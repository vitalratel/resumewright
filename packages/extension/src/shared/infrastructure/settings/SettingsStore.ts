// ABOUTME: Settings persistence functions using chrome.storage.sync API.
// ABOUTME: Provides validation, storage, and retrieval of UserSettings.

import type { BaseIssue } from 'valibot';
import { safeParse } from 'valibot';
import { CURRENT_SETTINGS_VERSION, DEFAULT_USER_SETTINGS } from '@/shared/domain/settings/defaults';
import { UserSettingsSchema } from '@/shared/domain/validation/settings';
import { type AsyncResult, ResultAsync, type SettingsError } from '@/shared/errors/result';
import { getLogger } from '@/shared/infrastructure/logging/instance';
import { localExtStorage, syncExtStorage } from '@/shared/infrastructure/storage/typedStorage';
import type { UserSettings, ValidationError, ValidationResult } from '@/shared/types/settings';

/**
 * Fallback: Load settings from local storage.
 */
async function loadSettingsLocal(): Promise<UserSettings> {
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
 * Load user settings from storage.
 * Returns default settings if none exist or validation fails.
 * This function never fails - it always returns valid settings (defaults if needed).
 */
export async function loadSettings(): Promise<UserSettings> {
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
      // Save defaults but don't block on it
      void saveSettings(defaults);
      return defaults;
    }

    // First time user: initialize with defaults
    const defaults = DEFAULT_USER_SETTINGS;
    // Save defaults but don't block on it
    void saveSettings(defaults);
    return defaults;
  } catch (error) {
    getLogger().error('SettingsStore', 'Failed to load settings from sync storage', error);
    // Fallback to local storage
    return loadSettingsLocal();
  }
}

/**
 * Save user settings to storage.
 * Validates settings and ensures version/timestamp are current.
 * Returns a Result to indicate success or failure.
 */
export function saveSettings(settings: UserSettings): AsyncResult<void, SettingsError> {
  return ResultAsync.fromPromise(
    (async (): Promise<void> => {
      // Validate settings
      const validation = validateSettings(settings);
      if (!validation.valid) {
        const validationError: SettingsError = {
          type: 'validation_failed',
          message: `Invalid settings: ${validation.errors.map((e) => e.message).join(', ')}`,
        };
        throw validationError;
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
    })(),
    (error): SettingsError => {
      if (isSettingsError(error)) {
        return error;
      }
      return {
        type: 'storage_failed',
        message: error instanceof Error ? error.message : String(error),
      };
    },
  );
}

/**
 * Type guard for SettingsError
 */
function isSettingsError(error: unknown): error is SettingsError {
  return (
    error !== null &&
    typeof error === 'object' &&
    'type' in error &&
    'message' in error &&
    (error.type === 'validation_failed' || error.type === 'storage_failed')
  );
}

/**
 * Reset settings to factory defaults.
 */
export function resetSettings(): AsyncResult<void, SettingsError> {
  return saveSettings(DEFAULT_USER_SETTINGS);
}

/**
 * Validate settings before saving.
 * Uses Valibot schema validation from shared types.
 */
export function validateSettings(settings: UserSettings): ValidationResult {
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

  // Additional business logic validation (margins 0-1.5 inches)
  // Improved validation error messages with context
  if (typeof settings.defaultConfig?.margin === 'object') {
    const validateMargin = (value: number, name: string) => {
      if (typeof value === 'number' && !Number.isNaN(value)) {
        if (value < 0 || value > 1.5) {
          errors.push({
            field: `margin.${name}`,
            message: `Invalid ${name} margin: ${value}" is outside the allowed range of 0" to 1.5"`,
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
export function onSettingsChanged(callback: (settings: UserSettings) => void): () => void {
  return syncExtStorage.onChange('resumewright-settings', (newValue) => {
    if (newValue !== null) {
      callback(newValue);
    }
  });
}
