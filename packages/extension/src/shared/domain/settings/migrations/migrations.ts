// ABOUTME: Schema migration utilities for settings.
// ABOUTME: Handles version upgrades while preserving user data.

import type { ConversionConfig } from '@/shared/types/models';
import type { UserSettings } from '@/shared/types/settings';
import { UserSettingsSchema } from '@/shared/domain/validation/schemas/settings';
import { safeParse } from '@/shared/domain/validation/valibot';
import { getLogger } from '@/shared/infrastructure/logging';
import {
  CURRENT_SETTINGS_VERSION,
  DEFAULT_CONVERSION_CONFIG,
  DEFAULT_USER_SETTINGS,
} from '../defaults';

export { CURRENT_SETTINGS_VERSION, DEFAULT_CONVERSION_CONFIG, DEFAULT_USER_SETTINGS };

/**
 * Migration result indicating success or failure
 */
export interface MigrationResult {
  success: boolean;
  data: UserSettings;
  migrated: boolean;
  fromVersion?: number;
  error?: string;
}

/**
 * Create backup of settings before migration
 * Note: Backup is logged but not stored in service worker context
 */
function createSettingsBackup(data: string, version: number): void {
  try {
    const backupKey = `settings_backup_v${version}`;

    // Only create backup in localStorage if available (e.g., popup context)
    // In service worker context, localStorage is undefined
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(backupKey, data);
      getLogger().info('Migration', `Backup created: ${backupKey}`, {
        dataLength: data.length,
        preview: data.substring(0, 100),
      });
    }
    else {
      getLogger().info('Migration', `Skipping localStorage backup in service worker context: ${backupKey}`);
    }
  }
  catch (error) {
    getLogger().warn('Migration', 'Backup creation failed', error);
  }
}

/**
 * Migrate settings from version 0 (pre-versioning) to version 1
 */
