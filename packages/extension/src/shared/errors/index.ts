/**
 * Shared Error Handling Module
 *
 * Centralized error creation, enrichment, presentation, and tracking.
 *
 * @example Factory usage
 * ```ts
 * import { createConversionError, createTsxParseError } from '@/shared/errors';
 *
 * const error = createTsxParseError('parsing', 'Unexpected token', { line: 42 });
 * ```
 *
 * @example Enrichment usage
 * ```ts
 * import { addCodeContextToError } from '@/shared/errors';
 *
 * const enriched = addCodeContextToError(error, tsxCode);
 * ```
 *
 * @example Presentation usage
 * ```ts
 * import { prioritizeSuggestions, getPriorityLabel } from '@/shared/errors';
 *
 * const suggestions = prioritizeSuggestions(ErrorCode.TSX_PARSE_ERROR, rawSuggestions);
 * ```
 */

// Error types, codes, messages (moved from shared/types/errors)
export { ErrorCategory, ErrorCode } from './codes';

// Factory exports (Now from index)
export {
  type CreateErrorOptions,
  createConversionError,
  createDownloadFailedError,
  createFontLoadError,
  createInvalidStructureError,
  createMemoryLimitError,
  createPdfGenerationError,
  createPdfLayoutError,
  createTimeoutError,
  createTsxParseError,
  createUnknownError,
  createWasmExecutionError,
  createWasmInitError,
  errorToConversionError,
} from './factory/';
export type { CodeContext } from './factory/enrichment';
// Enrichment exports
export {
  addCodeContextToError,
  extractCodeContext,
  extractCodeContextWithColumn,
  extractTruncatedCodeContext,
} from './factory/enrichment';
export type { HelpLink } from './helpResources';
export {
  ERROR_HELP_RESOURCES,
  getHelpLinkForSuggestion,
  getHelpResourcesForError,
  SUGGESTION_HELP_LINKS,
} from './helpResources';

export { ERROR_MESSAGES, ERROR_RECOVERABLE, ERROR_SUGGESTIONS } from './messages';
export { ERROR_CATEGORIES } from './metadata';

export {
  formatCodeContext,
  formatCodeContextWithColumn,
} from './presentation/formatting';
export type { PrioritizedSuggestion } from './presentation/suggestions';
// Presentation exports
export {
  getPriorityColors,
  getPriorityLabel,
  getSizeReductionTips,
  prioritizeSuggestions,
  SUGGESTION_PRIORITIES,
} from './presentation/suggestions';
export type { ErrorDetails, ErrorEvent } from './tracking/telemetry';
// Tracking exports (Added telemetry functions)
export {
  clearStoredErrors,
  copyToClipboard,
  exportErrors,
  formatErrorDetailsForClipboard,
  formatErrorTimestamp,
  generateErrorId,
  getStoredErrors,
  getTelemetryStats,
  trackError,
} from './tracking/telemetry';
