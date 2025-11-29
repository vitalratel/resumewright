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

// Factory exports (Now from index)
export {
  createConversionError,
  createDownloadFailedError,
  type CreateErrorOptions,
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

// Enrichment exports
export {
  addCodeContextToError,
  extractCodeContext,
  extractCodeContextWithColumn,
  extractTruncatedCodeContext,
} from './factory/enrichment';
export type { CodeContext } from './factory/enrichment';

export {
  formatCodeContext,
  formatCodeContextAsHtml,
  formatCodeContextWithColumn,
} from './presentation/formatting';
// Presentation exports
export {
  getPriorityColors,
  getPriorityLabel,
  getSizeReductionTips,
  prioritizeSuggestions,
  SUGGESTION_PRIORITIES,
} from './presentation/suggestions';

export type { PrioritizedSuggestion } from './presentation/suggestions';

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
export type { ErrorDetails, ErrorEvent } from './tracking/telemetry';
