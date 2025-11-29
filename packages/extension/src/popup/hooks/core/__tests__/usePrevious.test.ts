/**
 * usePrevious Hook Tests
 * Tests for the usePrevious custom React hook
 */

import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { usePrevious } from '../usePrevious';

describe('usePrevious', () => {
  it('should return undefined on initial render', () => {
    const { result } = renderHook(() => usePrevious(0));
    expect(result.current).toBeUndefined();
  });

  it('should return previous value after rerender', () => {
    const { result, rerender } = renderHook(({ value }) => usePrevious(value), {
      initialProps: { value: 0 },
    });

    expect(result.current).toBeUndefined();

    rerender({ value: 1 });
    expect(result.current).toBe(0);

    rerender({ value: 2 });
    expect(result.current).toBe(1);
  });

  it('should work with different types', () => {
    const { result, rerender } = renderHook(({ value }) => usePrevious(value), {
      initialProps: { value: 'first' },
    });

    expect(result.current).toBeUndefined();

    rerender({ value: 'second' });
    expect(result.current).toBe('first');
  });

  it('should work with objects', () => {
    const obj1 = { id: 1 };
    const obj2 = { id: 2 };

    const { result, rerender } = renderHook(({ value }) => usePrevious(value), {
      initialProps: { value: obj1 },
    });

    expect(result.current).toBeUndefined();

    rerender({ value: obj2 });
    expect(result.current).toBe(obj1);
  });

  it('should work with null and undefined values', () => {
    const { result, rerender } = renderHook(({ value }) => usePrevious(value), {
      initialProps: { value: null as null | string },
    });

    expect(result.current).toBeUndefined();

    rerender({ value: 'value' });
    expect(result.current).toBe(null);

    rerender({ value: null });
    expect(result.current).toBe('value');
  });

  it('should update only when value changes', () => {
    const { result, rerender } = renderHook(({ value }) => usePrevious(value), {
      initialProps: { value: 'same' },
    });

    expect(result.current).toBeUndefined();

    rerender({ value: 'same' });
    expect(result.current).toBe('same');

    rerender({ value: 'same' });
    expect(result.current).toBe('same');

    rerender({ value: 'different' });
    expect(result.current).toBe('same');
  });
});
