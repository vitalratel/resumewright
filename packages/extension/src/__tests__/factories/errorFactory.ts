/**
 * Error Factory for Test Suite
 *
 * Provides factory functions to create ConversionError objects with sensible defaults.
 * All factories support overrides for customization.
 *
 * Usage:
 * ```typescript
 * import { createParseError, createSizeError } from '@/__tests__/factories/errorFactory';
 *
 * const error = createParseError(); // Basic parse error
 * const customError = createParseError({ message: 'Custom message' }); // With overrides
 * const locationError = createParseErrorWithLocation(42, 15); // With line/column
 * ```
 */

import type { ConversionError } from '@/shared/types/models';
import { ErrorCategory, ErrorCode } from '@/shared/types/errors/';

/**
 * Generate unique error ID for tests
 */
let errorIdCounter = 0;
function generateErrorId(): string {
  errorIdCounter += 1;
  return `test-error-${errorIdCounter}-${Date.now()}`;
}

/**
 * Create a parse error (TSX_PARSE_ERROR)
 *
 * @param overrides - Partial ConversionError to override defaults
 * @returns ConversionError with parse error defaults
 *
 * @example
 * const error = createParseError();
 * const customError = createParseError({ message: 'Failed at line 10' });
 */
export function createParseError(overrides?: Partial<ConversionError>): ConversionError {
  return {
    stage: 'parsing',
    code: ErrorCode.TSX_PARSE_ERROR,
    message: 'Failed to parse CV code',
    recoverable: true,
    suggestions: [
      'The CV code may be incomplete or corrupted',
      'Try regenerating the CV in Claude',
      'Report this issue if the problem persists',
    ],
    category: ErrorCategory.SYNTAX,
    timestamp: Date.now(),
    errorId: generateErrorId(),
    ...overrides,
  };
}

/**
 * Create a parse error with line and column metadata
 *
 * @param line - Line number where error occurred
 * @param column - Column number where error occurred
 * @param overrides - Additional overrides
 * @returns ConversionError with location metadata
 *
 * @example
 * const error = createParseErrorWithLocation(42, 15);
 */
export function createParseErrorWithLocation(line: number, column: number, overrides?: Partial<ConversionError>): ConversionError {
  return createParseError({
    message: `Failed to parse CV code at line ${line}, column ${column}`,
    technicalDetails: 'SyntaxError: Unexpected token',
    metadata: { type: 'location', line, column },
    ...overrides,
  });
}

/**
 * Create a size/memory limit error (MEMORY_LIMIT_EXCEEDED)
 *
 * @param overrides - Partial ConversionError to override defaults
 * @returns ConversionError with size error defaults
 *
 * @example
 * const error = createSizeError();
 * const customError = createSizeError({ recoverable: true });
 */
export function createSizeError(overrides?: Partial<ConversionError>): ConversionError {
  return {
    stage: 'laying-out',
    code: ErrorCode.MEMORY_LIMIT_EXCEEDED,
    message: 'CV is too large to process',
    recoverable: false,
    suggestions: [
      'Your CV is too large',
      'Try reducing the content',
      'Split into multiple CVs',
    ],
    category: ErrorCategory.SIZE,
    metadata: {
      type: 'size',
      fileSize: 5242880, // 5 MB
      maxSize: 4194304, // 4 MB
    },
    timestamp: Date.now(),
    errorId: generateErrorId(),
    ...overrides,
  };
}

/**
 * Create a size error with specific byte sizes
 *
 * @param fileSize - Current file size in bytes
 * @param maxSize - Maximum allowed size in bytes
 * @param overrides - Additional overrides
 * @returns ConversionError with size metadata
 *
 * @example
 * const error = createSizeErrorWithBytes(5242880, 4194304);
 */
