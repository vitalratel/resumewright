/**
 * Validation Module
 *
 * Centralized validation with schemas, validators, and caching.
 *
 * @example Schema-only imports (for types/codegen)
 * ```ts
 * import { CVDocumentSchema, UserSettingsSchema } from '@/shared/validation/schemas';
 * ```
 *
 * @example Validator imports (for runtime validation)
 * ```ts
 * import { parseCVDocument, parseUserSettings } from '@/shared/validation';
 *
 * const result = parseCVDocument(data);
 * if (result.success) {
 *   console.log(result.data);
 * }
 * ```
 *
 * @example Caching for performance
 * ```ts
 * import { validateWithCache } from '@/shared/validation';
 *
 * const isValid = validateWithCache(data, (d): d is CVDocument => {
 *   return CVDocumentSchema.safeParse(d).success;
 * });
 * ```
 */

// Cache utilities
export {
  clearValidationCache,
  getValidationCacheStats,
  logValidationCacheStats,
  measureValidation,
  shouldValidate,
  validateWithCache,
} from './cache';

// Schemas (re-exported from subdirectory for convenience)
export * from './schemas';

// Validators
export * from './validators';
