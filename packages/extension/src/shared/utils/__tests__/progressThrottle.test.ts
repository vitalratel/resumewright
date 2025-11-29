/**
 * Tests for Progress Throttling Utility
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { throttleProgress } from '../progressThrottle';

describe('progressThrottle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should emit first call immediately', () => {
    const callback = vi.fn();
    const throttled = throttleProgress(callback, 500);

    throttled('parsing', 10);
    expect(callback).toHaveBeenCalledWith('parsing', 10);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should throttle subsequent calls within interval', () => {
    const callback = vi.fn();
    const throttled = throttleProgress(callback, 500);

    throttled('parsing', 10);
    throttled('parsing', 20);
    throttled('parsing', 30);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('parsing', 10);
  });

  it('should emit after throttle interval', () => {
    const callback = vi.fn();
    const throttled = throttleProgress(callback, 500);

    throttled('parsing', 10);
    expect(callback).toHaveBeenCalledTimes(1);

    // Within interval - should not emit
    vi.advanceTimersByTime(300);
    throttled('parsing', 20);
    expect(callback).toHaveBeenCalledTimes(1);

    // After interval - should emit
    vi.advanceTimersByTime(200); // Total 500ms
    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenLastCalledWith('parsing', 20);
  });

  it('should always emit 100% immediately', () => {
    const callback = vi.fn();
    const throttled = throttleProgress(callback, 500);

    throttled('parsing', 10);
    expect(callback).toHaveBeenCalledTimes(1);

    // 100% should emit immediately even within throttle window
    throttled('completed', 100);
    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenLastCalledWith('completed', 100);
  });

  it('should clear pending timeout on 100%', () => {
    const callback = vi.fn();
    const throttled = throttleProgress(callback, 500);

    throttled('parsing', 10);
    throttled('parsing', 50); // Pending update

    expect(callback).toHaveBeenCalledTimes(1);

    // 100% should clear pending and emit immediately
    throttled('completed', 100);
    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenLastCalledWith('completed', 100);

    // Advance time - no additional calls should happen
    vi.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('should store and emit most recent pending update', () => {
    const callback = vi.fn();
    const throttled = throttleProgress(callback, 500);

    throttled('parsing', 10);
    expect(callback).toHaveBeenCalledTimes(1);

    // Multiple updates within window - only last should be stored
    throttled('parsing', 20);
    throttled('parsing', 30);
    throttled('parsing', 40);

    // Advance time to trigger pending update
    vi.advanceTimersByTime(500);
    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenLastCalledWith('parsing', 40);
  });

  it('should handle rapid successive calls correctly', () => {
    const callback = vi.fn();
    const throttled = throttleProgress(callback, 500);

    // First call - immediate
    throttled('parsing', 0);
    expect(callback).toHaveBeenCalledTimes(1);

    // Rapid calls (except 100% which emits immediately)
    for (let i = 1; i <= 9; i++) {
      throttled('parsing', i * 10);
    }
    expect(callback).toHaveBeenCalledTimes(1); // Still only first call

    // Wait for throttle
    vi.advanceTimersByTime(500);
    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenLastCalledWith('parsing', 90);
  });

  it('should allow immediate emission after throttle interval', () => {
    const callback = vi.fn();
    const throttled = throttleProgress(callback, 500);

    throttled('parsing', 10);
    expect(callback).toHaveBeenCalledTimes(1);

    // Wait full interval
    vi.advanceTimersByTime(500);

    // Next call should be immediate
    throttled('rendering', 50);
    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenLastCalledWith('rendering', 50);
  });
});
