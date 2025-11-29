/**
 * Error Codes and Categories
 *
 * Machine-readable error codes for classification and handling.
 * Use const enum for compile-time inlining and tree-shaking.
 */

/**
 * Error Codes
 *
 * Machine-readable error codes for classification and handling.
 * Use const enum for compile-time inlining and tree-shaking.
 */
export const enum ErrorCode {
  // Parsing errors
  TSX_PARSE_ERROR = 'TSX_PARSE_ERROR',
  INVALID_TSX_STRUCTURE = 'INVALID_TSX_STRUCTURE',

  // WASM errors
  WASM_INIT_FAILED = 'WASM_INIT_FAILED',
  WASM_EXECUTION_ERROR = 'WASM_EXECUTION_ERROR',

  // PDF generation errors
  PDF_GENERATION_FAILED = 'PDF_GENERATION_FAILED',
  PDF_LAYOUT_ERROR = 'PDF_LAYOUT_ERROR',

  // Download errors
  DOWNLOAD_FAILED = 'DOWNLOAD_FAILED',

  // Resource errors
  FONT_LOAD_ERROR = 'FONT_LOAD_ERROR',
  MEMORY_LIMIT_EXCEEDED = 'MEMORY_LIMIT_EXCEEDED',

  // Timeout errors
  RENDER_TIMEOUT = 'RENDER_TIMEOUT',
  CONVERSION_TIMEOUT = 'CONVERSION_TIMEOUT',

  // Conversion start errors
  CONVERSION_START_FAILED = 'CONVERSION_START_FAILED',

  // Permission errors
  BROWSER_PERMISSION_DENIED = 'BROWSER_PERMISSION_DENIED',
  STORAGE_QUOTA_EXCEEDED = 'STORAGE_QUOTA_EXCEEDED',

  // Validation errors
  INVALID_CONFIG = 'INVALID_CONFIG',
  INVALID_METADATA = 'INVALID_METADATA',

  // Network errors (future, if needed)
  NETWORK_ERROR = 'NETWORK_ERROR',

  // Generic errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Error Categories
 *
 * High-level categorization of errors for UI presentation and debugging.
 * Categorize errors by type
 */
export enum ErrorCategory {
  /** Syntax and structure errors in TSX/CV */
  SYNTAX = 'SYNTAX',

  /** File size and quota errors */
  SIZE = 'SIZE',

  /** System and browser errors */
  SYSTEM = 'SYSTEM',

  /** Network and resource loading errors */
  NETWORK = 'NETWORK',

  /** Unknown or unexpected errors */
  UNKNOWN = 'UNKNOWN',
}
