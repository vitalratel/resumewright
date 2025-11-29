/**
 * SettingsStore Unit Tests
 *
 * Tests settings persistence, validation, and reset functionality
 */

import type { UserSettings } from '@/shared/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
// Import after mocking
import browser from 'webextension-polyfill';

import { DEFAULT_USER_SETTINGS } from '@/shared/domain/settings/defaults';
import { settingsStore } from '../SettingsStore';

// Mock webextension-polyfill
vi.mock('webextension-polyfill', () => ({
  default: {
    storage: {
      sync: {
        get: vi.fn(),
        set: vi.fn(),
      },
      local: {
        get: vi.fn(),
        set: vi.fn(),
      },
      onChanged: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
      },
    },
  },
}));

const mockStorage = browser.storage;

describe('SettingsStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadSettings', () => {
    it('returns default settings when storage is empty', async () => {
      (mockStorage.sync.get as ReturnType<typeof vi.fn>).mockResolvedValue({});

      const settings = await settingsStore.loadSettings();

      expect(settings.defaultConfig.pageSize).toBe('Letter');
      expect(settings.defaultConfig.margin.top).toBe(0.5);
      expect(settings.defaultConfig.margin.right).toBe(0.5);
      expect(settings.defaultConfig.margin.bottom).toBe(0.5);
      expect(settings.defaultConfig.margin.left).toBe(0.5);
      expect(settings.settingsVersion).toBe(1);
    });

    it('returns stored settings when present', async () => {
      const storedSettings: UserSettings = {
        ...DEFAULT_USER_SETTINGS,
        defaultConfig: {
          ...DEFAULT_USER_SETTINGS.defaultConfig,
          pageSize: 'A4',
          margin: {
            top: 0.75,
            right: 0.75,
            bottom: 0.75,
            left: 0.75,
          },
        },
      };
      (mockStorage.sync.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        'resumewright-settings': storedSettings,
      });

      const settings = await settingsStore.loadSettings();

      expect(settings.defaultConfig.pageSize).toBe('A4');
      expect(settings.defaultConfig.margin.top).toBe(0.75);
    });

    it('falls back to local storage on sync failure', async () => {
      (mockStorage.sync.get as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Sync storage unavailable')
      );
      (mockStorage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        'resumewright-settings': DEFAULT_USER_SETTINGS,
      });

      const settings = await settingsStore.loadSettings();

      expect(settings).toBeDefined();
      expect(mockStorage.local.get).toHaveBeenCalled();
    });

    describe('browser.storage.local.set error handling', () => {
      it('should handle browser.storage.local.set failure during migration in loadSettingsLocal', async () => {
        const oldSettings = {
          ...DEFAULT_USER_SETTINGS,
          settingsVersion: 0, // Old version to trigger migration
        };

        (mockStorage.sync.get as ReturnType<typeof vi.fn>).mockRejectedValue(
          new Error('Sync unavailable')
        );
        (mockStorage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({
          'resumewright-settings': oldSettings,
        });
        (mockStorage.local.set as ReturnType<typeof vi.fn>).mockRejectedValue(
          new Error('Storage quota exceeded')
        );

        const settings = await settingsStore.loadSettings();

        // Should still return migrated settings even if save fails
        expect(settings).toBeDefined();
        expect(settings.settingsVersion).toBeGreaterThan(0);
      });
    });

    describe('Error handling returns DEFAULT_USER_SETTINGS', () => {
      it('should return DEFAULT_USER_SETTINGS when loadSettingsLocal fails', async () => {
        (mockStorage.sync.get as ReturnType<typeof vi.fn>).mockRejectedValue(
          new Error('Sync unavailable')
        );
        (mockStorage.local.get as ReturnType<typeof vi.fn>).mockRejectedValue(
          new Error('Local storage access denied')
        );

        const settings = await settingsStore.loadSettings();

        expect(settings).toEqual(DEFAULT_USER_SETTINGS);
      });
    });
  });

  describe('saveSettings', () => {
    it('saves valid settings to chrome.storage.sync', async () => {
      (mockStorage.sync.set as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      await settingsStore.saveSettings(DEFAULT_USER_SETTINGS);

      expect(mockStorage.sync.set).toHaveBeenCalledWith({
        'resumewright-settings': expect.objectContaining({
          defaultConfig: expect.objectContaining({
            pageSize: 'Letter',
            margin: {
              top: 0.5,
              right: 0.5,
              bottom: 0.5,
              left: 0.5,
            },
          }),
        }),
      });
    });

    it('updates lastUpdated timestamp when saving', async () => {
      (mockStorage.sync.set as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
      const beforeSave = Date.now();

      await settingsStore.saveSettings(DEFAULT_USER_SETTINGS);

      const savedSettings = (mockStorage.sync.set as ReturnType<typeof vi.fn>).mock.calls[0][0][
        'resumewright-settings'
      ] as UserSettings;
      expect(savedSettings.lastUpdated).toBeGreaterThanOrEqual(beforeSave);
    });

    it('falls back to local storage on sync failure', async () => {
      (mockStorage.sync.set as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Sync storage unavailable')
      );
      (mockStorage.local.set as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      await settingsStore.saveSettings(DEFAULT_USER_SETTINGS);

      expect(mockStorage.local.set).toHaveBeenCalled();
    });
  });

  describe('resetSettings', () => {
    it('resets settings to defaults', async () => {
      (mockStorage.sync.set as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      await settingsStore.resetSettings();

      expect(mockStorage.sync.set).toHaveBeenCalledWith({
        'resumewright-settings': expect.objectContaining({
          defaultConfig: expect.objectContaining({
            pageSize: 'Letter',
            margin: {
              top: 0.5,
              right: 0.5,
              bottom: 0.5,
              left: 0.5,
            },
          }),
        }),
      });
    });
  });

  describe('validateSettings', () => {
    it('validates correct settings as valid', () => {
      const validation = settingsStore.validateSettings(DEFAULT_USER_SETTINGS);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('rejects invalid page size', () => {
      const invalidSettings: UserSettings = {
        ...DEFAULT_USER_SETTINGS,
        defaultConfig: {
          ...DEFAULT_USER_SETTINGS.defaultConfig,

          // Test invalid page size
          pageSize: 'Invalid' as unknown as 'Letter' | 'A4',
        },
      };

      const validation = settingsStore.validateSettings(invalidSettings);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContainEqual({
        field: 'defaultConfig.pageSize',
        message: expect.stringContaining('Invalid'),
      });
    });

    it('rejects negative margins', () => {
      const invalidSettings: UserSettings = {
        ...DEFAULT_USER_SETTINGS,
        defaultConfig: {
          ...DEFAULT_USER_SETTINGS.defaultConfig,
          margin: {
            top: -0.5,
            right: 0.5,
            bottom: 0.5,
            left: 0.5,
          },
        },
      };

      const validation = settingsStore.validateSettings(invalidSettings);

      expect(validation.valid).toBe(false);
      // Verify improved error messages include actual value
      expect(validation.errors).toContainEqual({
        field: 'margin.top',
        message: 'Invalid top margin: -0.5" is outside the allowed range of 0.25" to 1.0"',
      });
    });

    it('rejects margins greater than 1.0', () => {
      const invalidSettings: UserSettings = {
        ...DEFAULT_USER_SETTINGS,
        defaultConfig: {
          ...DEFAULT_USER_SETTINGS.defaultConfig,
          margin: {
            top: 0.5,
            right: 0.5,
            bottom: 0.5,
            left: 1.5,
          },
        },
      };

      const validation = settingsStore.validateSettings(invalidSettings);

      expect(validation.valid).toBe(false);
      // Verify improved error messages include actual value
      expect(validation.errors).toContainEqual({
        field: 'margin.left',
        message: 'Invalid left margin: 1.5" is outside the allowed range of 0.25" to 1.0"',
      });
    });

    it('rejects margins less than 0.25', () => {
      const invalidSettings: UserSettings = {
        ...DEFAULT_USER_SETTINGS,
        defaultConfig: {
          ...DEFAULT_USER_SETTINGS.defaultConfig,
          margin: {
            top: 0.1,
            right: 0.5,
            bottom: 0.5,
            left: 0.5,
          },
        },
      };

      const validation = settingsStore.validateSettings(invalidSettings);

      expect(validation.valid).toBe(false);
      // Verify improved error messages include actual value
      expect(validation.errors).toContainEqual({
        field: 'margin.top',
        message: 'Invalid top margin: 0.1" is outside the allowed range of 0.25" to 1.0"',
      });
    });

    it('rejects non-numeric margins', () => {
      const invalidSettings: UserSettings = {
        ...DEFAULT_USER_SETTINGS,
        defaultConfig: {
          ...DEFAULT_USER_SETTINGS.defaultConfig,
          margin: {
            top: Number.NaN,
            right: 0.5,
            bottom: 0.5,
            left: 0.5,
          },
        },
      };

      const validation = settingsStore.validateSettings(invalidSettings);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContainEqual({
        field: 'defaultConfig.margin.top',
        message: expect.stringContaining('number'),
      });
    });

    it('rejects invalid settingsVersion', () => {
      const invalidSettings: UserSettings = {
        ...DEFAULT_USER_SETTINGS,
        settingsVersion: 0,
      };

      const validation = settingsStore.validateSettings(invalidSettings);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContainEqual({
        field: 'settingsVersion',
        message: expect.stringContaining('Settings version must be positive'),
      });
    });

    it('throws error when saving invalid settings', async () => {
      const invalidSettings: UserSettings = {
        ...DEFAULT_USER_SETTINGS,
        defaultConfig: {
          ...DEFAULT_USER_SETTINGS.defaultConfig,

          pageSize: 'Invalid' as unknown as 'Letter' | 'A4' | 'Legal',
        },
      };

      await expect(settingsStore.saveSettings(invalidSettings)).rejects.toThrow('Invalid settings');
    });
  });

  describe('onSettingsChanged', () => {
    it('registers listener for settings changes', () => {
      const callback = vi.fn();

      const unsubscribe = settingsStore.onSettingsChanged(callback);

      expect(mockStorage.onChanged.addListener).toHaveBeenCalled();
      expect(typeof unsubscribe).toBe('function');
    });

    it('unsubscribes listener when unsubscribe function is called', () => {
      const callback = vi.fn();

      const unsubscribe = settingsStore.onSettingsChanged(callback);
      unsubscribe();

      expect(mockStorage.onChanged.removeListener).toHaveBeenCalled();
    });
  });
});
