/**
 * SettingsHandler Tests
 * Coverage for settings get/update operations
 */

import type { Runtime } from 'webextension-polyfill';
import type { GetSettingsMessage, UpdateSettingsMessage } from '../../../shared/types/messages';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MessageType } from '../../../shared/types/messages';
import { SettingsHandler } from '../settingsHandler';

// Mock dependencies
vi.mock('@/shared/infrastructure/settings/SettingsStore', () => ({
  settingsStore: {
    loadSettings: vi.fn(),
    saveSettings: vi.fn(),
  },
}));

describe('SettingsHandler', () => {
  let handler: SettingsHandler;
  let mockLoadSettings: ReturnType<typeof vi.fn>;
  let mockSaveSettings: ReturnType<typeof vi.fn>;

  const defaultSettings = {
    defaultConfig: {
      pageSize: 'Letter' as const,
      margin: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
      fontSize: 12,
      fontFamily: 'Arial',
      compress: false,
      atsOptimization: false,
      includeMetadata: true,
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const { settingsStore } = await import('@/shared/infrastructure/settings/SettingsStore');

    mockLoadSettings = vi.mocked(settingsStore.loadSettings);
    mockSaveSettings = vi.mocked(settingsStore.saveSettings);

    mockLoadSettings.mockResolvedValue(defaultSettings);
    mockSaveSettings.mockResolvedValue(undefined);

    handler = new SettingsHandler();
  });

  describe('handle', () => {
    it('should route GET_SETTINGS to handleGetSettings', async () => {
      const message: GetSettingsMessage = {
        type: MessageType.GET_SETTINGS,
        payload: {},
      };

      // Type assertion: test is checking handler behavior with specific message
      const result = await handler.handle(message as any, {} as Runtime.MessageSender);

      expect(result).toMatchObject({
        success: true,
        settings: defaultSettings,
      });
    });

    it('should route UPDATE_SETTINGS to handleUpdateSettings', async () => {
      const message: UpdateSettingsMessage = {
        type: MessageType.UPDATE_SETTINGS,
        payload: {
          settings: {
            defaultConfig: {
              ...defaultSettings.defaultConfig,
              pageSize: 'A4' as const,
            },
          },
        },
      };

      // Type assertion: test is checking handler behavior with specific message
      const result = await handler.handle(message as any, {} as Runtime.MessageSender);

      expect(result).toEqual({ success: true });
    });
  });

  describe('handleGetSettings', () => {
    it('should successfully load settings', async () => {
      mockLoadSettings.mockResolvedValue(defaultSettings);

      const message: GetSettingsMessage = {
        type: MessageType.GET_SETTINGS,
        payload: {},
      };

      // Type assertion: test is checking handler behavior with specific message
      const result = await handler.handle(message as any, {} as Runtime.MessageSender);

      expect(result).toEqual({
        success: true,
        settings: defaultSettings,
      });
      expect(mockLoadSettings).toHaveBeenCalled();
    });

    it('should handle load errors (P1)', async () => {
      mockLoadSettings.mockRejectedValue(new Error('Storage unavailable'));

      const message: GetSettingsMessage = {
        type: MessageType.GET_SETTINGS,
        payload: {},
      };

      // Type assertion: test is checking handler behavior with specific message
      const result = await handler.handle(message as any, {} as Runtime.MessageSender);

      expect(result).toEqual({
        success: false,
        error: 'Storage unavailable',
      });
    });

    it('should handle non-Error exceptions (P1)', async () => {
      mockLoadSettings.mockRejectedValue('String error');

      const message: GetSettingsMessage = {
        type: MessageType.GET_SETTINGS,
        payload: {},
      };

      // Type assertion: test is checking handler behavior with specific message
      const result = await handler.handle(message as any, {} as Runtime.MessageSender);

      expect(result).toMatchObject({
        success: false,
        error: 'Failed to load settings',
      });
    });
  });

  describe('handleUpdateSettings', () => {
    it('should successfully update settings', async () => {
      const updatedConfig = {
        ...defaultSettings.defaultConfig,
        pageSize: 'A4' as const,
        fontSize: 14,
      };

      const message: UpdateSettingsMessage = {
        type: MessageType.UPDATE_SETTINGS,
        payload: {
          settings: {
            defaultConfig: updatedConfig,
          },
        },
      };

      await handler.handle(message, {} as Runtime.MessageSender);

      expect(mockLoadSettings).toHaveBeenCalled();
      expect(mockSaveSettings).toHaveBeenCalledWith({
        defaultConfig: updatedConfig,
      });
    });

    it('should merge settings on update', async () => {
      const partialUpdate = {
        defaultConfig: {
          ...defaultSettings.defaultConfig,
          pageSize: 'A4' as const,
        },
      };

      const message: UpdateSettingsMessage = {
        type: MessageType.UPDATE_SETTINGS,
        payload: {
          settings: partialUpdate,
        },
      };

      await handler.handle(message, {} as Runtime.MessageSender);

      expect(mockSaveSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          defaultConfig: expect.objectContaining({
            pageSize: 'A4',
          }),
        }),
      );
    });

    it('should handle update errors (P1)', async () => {
      mockSaveSettings.mockRejectedValue(new Error('Storage full'));

      const message: UpdateSettingsMessage = {
        type: MessageType.UPDATE_SETTINGS,
        payload: {
          settings: { defaultConfig: defaultSettings.defaultConfig },
        },
      };

      // Type assertion: test is checking handler behavior with specific message
      const result = await handler.handle(message as any, {} as Runtime.MessageSender);

      expect(result).toEqual({
        success: false,
        error: 'Storage full',
      });
    });

    it('should handle load errors during update (P1)', async () => {
      mockLoadSettings.mockRejectedValue(new Error('Cannot load settings'));

      const message: UpdateSettingsMessage = {
        type: MessageType.UPDATE_SETTINGS,
        payload: {
          settings: { defaultConfig: defaultSettings.defaultConfig },
        },
      };

      // Type assertion: test is checking handler behavior with specific message
      const result = await handler.handle(message as any, {} as Runtime.MessageSender);

      expect(result).toMatchObject({
        success: false,
        error: expect.stringContaining('Cannot load settings'),
      });
    });
  });
});
