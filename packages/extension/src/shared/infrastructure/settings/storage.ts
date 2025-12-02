/**
 * Settings Storage I/O
 *
 * Handles loading and saving settings with validation.
 * Uses localStorage for popup-specific settings (e.g., dark mode).
 */

import type { UserSettings } from '@/shared/types/settings';
import { getLogger } from '@/shared/infrastructure/logging';
import { CURRENT_SETTINGS_VERSION, DEFAULT_USER_SETTINGS } from '../../domain/settings/defaults';
import { UserSettingsSchema } from '../../domain/validation/settings';
import { safeJsonParse, validateWithSchema } from '../storage/helpers';

/**
 * Load settings from localStorage.
 * Falls back to defaults if loading or validation fails.
 *
 * @param storageKey - localStorage key for settings (default: 'userSettings')
 * @returns Validated user settings or defaults
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
      return DEFAULT_USER_SETTINGS;
    }

    // Use shared helper for safe JSON parsing
    const parsed = safeJsonParse(raw, getLogger(), 'SettingsStorage');
    if (parsed === null) {
      return DEFAULT_USER_SETTINGS;
    }

    // Validate stored settings
    const result = validateWithSchema(UserSettingsSchema, parsed, getLogger(), 'SettingsStorage');
    if (result.success && result.data !== undefined) {
      return result.data as UserSettings;
    }

    getLogger().warn('SettingsStorage', 'Invalid stored settings, using defaults');
    return DEFAULT_USER_SETTINGS;
  }
  catch (error) {
    getLogger().error('SettingsStorage', 'Failed to load settings:', error);
    return DEFAULT_USER_SETTINGS;
  }
}

/**
 * Validate and save settings with version tracking.
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
      getLogger().warn('SettingsStorage', 'localStorage not available (service worker context), cannot save');
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
      getLogger().error('SettingsStorage', 'Cannot save invalid settings');
      return false;
    }

    localStorage.setItem(storageKey, JSON.stringify(toSave));
    return true;
  }
  catch (error) {
    getLogger().error('SettingsStorage', 'Failed to save settings:', error);
    return false;
  }
}