export function createSizeErrorWithBytes(fileSize: number, maxSize: number, overrides?: Partial<ConversionError>): ConversionError {
  const formatBytes = (bytes: number): string => {
    return `${(bytes / 1048576).toFixed(0)} MB`;
  };

  return createSizeError({
    message: `CV is too large to process (${formatBytes(fileSize)}, max ${formatBytes(maxSize)})`,
    technicalDetails: 'Memory allocation failed',
    metadata: { type: 'size', fileSize, maxSize },
    ...overrides,
  });
}

/**
 * Create a system error (WASM_INIT_FAILED)
 *
 * @param overrides - Partial ConversionError to override defaults
 * @returns ConversionError with system error defaults
 *
 * @example
 * const error = createSystemError();
 * const customError = createSystemError({ recoverable: false });
 */
export function createSystemError(overrides?: Partial<ConversionError>): ConversionError {
  return {
    stage: 'queued',
    code: ErrorCode.WASM_INIT_FAILED,
    message: 'Failed to initialize converter',
    technicalDetails: 'WebAssembly instantiation failed',
    recoverable: true,
    suggestions: [
      'Try restarting your browser',
      'Check if your browser supports WebAssembly',
      'Update your browser to the latest version',
    ],
    category: ErrorCategory.SYSTEM,
    timestamp: Date.now(),
    errorId: generateErrorId(),
    ...overrides,
  };
}

/**
 * Create a network error (FONT_LOAD_ERROR)
 *
 * @param overrides - Partial ConversionError to override defaults
 * @returns ConversionError with network error defaults
 *
 * @example
 * const error = createNetworkError();
 * const customError = createNetworkError({ message: 'Failed to load custom font' });
 */
export function createNetworkError(overrides?: Partial<ConversionError>): ConversionError {
  return {
    stage: 'generating-pdf',
    code: ErrorCode.FONT_LOAD_ERROR,
    message: 'Failed to load fonts',
    technicalDetails: 'Network request failed',
    recoverable: true,
    suggestions: [
      'Check your internet connection',
      'Try again in a moment',
      'Contact support if the issue persists',
    ],
    category: ErrorCategory.NETWORK,
    timestamp: Date.now(),
    errorId: generateErrorId(),
    ...overrides,
  };
}

/**
 * Create a PDF generation error (PDF_GENERATION_FAILED)
 *
 * @param overrides - Partial ConversionError to override defaults
 * @returns ConversionError with PDF generation error defaults
 *
 * @example
 * const error = createPdfGenerationError();
 */
export function createPdfGenerationError(overrides?: Partial<ConversionError>): ConversionError {
  return {
    stage: 'generating-pdf',
    code: ErrorCode.PDF_GENERATION_FAILED,
    message: 'Failed to generate PDF',
    technicalDetails: 'PDF rendering failed',
    recoverable: true,
    suggestions: [
      'Try converting again',
      'Check your CV format',
      'Report this issue if the problem persists',
    ],
    category: ErrorCategory.SYSTEM,
    timestamp: Date.now(),
    errorId: generateErrorId(),
    ...overrides,
  };
}

/**
 * Create a WASM execution error (WASM_EXECUTION_ERROR)
 *
 * @param overrides - Partial ConversionError to override defaults
 * @returns ConversionError with WASM execution error defaults
 *
 * @example
 * const error = createWasmExecutionError();
 */
export function createWasmExecutionError(overrides?: Partial<ConversionError>): ConversionError {
  return {
    stage: 'rendering',
    code: ErrorCode.WASM_EXECUTION_ERROR,
    message: 'Conversion failed',
    technicalDetails: 'WASM module execution error',
    recoverable: true,
    suggestions: [
      'Try converting again',
      'Restart your browser if the issue persists',
    ],
    category: ErrorCategory.SYSTEM,
    timestamp: Date.now(),
    errorId: generateErrorId(),
    ...overrides,
  };
}

/**
 * Create a timeout error (CONVERSION_TIMEOUT)
 *
 * @param overrides - Partial ConversionError to override defaults
 * @returns ConversionError with timeout error defaults
 *
 * @example
 * const error = createTimeoutError();
 */
