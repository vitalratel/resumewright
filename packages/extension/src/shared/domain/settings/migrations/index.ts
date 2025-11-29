/**
 * Settings Migration Orchestrator
 *
 * Handles backward-compatible schema migrations for settings and data structures.
 * Ensures user data is never lost during schema version upgrades.
 */

import type { ILogger } from '@/shared/domain/logging/ILogger';
import type { UserSettings } from '@/shared/types';
import { UserSettingsSchema } from '../../validation';
import { safeParse } from '../../validation/valibot';
import { CURRENT_SETTINGS_VERSION, DEFAULT_USER_SETTINGS } from '../defaults';
import { applyMigrations } from './registry';

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
function createSettingsBackup(data: string, version: number, logger: ILogger): void {
  try {
    const backupKey = `settings_backup_v${version}`;

    // Only create backup in localStorage if available (e.g., popup context)
    // In service worker context, localStorage is undefined
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(backupKey, data);
      logger.info('SettingsMigration', `Backup created: ${backupKey}`, {
        dataLength: data.length,
        preview: data.substring(0, 100),
      });
    }
    else {
      logger.info('SettingsMigration', `Skipping localStorage backup in service worker context: ${backupKey}`);
    }
  }
  catch (error) {
    logger.warn('SettingsMigration', '[Migration] Backup creation failed:', error);
  }
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
export function migrateUserSettings(data: unknown, rawString: string | undefined, logger: ILogger): MigrationResult {
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
    if ((rawString != null && rawString.length > 0) && currentVersion < CURRENT_SETTINGS_VERSION) {
      createSettingsBackup(rawString, currentVersion, logger);
    }

    // Apply migrations
    const migratedData = applyMigrations(data, currentVersion, logger);

    // Validate migrated data
    const migratedValidation = safeParse(UserSettingsSchema, migratedData);
    if (!migratedValidation.success) {
      logger.error('SettingsMigration', '[Migration] Validation failed after migration:', migratedValidation.issues);
      return {
        success: false,
        data: DEFAULT_USER_SETTINGS,
        migrated: true,
        fromVersion: currentVersion,
        error: 'Validation failed after migration',
      };
    }

    logger.info(
      'SettingsMigration',
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
    logger.error('SettingsMigration', '[Migration] Migration failed:', error);
    return {
      success: false,
      data: DEFAULT_USER_SETTINGS,
      migrated: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Re-export for backward compatibility
export { CURRENT_SETTINGS_VERSION, DEFAULT_USER_SETTINGS } from '../defaults';
