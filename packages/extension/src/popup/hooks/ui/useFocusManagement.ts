/**
 * Focus Management Hook
 *
 * Manages programmatic focus shifts on state transitions to improve
 * screen reader experience and keyboard navigation.
 * Includes focus traps for modals and screen reader announcements.
 */

import { useEffect, useRef } from 'react';
import { getLogger } from '@/shared/infrastructure/logging';

/**
 * Hook to manage focus on component mount or state changes
 * @param dependency - State or value to trigger focus management
 * @param focusDelay - Delay in ms before focusing (allows DOM updates)
 */
export function useFocusOnMount(dependency?: unknown, focusDelay = 100) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (elementRef.current) {
        elementRef.current.focus();
      }
    }, focusDelay);

    return () => clearTimeout(timer);
  }, [dependency, focusDelay]);

  return elementRef;
}

/**
 * Hook to announce content to screen readers without shifting focus
 * Uses aria-live regions that are already in the DOM
 *
 * Firefox fix: Reuses single live region instead of creating new ones on every message
 * to prevent DOM node accumulation causing crashes
 */
export function useScreenReaderAnnouncement(
  message: string | null,
  priority: 'polite' | 'assertive' = 'polite',
) {
  const liveRegionRef = useRef<HTMLDivElement | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (message === null || message === undefined || message === '') {
      // Clear any pending timeout when message becomes null
      if (timeoutRef.current !== null && timeoutRef.current !== undefined) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    // Reuse existing live region or create new one
    if (!liveRegionRef.current) {
      getLogger().debug('FocusManagement', 'CREATING live region');
      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('role', 'status');
      liveRegion.setAttribute('aria-live', priority);
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only'; // Visually hidden but accessible
      document.body.appendChild(liveRegion);
      liveRegionRef.current = liveRegion;
    }

    // Update message (triggers screen reader announcement)
    const liveRegion = liveRegionRef.current;
    liveRegion.textContent = message;

    // Clear previous timeout if still pending
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Clear message after announcement (keeps element in DOM for reuse)
    timeoutRef.current = setTimeout(() => {
      if (liveRegion != null) {
        liveRegion.textContent = '';
      }
      timeoutRef.current = null;
    }, 1000);

    // No cleanup return here - we want to keep the element across messages
  }, [message, priority]);

  // Separate cleanup effect that ONLY runs on unmount
  useEffect(() => {
    return () => {
      getLogger().debug('FocusManagement', 'CLEANING UP live region');
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (liveRegionRef.current && document.body.contains(liveRegionRef.current)) {
        document.body.removeChild(liveRegionRef.current);
        liveRegionRef.current = null;
      }
    };
  }, []); // Empty deps - runs once on mount, cleanup on unmount
}

/**
 * Hook to manage focus trap within a modal or dialog
 * Useful for Settings panel to keep focus contained
 *
 * Enhancements:
 * - Robust focus restoration with validation
 * - Auto-focus first interactive element
 * - Dynamic focusable element tracking
 */
export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isActive) {
      // Save current focus for restoration (only if it's a valid focusable element)
      const activeEl = document.activeElement as HTMLElement;
      if ((activeEl !== null && activeEl !== undefined) && activeEl !== document.body && typeof activeEl.focus === 'function') {
        previousFocusRef.current = activeEl;
      }

      if (containerRef.current === null || containerRef.current === undefined)
        return;

      const container = containerRef.current;

      // Helper to get current focusable elements (dynamic - refreshes on each Tab)
      const getFocusableElements = () => {
        return container.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href]:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])',
        );
      };

      const initialFocusableElements = getFocusableElements();
      if (initialFocusableElements.length === 0)
        return;

      const firstElement = initialFocusableElements[0];

      // Auto-focus first interactive element with delay for DOM updates
      const focusTimeout = setTimeout(() => {
        if ((firstElement !== null && firstElement !== undefined) && typeof firstElement.focus === 'function') {
          firstElement.focus();
        }
      }, 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key !== 'Tab')
          return;

        // Refresh focusable elements on each Tab (handles dynamic content)
        const focusableElements = getFocusableElements();
        if (focusableElements.length === 0)
          return;

        const focusableArray = Array.from(focusableElements);
        const firstEl = focusableArray[0];
        const lastEl = focusableArray[focusableArray.length - 1];

        // Check if focus is on a non-interactive element
        const isFocusInTrap = focusableArray.includes(document.activeElement as HTMLElement);

        if (!isFocusInTrap) {
          // Focus escaped to non-interactive element, return it to the trap
          e.preventDefault();
          if (e.shiftKey) {
            lastEl.focus();
          }
          else {
            firstEl.focus();
          }
          return;
        }

        if (e.shiftKey) {
          // Shift + Tab: wrap from first to last
          if (document.activeElement === firstEl) {
            e.preventDefault();
            lastEl.focus();
          }
        }
        else {
          // Tab: wrap from last to first
          if (document.activeElement === lastEl) {
            e.preventDefault();
            firstEl.focus();
          }
        }
      };

      container.addEventListener('keydown', handleKeyDown);

      return () => {
        clearTimeout(focusTimeout);
        container.removeEventListener('keydown', handleKeyDown);
      };
    }
    else if (previousFocusRef.current) {
      // Restore focus when deactivated (robust restoration)
      const elementToRestore = previousFocusRef.current;
      previousFocusRef.current = null;

      // Validate element is still in DOM and focusable before restoring
      // Track restoration timeout for cleanup
      const restoreTimeout = setTimeout(() => {
        if (
          (elementToRestore !== null && elementToRestore !== undefined)
          && document.body.contains(elementToRestore)
          && typeof elementToRestore.focus === 'function'
        ) {
          try {
            elementToRestore.focus();
          }
          catch (error) {
            // Fail silently if focus restoration errors (element may have been removed)
            getLogger().debug('FocusManagement', 'Focus restoration failed', error);
          }
        }
      }, 50);

      // Cleanup restoration timeout on unmount
      return () => {
        clearTimeout(restoreTimeout);
      };
    }
  }, [isActive]);

  return containerRef;
}
