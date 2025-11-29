/**
 * Error Metadata
 *
 * Error categorization and mappings for UI presentation.
 */

import { ErrorCategory, ErrorCode } from './codes';

/**
 * Error Code to Category Mapping
 *
 * Maps each error code to its category for UI presentation.
 */
export const ERROR_CATEGORIES: Record<ErrorCode, ErrorCategory> = {
  [ErrorCode.TSX_PARSE_ERROR]: ErrorCategory.SYNTAX,
  [ErrorCode.INVALID_TSX_STRUCTURE]: ErrorCategory.SYNTAX,
  [ErrorCode.WASM_INIT_FAILED]: ErrorCategory.SYSTEM,
  [ErrorCode.WASM_EXECUTION_ERROR]: ErrorCategory.SYSTEM,
  [ErrorCode.PDF_GENERATION_FAILED]: ErrorCategory.SYSTEM,
  [ErrorCode.PDF_LAYOUT_ERROR]: ErrorCategory.SYSTEM,
  [ErrorCode.DOWNLOAD_FAILED]: ErrorCategory.SYSTEM,
  [ErrorCode.FONT_LOAD_ERROR]: ErrorCategory.NETWORK,
  [ErrorCode.MEMORY_LIMIT_EXCEEDED]: ErrorCategory.SIZE,
  [ErrorCode.RENDER_TIMEOUT]: ErrorCategory.SYSTEM,
  [ErrorCode.CONVERSION_TIMEOUT]: ErrorCategory.SYSTEM,
  [ErrorCode.CONVERSION_START_FAILED]: ErrorCategory.SYSTEM,
  [ErrorCode.BROWSER_PERMISSION_DENIED]: ErrorCategory.SYSTEM,
  [ErrorCode.STORAGE_QUOTA_EXCEEDED]: ErrorCategory.SIZE,
  [ErrorCode.INVALID_CONFIG]: ErrorCategory.SYNTAX,
  [ErrorCode.INVALID_METADATA]: ErrorCategory.SYNTAX,
  [ErrorCode.NETWORK_ERROR]: ErrorCategory.NETWORK,
  [ErrorCode.UNKNOWN_ERROR]: ErrorCategory.UNKNOWN,
};
