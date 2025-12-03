/**
 * SettingsStore Service
 *
 * Manages user settings persistence using chrome.storage.sync API.
 * Provides validation, storage, and retrieval of UserSettings.
 *
 * Storage: chrome.storage.sync (primary) with chrome.storage.local fallback
 * Storage Key: "resumewright-settings"
 */

import type { BaseIssue } from 'valibot';
import { safeParse } from 'valibot';
import { CURRENT_SETTINGS_VERSION, DEFAULT_USER_SETTINGS } from '@/shared/domain/settings/defaults';
import { UserSettingsSchema } from '@/shared/domain/validation/settings';
import { getLogger } from '@/shared/infrastructure/logging';
import { localExtStorage, syncExtStorage } from '@/shared/infrastructure/storage';
import type { UserSettings, ValidationError, ValidationResult } from '@/shared/types/settings';

/**
 * SettingsStore manages user settings persistence.
 * Uses chrome.storage.sync for cross-device synchronization.
 */
class SettingsStore {
  /**
   * Load user settings from storage.
   * Returns default settings if none exist or validation fails.
   */
  async loadSettings(): Promise<UserSettings> {
    try {
      const stored = await syncExtStorage.getItem('resumewright-settings');

      if (stored !== null) {
        // Validate stored settings
        const parseResult = safeParse(UserSettingsSchema, stored);
        if (parseResult.success) {
          return parseResult.output;
        }

        // Invalid settings - use defaults
        getLogger().warn('SettingsStore', 'Invalid stored settings, using defaults');
        const defaults = DEFAULT_USER_SETTINGS;
        await this.saveSettings(defaults);
        return defaults;
      }

      // First time user: initialize with defaults
      const defaults = DEFAULT_USER_SETTINGS;
      await this.saveSettings(defaults);
      return defaults;
    } catch (error) {
      getLogger().error('SettingsStore', 'Failed to load settings from sync storage', error);
      // Fallback to local storage
      return this.loadSettingsLocal();
    }
  }

  /**
   * Fallback: Load settings from local storage.
   */
  private async loadSettingsLocal(): Promise<UserSettings> {
    try {
      const stored = await localExtStorage.getItem('resumewright-settings');
      if (stored !== null) {
        const parseResult = safeParse(UserSettingsSchema, stored);
        if (parseResult.success) {
          return parseResult.output;
        }
      }
      return DEFAULT_USER_SETTINGS;
    } catch (error) {
      getLogger().error('SettingsStore', 'Failed to load settings from local storage', error);
      return DEFAULT_USER_SETTINGS;
    }
  }

  /**
   * Save user settings to storage.
   * Validates settings and ensures version/timestamp are current.
   */
  async saveSettings(settings: UserSettings): Promise<void> {
    // Validate settings
    const validation = this.validateSettings(settings);
    if (!validation.valid) {
      throw new Error(`Invalid settings: ${validation.errors.map((e) => e.message).join(', ')}`);
    }

    // Ensure version and timestamp are current
    const toSave: UserSettings = {
      ...settings,
      settingsVersion: CURRENT_SETTINGS_VERSION,
      lastUpdated: Date.now(),
    };

    try {
      await syncExtStorage.setItem('resumewright-settings', toSave);
    } catch (error) {
      getLogger().error('SettingsStore', 'Failed to save settings to sync storage', error);
      // Fallback to local storage
      await localExtStorage.setItem('resumewright-settings', toSave);
    }
  }

  /**
   * Reset settings to factory defaults.
   */
  async resetSettings(): Promise<void> {
    await this.saveSettings(DEFAULT_USER_SETTINGS);
  }

  /**
   * Validate settings before saving.
   * Uses Valibot schema validation from shared types.
   */
  validateSettings(settings: UserSettings): ValidationResult {
    const errors: ValidationError[] = [];

    // Use Valibot validation for comprehensive type checking
    const result = safeParse(UserSettingsSchema, settings);

    if (!result.success) {
      // Convert Valibot errors to ValidationError format
      result.issues.forEach((issue: BaseIssue<unknown>) => {
        const field =
          issue.path?.map((p) => String(p.key)).join('.') !== null &&
          issue.path?.map((p) => String(p.key)).join('.') !== undefined &&
          issue.path?.map((p) => String(p.key)).join('.') !== ''
            ? issue.path.map((p) => String(p.key)).join('.')
            : 'settings';
        errors.push({
          field,
          message: issue.message,
        });
      });
    }

    // Additional business logic validation (margins 0.25-1.0 inches)
    // Improved validation error messages with context
    if (typeof settings.defaultConfig?.margin === 'object') {
      const validateMargin = (value: number, name: string) => {
        if (typeof value === 'number' && !Number.isNaN(value)) {
          if (value < 0.25 || value > 1.0) {
            errors.push({
              field: `margin.${name}`,
              message: `Invalid ${name} margin: ${value}" is outside the allowed range of 0.25" to 1.0"`,
            });
          }
        } else {
          errors.push({
            field: `margin.${name}`,
            message: `Invalid ${name} margin: expected a number, received ${typeof value}`,
          });
        }
      };

      validateMargin(settings.defaultConfig.margin.top, 'top');
      validateMargin(settings.defaultConfig.margin.right, 'right');
      validateMargin(settings.defaultConfig.margin.bottom, 'bottom');
      validateMargin(settings.defaultConfig.margin.left, 'left');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Listen for settings changes across extension contexts.
   */
  onSettingsChanged(callback: (settings: UserSettings) => void): () => void {
    return syncExtStorage.onChange('resumewright-settings', (newValue) => {
      if (newValue !== null) {
        callback(newValue);
      }
    });
  }
}

/**
 * Factory function for creating SettingsStore instances
 * Use in tests to create isolated store instances
 *
 * @example
 * ```ts
 * // Production code - use singleton
 * import { settingsStore } from '@/shared/infrastructure/settings/SettingsStore';
 *
 * // Test code - use factory
 * const testStore = createSettingsStore();
 * ```
 */
export function createSettingsStore(): SettingsStore {
  return new SettingsStore();
}

/**
 * Singleton instance for production use
 * Shared across all extension contexts (background, popup, content)
 */
export const settingsStore = createSettingsStore();
