// ABOUTME: Reusable test data for popup tests.
// ABOUTME: Provides consistent fixtures for common scenarios.

import { ErrorCategory, ErrorCode } from '@/shared/errors';
import type { ConversionError } from '@/shared/types/models';
import type { CVMetadata } from '../../store';

/**
 * Sample TSX content (valid)
 */
export const SAMPLE_TSX_VALID = `<CV>
  <Name>John Doe</Name>
  <Role>Software Engineer</Role>
  <Contact>
    <Email>john.doe@example.com</Email>
    <Phone>+1-555-0123</Phone>
  </Contact>
  <Experience>
    <Job company="Tech Corp" role="Senior Engineer" years="2020-2023" />
    <Job company="Startup Inc" role="Developer" years="2018-2020" />
  </Experience>
</CV>`;

/**
 * Sample TSX content (minimal valid)
 */
export const SAMPLE_TSX_MINIMAL = '<CV><Name>Jane Smith</Name></CV>';

/**
 * Sample TSX content (invalid - missing closing tag)
 */
export const SAMPLE_TSX_INVALID = '<CV><Name>Broken';

/**
 * Sample TSX content (empty)
 */
export const SAMPLE_TSX_EMPTY = '';

/**
 * Sample CV metadata (detailed)
 */
export const MOCK_CV_METADATA_DETAILED: CVMetadata = {
  name: 'John Doe',
  role: 'Software Engineer',
  confidence: 0.95,
  estimatedPages: 2,
  layoutType: 'two-column',
  hasImages: false,
};

/**
 * Sample CV metadata (simple)
 */
export const MOCK_CV_METADATA_SIMPLE: CVMetadata = {
  name: 'Jane Smith',
  confidence: 0.9,
  estimatedPages: 1,
  layoutType: 'single-column',
  hasImages: false,
};

/**
 * Sample CV metadata (minimal confidence)
 */
export const MOCK_CV_METADATA_LOW_CONFIDENCE: CVMetadata = {
  name: 'Unknown',
  confidence: 0.3,
  estimatedPages: 1,
  layoutType: 'single-column',
  hasImages: false,
};

/**
 * Sample conversion error (recoverable)
 */
export const MOCK_CONVERSION_ERROR_RECOVERABLE: ConversionError = {
  message: 'Temporary network issue. Please try again.',
  code: ErrorCode.NETWORK_ERROR,
  recoverable: true,
  timestamp: Date.now(),
  suggestions: ['Check your internet connection', 'Try again in a moment'],
  stage: 'queued',
  category: ErrorCategory.NETWORK,
  errorId: 'mock-error-1',
};

/**
 * Sample conversion error (parse error)
 */
export const MOCK_CONVERSION_ERROR_PARSE: ConversionError = {
  message: 'Invalid TSX format detected',
  code: ErrorCode.TSX_PARSE_ERROR,
  recoverable: true,
  timestamp: Date.now(),
  suggestions: ['Check your CV code syntax', 'Re-export from Claude.ai'],
  stage: 'parsing',
  category: ErrorCategory.SYNTAX,
  errorId: 'mock-error-2',
};

/**
 * Sample conversion error (WASM crash - not recoverable)
 */
export const MOCK_CONVERSION_ERROR_WASM_CRASH: ConversionError = {
  message: 'PDF converter crashed unexpectedly',
  code: ErrorCode.WASM_EXECUTION_ERROR,
  recoverable: false,
  timestamp: Date.now(),
  suggestions: ['Reload the extension', 'Contact support if this persists'],
  stage: 'rendering',
  category: ErrorCategory.SYSTEM,
  errorId: 'mock-error-3',
};

/**
 * Sample conversion error (validation failure)
 */
export const MOCK_CONVERSION_ERROR_VALIDATION: ConversionError = {
  message: 'CV structure is invalid',
  code: ErrorCode.INVALID_TSX_STRUCTURE,
  recoverable: true,
  timestamp: Date.now(),
  suggestions: ['Ensure your CV follows the expected format'],
  stage: 'queued',
  category: ErrorCategory.SYNTAX,
  errorId: 'mock-error-4',
};

/**
 * Sample imported file data (simple)
 */
export const MOCK_IMPORTED_FILE_SIMPLE = {
  filename: 'john-doe-cv.tsx',
  size: 512,
  content: SAMPLE_TSX_MINIMAL,
};

/**
 * Sample imported file data (detailed)
 */
export const MOCK_IMPORTED_FILE_DETAILED = {
  filename: 'senior-engineer-resume.tsx',
  size: 2048,
  content: SAMPLE_TSX_VALID,
};

/**
 * Sample imported file data (large)
 */
export const MOCK_IMPORTED_FILE_LARGE = {
  filename: 'comprehensive-cv.tsx',
  size: 520000, // 520KB (exceeds warning threshold)
  content: SAMPLE_TSX_VALID.repeat(100),
};

/**
 * Sample filenames for success state
 */
export const MOCK_SUCCESS_FILENAMES = {
  simple: 'john-doe-cv.pdf',
  detailed: 'john-doe-software-engineer-resume.pdf',
  timestamped: 'resume-2024-01-15-143022.pdf',
};

/**
 * Sample progress percentages for different stages
 */
export const MOCK_PROGRESS_PERCENTAGES = {
  queued: 0,
  parsing: 20,
  rendering: 50,
  layout: 70,
  pdfGeneration: 90,
  compressing: 95,
  completed: 100,
};

/**
 * Sample progress operation messages
 */
export const MOCK_PROGRESS_OPERATIONS = {
  queued: 'Waiting in queue...',
  parsing: 'Parsing TSX code...',
  rendering: 'Rendering React components...',
  layout: 'Calculating page layout...',
  pdfGeneration: 'Generating PDF file...',
  compressing: 'Compressing PDF...',
  completed: 'Conversion complete!',
};

/**
 * Helper: Create mock File object
 */
export function createMockFile(
  filename: string,
  content: string,
  type: string = 'text/plain',
): File {
  const blob = new Blob([content], { type });
  return new File([blob], filename, { type });
}

/**
 * Helper: Create mock CV metadata with custom name
 */
export function createMockCVMetadata(name: string, overrides?: Partial<CVMetadata>): CVMetadata {
  return {
    name,
    confidence: 0.9,
    estimatedPages: 1,
    layoutType: 'single-column',
    hasImages: false,
    ...overrides,
  };
}

/**
 * Helper: Create mock error with custom message
 */
export function createMockError(
  message: string,
  overrides?: Partial<ConversionError>,
): ConversionError {
  return {
    message,
    code: ErrorCode.UNKNOWN_ERROR,
    recoverable: true,
    timestamp: Date.now(),
    suggestions: ['Try again'],
    stage: 'queued',
    category: ErrorCategory.UNKNOWN,
    errorId: 'mock-error-custom',
    ...overrides,
  };
}
