/**
 * SettingsStore Unit Tests
 *
 * Tests settings persistence, validation, and reset functionality
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_USER_SETTINGS } from '@/shared/domain/settings/defaults';
import type { UserSettings } from '@/shared/types/settings';
import {
  loadSettings,
  onSettingsChanged,
  resetSettings,
  saveSettings,
  validateSettings,
} from '../SettingsStore';

// Use vi.hoisted to ensure mock functions are available when vi.mock factory runs
const {
  mockSyncGet,
  mockSyncSet,
  mockLocalGet,
  mockLocalSet,
  mockAddListener,
  mockRemoveListener,
} = vi.hoisted(() => ({
  mockSyncGet: vi.fn(),
  mockSyncSet: vi.fn(),
  mockLocalGet: vi.fn(),
  mockLocalSet: vi.fn(),
  mockAddListener: vi.fn(),
  mockRemoveListener: vi.fn(),
}));

// Mock wxt/browser
vi.mock('wxt/browser', () => ({
  browser: {
    storage: {
      sync: {
        get: mockSyncGet,
        set: mockSyncSet,
        onChanged: {
          addListener: mockAddListener,
          removeListener: mockRemoveListener,
        },
      },
      local: {
        get: mockLocalGet,
        set: mockLocalSet,
        onChanged: {
          addListener: mockAddListener,
          removeListener: mockRemoveListener,
        },
      },
      onChanged: {
        addListener: mockAddListener,
        removeListener: mockRemoveListener,
      },
    },
  },
}));

describe('SettingsStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadSettings', () => {
    it('returns default settings when storage is empty', async () => {
      mockSyncGet.mockResolvedValue({});

      const settings = await loadSettings();

      expect(settings.defaultConfig.pageSize).toBe('Letter');
      expect(settings.defaultConfig.margin.top).toBe(0);
      expect(settings.defaultConfig.margin.right).toBe(0);
      expect(settings.defaultConfig.margin.bottom).toBe(0);
      expect(settings.defaultConfig.margin.left).toBe(0);
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
      mockSyncGet.mockResolvedValue({
        'resumewright-settings': storedSettings,
      });

      const settings = await loadSettings();

      expect(settings.defaultConfig.pageSize).toBe('A4');
      expect(settings.defaultConfig.margin.top).toBe(0.75);
    });

    it('falls back to local storage on sync failure', async () => {
      mockSyncGet.mockRejectedValue(new Error('Sync storage unavailable'));
      mockLocalGet.mockResolvedValue({
        'resumewright-settings': DEFAULT_USER_SETTINGS,
      });

      const settings = await loadSettings();

      expect(settings).toBeDefined();
      expect(mockLocalGet).toHaveBeenCalled();
    });

    describe('invalid settings handling', () => {
      it('should return defaults when stored settings are invalid', async () => {
        const invalidSettings = {
          ...DEFAULT_USER_SETTINGS,
          settingsVersion: 0, // Invalid version
        };

        mockSyncGet.mockRejectedValue(new Error('Sync unavailable'));
        mockLocalGet.mockResolvedValue({
          'resumewright-settings': invalidSettings,
        });

        const settings = await loadSettings();

        // Should return defaults for invalid settings
        expect(settings).toEqual(DEFAULT_USER_SETTINGS);
      });
    });

    describe('Error handling returns DEFAULT_USER_SETTINGS', () => {
      it('should return DEFAULT_USER_SETTINGS when loadSettingsLocal fails', async () => {
        mockSyncGet.mockRejectedValue(new Error('Sync unavailable'));
        mockLocalGet.mockRejectedValue(new Error('Local storage access denied'));

        const settings = await loadSettings();

        expect(settings).toEqual(DEFAULT_USER_SETTINGS);
      });
    });
  });

  describe('saveSettings', () => {
    it('saves valid settings to chrome.storage.sync', async () => {
      mockSyncSet.mockResolvedValue(undefined);

      await saveSettings(DEFAULT_USER_SETTINGS);

      expect(mockSyncSet).toHaveBeenCalledWith({
        'resumewright-settings': expect.objectContaining({
          defaultConfig: expect.objectContaining({
            pageSize: 'Letter',
            margin: {
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
            },
          }),
        }),
      });
    });

    it('updates lastUpdated timestamp when saving', async () => {
      mockSyncSet.mockResolvedValue(undefined);
      const beforeSave = Date.now();

      await saveSettings(DEFAULT_USER_SETTINGS);

      const savedSettings = mockSyncSet.mock.calls[0][0]['resumewright-settings'] as UserSettings;
      expect(savedSettings.lastUpdated).toBeGreaterThanOrEqual(beforeSave);
    });

    it('falls back to local storage on sync failure', async () => {
      mockSyncSet.mockRejectedValue(new Error('Sync storage unavailable'));
      mockLocalSet.mockResolvedValue(undefined);

      await saveSettings(DEFAULT_USER_SETTINGS);

      expect(mockLocalSet).toHaveBeenCalled();
    });
  });

  describe('resetSettings', () => {
    it('resets settings to defaults', async () => {
      mockSyncSet.mockResolvedValue(undefined);

      await resetSettings();

      expect(mockSyncSet).toHaveBeenCalledWith({
        'resumewright-settings': expect.objectContaining({
          defaultConfig: expect.objectContaining({
            pageSize: 'Letter',
            margin: {
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
            },
          }),
        }),
      });
    });
  });

  describe('validateSettings', () => {
    it('validates correct settings as valid', () => {
      const validation = validateSettings(DEFAULT_USER_SETTINGS);

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

      const validation = validateSettings(invalidSettings);

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

      const validation = validateSettings(invalidSettings);

      expect(validation.valid).toBe(false);
      // Verify improved error messages include actual value
      expect(validation.errors).toContainEqual({
        field: 'margin.top',
        message: 'Invalid top margin: -0.5" is outside the allowed range of 0" to 1.5"',
      });
    });

    it('rejects margins greater than 1.5', () => {
      const invalidSettings: UserSettings = {
        ...DEFAULT_USER_SETTINGS,
        defaultConfig: {
          ...DEFAULT_USER_SETTINGS.defaultConfig,
          margin: {
            top: 0.5,
            right: 0.5,
            bottom: 0.5,
            left: 2.0,
          },
        },
      };

      const validation = validateSettings(invalidSettings);

      expect(validation.valid).toBe(false);
      // Verify improved error messages include actual value
      expect(validation.errors).toContainEqual({
        field: 'margin.left',
        message: 'Invalid left margin: 2" is outside the allowed range of 0" to 1.5"',
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

      const validation = validateSettings(invalidSettings);

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

      const validation = validateSettings(invalidSettings);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContainEqual({
        field: 'settingsVersion',
        message: expect.stringContaining('Settings version must be positive'),
      });
    });

    it('returns error result when saving invalid settings', async () => {
      const invalidSettings: UserSettings = {
        ...DEFAULT_USER_SETTINGS,
        defaultConfig: {
          ...DEFAULT_USER_SETTINGS.defaultConfig,

          pageSize: 'Invalid' as unknown as 'Letter' | 'A4' | 'Legal',
        },
      };

      const result = await saveSettings(invalidSettings);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('validation_failed');
        expect(result.error.message).toContain('Invalid settings');
      }
    });
  });

  describe('onSettingsChanged', () => {
    it('registers listener for settings changes', () => {
      const callback = vi.fn();

      const unsubscribe = onSettingsChanged(callback);

      expect(mockAddListener).toHaveBeenCalled();
      expect(typeof unsubscribe).toBe('function');
    });

    it('returns unsubscribe function', () => {
      const callback = vi.fn();

      const unsubscribe = onSettingsChanged(callback);

      // Verify unsubscribe is callable without error
      expect(() => unsubscribe()).not.toThrow();
    });
  });
});
