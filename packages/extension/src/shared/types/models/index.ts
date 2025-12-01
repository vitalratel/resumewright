// ABOUTME: Barrel export for model types.
// ABOUTME: Re-exports types from domain-specific files (cv, conversion, pdf, history).

// Default config - canonical source is @/shared/domain/settings/defaults
export { DEFAULT_CONVERSION_CONFIG } from '../../domain/settings/defaults';

// Conversion types
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

// Type guards for error metadata
export {
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