export function createTimeoutError(overrides?: Partial<ConversionError>): ConversionError {
  return {
    stage: 'generating-pdf',
    code: ErrorCode.CONVERSION_TIMEOUT,
    message: 'Conversion took too long',
    technicalDetails: 'Operation exceeded maximum duration',
    recoverable: true,
    suggestions: [
      'Try converting a smaller CV',
      'Simplify your CV content',
      'Try again later',
    ],
    category: ErrorCategory.SYSTEM,
    timestamp: Date.now(),
    errorId: generateErrorId(),
    ...overrides,
  };
}

/**
 * Create an invalid TSX structure error (INVALID_TSX_STRUCTURE)
 *
 * @param overrides - Partial ConversionError to override defaults
 * @returns ConversionError with invalid structure error defaults
 *
 * @example
 * const error = createInvalidStructureError();
 */
export function createInvalidStructureError(overrides?: Partial<ConversionError>): ConversionError {
  return {
    stage: 'parsing',
    code: ErrorCode.INVALID_TSX_STRUCTURE,
    message: 'Invalid CV structure',
    technicalDetails: 'TSX structure validation failed',
    recoverable: true,
    suggestions: [
      'The CV structure is invalid',
      'Try regenerating the CV in Claude',
      'Ensure the CV uses the correct template',
    ],
    category: ErrorCategory.SYNTAX,
    timestamp: Date.now(),
    errorId: generateErrorId(),
    ...overrides,
  };
}

/**
 * Create a generic error with minimal fields (for testing edge cases)
 *
 * @param overrides - Partial ConversionError to override defaults
 * @returns ConversionError with minimal defaults
 *
 * @example
 * const error = createGenericError({ category: undefined, suggestions: [] });
 */
export function createGenericError(overrides?: Partial<ConversionError>): ConversionError {
  return {
    stage: 'queued',
    code: ErrorCode.UNKNOWN_ERROR,
    message: 'An error occurred',
    recoverable: true,
    suggestions: ['Try again'],
    timestamp: Date.now(),
    errorId: generateErrorId(),
    ...overrides,
  };
}

/**
 * Create an error without metadata (for testing optional fields)
 *
 * @param overrides - Partial ConversionError to override defaults
 * @returns ConversionError without metadata
 *
 * @example
 * const error = createErrorWithoutMetadata();
 */
export function createErrorWithoutMetadata(overrides?: Partial<ConversionError>): ConversionError {
  return {
    stage: 'parsing',
    code: ErrorCode.TSX_PARSE_ERROR,
    message: 'Parse error without metadata',
    recoverable: true,
    suggestions: ['Try again'],
    category: ErrorCategory.SYNTAX,
    timestamp: Date.now(),
    errorId: generateErrorId(),
    ...overrides,
  };
}

/**
 * Create an error without category (for testing optional fields)
 *
 * @param overrides - Partial ConversionError to override defaults
 * @returns ConversionError without category
 *
 * @example
 * const error = createErrorWithoutCategory();
 */
export function createErrorWithoutCategory(overrides?: Partial<ConversionError>): ConversionError {
  return {
    stage: 'parsing',
    code: ErrorCode.TSX_PARSE_ERROR,
    message: 'Parse error without category',
    recoverable: true,
    suggestions: ['Try again'],
    timestamp: Date.now(),
    errorId: generateErrorId(),
    ...overrides,
  };
}

/**
 * Create an error without suggestions (for testing optional fields)
 *
 * @param overrides - Partial ConversionError to override defaults
 * @returns ConversionError with empty suggestions
 *
 * @example
 * const error = createErrorWithoutSuggestions();
 */
export function createErrorWithoutSuggestions(overrides?: Partial<ConversionError>): ConversionError {
  return {
    stage: 'parsing',
    code: ErrorCode.TSX_PARSE_ERROR,
    message: 'Parse error without suggestions',
    recoverable: false,
    suggestions: [],
    category: ErrorCategory.SYNTAX,
    timestamp: Date.now(),
    errorId: generateErrorId(),
    ...overrides,
  };
}
