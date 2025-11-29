/**
 * useValidation Hook Tests
 */

import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useValidation } from '../useValidation';

describe('useValidation', () => {
  it('should initialize with no errors', () => {
    const { result } = renderHook(() =>
      useValidation('test', {
        rules: [],
        validateOnChange: false,
      }),
    );

    expect(result.current.errors).toEqual([]);
    expect(result.current.isValid).toBe(true);
    expect(result.current.touched).toBe(false);
  });

  it('should validate with rules', () => {
    const { result } = renderHook(() =>
      useValidation('', {
        rules: [
          { validate: v => v.length > 0, message: 'Required' },
          { validate: v => v.length >= 3, message: 'Min 3 chars' },
        ],
        validateOnChange: false,
      }),
    );

    act(() => {
      result.current.validate();
    });

    expect(result.current.errors).toEqual(['Required', 'Min 3 chars']);
    expect(result.current.isValid).toBe(false);
  });

  it('should validate passing value', () => {
    const { result } = renderHook(() =>
      useValidation('hello', {
        rules: [
          { validate: v => v.length > 0, message: 'Required' },
          { validate: v => v.length >= 3, message: 'Min 3 chars' },
        ],
        validateOnChange: false,
      }),
    );

    act(() => {
      result.current.validate();
    });

    expect(result.current.errors).toEqual([]);
    expect(result.current.isValid).toBe(true);
  });

  it('should track touched state', () => {
    const { result } = renderHook(() =>
      useValidation('test', {
        rules: [],
        validateOnChange: false,
      }),
    );

    expect(result.current.touched).toBe(false);

    act(() => {
      result.current.touch();
    });

    expect(result.current.touched).toBe(true);
  });

  it('should reset validation state', () => {
    const { result } = renderHook(() =>
      useValidation('', {
        rules: [{ validate: v => v.length > 0, message: 'Required' }],
        validateOnChange: false,
      }),
    );

    act(() => {
      result.current.touch();
      result.current.validate();
    });

    expect(result.current.touched).toBe(true);
    expect(result.current.errors.length).toBeGreaterThan(0);

    act(() => {
      result.current.reset();
    });

    expect(result.current.touched).toBe(false);
    expect(result.current.errors).toEqual([]);
  });

  it('should validate on change when enabled', () => {
    const { result, rerender } = renderHook(
      ({ value }) =>
        useValidation(value, {
          rules: [{ validate: v => v.length > 0, message: 'Required' }],
          validateOnChange: true,
        }),
      { initialProps: { value: 'test' } },
    );

    act(() => {
      result.current.touch();
    });

    rerender({ value: '' });

    expect(result.current.errors).toEqual(['Required']);
  });

  it('should not validate on change when disabled', () => {
    const { result, rerender } = renderHook(
      ({ value }) =>
        useValidation(value, {
          rules: [{ validate: v => v.length > 0, message: 'Required' }],
          validateOnChange: false,
        }),
      { initialProps: { value: 'test' } },
    );

    act(() => {
      result.current.touch();
    });

    rerender({ value: '' });

    expect(result.current.errors).toEqual([]);
  });

  it('should handle multiple validation errors', () => {
    const { result } = renderHook(() =>
      useValidation('ab', {
        rules: [
          { validate: v => v.length >= 3, message: 'Min 3' },
          { validate: v => v.length <= 10, message: 'Max 10' },
          { validate: v => /^[a-z]+$/.test(v), message: 'Letters only' },
        ],
        validateOnChange: false,
      }),
    );

    act(() => {
      result.current.validate();
    });

    expect(result.current.errors).toEqual(['Min 3']);
    expect(result.current.isValid).toBe(false);
  });

  it('should update validation when value changes and touched', () => {
    const { result, rerender } = renderHook(
      ({ value }) =>
        useValidation(value, {
          rules: [{ validate: v => v.length >= 3, message: 'Min 3' }],
          validateOnChange: true,
        }),
      { initialProps: { value: 'abc' } },
    );

    act(() => {
      result.current.touch();
    });

    // Initially valid, no errors
    expect(result.current.errors).toEqual([]);

    // Change to invalid value - should trigger validation
    rerender({ value: 'ab' });

    expect(result.current.errors).toEqual(['Min 3']);
    expect(result.current.isValid).toBe(false);

    // Change back to valid value - should clear errors
    rerender({ value: 'abc' });

    expect(result.current.errors).toEqual([]);
    expect(result.current.isValid).toBe(true);
  });
});
