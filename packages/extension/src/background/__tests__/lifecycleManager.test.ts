// ABOUTME: Tests for LifecycleManager lifecycle event handling.
// ABOUTME: Verifies onInstalled and onStartup event registration and initialization.

import { fakeBrowser } from '@webext-core/fake-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserSettings } from '../../shared/types/settings';

// Use vi.hoisted to create shared mock instances that persist across module resets
const mocks = vi.hoisted(() => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
  settingsStore: {
    loadSettings: vi.fn(),
  },
}));

// Mock logger with shared instance
vi.mock('../../shared/infrastructure/logging/instance', () => ({
  getLogger: () => mocks.logger,
}));

// Mock settingsStore with shared instance
vi.mock('@/shared/infrastructure/settings/SettingsStore', () => ({
  settingsStore: mocks.settingsStore,
}));

describe('LifecycleManager', () => {
  let onStartupListener: (() => void) | null = null;
  let onInstalledListener:
    | ((details: { reason: string; previousVersion?: string }) => void)
    | null = null;

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

  beforeEach(async () => {
    // Reset all mocks - clears call history AND resets implementations
    vi.resetAllMocks();
    vi.resetModules();

    // Set default mock implementation for settings
    mocks.settingsStore.loadSettings.mockResolvedValue(mockSettings);

    // Clear storage
    await fakeBrowser.storage.local.clear();
    await fakeBrowser.storage.sync.clear();

    // Capture listeners
    vi.spyOn(fakeBrowser.runtime.onStartup, 'addListener').mockImplementation(
      (listener: () => void) => {
        onStartupListener = listener;
      },
    );
    vi.spyOn(fakeBrowser.runtime.onInstalled, 'addListener').mockImplementation(
      (listener: (details: { reason: string; previousVersion?: string }) => void) => {
        onInstalledListener = listener;
      },
    );

    // Import to trigger constructor which registers listeners
    await import('../lifecycleManager');
  });

  describe('initialization', () => {
    it('should register lifecycle event listeners', () => {
      expect(onInstalledListener).toBeDefined();
      expect(onStartupListener).toBeDefined();
    });

    it('should initialize default settings', async () => {
      const { settingsStore } = await import('@/shared/infrastructure/settings/SettingsStore');
      vi.mocked(settingsStore.loadSettings).mockResolvedValue(mockSettings);

      const { LifecycleManager } = await import('../lifecycleManager');
      const manager = new LifecycleManager();

      await manager.initialize();

      expect(settingsStore.loadSettings).toHaveBeenCalled();
    });

    it('should handle settings initialization failure gracefully', async () => {
      const testError = new Error('Settings initialization failed');
      mocks.settingsStore.loadSettings.mockRejectedValue(testError);

      const { LifecycleManager } = await import('../lifecycleManager');
      const manager = new LifecycleManager();

      // Should not throw - error is caught and logged
      await expect(manager.initialize()).resolves.not.toThrow();

      // Verify error was logged
      expect(mocks.logger.error).toHaveBeenCalledWith(
        'LifecycleManager',
        '[Lifecycle] Failed to initialize settings',
        testError,
      );
    });

    it('should log success when settings initialization succeeds', async () => {
      mocks.settingsStore.loadSettings.mockResolvedValue(mockSettings);

      const { LifecycleManager } = await import('../lifecycleManager');
      const manager = new LifecycleManager();

      await manager.initialize();

      expect(mocks.logger.info).toHaveBeenCalledWith(
        'LifecycleManager',
        'Default settings initialized',
      );
      expect(mocks.logger.error).not.toHaveBeenCalled();
    });
  });

  describe('lifecycle events', () => {
    it('should call initialize on install event', async () => {
      expect(onInstalledListener).toBeDefined();

      onInstalledListener?.({ reason: 'install' });

      // Give async operations time to complete
      await vi.waitFor(() => {
        expect(mocks.logger.info).toHaveBeenCalledWith(
          'LifecycleManager',
          'Performing first-time initialization',
        );
      });
    });

    it('should handle update event', async () => {
      expect(onInstalledListener).toBeDefined();

      onInstalledListener?.({ reason: 'update', previousVersion: '1.0.0' });

      await vi.waitFor(() => {
        expect(mocks.logger.info).toHaveBeenCalledWith(
          'LifecycleManager',
          ' Updated from version 1.0.0',
        );
      });
    });

    it('should log on browser startup', () => {
      expect(onStartupListener).toBeDefined();

      onStartupListener?.();

      expect(mocks.logger.info).toHaveBeenCalledWith(
        'LifecycleManager',
        'onStartup: Browser started',
      );
    });
  });
});
