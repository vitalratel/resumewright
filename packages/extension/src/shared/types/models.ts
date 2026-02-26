// ABOUTME: Type definitions for the TSX-to-PDF conversion pipeline.
// ABOUTME: Contains status, progress, error, configuration types and error metadata.

import type { ErrorCategory, ErrorCode } from '../errors/codes';

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

  /** Timestamp when the error occurred */
  timestamp: number;
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
