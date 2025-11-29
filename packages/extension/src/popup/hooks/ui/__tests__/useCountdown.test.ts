/**
 * Tests for useCountdown hook
 * Pausable countdown functionality
 */

import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, vi } from 'vitest';
import { useCountdown } from '../useCountdown';

describe('useCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('Basic Countdown', () => {
    it('initializes with starting countdown value', () => {
      const { result } = renderHook(() => useCountdown(10));

      expect(result.current.countdown).toBe(10);
      expect(result.current.isPaused).toBe(false);
    });

    it('returns undefined countdown when initialSeconds is undefined', () => {
      const { result } = renderHook(() => useCountdown(undefined));

      expect(result.current.countdown).toBeUndefined();
      expect(result.current.isPaused).toBe(false);
    });

    it('counts down from initial value', () => {
      const { result } = renderHook(() => useCountdown(3));

      expect(result.current.countdown).toBe(3);

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(result.current.countdown).toBe(2);

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(result.current.countdown).toBe(1);

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(result.current.countdown).toBe(0);
    });

    it('stops at 0', () => {
      const { result } = renderHook(() => useCountdown(2));

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(result.current.countdown).toBe(0);

      // Shouldn't go negative
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(result.current.countdown).toBe(0);
    });
  });

  describe('onComplete Callback', () => {
    it('calls onComplete when countdown reaches 0', () => {
      const onComplete = vi.fn();
      renderHook(() => useCountdown(2, onComplete));

      expect(onComplete).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('does not call onComplete if initialSeconds is undefined', () => {
      const onComplete = vi.fn();
      renderHook(() => useCountdown(undefined, onComplete));

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(onComplete).not.toHaveBeenCalled();
    });

    it('calls onComplete exactly once', () => {
      const onComplete = vi.fn();
      renderHook(() => useCountdown(1, onComplete));

      act(() => {
        vi.advanceTimersByTime(5000); // Advance way past countdown
      });

      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe('Pause Functionality', () => {
    it('pauses countdown when pause() is called', () => {
      const { result } = renderHook(() => useCountdown(5));

      expect(result.current.countdown).toBe(5);
      expect(result.current.isPaused).toBe(false);

      // Countdown for 2 seconds
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(result.current.countdown).toBe(3);

      // Pause
      act(() => {
        result.current.pause();
      });
      expect(result.current.isPaused).toBe(true);

      // Advance time - countdown should NOT change
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(result.current.countdown).toBe(3);
    });

    it('pause at 0 does not affect state', () => {
      const onComplete = vi.fn();
      const { result } = renderHook(() => useCountdown(1, onComplete));

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(result.current.countdown).toBe(0);

      act(() => {
        result.current.pause();
      });

      expect(result.current.isPaused).toBe(true);
      expect(result.current.countdown).toBe(0);
    });
  });

  describe('Resume Functionality', () => {
    it('resumes countdown when resume() is called', () => {
      const { result } = renderHook(() => useCountdown(5));

      // Pause after 2 seconds
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(result.current.countdown).toBe(3);

      act(() => {
        result.current.pause();
      });

      // Time passes while paused
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(result.current.countdown).toBe(3); // Still 3

      // Resume
      act(() => {
        result.current.resume();
      });
      expect(result.current.isPaused).toBe(false);

      // Countdown continues
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(result.current.countdown).toBe(2);

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(result.current.countdown).toBe(1);
    });

    it('resume when already running has no effect', () => {
      const { result } = renderHook(() => useCountdown(5));

      expect(result.current.isPaused).toBe(false);

      act(() => {
        result.current.resume();
      });

      expect(result.current.isPaused).toBe(false);

      // Countdown continues normally
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(result.current.countdown).toBe(4);
    });
  });

  describe('Multiple Pause/Resume Cycles', () => {
    it('handles multiple pause/resume cycles correctly', () => {
      const { result } = renderHook(() => useCountdown(10));

      // Countdown 2 seconds
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(result.current.countdown).toBe(8);

      // Pause
      act(() => {
        result.current.pause();
      });
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(result.current.countdown).toBe(8);

      // Resume and countdown 1 second
      act(() => {
        result.current.resume();
      });
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(result.current.countdown).toBe(7);

      // Pause again
      act(() => {
        result.current.pause();
      });
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(result.current.countdown).toBe(7);

      // Final resume
      act(() => {
        result.current.resume();
      });
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(result.current.countdown).toBe(4);
    });

    it('onComplete still fires after pause/resume cycles', () => {
      const onComplete = vi.fn();
      const { result } = renderHook(() => useCountdown(3, onComplete));

      // Countdown 1 second
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(result.current.countdown).toBe(2);

      // Pause for a while
      act(() => {
        result.current.pause();
      });
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      expect(result.current.countdown).toBe(2);

      // Resume and finish countdown
      act(() => {
        result.current.resume();
      });
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.countdown).toBe(0);
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe('Cleanup and Memory', () => {
    it('cleans up interval on unmount', () => {
      const { unmount } = renderHook(() => useCountdown(5));

      const timersCount = vi.getTimerCount();
      expect(timersCount).toBeGreaterThan(0);

      unmount();

      // Verify no timers remain
      expect(vi.getTimerCount()).toBe(0);
    });

    it('cleans up interval when countdown reaches 0', () => {
      const { result } = renderHook(() => useCountdown(1));

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.countdown).toBe(0);

      // Timer should be cleared
      const timersAfter = vi.getTimerCount();
      expect(timersAfter).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('handles countdown of 0 seconds', () => {
      const onComplete = vi.fn();
      const { result } = renderHook(() => useCountdown(0, onComplete));

      expect(result.current.countdown).toBe(0);
      // onComplete should not be called for 0 initial value
      expect(onComplete).not.toHaveBeenCalled();
    });

    it('handles very long countdown', () => {
      const { result } = renderHook(() => useCountdown(1000));

      expect(result.current.countdown).toBe(1000);

      act(() => {
        vi.advanceTimersByTime(100000); // Advance 100 seconds
      });

      expect(result.current.countdown).toBe(900);
    });

    it('pause and resume maintain function identity', () => {
      const { result, rerender } = renderHook(() => useCountdown(5));

      const pauseFn = result.current.pause;
      const resumeFn = result.current.resume;

      rerender();

      // Functions should be stable
      expect(result.current.pause).toBe(pauseFn);
      expect(result.current.resume).toBe(resumeFn);
    });
  });
});
