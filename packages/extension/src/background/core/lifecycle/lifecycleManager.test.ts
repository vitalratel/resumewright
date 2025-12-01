/**
 * LifecycleManager Tests
 * Tests for service worker lifecycle management
 */

import type { UserSettings } from '../../../shared/types/settings';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { settingsStore } from '@/shared/infrastructure/settings/SettingsStore';
import { LifecycleManager } from './lifecycleManager';

// Mock browser API
vi.mock('wxt/browser', () => ({
  browser: {
    runtime: {
      onInstalled: {
        addListener: vi.fn(),
      },
      onStartup: {
        addListener: vi.fn(),
      },
    },
    storage: {
      local: {
        get: vi.fn(),
        set: vi.fn(),
      },
    },
  },
}));

// Mock logger
vi.mock('../../../shared/infrastructure/logging', () => ({
  getLogger: vi.fn(() => ({
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

// Mock settingsStore
vi.mock('@/shared/infrastructure/settings/SettingsStore', () => ({
  settingsStore: {
    loadSettings: vi.fn(),
  },
}));

describe('LifecycleManager', () => {
  const mockSettings: UserSettings = {
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

  let lifecycleManager: LifecycleManager;

  beforeEach(() => {
    vi.clearAllMocks();
    // Create fresh instance for each test (no singleton reset needed)
    lifecycleManager = new LifecycleManager();
  });

  describe('initialize', () => {
    it('should clear existing storage', async () => {
      const manager = lifecycleManager;
      vi.mocked(browser.storage.local.set).mockResolvedValue();
      vi.mocked(settingsStore.loadSettings).mockResolvedValue(mockSettings);

      await manager.initialize();

      expect(browser.storage.local.set).toHaveBeenCalledWith({
        resumewright_job_states: {},
      });
    });

    it('should initialize default settings', async () => {
      const manager = lifecycleManager;
      vi.mocked(browser.storage.local.set).mockResolvedValue();
      vi.mocked(settingsStore.loadSettings).mockResolvedValue(mockSettings);

      await manager.initialize();

      expect(settingsStore.loadSettings).toHaveBeenCalled();
    });

    it('should handle settings initialization failure gracefully', async () => {
      // Test error handler at lines 108-109
      const { getLogger } = await import('../../../shared/infrastructure/logging');
      const mockLogger = {
        info: vi.fn(),
        debug: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      };
      vi.mocked(getLogger).mockReturnValue(mockLogger as never);

      const manager = lifecycleManager;
      vi.mocked(browser.storage.local.set).mockResolvedValue();

      const testError = new Error('Settings initialization failed');
      vi.mocked(settingsStore.loadSettings).mockRejectedValue(testError);

      // Should not throw - error is caught and logged
      await expect(manager.initialize()).resolves.not.toThrow();

      // Verify error was logged
      expect(mockLogger.error).toHaveBeenCalledWith(
        'LifecycleManager',
        '[Lifecycle] Failed to initialize settings',
        testError,
      );
    });

    it('should log success when settings initialization succeeds', async () => {
      const { getLogger } = await import('../../../shared/infrastructure/logging');
      const mockLogger = {
        info: vi.fn(),
        debug: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      };
      vi.mocked(getLogger).mockReturnValue(mockLogger as never);

      const manager = lifecycleManager;
      vi.mocked(browser.storage.local.set).mockResolvedValue();
      vi.mocked(settingsStore.loadSettings).mockResolvedValue(mockSettings);

      await manager.initialize();

      expect(mockLogger.info).toHaveBeenCalledWith(
        'LifecycleManager',
        'Default settings initialized',
      );
      expect(mockLogger.error).not.toHaveBeenCalled();
    });
  });
});
