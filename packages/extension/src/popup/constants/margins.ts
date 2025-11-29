/**
 * Margin Preset Constants
 * Centralized margin preset definitions for conversion settings
 */

/**
 * Predefined margin presets (in inches)
 * Used by QuickSettings and margin preset detection
 */
export const MARGIN_PRESETS = {
  compact: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
  narrow: { top: 0.5, right: 0.625, bottom: 0.5, left: 0.625 },
  normal: { top: 0.75, right: 0.75, bottom: 0.75, left: 0.75 },
  wide: { top: 1.0, right: 1.0, bottom: 1.0, left: 1.0 },
  spacious: { top: 1.25, right: 1.25, bottom: 1.25, left: 1.25 },
} as const;
