// ABOUTME: Font type definitions for the two-step WASM API.
// ABOUTME: Contains FontRequirement, FontData, and related types.

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
