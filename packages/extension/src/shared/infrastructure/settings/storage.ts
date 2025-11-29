/**
 * Settings Storage I/O
 *
 * Handles loading and saving settings with validation.
 * Supports both localStorage (popup) and chrome.storage (service worker).
 */

import type { UserSettings } from '@/shared/types';
import { getLogger } from '@/shared/infrastructure/logging';
import { CURRENT_SETTINGS_VERSION, DEFAULT_USER_SETTINGS } from '../../domain/settings/defaults';
import { migrateUserSettings } from '../../domain/settings/migrations';
import { UserSettingsSchema } from '../../domain/validation';
import { safeJsonParse, validateWithSchema } from '../storage/helpers';

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
      getLogger().warn('SettingsStorage', 'localStorage not available (service worker context), using defaults');
      return DEFAULT_USER_SETTINGS;
    }
    const raw = localStorage.getItem(storageKey);
    if (raw == null || raw.length === 0) {
      getLogger().info('SettingsStorage', '[Migration] No existing settings found, using defaults');
      return DEFAULT_USER_SETTINGS;
    }

    // Use shared helper for safe JSON parsing
    const parsed = safeJsonParse(raw, getLogger(), 'SettingsStorage');
    if (parsed === null) {
      getLogger().info('SettingsStorage', '[Migration] Failed to parse stored settings, using defaults');
      return DEFAULT_USER_SETTINGS;
    }

    const result = migrateUserSettings(parsed, raw, getLogger());

    if (!result.success) {
      getLogger().warn('SettingsStorage', '[Migration] Using defaults due to migration failure:', result.error);
    }
    else if (result.migrated) {
      // Save migrated settings back to storage
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(storageKey, JSON.stringify(result.data));
        }
        getLogger().info('SettingsStorage', '[Migration] Migrated settings saved to storage');
      }
      catch (saveError) {
        getLogger().error('SettingsStorage', '[Migration] Failed to save migrated settings:', saveError);
      }
    }

    return result.data;
  }
  catch (error) {
    getLogger().error('SettingsStorage', '[Migration] Failed to load settings:', error);
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
      getLogger().warn('SettingsStorage', '[Migration] localStorage not available (service worker context), cannot save');
      return false;
    }

    // Ensure version and timestamp are current
    const toSave: UserSettings = {
      ...settings,
      settingsVersion: CURRENT_SETTINGS_VERSION,
      lastUpdated: Date.now(),
    };

    // Validate before saving using shared helper
    const result = validateWithSchema(UserSettingsSchema, toSave, getLogger(), 'SettingsStorage');
    if (!result.success) {
      getLogger().error('SettingsStorage', '[Migration] Cannot save invalid settings');
      return false;
    }

    localStorage.setItem(storageKey, JSON.stringify(toSave));
    return true;
  }
  catch (error) {
    getLogger().error('SettingsStorage', '[Migration] Failed to save settings:', error);
    return false;
  }
}

/**
 * Create backup of settings before migration
 * Note: Backup is stored in localStorage with timestamped key
 *
 * @param settings - Settings to backup
 * @param reason - Reason for backup (e.g., 'pre-migration', 'manual')
 * @returns true if backup succeeded, false otherwise
 */
export function createSettingsBackup(settings: UserSettings, reason = 'manual'): boolean {
  try {
    if (typeof localStorage === 'undefined') {
      getLogger().warn('SettingsStorage', '[Backup] localStorage not available, cannot create backup');
      return false;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupKey = `settings_backup_${reason}_${timestamp}`;

    localStorage.setItem(backupKey, JSON.stringify(settings));
    getLogger().info('SettingsStorage', `[Backup] Created backup: ${backupKey}`);

    return true;
  }
  catch (error) {
    getLogger().error('SettingsStorage', '[Backup] Failed to create backup:', error);
    return false;
  }
}
