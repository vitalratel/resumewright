/**
 * ABOUTME: Tests for createThrottledAnnouncement reactive function.
 * ABOUTME: Validates throttled announcements based on value delta and time interval.
 */

import { renderHook } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createThrottledAnnouncement } from '../throttledAnnouncement';

describe('createThrottledAnnouncement', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('Initial State', () => {
    it('announces on initial render', () => {
      const { result } = renderHook(() => createThrottledAnnouncement(() => 0));

      expect(result()).toBe(true);
    });

    it('uses default threshold of 10', () => {
      const [value, setValue] = createSignal(0);
      const { result } = renderHook(() => createThrottledAnnouncement(value));

      // Change less than threshold (10)
      setValue(5);
      expect(result()).toBe(false);

      // Change >= threshold
      setValue(15);
      expect(result()).toBe(true);
    });

    it('uses default minInterval of 5000ms', () => {
      const [value, setValue] = createSignal(0);
      const { result } = renderHook(() => createThrottledAnnouncement(value));

      // Small change, not enough time
      setValue(1);
      expect(result()).toBe(false);

      // Advance past default interval
      vi.advanceTimersByTime(5000);
      setValue(2);
      expect(result()).toBe(true);
    });
  });

  describe('Value Threshold', () => {
    it('announces when value change meets threshold', () => {
      const [value, setValue] = createSignal(0);
      const { result } = renderHook(() => createThrottledAnnouncement(value, () => 10));

      setValue(10);
      expect(result()).toBe(true);
    });

    it('does not announce when value change is below threshold', () => {
      const [value, setValue] = createSignal(0);
      const { result } = renderHook(() => createThrottledAnnouncement(value, () => 10));

      setValue(5);
      expect(result()).toBe(false);
    });

    it('uses absolute value difference', () => {
      const [value, setValue] = createSignal(20);
      const { result } = renderHook(() => createThrottledAnnouncement(value, () => 10));

      // Going down by >= threshold
      setValue(5);
      expect(result()).toBe(true);
    });

    it('respects custom threshold', () => {
      const [value, setValue] = createSignal(0);
      const { result } = renderHook(() => createThrottledAnnouncement(value, () => 5));

      setValue(3);
      expect(result()).toBe(false);

      setValue(8);
      expect(result()).toBe(true);
    });
  });

  describe('Time Interval', () => {
    it('announces when time interval is met regardless of value delta', () => {
      const [value, setValue] = createSignal(0);
      const { result } = renderHook(() =>
        createThrottledAnnouncement(
          value,
          () => 10,
          () => 3000,
        ),
      );

      // Small change, but after time interval
      vi.advanceTimersByTime(3000);
      setValue(1);
      expect(result()).toBe(true);
    });

    it('does not announce when neither threshold nor interval is met', () => {
      const [value, setValue] = createSignal(0);
      const { result } = renderHook(() =>
        createThrottledAnnouncement(
          value,
          () => 10,
          () => 5000,
        ),
      );

      vi.advanceTimersByTime(2000);
      setValue(3);
      expect(result()).toBe(false);
    });
  });

  describe('Tracking Last Announced Value', () => {
    it('tracks last announced value for subsequent delta calculations', () => {
      const [value, setValue] = createSignal(0);
      const { result } = renderHook(() => createThrottledAnnouncement(value, () => 10));

      // First big change: 0 -> 15 (delta=15 >= 10)
      setValue(15);
      expect(result()).toBe(true);

      // Second change from 15 -> 20 (delta=5 < 10)
      setValue(20);
      expect(result()).toBe(false);

      // Third change from 15 -> 30 (delta=15 >= 10)
      setValue(30);
      expect(result()).toBe(true);
    });
  });

  describe('Combined Conditions', () => {
    it('prefers threshold announcement over time', () => {
      const [value, setValue] = createSignal(0);
      const { result } = renderHook(() =>
        createThrottledAnnouncement(
          value,
          () => 10,
          () => 5000,
        ),
      );

      // Big value change without waiting
      setValue(20);
      expect(result()).toBe(true);
    });

    it('falls back to time interval for small changes', () => {
      const [value, setValue] = createSignal(0);
      const { result } = renderHook(() =>
        createThrottledAnnouncement(
          value,
          () => 10,
          () => 3000,
        ),
      );

      // Small change, no time elapsed
      setValue(2);
      expect(result()).toBe(false);

      // Small change, but enough time
      vi.advanceTimersByTime(3000);
      setValue(4);
      expect(result()).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('handles same value repeatedly', () => {
      const [value, setValue] = createSignal(50);
      const { result } = renderHook(() => createThrottledAnnouncement(value, () => 10));

      // Same value - no change in delta
      setValue(50);
      expect(result()).toBe(true); // Initial still true since value didn't change signal
    });

    it('handles zero threshold', () => {
      const [value, setValue] = createSignal(0);
      const { result } = renderHook(() => createThrottledAnnouncement(value, () => 0));

      // Any change should trigger
      setValue(1);
      expect(result()).toBe(true);
    });

    it('handles large values', () => {
      const [value, setValue] = createSignal(0);
      const { result } = renderHook(() => createThrottledAnnouncement(value, () => 10));

      setValue(1000000);
      expect(result()).toBe(true);
    });
  });
});
