/**
 * Settings Type Definitions
 *
 * User preferences and extension configuration for ResumeWright.
 * Storage: chrome.storage.sync for cross-device synchronization.
 *
 * Schema Version: 1
 * Storage Key: "resumewright-settings"
 * Storage Quota: chrome.storage.sync has 100KB limit, UserSettings ~1KB (1% of quota)
 */

import type { ConversionConfig } from '@/shared/types/models';

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
 * Default settings are defined in utils/migrations.ts as DEFAULT_USER_SETTINGS.
 * Import from '@/shared/types' to get DEFAULT_USER_SETTINGS.
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
