/**
 * ABOUTME: Tests for createLocalStorage reactive function.
 * ABOUTME: Validates localStorage persistence, cross-tab sync, and error handling.
 */

import { renderHook } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockLogger = {
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
};

vi.mock('@/shared/infrastructure/logging/instance', () => ({
  getLogger: () => mockLogger,
}));

const { createLocalStorage } = await import('../storage');

const getStored = (key: string): unknown => JSON.parse(window.localStorage.getItem(key)!);
const setStored = (key: string, value: unknown) =>
  window.localStorage.setItem(key, JSON.stringify(value));

describe('createLocalStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('returns initial value when localStorage empty', () => {
    const { result } = renderHook(() => createLocalStorage('testKey', 'initial'));

    expect(result.value()).toBe('initial');
  });

  it('persists value to localStorage', () => {
    const { result } = renderHook(() => createLocalStorage('testKey', 'initial'));

    result.setValue('updated');

    expect(result.value()).toBe('updated');
    expect(getStored('testKey')).toBe('updated');
  });

  it('reads existing value from localStorage', () => {
    setStored('testKey', 'existing');

    const { result } = renderHook(() => createLocalStorage('testKey', 'initial'));

    expect(result.value()).toBe('existing');
  });

  it('supports function updates', () => {
    const { result } = renderHook(() => createLocalStorage('counter', 0));

    result.setValue((prev: number) => prev + 1);
    expect(result.value()).toBe(1);

    result.setValue((prev: number) => prev + 1);
    expect(result.value()).toBe(2);
  });

  it('handles boolean values', () => {
    const { result } = renderHook(() => createLocalStorage('flag', false));

    result.setValue(true);

    expect(result.value()).toBe(true);
    expect(getStored('flag')).toBe(true);
  });

  it('handles complex objects', () => {
    const { result } = renderHook(() => createLocalStorage('obj', { count: 0, name: 'test' }));

    const updated = { count: 1, name: 'updated' };
    result.setValue(updated);

    expect(result.value()).toEqual(updated);
    expect(getStored('obj')).toEqual(updated);
  });

  it('handles corrupted localStorage data gracefully', () => {
    window.localStorage.setItem('testKey', 'invalid-json{');

    const { result } = renderHook(() => createLocalStorage('testKey', 'fallback'));

    expect(result.value()).toBe('fallback');
  });

  it('handles setItem errors gracefully', () => {
    const { result } = renderHook(() => createLocalStorage('testKey', 'initial'));

    // Mock localStorage.setItem to throw (e.g., quota exceeded)
    const originalSetItem = window.localStorage.setItem;
    window.localStorage.setItem = vi.fn(() => {
      throw new Error('QuotaExceededError');
    });

    // Should not throw, just log the error
    expect(() => result.setValue('newValue')).not.toThrow();

    // Restore original
    window.localStorage.setItem = originalSetItem;
  });

  it('listens for cross-tab storage events', () => {
    const { result } = renderHook(() => createLocalStorage('testKey', 'initial'));

    const event = new StorageEvent('storage', {
      key: 'testKey',
      newValue: '"cross-tab-value"',
      oldValue: null,
      storageArea: window.localStorage,
    });
    window.dispatchEvent(event);

    expect(result.value()).toBe('cross-tab-value');
  });

  it('ignores storage events for different keys', () => {
    const { result } = renderHook(() => createLocalStorage('testKey', 'initial'));

    const event = new StorageEvent('storage', {
      key: 'otherKey',
      newValue: '"other-value"',
      oldValue: null,
      storageArea: window.localStorage,
    });
    window.dispatchEvent(event);

    expect(result.value()).toBe('initial');
  });

  it('handles storage event parsing errors gracefully', () => {
    const { result } = renderHook(() => createLocalStorage('testKey', 'initial'));

    const event = new StorageEvent('storage', {
      key: 'testKey',
      newValue: 'invalid-json{',
      oldValue: null,
      storageArea: window.localStorage,
    });
    window.dispatchEvent(event);

    // Should not throw, value stays unchanged
    expect(result.value()).toBe('initial');
  });

  it('cleans up storage event listener', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const { cleanup } = renderHook(() => createLocalStorage('testKey', 'initial'));

    expect(addSpy).toHaveBeenCalledWith('storage', expect.any(Function));

    cleanup();

    expect(removeSpy).toHaveBeenCalledWith('storage', expect.any(Function));

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });
});
