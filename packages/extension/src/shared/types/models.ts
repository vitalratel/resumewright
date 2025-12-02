// ABOUTME: Type definitions for the TSX-to-PDF conversion pipeline.
// ABOUTME: Contains status, progress, error, configuration types and error metadata.

import type { ErrorCategory, ErrorCode } from '../errors';

// Default config - canonical source is @/shared/domain/settings/defaults
export { DEFAULT_CONVERSION_CONFIG } from '../domain/settings/defaults';

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
  metadata: ErrorMetadata | undefined,
): metadata is ParseErrorMetadata {
  return metadata?.type === 'parse';
}

export function isSizeErrorMetadata(
  metadata: ErrorMetadata | undefined,
): metadata is SizeErrorMetadata {
  return metadata?.type === 'size';
}

export function isRetryErrorMetadata(
  metadata: ErrorMetadata | undefined,
): metadata is RetryErrorMetadata {
  return metadata?.type === 'retry';
}

export function isWasmErrorMetadata(
  metadata: ErrorMetadata | undefined,
): metadata is WasmErrorMetadata {
  return metadata?.type === 'wasm';
}

export function isLocationErrorMetadata(
  metadata: ErrorMetadata | undefined,
): metadata is LocationErrorMetadata {
  return metadata?.type === 'location';
}

/**
 * Conversion Error
 *
 * Structured error information for failed conversions.
 */
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

  /** Timestamp when the error occurred */
  timestamp: number;

  /** Unique error identifier for tracking and reporting */
  errorId: string;
}

/**
 * PDF Conversion Configuration
 *
 * Settings for PDF generation and export.
 * Used in UserSettings and per-conversion overrides.
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

  /** Enable ATS optimization mode */
  atsOptimization?: boolean;

  /** Embed PDF metadata */
  includeMetadata?: boolean;
}
