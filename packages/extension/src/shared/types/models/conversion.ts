/**
 * Conversion-Related Type Definitions
 *
 * Contains types for conversion status, progress, jobs, configuration, and errors.
 * Extracted from models.ts for better modularity.
 */

import type { ErrorCategory, ErrorCode } from '../errors/';
import type { CVDocument } from './cv';
import type { PDFMetadata } from './pdf';

/**
 * Conversion Status
 *
 * Represents the current stage of the TSX-to-PDF conversion process.
 * Forms a state machine: queued → parsing → ... → completed/failed/cancelled
 */
export type ConversionStatus =
  | 'queued' // Waiting to start
  | 'parsing' // Parsing TSX
  | 'extracting-metadata' // Extracting CV metadata
  | 'rendering' // Rendering virtual DOM
  | 'laying-out' // Calculating PDF layout
  | 'optimizing' // Applying ATS optimizations
  | 'generating-pdf' // Generating PDF bytes
  | 'completed' // Successfully completed
  | 'failed' // Failed with error
  | 'cancelled'; // User cancelled

/**
 * Conversion Progress
 *
 * Provides detailed progress information for UI display.
 * Updated in real-time during conversion process.
 */
export interface ConversionProgress {
  /** Current conversion stage */
  stage: ConversionStatus;

  /** Progress percentage (0-100) */
  percentage: number;

  /** Human-readable description of current operation */
  currentOperation: string;

  /** Estimated time remaining in milliseconds (optional) */
  estimatedTimeRemaining?: number;

  /** Pages processed so far (optional) */
  pagesProcessed?: number;

  /** Total pages to process (optional) */
  totalPages?: number;

  /** Current retry attempt number (Retry logic) */
  retryAttempt?: number;

  /** Last error message from previous attempt (Retry context) */
  lastError?: string;
}

/**
 * Conversion Error
 *
 * Structured error information for failed conversions.
 * Implements comprehensive error handling.
 */
/**
 * Error metadata types - Discriminated union for type safety
 */

/** Metadata for parse errors (TSX syntax errors) */
export interface ParseErrorMetadata {
  type: 'parse';
  /** Line number where parse error occurred */
  line: number;
  /** Column number where parse error occurred */
  column: number;
  /** Code context snippet showing the error */
  codeContext: string;
}

/** Metadata for size limit errors */
export interface SizeErrorMetadata {
  type: 'size';
  /** Current file size in bytes */
  fileSize: number;
  /** Maximum allowed size in bytes */
  maxSize: number;
}

/** Metadata for retry tracking */
export interface RetryErrorMetadata {
  type: 'retry';
  /** Number of retry attempts made */
  retryAttempt: number;
  /** Last error message from previous attempt */
  lastError?: string;
}

/** Metadata for WASM-specific errors */
export interface WasmErrorMetadata {
  type: 'wasm';
  /** Browser information */
  browserInfo?: unknown;
  /** WASM module information */
  wasmInfo?: unknown;
  /** Memory information */
  memoryInfo?: unknown;
}

/** Metadata for generic errors with line/column info */
export interface LocationErrorMetadata {
  type: 'location';
  /** Line number (optional) */
  line?: number;
  /** Column number (optional) */
  column?: number;
  /** File size (optional) */
  fileSize?: number;
  /** Max size (optional) */
  maxSize?: number;
}

/** Union of all possible error metadata types */
export type ErrorMetadata =
  | ParseErrorMetadata
  | SizeErrorMetadata
  | RetryErrorMetadata
  | WasmErrorMetadata
  | LocationErrorMetadata;

/**
 * Type guards for error metadata
 */
export function isParseErrorMetadata(
  metadata: ErrorMetadata | undefined
): metadata is ParseErrorMetadata {
  return metadata?.type === 'parse';
}

export function isSizeErrorMetadata(
  metadata: ErrorMetadata | undefined
): metadata is SizeErrorMetadata {
  return metadata?.type === 'size';
}

export function isRetryErrorMetadata(
  metadata: ErrorMetadata | undefined
): metadata is RetryErrorMetadata {
  return metadata?.type === 'retry';
}

export function isWasmErrorMetadata(
  metadata: ErrorMetadata | undefined
): metadata is WasmErrorMetadata {
  return metadata?.type === 'wasm';
}

export function isLocationErrorMetadata(
  metadata: ErrorMetadata | undefined
): metadata is LocationErrorMetadata {
  return metadata?.type === 'location';
}

export interface ConversionError {
  /** Conversion stage where error occurred */
  stage: ConversionStatus;

  /** Machine-readable error code (see ErrorCode enum) */
  code: ErrorCode;

  /** User-friendly error message */
  message: string;

  /** Detailed technical information for debugging */
  technicalDetails?: string;

  /** Whether user can retry the operation */
  recoverable: boolean;

  /** Actionable suggestions for the user */
  suggestions: string[];

  /** Error category for UI presentation */
  category?: ErrorCategory;

  /** Error-specific metadata for enhanced error display - Discriminated union */
  metadata?: ErrorMetadata;

  /** Timestamp when the error occurred  */
  timestamp: number;

  /** Unique error identifier for tracking and reporting  */
  errorId: string;
}

