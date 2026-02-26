/**
 * Type-Safe Extension Storage
 *
 * Provides typed wrappers around browser.storage using @webext-core/storage.
 * All storage keys are defined in a central schema for type safety.
 */

import { defineExtensionStorage } from '@webext-core/storage';
import { browser } from 'wxt/browser';
import type { UserSettings } from '@/shared/types/settings';

/**
 * Local storage schema - browser.storage.local
 *
 * All keys that can be stored in local storage with their types.
 * Using `| null` for optional fields per @webext-core/storage convention.
 */
interface LocalStorageSchema {
  // WASM initialization state
  wasmStatus: 'initializing' | 'success' | 'failed' | null;
  wasmInitTime: number | null;
  wasmInitError: string | null;

  // Settings fallback (primary is sync storage)
  'resumewright-settings': UserSettings | null;
}

/**
 * Sync storage schema - browser.storage.sync
 *
 * Cross-device synchronized storage for user settings.
 */
interface SyncStorageSchema {
  'resumewright-settings': UserSettings | null;
}

/**
 * Type-safe local storage instance
 */
export const localExtStorage = defineExtensionStorage<LocalStorageSchema>(browser.storage.local);

/**
 * Type-safe sync storage instance
 */
export const syncExtStorage = defineExtensionStorage<SyncStorageSchema>(browser.storage.sync);
