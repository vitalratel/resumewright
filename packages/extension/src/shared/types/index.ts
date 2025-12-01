// ABOUTME: Barrel export for shared type definitions.
// ABOUTME: Re-exports types from models, messages, settings, and errors modules.

// Fonts
export type {
  DetectedFont,
  FontStyle,
  FontWeight,
  GoogleFontFamily,
} from '../domain/fonts';

export { GOOGLE_FONTS } from '../domain/fonts';

// Errors
export type {
  CodeContext,
  CreateErrorOptions,
  ErrorDetails,
  PrioritizedSuggestion,
} from '../errors';

// Logging
export { LogLevel } from '../infrastructure/logging';

export type { LoggerConfig } from '../infrastructure/logging';
export { ERROR_MESSAGES, ERROR_RECOVERABLE, ERROR_SUGGESTIONS, ErrorCode } from './errors/';

// Message payloads
export type {
  ConversionCompletePayload,
  ConversionErrorPayload,
  ConversionProgressPayload,
  ConversionRequestPayload,
  FetchGoogleFontPayload,
  GoogleFontErrorPayload,
  GoogleFontFetchedPayload,
  PopupOpenedPayload,
  UpdateSettingsPayload,
  WasmStatusPayload,
} from './messages';

// Models
export type {
  ConversionConfig,
  ConversionError,
  ConversionJob,
  ConversionProgress,
  ConversionResult,
  ConversionStatus,
  CVDocument,
  CVMetadata,
  HistoryEntry,
  PDFMetadata,
} from './models';

export { DEFAULT_CONVERSION_CONFIG } from './models';

// Settings
export type { UserSettings, ValidationError, ValidationResult } from './settings';
