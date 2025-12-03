/**
 * Margin preset utilities
 * Extracted to enable React Fast Refresh for component files
 */

import type { ConversionConfig } from '@/shared/types/models';
import { MARGIN_PRESETS } from '../constants/margins';

/**
 * Derive margin preset from ConversionConfig margins
 * Added compact and spacious preset detection
 */
export function getMarginPreset(
  margin: ConversionConfig['margin'],
): 'compact' | 'narrow' | 'normal' | 'wide' | 'spacious' | 'custom' {
  // Check against all presets
  for (const [presetName, presetValues] of Object.entries(MARGIN_PRESETS)) {
    if (
      margin.top === presetValues.top &&
      margin.right === presetValues.right &&
      margin.bottom === presetValues.bottom &&
      margin.left === presetValues.left
    ) {
      return presetName as 'compact' | 'narrow' | 'normal' | 'wide' | 'spacious';
    }
  }

  return 'custom';
}
