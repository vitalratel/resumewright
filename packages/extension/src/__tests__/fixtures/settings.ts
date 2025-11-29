/**
 * Settings Fixtures for Test Suite
 *
 * Provides fixtures for UserSettings and ConversionConfig with sensible defaults.
 * All fixtures support overrides for customization.
 *
 * Usage:
 * ```typescript
 * import { createMockSettings, mockLetterConfig } from '@/__tests__/fixtures/settings';
 *
 * const settings = createMockSettings(); // Default settings
 * const a4Settings = createA4Settings(); // A4 page size
 * const custom = createMockSettings({ theme: 'dark' }); // Custom overrides
 * ```
 */

import type { ConversionConfig, UserSettings } from '@/shared/types';

/**
 * Default Letter-sized conversion configuration
 * Most common configuration for US users
 */
export const mockLetterConfig: ConversionConfig = {
  pageSize: 'Letter',
  margin: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
  fontSize: 12,
  fontFamily: 'Arial',
  compress: false,
  includeMetadata: true,
};

/**
 * A4-sized conversion configuration
 * Common configuration for international users
 */
export const mockA4Config: ConversionConfig = {
  pageSize: 'A4',
  margin: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
  fontSize: 12,
  fontFamily: 'Arial',
  compress: false,
  includeMetadata: true,
};

/**
 * Legal-sized conversion configuration
 */
export const mockLegalConfig: ConversionConfig = {
  pageSize: 'Legal',
  margin: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
  fontSize: 12,
  fontFamily: 'Arial',
  compress: false,
  includeMetadata: true,
};

/**
 * Minimal margins configuration (for testing tight layouts)
 */
export const mockMinimalMarginConfig: ConversionConfig = {
  ...mockLetterConfig,
  margin: { top: 0.25, right: 0.25, bottom: 0.25, left: 0.25 },
};

/**
 * Large margins configuration (for testing spacious layouts)
 */
export const mockLargeMarginConfig: ConversionConfig = {
  ...mockLetterConfig,
  margin: { top: 1.0, right: 1.0, bottom: 1.0, left: 1.0 },
};

/**
 * Compressed PDF configuration
 */
export const mockCompressedConfig: ConversionConfig = {
  ...mockLetterConfig,
  compress: true,
};

/**
 * Create a custom conversion configuration
 *
 * @param overrides - Partial ConversionConfig to override defaults
 * @returns ConversionConfig with Letter defaults
 *
 * @example
 * const config = createMockConfig({ pageSize: 'A4' });
 */
export function createMockConfig(overrides?: Partial<ConversionConfig>): ConversionConfig {
  return {
    ...mockLetterConfig,
    ...overrides,
  };
}

/**
 * Create mock user settings with defaults
 *
 * @param overrides - Partial UserSettings to override defaults
 * @returns UserSettings with sensible defaults
 *
 * @example
 * const settings = createMockSettings();
 * const custom = createMockSettings({ theme: 'dark', telemetryEnabled: false });
 */
export function createMockSettings(overrides?: Partial<UserSettings>): UserSettings {
  return {
    theme: 'auto',
    defaultConfig: mockLetterConfig,
    autoDetectCV: true,
    showConvertButtons: true,
    telemetryEnabled: false,
    retentionDays: 30,
    settingsVersion: 1,
    lastUpdated: Date.now(),
    ...overrides,
  };
}

/**
 * Create mock settings with A4 page size
 *
 * @param overrides - Additional overrides
 * @returns UserSettings with A4 configuration
 *
 * @example
 * const settings = createA4Settings();
 */
export function createA4Settings(overrides?: Partial<UserSettings>): UserSettings {
  return createMockSettings({
    defaultConfig: mockA4Config,
    ...overrides,
  });
}

/**
 * Create mock settings with Legal page size
 *
 * @param overrides - Additional overrides
 * @returns UserSettings with Legal configuration
 *
 * @example
 * const settings = createLegalSettings();
 */
export function createLegalSettings(overrides?: Partial<UserSettings>): UserSettings {
  return createMockSettings({
    defaultConfig: mockLegalConfig,
    ...overrides,
  });
}

/**
 * Create mock settings with custom margins
 *
 * @param margins - Custom margin values
 * @param overrides - Additional overrides
 * @returns UserSettings with custom margins
 *
 * @example
 * const settings = createCustomMarginSettings({ top: 1, right: 1, bottom: 1, left: 1 });
 */
export function createCustomMarginSettings(margins: ConversionConfig['margin'], overrides?: Partial<UserSettings>): UserSettings {
  return createMockSettings({
    defaultConfig: {
      ...mockLetterConfig,
      margin: margins,
    },
    ...overrides,
  });
}

/**
 * Create mock settings with minimal margins
 *
 * @param overrides - Additional overrides
 * @returns UserSettings with minimal margins
 *
 * @example
 * const settings = createMinimalMarginSettings();
 */
export function createMinimalMarginSettings(overrides?: Partial<UserSettings>): UserSettings {
  return createMockSettings({
    defaultConfig: mockMinimalMarginConfig,
    ...overrides,
  });
}

/**
 * Create mock settings with large margins
 *
 * @param overrides - Additional overrides
 * @returns UserSettings with large margins
 *
 * @example
 * const settings = createLargeMarginSettings();
 */
export function createLargeMarginSettings(overrides?: Partial<UserSettings>): UserSettings {
  return createMockSettings({
    defaultConfig: mockLargeMarginConfig,
    ...overrides,
  });
}

/**
 * Create mock settings with compression enabled
 *
 * @param overrides - Additional overrides
 * @returns UserSettings with compression enabled
 *
 * @example
 * const settings = createCompressedSettings();
 */
export function createCompressedSettings(overrides?: Partial<UserSettings>): UserSettings {
  return createMockSettings({
    defaultConfig: mockCompressedConfig,
    ...overrides,
  });
}

/**
 * Create mock settings with telemetry enabled
 *
 * @param overrides - Additional overrides
 * @returns UserSettings with telemetry enabled
 *
 * @example
 * const settings = createTelemetrySettings();
 */
export function createTelemetrySettings(overrides?: Partial<UserSettings>): UserSettings {
  return createMockSettings({
    telemetryEnabled: true,
    ...overrides,
  });
}

/**
 * Create mock settings with dark theme
 *
 * @param overrides - Additional overrides
 * @returns UserSettings with dark theme
 *
 * @example
 * const settings = createDarkThemeSettings();
 */
export function createDarkThemeSettings(overrides?: Partial<UserSettings>): UserSettings {
  return createMockSettings({
    theme: 'dark',
    ...overrides,
  });
}

/**
 * Create minimal mock settings (for testing migrations/edge cases)
 *
 * @param overrides - Additional overrides
 * @returns UserSettings with minimal configuration
 *
 * @example
 * const settings = createMinimalSettings();
 */
export function createMinimalSettings(overrides?: Partial<UserSettings>): UserSettings {
  return createMockSettings({
    theme: 'light',
    autoDetectCV: false,
    showConvertButtons: false,
    telemetryEnabled: false,
    retentionDays: 7,
    ...overrides,
  });
}
