/**
 * Settings Migration Integration Tests
 * Test settings migration scenarios
 */

import type { UserSettings } from '../../shared/types/settings';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import browser from 'webextension-polyfill';
import { DEFAULT_USER_SETTINGS } from '@/shared/domain/settings/migrations';

import { settingsStore } from '@/shared/infrastructure/settings/SettingsStore';

// Mock chrome storage
vi.mock('webextension-polyfill', () => ({
  default: {
    storage: {
      sync: {
        get: vi.fn(),
        set: vi.fn(),
        remove: vi.fn(),
      },
      local: {
        get: vi.fn(),
        set: vi.fn(),
        remove: vi.fn(),
      },
      onChanged: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
      },
    },
  },
}));

describe('Settings Migration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fresh install creates default settings', async () => {
    // Simulate no existing settings
    vi.mocked(browser.storage.sync.get).mockResolvedValue({});

    const settings = await settingsStore.loadSettings();

    expect(settings).toEqual(DEFAULT_USER_SETTINGS);
    expect(settings.settingsVersion).toBe(1);
  });

  it('existing v1 settings are loaded without migration', async () => {
    const timestamp = Date.now();
    const existingSettings: UserSettings = {
      theme: 'auto',
      defaultConfig: {
        pageSize: 'A4',
        margin: { top: 1, bottom: 1, left: 1, right: 1 },
        fontSize: 11,
        fontFamily: 'Helvetica',
        compress: true,
        includeMetadata: true,
      },
      autoDetectCV: true,
      showConvertButtons: true,
      telemetryEnabled: false,
      retentionDays: 30,
      settingsVersion: 1,
      lastUpdated: timestamp,
    };

    vi.mocked(browser.storage.sync.get).mockResolvedValue({
      'resumewright-settings': existingSettings,
    });

    const settings = await settingsStore.loadSettings();

    expect(settings.settingsVersion).toBe(1);
    expect(settings.defaultConfig.pageSize).toBe('A4');
    expect(settings.defaultConfig.margin).toEqual({ top: 1, bottom: 1, left: 1, right: 1 });
    expect(settings.theme).toBe('auto');
    expect(settings.lastUpdated).toBe(timestamp);
  });

  it('corrupted settings reset to defaults', async () => {
    // Simulate corrupted data
    vi.mocked(browser.storage.sync.get).mockResolvedValue({
      'resumewright-settings': 'invalid json',
    });

    const settings = await settingsStore.loadSettings();

    expect(settings).toEqual(DEFAULT_USER_SETTINGS);
  });

  it('missing required fields get defaults', async () => {
    const incompleteSettings = {
      theme: 'auto',
      settingsVersion: 1,
      defaultConfig: {
        pageSize: 'Letter',
        // Missing other required fields
      },
      autoDetectCV: true,
      showConvertButtons: true,
      telemetryEnabled: false,
      retentionDays: 30,
      lastUpdated: Date.now(),
    };

    vi.mocked(browser.storage.sync.get).mockResolvedValue({
      'resumewright-settings': incompleteSettings,
    });

    const settings = await settingsStore.loadSettings();

    // Should have all required fields with defaults merged
    expect(settings.defaultConfig.margin).toBeDefined();
    expect(settings.defaultConfig.fontSize).toBeDefined();
    expect(settings.defaultConfig.fontFamily).toBeDefined();
    expect(settings.defaultConfig.pageSize).toBe('Letter');
  });

  it('unknown fields are rejected (strict schema validation)', async () => {
    // Settings with unknown fields should fail validation and fall back to defaults
    const futureSettings = {
      ...DEFAULT_USER_SETTINGS,
      futureField: 'future value',
      defaultConfig: {
        ...DEFAULT_USER_SETTINGS.defaultConfig,
        futureConfigField: true,
      },
    };

    vi.mocked(browser.storage.sync.get).mockResolvedValue({
      'resumewright-settings': futureSettings,
    });

    const settings = await settingsStore.loadSettings();

    // Should fall back to defaults because unknown fields are rejected
    expect(settings).toEqual(DEFAULT_USER_SETTINGS);
    expect((settings as unknown as Record<string, unknown>).futureField).toBeUndefined();
    expect((settings.defaultConfig as unknown as Record<string, unknown>).futureConfigField).toBeUndefined();
  });

  it('saveSettings persists to storage', async () => {
    const settingsToSave: UserSettings = {
      ...DEFAULT_USER_SETTINGS,
      defaultConfig: {
        ...DEFAULT_USER_SETTINGS.defaultConfig,
        pageSize: 'A4',
      },
    };

    await settingsStore.saveSettings(settingsToSave);

    expect(browser.storage.sync.set).toHaveBeenCalledWith({
      'resumewright-settings': expect.objectContaining({
        ...settingsToSave,
        settingsVersion: 1,
        lastUpdated: expect.any(Number),
      }),
    });
  });

  it('resetSettings restores defaults', async () => {
    await settingsStore.resetSettings();

    expect(browser.storage.sync.set).toHaveBeenCalledWith({
      'resumewright-settings': expect.objectContaining({
        ...DEFAULT_USER_SETTINGS,
        settingsVersion: 1,
        lastUpdated: expect.any(Number),
      }),
    });
  });

  it('migration is idempotent', async () => {
    // Load settings twice
    vi.mocked(browser.storage.sync.get).mockResolvedValue({
      'resumewright-settings': DEFAULT_USER_SETTINGS,
    });

    const settings1 = await settingsStore.loadSettings();
    const settings2 = await settingsStore.loadSettings();

    expect(settings1).toEqual(settings2);
  });
});

/**
 * Settings Migration Documentation
 *
 * Version History:
 * - v1: Initial release
 *   - defaultConfig.pageSize: 'Letter' | 'A4'
 *   - defaultConfig.margins: { top, bottom, left, right }
 *   - defaultConfig.customFonts: FontRequirement[]
 *
 * Migration Rules:
 * 1. Fresh install → v1 defaults
 * 2. Existing v1 → No migration needed
 * 3. Corrupted data → v1 defaults
 * 4. Missing fields → Add v1 defaults
 * 5. Unknown fields → Preserve (forward compatibility)
 *
 * Future Migrations:
 * When adding v2:
 * 1. Add version check in loadSettings()
 * 2. Implement migration function (v1 → v2)
 * 3. Update DEFAULT_SETTINGS version to 2
 * 4. Add tests for v1 → v2 migration
 */
