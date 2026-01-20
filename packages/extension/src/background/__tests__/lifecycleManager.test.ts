// ABOUTME: Tests for lifecycle event handling functions.
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
  loadSettings: vi.fn(),
}));

// Mock logger with shared instance
vi.mock('../../shared/infrastructure/logging/instance', () => ({
  getLogger: () => mocks.logger,
}));

// Mock settings functions with shared instance
vi.mock('@/shared/infrastructure/settings/SettingsStore', () => ({
  loadSettings: mocks.loadSettings,
}));

describe('setupLifecycleListeners', () => {
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
    mocks.loadSettings.mockResolvedValue(mockSettings);

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

    // Import to trigger setupLifecycleListeners via module execution
    const { setupLifecycleListeners } = await import('../lifecycleManager');
    setupLifecycleListeners();
  });

  describe('listener registration', () => {
    it('should register lifecycle event listeners', () => {
      expect(onInstalledListener).toBeDefined();
      expect(onStartupListener).toBeDefined();
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

    it('should handle settings initialization failure gracefully', async () => {
      const testError = new Error('Settings initialization failed');
      mocks.loadSettings.mockRejectedValue(testError);

      // Trigger install event which calls initializeExtension
      onInstalledListener?.({ reason: 'install' });

      // Give async operations time to complete
      await vi.waitFor(() => {
        expect(mocks.logger.error).toHaveBeenCalledWith(
          'LifecycleManager',
          '[Lifecycle] Failed to initialize settings',
          testError,
        );
      });
    });

    it('should log success when settings initialization succeeds', async () => {
      mocks.loadSettings.mockResolvedValue(mockSettings);

      // Trigger install event which calls initializeExtension
      onInstalledListener?.({ reason: 'install' });

      // Give async operations time to complete
      await vi.waitFor(() => {
        expect(mocks.logger.info).toHaveBeenCalledWith(
          'LifecycleManager',
          'Default settings initialized',
        );
      });
    });
  });
});
