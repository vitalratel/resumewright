/**
 * Font Domain Module
 *
 * Pure business logic for font detection, validation, and management.
 * No external dependencies - all functions are side-effect free.
 *
 * @example
 * ```ts
 * import { detectGoogleFontsInTSX, isGoogleFont, GOOGLE_FONTS } from '@/shared/domain/fonts';
 *
 * // Detect fonts in TSX
 * const fonts = detectGoogleFontsInTSX(tsxCode);
 *
 * // Validate font family
 * if (isGoogleFont('Roboto')) {
 *   // ...
 * }
 * ```
 */

// Constants
export { CUSTOM_FONT_LIMITS, GOOGLE_FONTS, WEB_SAFE_FONTS } from './constants';
export type { GoogleFontFamily, WebSafeFont } from './constants';

// Detection
export { detectGoogleFontsInTSX } from './detection';

// Models
export type {
  CustomFont,
  DetectedFont,
  FontData,
  FontFormat,
  FontRequirement,
  FontSource,
  FontStyle,
  FontValidationResult,
  FontWeight,
} from './models/Font';

// Validation
export {
  deduplicateFonts,
  isGoogleFont,
  isValidFontStyle,
  isValidFontWeight,
  isWebSafeFont,
  validateDetectedFonts,
  validateFont,
} from './validation';
