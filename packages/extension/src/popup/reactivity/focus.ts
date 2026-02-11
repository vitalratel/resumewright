// ABOUTME: Focus management for accessibility and keyboard navigation.
// ABOUTME: Provides focus-on-mount, screen reader announcements, and focus traps.

import type { Accessor } from 'solid-js';
import { createEffect, createSignal, onCleanup } from 'solid-js';
import { getLogger } from '@/shared/infrastructure/logging/instance';

/**
 * Focus an element when a condition becomes true.
 *
 * @param shouldFocus - Accessor returning whether to focus
 * @param focusDelay - Delay in ms before focusing (allows DOM updates)
 * @returns Ref callback to attach to the target element
 */
export function createFocusOnMount(
  shouldFocus: Accessor<boolean>,
  focusDelay = 100,
): (el: HTMLDivElement) => void {
  const [element, setElement] = createSignal<HTMLDivElement | undefined>(undefined);

  createEffect(() => {
    const el = element();
    if (!shouldFocus() || !el) return;

    const timer = setTimeout(() => {
      el.focus();
    }, focusDelay);

    onCleanup(() => clearTimeout(timer));
  });

  return (el: HTMLDivElement) => {
    setElement(el);
  };
}

/**
 * Announce content to screen readers without shifting focus.
 * Reuses a single live region to prevent DOM node accumulation.
 *
 * @param message - Accessor for message to announce (null = no announcement)
 * @param priority - Accessor for announcement priority (default: 'polite')
 */
export function createScreenReaderAnnouncement(
  message: Accessor<string | null>,
  priority: Accessor<'polite' | 'assertive'> = () => 'polite',
): void {
  let liveRegion: HTMLDivElement | null = null;
  let messageTimeout: ReturnType<typeof setTimeout> | null = null;

  createEffect(() => {
    const msg = message();
    const prio = priority();

    if (msg === null || msg === undefined || msg === '') {
      if (messageTimeout !== null) {
        clearTimeout(messageTimeout);
        messageTimeout = null;
      }
      return;
    }

    // Reuse existing live region or create new one
    if (!liveRegion) {
      getLogger().debug('FocusManagement', 'CREATING live region');
      liveRegion = document.createElement('div');
      liveRegion.setAttribute('role', 'status');
      liveRegion.setAttribute('aria-live', prio);
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      document.body.appendChild(liveRegion);
    }

    liveRegion.textContent = msg;

    if (messageTimeout) {
      clearTimeout(messageTimeout);
    }

    messageTimeout = setTimeout(() => {
      if (liveRegion != null) {
        liveRegion.textContent = '';
      }
      messageTimeout = null;
    }, 1000);
  });

  onCleanup(() => {
    getLogger().debug('FocusManagement', 'CLEANING UP live region');
    if (messageTimeout) {
      clearTimeout(messageTimeout);
      messageTimeout = null;
    }
    if (liveRegion && document.body.contains(liveRegion)) {
      document.body.removeChild(liveRegion);
      liveRegion = null;
    }
  });
}

/**
 * Trap focus within a container element for modal/dialog accessibility.
 *
 * @param isActive - Accessor returning whether the trap is active
 * @returns Ref callback to attach to the container element
 */
export function createFocusTrap(isActive: Accessor<boolean>): (el: HTMLDivElement) => void {
  const [container, setContainer] = createSignal<HTMLDivElement | undefined>(undefined);
  let previousFocus: HTMLElement | null = null;

  createEffect(() => {
    const containerEl = container();
    if (!containerEl) return;

    if (isActive()) {
      // Save current focus for restoration
      const activeEl = document.activeElement as HTMLElement;
      if (activeEl !== null && activeEl !== document.body && typeof activeEl.focus === 'function') {
        previousFocus = activeEl;
      }

      const getFocusableElements = () => {
        return containerEl.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href]:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])',
        );
      };

      const initialFocusable = getFocusableElements();
      if (initialFocusable.length === 0) return;

      const firstElement = initialFocusable[0];

      // Auto-focus first interactive element
      const focusTimeout = setTimeout(() => {
        if (firstElement && typeof firstElement.focus === 'function') {
          firstElement.focus();
        }
      }, 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return;

        const focusableElements = getFocusableElements();
        if (focusableElements.length === 0) return;

        const focusableArray = Array.from(focusableElements);
        const firstEl = focusableArray[0];
        const lastEl = focusableArray[focusableArray.length - 1];

        const isFocusInTrap = focusableArray.includes(document.activeElement as HTMLElement);

        if (!isFocusInTrap) {
          e.preventDefault();
          if (e.shiftKey) {
            lastEl.focus();
          } else {
            firstEl.focus();
          }
          return;
        }

        if (e.shiftKey) {
          if (document.activeElement === firstEl) {
            e.preventDefault();
            lastEl.focus();
          }
        } else {
          if (document.activeElement === lastEl) {
            e.preventDefault();
            firstEl.focus();
          }
        }
      };

      containerEl.addEventListener('keydown', handleKeyDown);

      onCleanup(() => {
        clearTimeout(focusTimeout);
        containerEl.removeEventListener('keydown', handleKeyDown);
      });
    } else if (previousFocus) {
      // Restore focus when deactivated
      const elementToRestore = previousFocus;
      previousFocus = null;

      const restoreTimeout = setTimeout(() => {
        if (
          elementToRestore &&
          document.body.contains(elementToRestore) &&
          typeof elementToRestore.focus === 'function'
        ) {
          try {
            elementToRestore.focus();
          } catch (error) {
            getLogger().debug('FocusManagement', 'Focus restoration failed', error);
          }
        }
      }, 50);

      onCleanup(() => clearTimeout(restoreTimeout));
    }
  });

  return (el: HTMLDivElement) => {
    setContainer(el);
  };
}
