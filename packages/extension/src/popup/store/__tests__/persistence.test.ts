/**
 * ABOUTME: Tests for Chrome storage persistence adapter.
 * ABOUTME: Validates load, save, debounce, validation, and flush-on-close behavior.
 */

import { createStore, reconcile } from 'solid-js/store';
import { boolean, nullable, number, object, string } from 'valibot';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { loadPersistedState, setupPersistence } from '../persistence';

const mockLogger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  setLevel: vi.fn(),
  getLevel: vi.fn(() => 0),
};

vi.mock('../../../shared/infrastructure/logging/instance', () => ({
  getLogger: () => mockLogger,
}));

const TestSchema = object({
  name: nullable(string()),
  count: number(),
  active: boolean(),
});

type TestState = { name: string | null; count: number; active: boolean };

describe('persistence', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    fakeBrowser.reset();
  });

  describe('loadPersistedState', () => {
    it('should return null when no stored data exists', async () => {
      const result = await loadPersistedState('test-key', TestSchema);
      expect(result).toBeNull();
    });

    it('should load and validate stored data', async () => {
      await fakeBrowser.storage.local.set({
        'test-key': { name: 'Alice', count: 5, active: true },
      });

      const result = await loadPersistedState<TestState>('test-key', TestSchema);
      expect(result).toEqual({ name: 'Alice', count: 5, active: true });
    });

    it('should return null for invalid stored data', async () => {
      await fakeBrowser.storage.local.set({
        'test-key': { name: 123, count: 'invalid', active: 'nope' },
      });

      const result = await loadPersistedState('test-key', TestSchema);
      expect(result).toBeNull();
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Persistence',
        'Validation failed for stored data',
        expect.any(Array),
      );
    });

    it('should return null when stored value is null', async () => {
      await fakeBrowser.storage.local.set({ 'test-key': null });

      const result = await loadPersistedState('test-key', TestSchema);
      expect(result).toBeNull();
    });
  });

  describe('setupPersistence', () => {
    it('should debounce writes to storage', async () => {
      const [state, setState] = createStore<TestState>({
        name: null,
        count: 0,
        active: false,
      });

      const persistence = setupPersistence({
        state,
        storageKey: 'test-key',
        schema: TestSchema,
        debounceMs: 300,
        pick: (s) => ({ name: s.name, count: s.count, active: s.active }),
      });

      // Trigger a save
      persistence.save();

      // Storage should be empty before debounce fires
      const before = await fakeBrowser.storage.local.get('test-key');
      expect(before['test-key']).toBeUndefined();

      // Advance past debounce
      vi.advanceTimersByTime(300);
      // Let the async write complete
      await vi.runAllTimersAsync();

      const after = await fakeBrowser.storage.local.get('test-key');
      expect(after['test-key']).toEqual({ name: null, count: 0, active: false });

      persistence.cancel();
    });

    it('should validate data before writing', async () => {
      const [state] = createStore<TestState>({
        name: null,
        count: 0,
        active: false,
      });

      const persistence = setupPersistence({
        state,
        storageKey: 'test-key',
        schema: TestSchema,
        debounceMs: 0,
        pick: (s) => ({ name: s.name, count: s.count, active: s.active }),
      });

      persistence.save();
      await vi.runAllTimersAsync();

      const stored = await fakeBrowser.storage.local.get('test-key');
      expect(stored['test-key']).toEqual({ name: null, count: 0, active: false });

      persistence.cancel();
    });

    it('should flush pending writes immediately', async () => {
      const [state] = createStore<TestState>({
        name: 'Bob',
        count: 42,
        active: true,
      });

      const persistence = setupPersistence({
        state,
        storageKey: 'test-key',
        schema: TestSchema,
        debounceMs: 5000,
        pick: (s) => ({ name: s.name, count: s.count, active: s.active }),
      });

      // Trigger a save (won't fire for 5 seconds)
      persistence.save();

      // Flush immediately
      await persistence.flush();

      const stored = await fakeBrowser.storage.local.get('test-key');
      expect(stored['test-key']).toEqual({ name: 'Bob', count: 42, active: true });

      persistence.cancel();
    });

    it('should cancel pending writes', async () => {
      const [state] = createStore<TestState>({
        name: 'Cancel',
        count: 0,
        active: false,
      });

      const persistence = setupPersistence({
        state,
        storageKey: 'test-key',
        schema: TestSchema,
        debounceMs: 300,
        pick: (s) => ({ name: s.name, count: s.count, active: s.active }),
      });

      persistence.save();
      persistence.cancel();

      vi.advanceTimersByTime(500);
      await vi.runAllTimersAsync();

      const stored = await fakeBrowser.storage.local.get('test-key');
      expect(stored['test-key']).toBeUndefined();
    });

    it('should only persist picked fields', async () => {
      const [state] = createStore({
        name: 'Test',
        count: 10,
        active: true,
        transient: 'should-not-persist',
      });

      const persistence = setupPersistence({
        state,
        storageKey: 'test-key',
        schema: TestSchema,
        debounceMs: 0,
        pick: (s) => ({ name: s.name, count: s.count, active: s.active }),
      });

      persistence.save();
      await vi.runAllTimersAsync();

      const stored = await fakeBrowser.storage.local.get('test-key');
      expect(stored['test-key']).toEqual({ name: 'Test', count: 10, active: true });
      expect((stored['test-key'] as Record<string, unknown>).transient).toBeUndefined();

      persistence.cancel();
    });
  });
});
