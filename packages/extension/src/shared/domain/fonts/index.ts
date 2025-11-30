/**
 * Font Domain Module
 *
 * Font type definitions and constants for the two-step WASM API.
 */

// Constants
export { GOOGLE_FONTS, WEB_SAFE_FONTS } from './constants';
export type { GoogleFontFamily, WebSafeFont } from './constants';

// Models
export type {
  DetectedFont,
  FontData,
  FontFormat,
  FontRequirement,
  FontSource,
  FontStyle,
  FontWeight,
} from './models/Font';
