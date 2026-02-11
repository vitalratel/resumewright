/**
 * ABOUTME: Tests for createCountdown reactive function.
 * ABOUTME: Validates pausable countdown timer with completion callbacks.
 */

import { renderHook } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createCountdown } from '../countdown';

describe('createCountdown', () => {
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
      const { result } = renderHook(() => createCountdown(10));

      expect(result.countdown()).toBe(10);
      expect(result.isPaused()).toBe(false);
    });

    it('returns undefined countdown when initialSeconds is undefined', () => {
      const { result } = renderHook(() => createCountdown(undefined));

      expect(result.countdown()).toBeUndefined();
      expect(result.isPaused()).toBe(false);
    });

    it('counts down from initial value', () => {
      const { result } = renderHook(() => createCountdown(3));

      expect(result.countdown()).toBe(3);

      vi.advanceTimersByTime(1000);
      expect(result.countdown()).toBe(2);

      vi.advanceTimersByTime(1000);
      expect(result.countdown()).toBe(1);

      vi.advanceTimersByTime(1000);
      expect(result.countdown()).toBe(0);
    });

    it('stops at 0', () => {
      const { result } = renderHook(() => createCountdown(2));

      vi.advanceTimersByTime(3000);
      expect(result.countdown()).toBe(0);

      vi.advanceTimersByTime(1000);
      expect(result.countdown()).toBe(0);
    });
  });

  describe('onComplete Callback', () => {
    it('calls onComplete when countdown reaches 0', () => {
      const onComplete = vi.fn();
      renderHook(() => createCountdown(2, onComplete));

      expect(onComplete).not.toHaveBeenCalled();

      vi.advanceTimersByTime(2000);

      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('does not call onComplete if initialSeconds is undefined', () => {
      const onComplete = vi.fn();
      renderHook(() => createCountdown(undefined, onComplete));

      vi.advanceTimersByTime(5000);

      expect(onComplete).not.toHaveBeenCalled();
    });

    it('calls onComplete exactly once', () => {
      const onComplete = vi.fn();
      renderHook(() => createCountdown(1, onComplete));

      vi.advanceTimersByTime(5000);

      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe('Pause Functionality', () => {
    it('pauses countdown when pause() is called', () => {
      const { result } = renderHook(() => createCountdown(5));

      expect(result.countdown()).toBe(5);
      expect(result.isPaused()).toBe(false);

      vi.advanceTimersByTime(2000);
      expect(result.countdown()).toBe(3);

      result.pause();
      expect(result.isPaused()).toBe(true);

      vi.advanceTimersByTime(3000);
      expect(result.countdown()).toBe(3);
    });

    it('pause at 0 does not affect state', () => {
      const onComplete = vi.fn();
      const { result } = renderHook(() => createCountdown(1, onComplete));

      vi.advanceTimersByTime(1000);
      expect(result.countdown()).toBe(0);

      result.pause();

      expect(result.isPaused()).toBe(true);
      expect(result.countdown()).toBe(0);
    });
  });

  describe('Resume Functionality', () => {
    it('resumes countdown when resume() is called', () => {
      const { result } = renderHook(() => createCountdown(5));

      vi.advanceTimersByTime(2000);
      expect(result.countdown()).toBe(3);

      result.pause();

      vi.advanceTimersByTime(2000);
      expect(result.countdown()).toBe(3);

      result.resume();
      expect(result.isPaused()).toBe(false);

      vi.advanceTimersByTime(1000);
      expect(result.countdown()).toBe(2);

      vi.advanceTimersByTime(1000);
      expect(result.countdown()).toBe(1);
    });

    it('resume when already running has no effect', () => {
      const { result } = renderHook(() => createCountdown(5));

      expect(result.isPaused()).toBe(false);

      result.resume();

      expect(result.isPaused()).toBe(false);

      vi.advanceTimersByTime(1000);
      expect(result.countdown()).toBe(4);
    });
  });

  describe('Multiple Pause/Resume Cycles', () => {
    it('handles multiple pause/resume cycles correctly', () => {
      const { result } = renderHook(() => createCountdown(10));

      vi.advanceTimersByTime(2000);
      expect(result.countdown()).toBe(8);

      result.pause();
      vi.advanceTimersByTime(1000);
      expect(result.countdown()).toBe(8);

      result.resume();
      vi.advanceTimersByTime(1000);
      expect(result.countdown()).toBe(7);

      result.pause();
      vi.advanceTimersByTime(2000);
      expect(result.countdown()).toBe(7);

      result.resume();
      vi.advanceTimersByTime(3000);
      expect(result.countdown()).toBe(4);
    });

    it('onComplete still fires after pause/resume cycles', () => {
      const onComplete = vi.fn();
      const { result } = renderHook(() => createCountdown(3, onComplete));

      vi.advanceTimersByTime(1000);
      expect(result.countdown()).toBe(2);

      result.pause();
      vi.advanceTimersByTime(5000);
      expect(result.countdown()).toBe(2);

      result.resume();
      vi.advanceTimersByTime(2000);

      expect(result.countdown()).toBe(0);
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe('Cleanup and Memory', () => {
    it('cleans up interval on unmount', () => {
      const { cleanup } = renderHook(() => createCountdown(5));

      const timersCount = vi.getTimerCount();
      expect(timersCount).toBeGreaterThan(0);

      cleanup();

      expect(vi.getTimerCount()).toBe(0);
    });

    it('cleans up interval when countdown reaches 0', () => {
      const { result } = renderHook(() => createCountdown(1));

      vi.advanceTimersByTime(1000);

      expect(result.countdown()).toBe(0);

      const timersAfter = vi.getTimerCount();
      expect(timersAfter).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('handles countdown of 0 seconds', () => {
      const onComplete = vi.fn();
      const { result } = renderHook(() => createCountdown(0, onComplete));

      expect(result.countdown()).toBe(0);
      expect(onComplete).not.toHaveBeenCalled();
    });

    it('handles very long countdown', () => {
      const { result } = renderHook(() => createCountdown(1000));

      expect(result.countdown()).toBe(1000);

      vi.advanceTimersByTime(100000);

      expect(result.countdown()).toBe(900);
    });

    it('pause and resume are stable function references', () => {
      const { result } = renderHook(() => createCountdown(5));

      const pauseFn = result.pause;
      const resumeFn = result.resume;

      // Functions are stable in Solid (component only runs once)
      expect(result.pause).toBe(pauseFn);
      expect(result.resume).toBe(resumeFn);
    });
  });
});