/**
 * Conversion Result
 *
 * Discriminated union for successful or failed conversion.
 * Use type guards to narrow the type safely.
 *
 * @example
 * ```ts
 * if (result.success) {
 *   // TypeScript knows result has pdfBytes and metadata
 *   downloadPDF(result.pdfBytes, result.metadata.title);
 * } else {
 *   // TypeScript knows result has error
 *   showError(result.error.message);
 * }
 * ```
 */
export type ConversionResult =
  | {
      success: true;
      pdfBytes: Uint8Array;
      metadata: PDFMetadata;
    }
  | {
      success: false;
      error: ConversionError;
    };

/**
 * ATS Scoring Weights Configuration
 *
 * Allows customization of how different resume elements contribute to the overall
 * ATS compatibility score. All weights should sum to 1.0 for intuitive percentage-based scoring.
 *
 * @remarks
 * - Default weights follow industry standards for ATS parsing priorities
 * - Experience and education weights are distributed across multiple entries
 * - Technical requirements (text/fonts embedded) ensure parsing capability
 *
 * @example
 * ```ts
 * // Use default industry-standard weights
 * const defaultWeights: ATSWeights = {
 *   name: 0.10,           // 10% - Critical for identification
 *   email: 0.10,          // 10% - Critical for contact
 *   phone: 0.05,          // 5% - Recommended contact
 *   experience: 0.30,     // 30% - Primary content (6% per entry, max 5)
 *   education: 0.20,      // 20% - Important background (10% per entry, max 2)
 *   skills: 0.10,         // 10% - Keyword matching
 *   textEmbedded: 0.05,   // 5% - Technical requirement
 *   fontsEmbedded: 0.05,  // 5% - Technical requirement
 *   structure: 0.05       // 5% - Accessibility
 * };
 *
 * // Emphasize experience over education
 * const customWeights: ATSWeights = {
 *   ...defaultWeights,
 *   experience: 0.40,  // 40%
 *   education: 0.10    // 10%
 * };
 * ```
 */
export interface ATSWeights {
  /** Weight for name presence (default: 0.10 = 10%) */
  name: number;

  /** Weight for email presence (default: 0.10 = 10%) */
  email: number;

  /** Weight for phone presence (default: 0.05 = 5%) */
  phone: number;

  /** Weight for experience entries (default: 0.30 = 30%). Applied as: (count * 0.06).min(0.30) */
  experience: number;

  /** Weight for education entries (default: 0.20 = 20%). Applied as: (count * 0.10).min(0.20) */
  education: number;

  /** Weight for skills section (default: 0.10 = 10%) */
  skills: number;

  /** Weight for text embedding (default: 0.05 = 5%) */
  textEmbedded: number;

  /** Weight for font embedding (default: 0.05 = 5%) */
  fontsEmbedded: number;

  /** Weight for proper document structure (default: 0.05 = 5%) */
  structure: number;
}

/**
 * Default ATS weights following industry standards
 */
export const DEFAULT_ATS_WEIGHTS: ATSWeights = {
  name: 0.1,
  email: 0.1,
  phone: 0.05,
  experience: 0.3,
  education: 0.2,
  skills: 0.1,
  textEmbedded: 0.05,
  fontsEmbedded: 0.05,
  structure: 0.05,
};

/**
 * PDF Conversion Configuration
 *
 * Settings for PDF generation and export.
 * Used in UserSettings and per-conversion overrides.
 *
 * @see {@link UserSettings}
 */
export interface ConversionConfig {
  /** Page size: Letter (8.5x11") or A4 (210x297mm) */
  pageSize: 'Letter' | 'A4' | 'Legal';

  /** Page margins in inches */
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };

  /** Base font size in points */
  fontSize: number;

  /** Default font family */
  fontFamily: string;

  /** Custom filename override (optional) */
  filename?: string;

  /** Enable PDF compression */
  compress: boolean;

  /** Enable ATS optimization mode (post-MVP) */
  atsOptimization?: boolean;

  /** Embed PDF metadata */
  includeMetadata?: boolean;

  /** Custom ATS scoring weights (optional, uses defaults if not provided) */
  atsWeights?: ATSWeights;
}


/**
 * Conversion Job
 *
 * Tracks the complete state and progress of a TSX-to-PDF conversion.
 * Manages lifecycle from queue to completion/failure.
 *
 * @example
 * ```ts
 * const job: ConversionJob = {
 *   id: 'job-123',
 *   cvDocument: cv,
 *   status: 'parsing',
 *   progress: { stage: 'parsing', percentage: 25, currentOperation: 'Parsing TSX...' },
 *   config: defaultConfig,
 *   startTime: Date.now()
 * };
 * ```
 */
export interface ConversionJob {
  /** Unique job identifier */
  id: string;

  /** CV document being converted */
  cvDocument: CVDocument;

  /** Current conversion status */
  status: ConversionStatus;

  /** Real-time progress information */
  progress: ConversionProgress;

  /** Conversion configuration */
  config: ConversionConfig;

  /** Conversion result (only present when completed or failed) */
  result?: ConversionResult;

  /** Job start timestamp */
  startTime: number;

  /** Job end timestamp (only present when completed, failed, or cancelled) */
  endTime?: number;
}
