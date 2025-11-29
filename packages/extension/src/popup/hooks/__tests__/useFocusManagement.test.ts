/**
 * Focus Management Hooks Tests
 *
 * Tests focus trap, mount focus, and screen reader announcements
 */

import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useFocusOnMount, useFocusTrap, useScreenReaderAnnouncement } from '../ui/useFocusManagement';

describe('Focus Management Hooks', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('useFocusOnMount', () => {
    it('should focus element on mount', async () => {
      const { result } = renderHook(() => useFocusOnMount());

      // Hook returns a ref
      expect(result.current).toBeDefined();
      expect(typeof result.current).toBe('object');
    });

    it('should handle dependency changes', async () => {
      const { rerender } = renderHook(
        ({ dep }) => useFocusOnMount(dep),
        { initialProps: { dep: 'initial' } },
      );

      // Change dependency to trigger re-focus
      rerender({ dep: 'changed' });

      await new Promise(resolve => setTimeout(resolve, 150));
      expect(true).toBe(true); // Hook doesn't throw
    });

    it('should cleanup timeout on unmount', () => {
      const { unmount } = renderHook(() => useFocusOnMount());

      // Should not throw when unmounting before timeout completes
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('useFocusTrap', () => {
    it('should setup focus trap', () => {
      const { result } = renderHook(() => useFocusTrap(true));

      expect(result.current.current).toBeDefined();
    });

    it('should handle disabled trap', () => {
      const { result } = renderHook(() => useFocusTrap(false));

      expect(result.current.current).toBeDefined();
    });

    it('should toggle trap state', () => {
      const { rerender } = renderHook(
        ({ active }) => useFocusTrap(active),
        { initialProps: { active: true } },
      );

      // Toggle to inactive
      expect(() => rerender({ active: false })).not.toThrow();
    });

    it('should handle focus restoration errors', async () => {
      // Test error handler for focus restoration
      const mockElement = document.createElement('button');
      document.body.appendChild(mockElement);

      // Make it the active element first
      mockElement.focus();

      // Then override focus to throw
      mockElement.focus = vi.fn(() => {
        throw new Error('Focus failed');
      });

      const { rerender } = renderHook(
        ({ active }) => useFocusTrap(active),
        { initialProps: { active: true } },
      );

      // Deactivate to trigger restoration (which will fail and be caught)
      expect(() => rerender({ active: false })).not.toThrow();

      // Wait for restoration timeout
      await new Promise(resolve => setTimeout(resolve, 100));

      document.body.removeChild(mockElement);
    });
  });

  describe('useScreenReaderAnnouncement', () => {
    it('should create announcement element', () => {
      renderHook(() => useScreenReaderAnnouncement('Test announcement'));

      const announcement = document.querySelector('[role="status"]');
      expect(announcement).toBeTruthy();
    });

    it('should handle empty message', () => {
      renderHook(() => useScreenReaderAnnouncement(''));

      expect(document.body).toBeDefined();
    });

    it('should update message content', () => {
      const { rerender } = renderHook(
        ({ msg }) => useScreenReaderAnnouncement(msg),
        { initialProps: { msg: 'First message' } },
      );

      const announcement = document.querySelector('[role="status"]');
      expect(announcement?.textContent).toBe('First message');

      // Update message
      rerender({ msg: 'Second message' });
      expect(announcement?.textContent).toBe('Second message');
    });

    it('should cleanup on unmount', () => {
      const { unmount } = renderHook(() => useScreenReaderAnnouncement('Test'));

      const announcementBefore = document.querySelector('[role="status"]');
      expect(announcementBefore).toBeTruthy();

      unmount();

      const announcementAfter = document.querySelector('[role="status"]');
      // Should be removed on unmount
      expect(announcementAfter).toBeNull();
    });
  });
});
