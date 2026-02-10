/**
 * ABOUTME: Chrome storage persistence adapter for Solid stores.
 * ABOUTME: Provides debounced load/save with Valibot validation and flush-on-close support.
 */

import type { BaseSchema, InferOutput } from 'valibot';
import { safeParse } from 'valibot';
import { getLogger } from '../../shared/infrastructure/logging/instance';
import { debounceAsync } from '../../shared/utils/debounce';

/**
 * Load and validate persisted state from Chrome storage.
 * Returns null if no data exists or validation fails.
 */
export async function loadPersistedState<T>(
  storageKey: string,
  schema: BaseSchema<unknown, unknown, never>,
): Promise<T | null> {
  try {
    const result = await browser.storage.local.get(storageKey);
    const value = result[storageKey];

    if (value === null || value === undefined) {
      return null;
    }

    const parsed = safeParse(schema, value);
    if (!parsed.success) {
      getLogger().error('Persistence', 'Validation failed for stored data', parsed.issues);
      return null;
    }

    return parsed.output as T;
  } catch (error) {
    getLogger().error('Persistence', 'Failed to load from storage', error);
    return null;
  }
}

interface PersistenceOptions<TState, TPersisted> {
  state: TState;
  storageKey: string;
  schema: BaseSchema<unknown, unknown, never>;
  debounceMs: number;
  pick: (state: TState) => TPersisted;
}

/**
 * Set up debounced persistence for a Solid store to Chrome storage.
 * Returns save/flush/cancel functions for manual control.
 */
export function setupPersistence<TState, TPersisted>(
  options: PersistenceOptions<TState, TPersisted>,
) {
  const { state, storageKey, schema, debounceMs, pick } = options;

  const debouncedWrite = debounceAsync(async (data: TPersisted) => {
    const parsed = safeParse(schema, data);
    if (!parsed.success) {
      getLogger().error('Persistence', 'Validation failed, skipping write', parsed.issues);
      return;
    }
    await browser.storage.local.set({ [storageKey]: parsed.output });
  }, debounceMs);

  function save() {
    const data = pick(state);
    debouncedWrite(data).catch(() => {
      // Cancellation rejections are expected when cancel() is called
    });
  }

  async function flush() {
    // Snapshot current state and flush
    const data = pick(state);
    void debouncedWrite(data);
    await debouncedWrite.flush();
  }

  function cancel() {
    debouncedWrite.cancel();
  }

  return { save, flush, cancel };
}
