/**
 * Settings Validation Schema Tests
 *
 * Tests for Valibot schemas and validation functions for user settings.
 *
 * Coverage areas:
 * - UserSettings validation (theme, config, boolean flags, numeric limits)
 * - strictObject behavior (rejects unknown keys)
 * - Parse functions with error handling
 * - Boundary value testing for retentionDays
 *
 * Coverage target: >85%
 */

import type { UserSettings } from '@/shared/types/settings';
import { describe, expect, it } from 'vitest';
import { DEFAULT_CONVERSION_CONFIG } from '@/shared/types/models';
import { safeParse } from '../../valibot';
import {
  parseUserSettings,
  UserSettingsSchema,
  validateUserSettings,
} from '../settings';

describe('UserSettings Schema', () => {
  const validSettings: UserSettings = {
    theme: 'light',
    defaultConfig: DEFAULT_CONVERSION_CONFIG,
    autoDetectCV: true,
    showConvertButtons: true,
    telemetryEnabled: false,
    retentionDays: 30,
    settingsVersion: 1,
    lastUpdated: Date.now(),
  };

  describe('Valid Settings', () => {
    it('should validate complete UserSettings', () => {
      expect(validateUserSettings(validSettings)).toBe(true);
      const result = safeParse(UserSettingsSchema, validSettings);
      expect(result.success).toBe(true);
    });

    it.each([
      ['light', 'light'],
      ['dark', 'dark'],
      ['auto', 'auto'],
    ])('should accept theme: %s', (_label, theme) => {
      const settings = { ...validSettings, theme };
      expect(validateUserSettings(settings)).toBe(true);
    });

    it('should validate with all boolean flags true', () => {
      const settings: UserSettings = {
        ...validSettings,
        autoDetectCV: true,
        showConvertButtons: true,
        telemetryEnabled: true,
      };

      expect(validateUserSettings(settings)).toBe(true);
    });

    it('should validate with all boolean flags false', () => {
      const settings: UserSettings = {
        ...validSettings,
        autoDetectCV: false,
        showConvertButtons: false,
        telemetryEnabled: false,
      };

      expect(validateUserSettings(settings)).toBe(true);
    });
  });

  describe('Theme Validation', () => {
    it('should reject invalid theme', () => {
      const settings = { ...validSettings, theme: 'invalid-theme' };
      expect(validateUserSettings(settings)).toBe(false);
    });

    it('should reject non-string theme', () => {
      const settings = { ...validSettings, theme: 123 };
      expect(validateUserSettings(settings)).toBe(false);
    });
  });

  describe('Boolean Field Validation', () => {
    it('should reject non-boolean autoDetectCV', () => {
      const settings = { ...validSettings, autoDetectCV: 'true' };
      expect(validateUserSettings(settings)).toBe(false);
    });

    it('should reject non-boolean showConvertButtons', () => {
      const settings = { ...validSettings, showConvertButtons: 1 };
      expect(validateUserSettings(settings)).toBe(false);
    });

    it('should reject non-boolean telemetryEnabled', () => {
      const settings = { ...validSettings, telemetryEnabled: null };
      expect(validateUserSettings(settings)).toBe(false);
    });
  });

  describe('retentionDays Validation', () => {
    it('should accept valid retentionDays values', () => {
      [1, 7, 30, 90, 180, 365].forEach((retentionDays) => {
        const settings = { ...validSettings, retentionDays };
        expect(validateUserSettings(settings)).toBe(true);
      });
    });

    it('should accept boundary values for retentionDays', () => {
      const settings1 = { ...validSettings, retentionDays: 1 };
      const settings365 = { ...validSettings, retentionDays: 365 };

      expect(validateUserSettings(settings1)).toBe(true);
      expect(validateUserSettings(settings365)).toBe(true);
    });

    it('should reject retentionDays below minimum (< 1)', () => {
      const settings = { ...validSettings, retentionDays: 0 };
      expect(validateUserSettings(settings)).toBe(false);
    });

    it('should reject retentionDays above maximum (> 365)', () => {
      const settings = { ...validSettings, retentionDays: 366 };
      expect(validateUserSettings(settings)).toBe(false);
    });

    it('should reject negative retentionDays', () => {
      const settings = { ...validSettings, retentionDays: -1 };
      expect(validateUserSettings(settings)).toBe(false);
    });

    it('should reject non-integer retentionDays', () => {
      const settings = { ...validSettings, retentionDays: 30.5 };
      expect(validateUserSettings(settings)).toBe(false);
    });

    it('should reject non-numeric retentionDays', () => {
      const settings = { ...validSettings, retentionDays: '30' };
      expect(validateUserSettings(settings)).toBe(false);
    });
  });

  describe('settingsVersion Validation', () => {
    it('should accept valid settingsVersion values', () => {
      [1, 2, 5, 10, 100].forEach((settingsVersion) => {
        const settings = { ...validSettings, settingsVersion };
        expect(validateUserSettings(settings)).toBe(true);
      });
    });

    it('should reject non-positive settingsVersion', () => {
      const settings = { ...validSettings, settingsVersion: 0 };
      expect(validateUserSettings(settings)).toBe(false);
    });

    it('should reject negative settingsVersion', () => {
      const settings = { ...validSettings, settingsVersion: -1 };
      expect(validateUserSettings(settings)).toBe(false);
    });

    it('should reject non-integer settingsVersion', () => {
      const settings = { ...validSettings, settingsVersion: 1.5 };
      expect(validateUserSettings(settings)).toBe(false);
    });
  });

  describe('lastUpdated Validation', () => {
    it('should accept valid timestamp values', () => {
      const now = Date.now();
      const settings = { ...validSettings, lastUpdated: now };
      expect(validateUserSettings(settings)).toBe(true);
    });

    it('should accept past timestamps', () => {
      const past = Date.now() - 1000000;
      const settings = { ...validSettings, lastUpdated: past };
      expect(validateUserSettings(settings)).toBe(true);
    });

    it('should reject non-positive lastUpdated', () => {
      const settings = { ...validSettings, lastUpdated: 0 };
      expect(validateUserSettings(settings)).toBe(false);
    });

    it('should reject negative lastUpdated', () => {
      const settings = { ...validSettings, lastUpdated: -1 };
      expect(validateUserSettings(settings)).toBe(false);
    });

    it('should reject non-integer lastUpdated', () => {
      const settings = { ...validSettings, lastUpdated: 1234.56 };
      expect(validateUserSettings(settings)).toBe(false);
    });
  });

  describe('Nested defaultConfig Validation', () => {
    it('should validate with valid defaultConfig', () => {
      const settings = {
        ...validSettings,
        defaultConfig: DEFAULT_CONVERSION_CONFIG,
      };

      expect(validateUserSettings(settings)).toBe(true);
    });

    it('should reject invalid page size in defaultConfig', () => {
      const settings = {
        ...validSettings,
        defaultConfig: {
          ...DEFAULT_CONVERSION_CONFIG,
          pageSize: 'Invalid',
        },
      };

      expect(validateUserSettings(settings)).toBe(false);
    });

    it('should reject invalid margin values in defaultConfig', () => {
      const settings = {
        ...validSettings,
        defaultConfig: {
          ...DEFAULT_CONVERSION_CONFIG,
          margin: {
            ...DEFAULT_CONVERSION_CONFIG.margin,
            top: -1,
          },
        },
      };

      expect(validateUserSettings(settings)).toBe(false);
    });
  });

  describe('strictObject Behavior', () => {
    it('should reject settings with unknown keys', () => {
      const settingsWithExtra = {
        ...validSettings,
        unknownField: 'should be rejected',
      };

      expect(validateUserSettings(settingsWithExtra)).toBe(false);
    });

    it('should reject settings with additional properties', () => {
      const settingsWithExtra = {
        ...validSettings,
        customSetting: true,
        extraData: 'test',
      };

      expect(validateUserSettings(settingsWithExtra)).toBe(false);
    });
  });

  describe('parseUserSettings', () => {
    it('should parse valid settings', () => {
      const result = parseUserSettings(validSettings);

      expect(result).toEqual(validSettings);
      expect(result.theme).toBe('light');
      expect(result.retentionDays).toBe(30);
    });

    it('should throw on invalid theme', () => {
      const invalidSettings = { ...validSettings, theme: 'invalid' };
      expect(() => parseUserSettings(invalidSettings)).toThrow();
    });

    it('should throw on invalid retentionDays', () => {
      const invalidSettings = { ...validSettings, retentionDays: 0 };
      expect(() => parseUserSettings(invalidSettings)).toThrow();
    });

    it('should throw on missing required fields', () => {
      const { theme, ...incomplete } = validSettings;
      void theme; // Acknowledge unused variable
      expect(() => parseUserSettings(incomplete)).toThrow();
    });

    it('should throw on unknown keys', () => {
      const settingsWithExtra = { ...validSettings, unknownKey: 'value' };
      expect(() => parseUserSettings(settingsWithExtra)).toThrow();
    });
  });
});
