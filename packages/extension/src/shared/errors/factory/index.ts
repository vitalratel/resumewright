/**
 * Error Factory Exports
 * Centralized exports for all error factory functions
 *
 * Re-exports all error creation functions from category-specific modules
 * for convenient importing throughout the application.
 */

// Enrichment utilities (already separate)
export * from './enrichment';

// Base factory
export { type CreateErrorOptions, createConversionError } from './errorFactory';

// Network errors
export { createFontLoadError } from './networkErrors';

// PDF errors
export {
  createDownloadFailedError,
  createPdfGenerationError,
  createPdfLayoutError,
} from './pdfErrors';

// System errors
export {
  createMemoryLimitError,
  createTimeoutError,
  createUnknownError,
  errorToConversionError,
} from './systemErrors';

// Validation errors
export { createInvalidStructureError, createTsxParseError } from './validationErrors';

// WASM errors
export { createWasmExecutionError, createWasmInitError } from './wasmErrors';
