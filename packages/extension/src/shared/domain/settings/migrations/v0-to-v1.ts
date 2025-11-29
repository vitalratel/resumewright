/**
 * Settings Migration: Version 0 → Version 1
 *
 * Handles migration from pre-versioning schema to version 1.
 */

import type { ConversionConfig, UserSettings } from '@/shared/types';
import { DEFAULT_CONVERSION_CONFIG, DEFAULT_USER_SETTINGS } from '../defaults';

/**
 * Migrate settings from version 0 (pre-versioning) to version 1
 */
export function migrateV0toV1(data: unknown): UserSettings {
  // Handle null/undefined
  if (data === null || data === undefined || typeof data !== 'object') {
    return { ...DEFAULT_USER_SETTINGS };
  }

  const v0 = data as Record<string, unknown>;

  // Safely extract theme with validation
  let theme: 'light' | 'dark' | 'auto' = 'auto';
  if (v0.theme === 'light' || v0.theme === 'dark' || v0.theme === 'auto') {
    theme = v0.theme;
  }

  // Safely extract defaultConfig
  let defaultConfig = DEFAULT_CONVERSION_CONFIG;
  if (v0.defaultConfig !== null && v0.defaultConfig !== undefined && typeof v0.defaultConfig === 'object') {
    const cfg = v0.defaultConfig as Record<string, unknown>;
    defaultConfig = {
      pageSize:
        cfg.pageSize === 'Letter' || cfg.pageSize === 'A4' || cfg.pageSize === 'Legal'
          ? cfg.pageSize
          : 'Letter',
      margin:
        typeof cfg.margin === 'object' && cfg.margin !== null
          ? (cfg.margin as ConversionConfig['margin'])
          : DEFAULT_CONVERSION_CONFIG.margin,
      fontSize: typeof cfg.fontSize === 'number' ? cfg.fontSize : 11,
      fontFamily: typeof cfg.fontFamily === 'string' ? cfg.fontFamily : 'Helvetica',
      filename: typeof cfg.filename === 'string' ? cfg.filename : undefined,
      compress: typeof cfg.compress === 'boolean' ? cfg.compress : true,
      atsOptimization:
        typeof cfg.atsOptimization === 'boolean' ? cfg.atsOptimization : undefined,
      includeMetadata: typeof cfg.includeMetadata === 'boolean' ? cfg.includeMetadata : true,
    };
  }

  return {
    theme,
    defaultConfig,
    autoDetectCV: typeof v0.autoDetectCV === 'boolean' ? v0.autoDetectCV : true,
    showConvertButtons: typeof v0.showConvertButtons === 'boolean' ? v0.showConvertButtons : true,
    telemetryEnabled: typeof v0.telemetryEnabled === 'boolean' ? v0.telemetryEnabled : false,
    retentionDays: typeof v0.retentionDays === 'number' ? v0.retentionDays : 30,
    settingsVersion: 1,
    lastUpdated: Date.now(),
  };
}
