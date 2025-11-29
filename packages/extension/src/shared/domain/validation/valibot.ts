/**
 * Valibot Re-exports
 *
 * Centralizes Valibot imports to enable tree-shaking.
 * Only imports validators actually used across the codebase.
 *
 * IMPORTANT: When adding a new validator, import it here and re-export it.
 * This allows bundler to tree-shake unused Valibot code (~200KB savings potential).
 */

// Core parsing functions (most used)
export { parse, safeParse } from 'valibot';

// Schema constructors (most used)
export { array, boolean, literal, number, object, picklist, pipe, string, union } from 'valibot';

// Optional/nullable modifiers
export { nullable, optional } from 'valibot';

// Number validators
export { integer, maxValue, minValue } from 'valibot';

// String validators
export { email, maxLength, minLength, url } from 'valibot';

// Advanced validators
export { check, custom, instance } from 'valibot';

// Type utilities
export type { BaseIssue, BaseSchema, InferOutput } from 'valibot';

// Special schemas
export { any, date, record, strictObject } from 'valibot';

// Null schema (used in background tests)
export { null_ } from 'valibot';
