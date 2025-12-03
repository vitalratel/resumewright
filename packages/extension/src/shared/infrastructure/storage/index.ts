/**
 * Storage Utilities
 * Re-exports validated storage operations and helpers
 */

export { safeJsonParse, type ValidationResult, validateWithSchema } from './helpers';

export {
  type JobState,
  type LocalStorageSchema,
  localExtStorage,
  type SyncStorageSchema,
  syncExtStorage,
  type WasmBadgeError,
} from './typedStorage';

export {
  getMultipleValidatedStorage,
  getValidatedStorage,
  removeFromStorage,
  setValidatedStorage,
} from './validation';
