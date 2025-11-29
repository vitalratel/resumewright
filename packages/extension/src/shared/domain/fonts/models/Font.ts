/**
 * Font Type Definitions
 *
 * Core font types for the two-step WASM API:
 * 1. detect_fonts() - Returns FontRequirement[]
 * 2. fetch fonts (TypeScript) - Returns FontData[]
 * 3. convert_tsx_to_pdf() - Accepts FontData[]
 */

// Re-export constants for backward compatibility
export { CUSTOM_FONT_LIMITS } from '../constants';

/**
 * Font source type
 */
export type FontSource = 'google' | 'custom' | 'websafe';

/**
 * Font style
 */
export type FontStyle = 'normal' | 'italic';

/**
 * Font weight (100-900, multiples of 100)
 */
export type FontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

/**
 * Font format
 */
export type FontFormat = 'ttf' | 'woff' | 'woff2';

/**
 * Font requirement detected from TSX
 * Returned by WASM detect_fonts() API
 */
export interface FontRequirement {
  /** Font family name (e.g., "Roboto", "Open Sans") */
  family: string;

  /** Font weight */
  weight: FontWeight;

  /** Font style */
  style: FontStyle;

  /** Font source (Google Fonts, custom upload, or web-safe) */
  source: FontSource;
}

/**
 * Font data for embedding in PDF
 * Passed to WASM convert_tsx_to_pdf() API
 */
export interface FontData {
  /** Font family name */
  family: string;

  /** Font weight */
  weight: FontWeight;

  /** Font style */
  style: FontStyle;

  /** Raw font file bytes */
  bytes: Uint8Array;

  /** Font format */
  format: FontFormat;
}

/**
 * Custom font stored in IndexedDB
 */
export interface CustomFont {
  /** Unique ID (UUID) */
  id: string;

  /** Font family name */
  family: string;

  /** Font weight */
  weight: FontWeight;

  /** Font style */
  style: FontStyle;

  /** Font format */
  format: FontFormat;

  /** Raw font file bytes (TrueType format after decompression) */
  bytes: Uint8Array;

  /** Upload timestamp */
  uploadedAt: number;

  /** File size in bytes */
  fileSize: number;
}

/**
 * Font validation result
 */
export interface FontValidationResult {
  /** Whether font is valid */
  valid: boolean;

  /** Error message if invalid */
  error?: string;

  /** Extracted font metadata if valid */
  metadata?: {
    family: string;
    weight: FontWeight;
    style: FontStyle;
    format: FontFormat;
    fileSize: number;
  };
}

/**
 * Detected font information (from TSX parsing)
 */
export interface DetectedFont {
  family: string;
  weight: FontWeight;
  style: FontStyle;
}

/**
 * Custom font format type (for backward compatibility)
 */
export type CustomFontFormat = FontFormat;

/**
 * Custom font upload error types
 */
export enum CustomFontErrorType {
  INVALID_FORMAT = 'INVALID_FORMAT',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  STORAGE_QUOTA_EXCEEDED = 'STORAGE_QUOTA_EXCEEDED',
  TOO_MANY_FONTS = 'TOO_MANY_FONTS',
  DECOMPRESSION_FAILED = 'DECOMPRESSION_FAILED',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  STORAGE_ERROR = 'STORAGE_ERROR',
}

/**
 * Custom font upload error
 */
export class CustomFontError extends Error {
  constructor(
    public type: CustomFontErrorType,
    message: string,
  ) {
    super(message);
    this.name = 'CustomFontError';
  }
}
