/**
 * Type-Safe Extension Storage
 *
 * Provides typed wrappers around browser.storage using @webext-core/storage.
 * All storage keys are defined in a central schema for type safety.
 */

import type { ErrorEvent } from '@/shared/errors/tracking/telemetry';
import type { ConversionStatus } from '@/shared/types/models';
import type { UserSettings } from '@/shared/types/settings';
import { defineExtensionStorage } from '@webext-core/storage';
import { browser } from 'wxt/browser';

/**
 * Job state for lifecycle management persistence
 */
export interface JobState {
  jobId: string;
  status: ConversionStatus;
  startTime: number;
  lastUpdate: number;
  tsx?: string;
}

/**
 * WASM badge error info for UI display
 */
export interface WasmBadgeError {
  hasError: boolean;
  errorMessage?: string;
  timestamp?: number;
}

/**
 * Local storage schema - browser.storage.local
 *
 * All keys that can be stored in local storage with their types.
 * Using `| null` for optional fields per @webext-core/storage convention.
 */
export interface LocalStorageSchema {
  // WASM initialization state
  wasmStatus: 'initializing' | 'success' | 'failed' | null;
  wasmInitTime: number | null;
  wasmInitError: string | null;
  wasmBadgeError: WasmBadgeError | null;

  // Error telemetry
  errorTelemetry: ErrorEvent[] | null;

  // Settings fallback (primary is sync storage)
  'resumewright-settings': UserSettings | null;

  // Lifecycle management
  resumewright_job_states: Record<string, JobState> | null;

  // Zustand store persistence (dynamic key based on store name)
  // Note: Zustand uses its own key pattern, handled separately
}

/**
 * Sync storage schema - browser.storage.sync
 *
 * Cross-device synchronized storage for user settings.
 */
export interface SyncStorageSchema {
  'resumewright-settings': UserSettings | null;
}

/**
 * Type-safe local storage instance
 */
export const localExtStorage = defineExtensionStorage<LocalStorageSchema>(
  browser.storage.local
);

/**
 * Type-safe sync storage instance
 */
export const syncExtStorage = defineExtensionStorage<SyncStorageSchema>(
  browser.storage.sync
);
