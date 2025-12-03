/**
 * Tests for useLocalStorage hook
 * Info card minimize functionality
 */

import { act, renderHook } from '@testing-library/react';
import { vi } from 'vitest';
import { useLocalStorage } from '../integration/useLocalStorage';

const getStored = (key: string): unknown => JSON.parse(window.localStorage.getItem(key)!);
const setStored = (key: string, value: unknown) =>
  window.localStorage.setItem(key, JSON.stringify(value));

describe('useLocalStorage', () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => window.localStorage.clear());

  it('returns initial value when localStorage empty', () => {
    const { result } = renderHook(() => useLocalStorage('testKey', 'initial'));

    expect(result.current[0]).toBe('initial');
  });

  it('persists value to localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('testKey', 'initial'));

    act(() => result.current[1]('updated'));

    expect(result.current[0]).toBe('updated');
    expect(getStored('testKey')).toBe('updated');
  });

  it('reads existing value from localStorage', () => {
    setStored('testKey', 'existing');

    const { result } = renderHook(() => useLocalStorage('testKey', 'initial'));

    expect(result.current[0]).toBe('existing');
  });

  it('supports function updates', () => {
    const { result } = renderHook(() => useLocalStorage('counter', 0));

    act(() => result.current[1]((prev: number) => prev + 1));
    expect(result.current[0]).toBe(1);

    act(() => result.current[1]((prev) => prev + 1));
    expect(result.current[0]).toBe(2);
  });

  it('handles boolean values', () => {
    const { result } = renderHook(() => useLocalStorage('flag', false));

    act(() => result.current[1](true));

    expect(result.current[0]).toBe(true);
    expect(getStored('flag')).toBe(true);
  });

  it('handles complex objects', () => {
    const { result } = renderHook(() => useLocalStorage('obj', { count: 0, name: 'test' }));

    const updated = { count: 1, name: 'updated' };
    act(() => result.current[1](updated));

    expect(result.current[0]).toEqual(updated);
    expect(getStored('obj')).toEqual(updated);
  });

  it('handles corrupted localStorage data gracefully', () => {
    window.localStorage.setItem('testKey', 'invalid-json{');

    const { result } = renderHook(() => useLocalStorage('testKey', 'fallback'));

    expect(result.current[0]).toBe('fallback');
  });

  it('syncs across multiple instances of same key', () => {
    const { result: result1 } = renderHook(() => useLocalStorage('shared', 'initial'));
    renderHook(() => useLocalStorage('shared', 'initial'));

    act(() => result1.current[1]('updated'));

    expect(result1.current[0]).toBe('updated');
    expect(getStored('shared')).toBe('updated');
  });

  it('handles setItem errors gracefully', () => {
    const { result } = renderHook(() => useLocalStorage('testKey', 'initial'));

    // Mock localStorage.setItem to throw (e.g., quota exceeded)
    const originalSetItem = window.localStorage.setItem;
    window.localStorage.setItem = vi.fn(() => {
      throw new Error('QuotaExceededError');
    });

    // Should not throw, just log the error
    act(() => {
      expect(() => result.current[1]('newValue')).not.toThrow();
    });

    // Restore original
    window.localStorage.setItem = originalSetItem;
  });

  it('handles storage event parsing errors gracefully', () => {
    const { result } = renderHook(() => useLocalStorage('testKey', 'initial'));

    // Trigger a storage event with invalid JSON
    act(() => {
      const event = new StorageEvent('storage', {
        key: 'testKey',
        newValue: 'invalid-json{',
        oldValue: null,
        storageArea: window.localStorage,
      });
      window.dispatchEvent(event);
    });

    // Should not throw, hook should continue working
    expect(result.current[0]).toBe('initial');
  });
});
