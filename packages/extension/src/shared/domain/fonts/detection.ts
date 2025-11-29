/**
 * Font Detection from TSX
 *
 * Detects Google Fonts usage in TSX code before PDF generation.
 * This allows pre-fetching fonts before calling WASM for synchronous processing.
 *
 * Pure functions - no external dependencies or side effects.
 */

import type { DetectedFont, FontStyle, FontWeight } from './models/Font';
import { isGoogleFont } from './validation';

/**
 * Parse fontWeight and fontStyle from context around a fontFamily declaration
 *
 * Searches for fontWeight and fontStyle within the same style object/block.
 * Uses heuristics to find properties within ~200 chars before/after the fontFamily.
 *
 * @param tsx - TSX source code
 * @param fontFamilyIndex - Index in tsx where fontFamily was found
 * @returns Object with weight and style (defaults to 400/normal if not found)
 *
 * @example
 * ```ts
 * const tsx = `<div style={{ fontFamily: 'Roboto', fontWeight: 700 }}>Text</div>`;
 * parseFontAttributes(tsx, tsx.indexOf('Roboto'));
 * // { weight: 700, style: 'normal' }
 * ```
 */
function parseFontAttributes(
  tsx: string,
  fontFamilyIndex: number,
): { weight: FontWeight; style: FontStyle } {
  // Extract context window (200 chars before and after)
  const contextStart = Math.max(0, fontFamilyIndex - 200);
  const contextEnd = Math.min(tsx.length, fontFamilyIndex + 200);
  const context = tsx.substring(contextStart, contextEnd);

  // Parse fontWeight
  // Matches: fontWeight: 700, fontWeight: '600', font-weight: 700, fw: 700
  const weightPattern = /(?:fontWeight|font-weight|fw)\s*:\s*['"]?(\d+)['"]?/;
  const weightMatch = context.match(weightPattern);
  let weight: FontWeight = 400;

  if (weightMatch) {
    const parsedWeight = Number.parseInt(weightMatch[1], 10);
    if (parsedWeight >= 100 && parsedWeight <= 900 && parsedWeight % 100 === 0) {
      weight = parsedWeight as FontWeight;
    }
  }

  // Parse fontStyle
  // Matches: fontStyle: 'italic', font-style: "italic", fs: 'italic'
  const stylePattern = /(?:fontStyle|font-style|fs)\s*:\s*['"](italic|normal)['"]/;
  const styleMatch = context.match(stylePattern);
  const style: FontStyle = styleMatch ? (styleMatch[1] as FontStyle) : 'normal';

  return { weight, style };
}

/**
 * Detect Google Fonts in TSX code
 *
 * Uses regex to find font-family declarations in TSX.
 * Pragmatic approach suitable for most use cases.
 *
 * @param tsx - TSX source code
 * @returns Array of detected Google Fonts with weights and styles
 *
 * @example
 * ```ts
 * const tsx = `
 *   <div style={{ fontFamily: 'Roboto, Arial, sans-serif' }}>Text</div>
 *   <p style={{ fontFamily: 'Open Sans', fontWeight: 700 }}>Bold</p>
 * `;
 * const fonts = detectGoogleFontsInTSX(tsx);
 * // Returns: [
 * //   { family: 'Roboto', weight: 400, style: 'normal' },
 * //   { family: 'Open Sans', weight: 700, style: 'normal' }
 * // ]
 * ```
 */
export function detectGoogleFontsInTSX(tsx: string): DetectedFont[] {
  const detectedFonts = new Map<string, DetectedFont>();

  // Pattern 1: fontFamily in style objects
  // Matches: fontFamily: 'Roboto', fontFamily: "Open Sans, Arial", etc.
  const fontFamilyPattern = /fontFamily:\s*['"]([^'"]+)['"]/g;

  // Pattern 2: font-family in CSS strings (tailwind, inline styles)
  // Matches: font-family: 'Roboto', font-family: "Open Sans", etc.
  const cssFontFamilyPattern = /font-family:\s*['"]([^'"]+)['"]/g;

  // Extract all font-family declarations
  const allMatches = [
    ...Array.from(tsx.matchAll(fontFamilyPattern)),
    ...Array.from(tsx.matchAll(cssFontFamilyPattern)),
  ];

  for (const match of allMatches) {
    const fontChain = match[1];
    const matchIndex = match.index ?? 0;

    // Split by comma (font fallback chain)
    const fonts = fontChain.split(',').map((f) => f.trim().replace(/['"]/g, ''));

    // Find first Google Font in chain
    for (const font of fonts) {
      if (isGoogleFont(font)) {
        // Parse weight and style from context around this fontFamily declaration
        const { weight, style } = parseFontAttributes(tsx, matchIndex);
        const key = `${font}:${weight}:${style}`;

        if (!detectedFonts.has(key)) {
          detectedFonts.set(key, {
            family: font,
            weight,
            style,
          });
        }

        break; // Only take first Google Font from chain
      }
    }
  }

  return Array.from(detectedFonts.values());
}
