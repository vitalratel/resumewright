/**
 * Storage Utilities
 * Re-exports validated storage operations and helpers
 */

export { safeJsonParse, validateWithSchema, type ValidationResult } from './helpers';

export {
  getMultipleValidatedStorage,
  getValidatedStorage,
  removeFromStorage,
  setValidatedStorage,
} from './validation';
