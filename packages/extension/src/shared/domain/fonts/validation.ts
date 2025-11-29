/**
 * Font Validation Logic
 *
 * Pure validation functions for font families, weights, and styles.
 * No external dependencies - all functions are pure and side-effect free.
 */

import type { GoogleFontFamily } from './constants';
import type { DetectedFont, FontStyle, FontWeight } from './models/Font';
import { GOOGLE_FONTS, WEB_SAFE_FONTS } from './constants';

/**
 * Check if a font family is a supported Google Font
 *
 * @param family - Font family name (case-insensitive)
 * @returns true if supported Google Font
 *
 * @example
 * ```ts
 * isGoogleFont('Roboto')      // true
 * isGoogleFont('roboto')      // true (case-insensitive)
 * isGoogleFont(' Roboto ')    // true (trimmed)
 * isGoogleFont('Arial')       // false
 * ```
 */
export function isGoogleFont(family: string): family is GoogleFontFamily {
  const normalized = family.trim();
  return GOOGLE_FONTS.some((gf) => gf.toLowerCase() === normalized.toLowerCase());
}

/**
 * Check if a font family is a web-safe font
 *
 * @param family - Font family name (case-insensitive)
 * @returns true if web-safe font
 *
 * @example
 * ```ts
 * isWebSafeFont('Arial')             // true
 * isWebSafeFont('Times New Roman')   // true
 * isWebSafeFont('Roboto')            // false
 * ```
 */
export function isWebSafeFont(family: string): boolean {
  const normalized = family.trim().toLowerCase();
  return WEB_SAFE_FONTS.some((wsf) => wsf.toLowerCase() === normalized);
}

/**
 * Validate font weight is a multiple of 100 between 100-900
 *
 * @param weight - Font weight to validate
 * @returns true if valid weight (100, 200, ..., 900)
 *
 * @example
 * ```ts
 * isValidFontWeight(400)   // true
 * isValidFontWeight(700)   // true
 * isValidFontWeight(150)   // false (not multiple of 100)
 * isValidFontWeight(1000)  // false (out of range)
 * ```
 */
export function isValidFontWeight(weight: number): weight is FontWeight {
  return weight >= 100 && weight <= 900 && weight % 100 === 0;
}

/**
 * Validate font style is 'normal' or 'italic'
 *
 * @param style - Font style to validate
 * @returns true if valid style
 *
 * @example
 * ```ts
 * isValidFontStyle('normal')   // true
 * isValidFontStyle('italic')   // true
 * isValidFontStyle('oblique')  // false
 * ```
 */
export function isValidFontStyle(style: string): style is FontStyle {
  return style === 'normal' || style === 'italic';
}

/**
 * Validate a single detected font
 *
 * @param font - Font to validate
 * @returns Validation result with error message if invalid
 *
 * @example
 * ```ts
 * validateFont({ family: 'Roboto', weight: 400, style: 'normal' })
 * // { valid: true }
 *
 * validateFont({ family: 'Roboto', weight: 150, style: 'normal' })
 * // { valid: false, error: 'Invalid font weight: 150' }
 * ```
 */
export function validateFont(font: DetectedFont): { valid: boolean; error?: string } {
  // Check family is supported
  if (!isGoogleFont(font.family)) {
    return {
      valid: false,
      error: `Unsupported Google Font: ${font.family}`,
    };
  }

  // Check weight is valid
  if (!isValidFontWeight(font.weight)) {
    return {
      valid: false,
      error: `Invalid font weight: ${String(font.weight)} for ${font.family}`,
    };
  }

  // Check style is valid
  if (!isValidFontStyle(font.style)) {
    return {
      valid: false,
      error: `Invalid font style: ${String(font.style)} for ${font.family}`,
    };
  }

  return { valid: true };
}

/**
 * Validate and filter detected fonts
 *
 * @param fonts - Array of detected fonts to validate
 * @returns Object with valid fonts and invalid fonts with errors
 *
 * @example
 * ```ts
 * const result = validateDetectedFonts([
 *   { family: 'Roboto', weight: 400, style: 'normal' },
 *   { family: 'Unknown', weight: 400, style: 'normal' },
 * ]);
 * // result.valid.length === 1
 * // result.invalid.length === 1
 * ```
 */
export function validateDetectedFonts(fonts: DetectedFont[]): {
  valid: DetectedFont[];
  invalid: Array<{ font: DetectedFont; error: string }>;
} {
  const valid: DetectedFont[] = [];
  const invalid: Array<{ font: DetectedFont; error: string }> = [];

  for (const font of fonts) {
    const result = validateFont(font);
    if (result.valid) {
      valid.push(font);
    } else if (result.error != null) {
      invalid.push({ font, error: result.error });
    }
  }

  return { valid, invalid };
}

/**
 * Deduplicate detected fonts
 *
 * @param fonts - Array of detected fonts (may contain duplicates)
 * @returns Array with duplicates removed
 *
 * @example
 * ```ts
 * const fonts = [
 *   { family: 'Roboto', weight: 400, style: 'normal' },
 *   { family: 'Roboto', weight: 400, style: 'normal' }, // duplicate
 *   { family: 'Roboto', weight: 700, style: 'normal' },
 * ];
 * deduplicateFonts(fonts).length // 2
 * ```
 */
export function deduplicateFonts(fonts: DetectedFont[]): DetectedFont[] {
  const uniqueMap = new Map<string, DetectedFont>();

  for (const font of fonts) {
    const key = `${font.family}:${font.weight}:${font.style}`;
    uniqueMap.set(key, font);
  }

  return Array.from(uniqueMap.values());
}
