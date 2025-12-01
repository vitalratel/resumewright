/**
 * Storage Utilities
 * Re-exports validated storage operations and helpers
 */

export { safeJsonParse, validateWithSchema, type ValidationResult } from './helpers';

export {
  type JobState,
  localExtStorage,
  type LocalStorageSchema,
  syncExtStorage,
  type SyncStorageSchema,
  type WasmBadgeError,
} from './typedStorage';

export {
  getMultipleValidatedStorage,
  getValidatedStorage,
  removeFromStorage,
  setValidatedStorage,
} from './validation';