function migrateV0toV1(data: unknown): UserSettings {
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
  if ((v0.defaultConfig !== null && v0.defaultConfig !== undefined) && typeof v0.defaultConfig === 'object') {
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

/**
 * Apply migrations sequentially based on current version
 */
function applyMigrations(data: unknown, fromVersion: number): UserSettings {
  let migrated = data;

  if (fromVersion < 1) {
    getLogger().info('Migration', 'Applying v0 → v1 migration');
    migrated = migrateV0toV1(migrated);
  }

  // Future migrations would go here:
  // if (fromVersion < 2) {
  //   getLogger().info('Migration', 'Applying v1 → v2 migration');
  //   migrated = migrateV1toV2(migrated);
  // }

  return migrated as UserSettings;
}

/**
 * Migrate user settings with backward compatibility
 *
 * Handles:
 * - Version 0 (no version field) → Version 1
 * - Invalid/corrupted data → Default settings
 * - Missing required fields → Merge with defaults
 * - Future version migrations
 *
 * @param data - Raw settings data from storage
 * @param rawString - Original string for backup (optional)
 * @returns Migration result with migrated settings
 */
export function migrateUserSettings(data: unknown, rawString?: string): MigrationResult {
  try {
    // Check if data is already valid for current version
    const validationResult = safeParse(UserSettingsSchema, data);
    if (validationResult.success) {
      const settings = validationResult.output;
      // Accept settings at current version or newer (future versions)
      if (settings.settingsVersion >= CURRENT_SETTINGS_VERSION) {
        return {
          success: true,
          data: settings,
          migrated: false,
        };
      }
    }

    // Extract version from data
    const currentVersion = (data as { settingsVersion?: number })?.settingsVersion ?? 0;

    // Only migrate if below current version
    if (currentVersion >= CURRENT_SETTINGS_VERSION) {
      // Future version - accept as-is if valid
      if (validationResult.success) {
        return {
          success: true,
          data: validationResult.output,
          migrated: false,
        };
      }
    }

    // Create backup before migration
    if ((rawString !== null && rawString !== undefined && rawString !== '') && currentVersion < CURRENT_SETTINGS_VERSION) {
      createSettingsBackup(rawString, currentVersion);
    }

    // Apply migrations
    const migratedData = applyMigrations(data, currentVersion);

    // Validate migrated data
    const migratedValidation = safeParse(UserSettingsSchema, migratedData);
    if (!migratedValidation.success) {
      getLogger().error('Migration', 'Validation failed after migration', migratedValidation.issues);
      return {
        success: false,
        data: DEFAULT_USER_SETTINGS,
        migrated: true,
        fromVersion: currentVersion,
        error: 'Validation failed after migration',
      };
    }

    getLogger().info(
      'Migration',
      `Successfully migrated settings: v${currentVersion} → v${CURRENT_SETTINGS_VERSION}`,
    );

    return {
      success: true,
      data: migratedValidation.output,
      migrated: true,
      fromVersion: currentVersion,
    };
  }
  catch (error) {
    getLogger().error('Migration', 'Migration failed', error);
    return {
      success: false,
      data: DEFAULT_USER_SETTINGS,
      migrated: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Safe settings loader with migration support
 *
 * Reads settings from localStorage, applies migrations if needed,
 * and falls back to defaults if loading/migration fails.
 *
 * @param storageKey - localStorage key for settings (default: 'userSettings')
 * @returns Migrated and validated user settings
 */
export function loadSettings(storageKey = 'userSettings'): UserSettings {
  try {
    // Guard against service worker context where localStorage is undefined
    if (typeof localStorage === 'undefined') {
      getLogger().warn('Migration', 'localStorage not available (service worker context), using defaults');
      return DEFAULT_USER_SETTINGS;
    }
    const raw = localStorage.getItem(storageKey);
    if (raw === null || raw === undefined || raw === '') {
      getLogger().info('Migration', 'No existing settings found, using defaults');
      return DEFAULT_USER_SETTINGS;
    }

    // Wrap JSON.parse in try-catch for corrupted storage
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    }
    catch (parseError) {
      getLogger().error('Migration', 'Failed to parse stored settings, using defaults', parseError);
      return DEFAULT_USER_SETTINGS;
    }

    const result = migrateUserSettings(parsed, raw);

    if (!result.success) {
      getLogger().warn('Migration', 'Using defaults due to migration failure', result.error);
    }
    else if (result.migrated) {
      // Save migrated settings back to storage
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(storageKey, JSON.stringify(result.data));
        }
        getLogger().info('Migration', 'Migrated settings saved to storage');
      }
      catch (saveError) {
        getLogger().error('Migration', 'Failed to save migrated settings', saveError);
      }
    }

    return result.data;
  }
  catch (error) {
    getLogger().error('Migration', 'Failed to load settings', error);
    return DEFAULT_USER_SETTINGS;
  }
}

/**
 * Validate and save settings with version tracking
 *
 * Ensures saved settings always have correct version and timestamp.
 *
 * @param settings - Settings to save
 * @param storageKey - localStorage key (default: 'userSettings')
 * @returns true if save succeeded, false otherwise
 */
export function saveSettings(settings: UserSettings, storageKey = 'userSettings'): boolean {
  try {
    // Guard against service worker context where localStorage is undefined
    if (typeof localStorage === 'undefined') {
      getLogger().warn('Migration', 'localStorage not available (service worker context), cannot save');
      return false;
    }

    // Ensure version and timestamp are current
    const toSave: UserSettings = {
      ...settings,
      settingsVersion: CURRENT_SETTINGS_VERSION,
      lastUpdated: Date.now(),
    };

    // Validate before saving
    const validation = safeParse(UserSettingsSchema, toSave);
    if (!validation.success) {
      getLogger().error('Migration', 'Cannot save invalid settings', validation.issues);
      return false;
    }

    localStorage.setItem(storageKey, JSON.stringify(toSave));
    return true;
  }
  catch (error) {
    getLogger().error('Migration', 'Failed to save settings', error);
    return false;
  }
}
