// ABOUTME: User settings type definitions for extension configuration.
// ABOUTME: Contains UserSettings, ValidationResult, and ValidationError types.

import type { ConversionConfig } from './models';

/**
 * User preferences and extension configuration.
 * Persisted to chrome.storage.sync for cross-device synchronization.
 */
export interface UserSettings {
  /** UI theme preference (not used in MVP, reserved for future) */
  theme: 'light' | 'dark' | 'auto';

  /** Default conversion configuration applied to all exports */
  defaultConfig: ConversionConfig;

  /** Auto-detect CVs on claude.ai (always true in MVP) */
  autoDetectCV: boolean;

  /** Show quick export buttons in content (future feature) */
  showConvertButtons: boolean;

  /** Enable anonymous telemetry */
  telemetryEnabled: boolean;

  /** History retention period in days */
  retentionDays: number;

  /** Schema version for future migrations */
  settingsVersion: number;

  /** Last updated timestamp */
  lastUpdated: number;
}

/**
 * Default settings are defined in domain/settings/defaults.ts as DEFAULT_USER_SETTINGS.
 */

/**
 * Validation result for settings.
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
}
