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
