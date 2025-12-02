/**
 * Default Settings Values
 *
 * Centralized default values for user settings and conversion configuration.
 * Used as fallback when settings are invalid or missing.
 */

import type { ConversionConfig } from '@/shared/types/models';
import type { UserSettings } from '@/shared/types/settings';

/**
 * Current schema version for UserSettings
 * Increment when making breaking changes to UserSettings schema
 */
export const CURRENT_SETTINGS_VERSION = 1;

/**
 * Default conversion configuration
 * Used as fallback when config is invalid or missing
 */
export const DEFAULT_CONVERSION_CONFIG: ConversionConfig = {
  pageSize: 'Letter',
  margin: {
    top: 0.5,
    right: 0.5,
    bottom: 0.5,
    left: 0.5,
  },
  fontSize: 11,
  fontFamily: 'Helvetica',
  compress: true,
  atsOptimization: false,
  includeMetadata: true,
};

/**
 * Default user settings
 * Used as fallback when settings are invalid or missing
 */
export const DEFAULT_USER_SETTINGS: UserSettings = {
  theme: 'auto',
  defaultConfig: DEFAULT_CONVERSION_CONFIG,
  autoDetectCV: true,
  showConvertButtons: true,
  telemetryEnabled: false,
  retentionDays: 30,
  settingsVersion: CURRENT_SETTINGS_VERSION,
  lastUpdated: Date.now(),
};
