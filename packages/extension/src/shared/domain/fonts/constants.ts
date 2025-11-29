/**
 * Font Constants
 *
 * Shared font family lists and constants for font detection and validation.
 * Must be kept in sync with Rust implementation (pdf-generator/src/font_mapper.rs).
 */

/**
 * Google Fonts supported for embedding in PDFs
 */
export const GOOGLE_FONTS = [
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Poppins',
  'Source Sans Pro',
  'Raleway',
  'Merriweather',
  'PT Sans',
  'Nunito',
] as const;

export type GoogleFontFamily = (typeof GOOGLE_FONTS)[number];

/**
 * Web-safe fonts available without fetching
 * These fonts are built into the PDF generator
 */
export const WEB_SAFE_FONTS = [
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Times',
  'Courier New',
  'Courier',
  'Georgia',
  'Verdana',
] as const;

export type WebSafeFont = (typeof WEB_SAFE_FONTS)[number];

/**
 * Custom font storage limits
 */
export const CUSTOM_FONT_LIMITS = {
  /** Maximum file size per font (2MB) */
  MAX_FILE_SIZE: 2 * 1024 * 1024,

  /** Maximum number of custom fonts */
  MAX_FONT_COUNT: 10,

  /** Maximum total storage for custom fonts (20MB) */
  MAX_TOTAL_SIZE: 20 * 1024 * 1024,
} as const;
