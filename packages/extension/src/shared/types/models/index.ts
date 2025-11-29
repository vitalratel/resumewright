/**
 * Models Barrel Export
 *
 * Re-exports all model types from domain-specific files for backward compatibility.
 * This ensures existing imports continue to work without changes.
 *
 * REFACTORED: models.ts has been split into domain-specific files:
 * - cv.ts: CV-related types (CVMetadata, CVDocument)
 * - conversion.ts: Conversion-related types (ConversionStatus, ConversionProgress, ConversionConfig, ConversionJob, ConversionError, ConversionResult)
 * - pdf.ts: PDF-related types (PDFMetadata)
 * - history.ts: History-related types (HistoryEntry)
 *
 * WHY: Reduces token waste by 50-88% when editing domain-specific types.
 * Before: 420 lines loaded for ANY edit
 * After: 50-200 lines loaded for focused domain work
 */

// Conversion types - Added ErrorMetadata discriminated union types
export type {
  ConversionConfig,
  ConversionError,
  ConversionJob,
  ConversionProgress,
  ConversionResult,
  ConversionStatus,
  ErrorMetadata,
  LocationErrorMetadata,
  ParseErrorMetadata,
  RetryErrorMetadata,
  SizeErrorMetadata,
  WasmErrorMetadata,
} from './conversion';

// Export constant and type guards
export {
  DEFAULT_CONVERSION_CONFIG,
  isLocationErrorMetadata,
  isParseErrorMetadata,
  isRetryErrorMetadata,
  isSizeErrorMetadata,
  isWasmErrorMetadata,
} from './conversion';

// CV types
export type { CVDocument, CVMetadata } from './cv';

// History types
export type { HistoryEntry } from './history';

// PDF types
export type { PDFMetadata } from './pdf';
