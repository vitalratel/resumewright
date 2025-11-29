/**
 * Settings Validator Tests
 *
 * Tests for user settings validation functions:
 * - validateUserSettings (boolean validation)
 * - parseUserSettings (parse with detailed errors)
 */

import type { UserSettings } from '@/shared/types/settings';
import { describe, expect, it } from 'vitest';
import {
  parseUserSettings,
  validateUserSettings,
} from '../settings';

describe('Settings Validators', () => {
  const validSettings: UserSettings = {
    theme: 'auto',
    defaultConfig: {
      margin: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
      fontSize: 12,
      fontFamily: 'Arial',
      pageSize: 'Letter',
      filename: 'resume.pdf',
      compress: true,
      atsOptimization: true,
      includeMetadata: true,
    },
    autoDetectCV: true,
    showConvertButtons: true,
    telemetryEnabled: false,
    retentionDays: 30,
    settingsVersion: 1,
    lastUpdated: Date.now(),
  };

  describe('validateUserSettings', () => {
    it('should validate valid user settings', () => {
      expect(validateUserSettings(validSettings)).toBe(true);
    });

    it('should validate with different theme values', () => {
      expect(validateUserSettings({ ...validSettings, theme: 'light' })).toBe(true);
      expect(validateUserSettings({ ...validSettings, theme: 'dark' })).toBe(true);
      expect(validateUserSettings({ ...validSettings, theme: 'auto' })).toBe(true);
    });

    it('should reject invalid theme', () => {
      expect(validateUserSettings({ ...validSettings, theme: 'blue' })).toBe(false);
      expect(validateUserSettings({ ...validSettings, theme: '' })).toBe(false);
    });

    it('should reject missing required fields', () => {
      const incomplete = { theme: 'auto', autoDetectCV: true };
      expect(validateUserSettings(incomplete)).toBe(false);
    });

    it('should reject invalid retention days - too small', () => {
      expect(validateUserSettings({ ...validSettings, retentionDays: 0 })).toBe(false);
      expect(validateUserSettings({ ...validSettings, retentionDays: -1 })).toBe(false);
    });

    it('should reject invalid retention days - too large', () => {
      expect(validateUserSettings({ ...validSettings, retentionDays: 366 })).toBe(false);
      expect(validateUserSettings({ ...validSettings, retentionDays: 1000 })).toBe(false);
    });

    it('should accept boundary retention days', () => {
      expect(validateUserSettings({ ...validSettings, retentionDays: 1 })).toBe(true);
      expect(validateUserSettings({ ...validSettings, retentionDays: 365 })).toBe(true);
    });

    it('should reject non-boolean flags', () => {
      expect(validateUserSettings({ ...validSettings, autoDetectCV: 'true' })).toBe(false);
      expect(validateUserSettings({ ...validSettings, showConvertButtons: 1 })).toBe(false);
      expect(validateUserSettings({ ...validSettings, telemetryEnabled: null })).toBe(false);
    });

    it('should reject negative version numbers', () => {
      expect(validateUserSettings({ ...validSettings, settingsVersion: 0 })).toBe(false);
      expect(validateUserSettings({ ...validSettings, settingsVersion: -1 })).toBe(false);
    });

    it('should reject negative lastUpdated', () => {
      expect(validateUserSettings({ ...validSettings, lastUpdated: 0 })).toBe(false);
      expect(validateUserSettings({ ...validSettings, lastUpdated: -100 })).toBe(false);
    });
  });

  describe('parseUserSettings', () => {
    it('should parse valid user settings', () => {
      const result = parseUserSettings(validSettings);
      expect(result).toEqual(validSettings);
    });

    it('should throw error for invalid settings', () => {
      const invalid = { theme: 'auto' };
      expect(() => parseUserSettings(invalid)).toThrow();
    });

    it('should throw error with descriptive message for invalid theme', () => {
      expect(() => parseUserSettings({ ...validSettings, theme: 'invalid' })).toThrow();
    });

    it('should throw error for retention days out of range', () => {
      expect(() => parseUserSettings({ ...validSettings, retentionDays: 0 }))
        .toThrow(/Retention days must be between 1 and 365/);

      expect(() => parseUserSettings({ ...validSettings, retentionDays: 400 }))
        .toThrow(/Retention days must be between 1 and 365/);
    });

    it('should throw error for non-boolean flag', () => {
      expect(() => parseUserSettings({ ...validSettings, autoDetectCV: 'yes' }))
        .toThrow(/Auto-detect CV must be a boolean/);
    });

    it('should throw error for negative version', () => {
      expect(() => parseUserSettings({ ...validSettings, settingsVersion: -1 }))
        .toThrow(/Settings version must be positive/);
    });
  });
});
