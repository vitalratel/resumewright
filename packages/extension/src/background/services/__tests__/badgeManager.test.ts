/**
 * Badge Manager Tests
 *
 * Comprehensive tests for BadgeManager service.
 * Coverage: Success badge, error badge, error logging, non-critical failure handling
 */

import { fakeBrowser } from '@webext-core/fake-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Logger, LogLevel, resetLogger, setLogger } from '@/shared/infrastructure/logging';
import { BadgeManager } from '../badgeManager';

// Mock dependencies
// webextension-polyfill is mocked globally with fakeBrowser

describe('BadgeManager', () => {
  let badgeManager: BadgeManager;

  beforeEach(() => {
    badgeManager = new BadgeManager();
    vi.clearAllMocks();

    // Create spies for fakeBrowser action and storage methods
    vi.spyOn(fakeBrowser.action, 'setBadgeText').mockResolvedValue(undefined);
    vi.spyOn(fakeBrowser.action, 'setBadgeBackgroundColor').mockResolvedValue(undefined);
    vi.spyOn(fakeBrowser.storage.local, 'set').mockResolvedValue(undefined);

    // Suppress logger output during tests
    const silentLogger = new Logger({ level: LogLevel.NONE });
    setLogger(silentLogger);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetLogger();
  });

  describe('showSuccess', () => {
    it('should clear badge text on success', async () => {
      await badgeManager.showSuccess();

      expect(fakeBrowser.action.setBadgeText).toHaveBeenCalledWith({ text: '' });
    });

    it('should complete without throwing', async () => {
      await expect(badgeManager.showSuccess()).resolves.toBeUndefined();
    });

    it('should only call setBadgeText (no background color change)', async () => {
      await badgeManager.showSuccess();

      expect(fakeBrowser.action.setBadgeText).toHaveBeenCalledOnce();
      expect(fakeBrowser.action.setBadgeBackgroundColor).not.toHaveBeenCalled();
    });

    it('should handle badge API error gracefully', async () => {
      vi.mocked(fakeBrowser.action.setBadgeText).mockRejectedValueOnce(
        new Error('Badge API unavailable'),
      );

      // Should not throw despite badge error
      await expect(badgeManager.showSuccess()).resolves.toBeUndefined();
    });

    it('should log badge error to storage when badge update fails', async () => {
      vi.mocked(fakeBrowser.action.setBadgeText).mockRejectedValueOnce(new Error('Badge error'));

      await badgeManager.showSuccess();

      expect(fakeBrowser.storage.local.set).toHaveBeenCalledWith(
        expect.objectContaining({
          wasmBadgeError: expect.objectContaining({
            hasError: true,
            errorMessage: 'Badge update failed (non-critical)',
            timestamp: expect.any(Number),
          }),
        }),
      );
    });

    it('should handle storage error when logging badge error', async () => {
      vi.mocked(fakeBrowser.action.setBadgeText).mockRejectedValueOnce(new Error('Badge error'));
      vi.mocked(fakeBrowser.storage.local.set).mockRejectedValueOnce(new Error('Storage error'));

      // Should not throw even if both badge and storage fail
      await expect(badgeManager.showSuccess()).resolves.toBeUndefined();
    });

    it('should set timestamp when logging error', async () => {
      vi.mocked(fakeBrowser.action.setBadgeText).mockRejectedValueOnce(new Error('Badge error'));

      const beforeTime = Date.now();
      await badgeManager.showSuccess();
      const afterTime = Date.now();

      const call = vi.mocked(fakeBrowser.storage.local.set).mock.calls[0][0] as {
        wasmBadgeError: { timestamp: number };
      };
      expect(call.wasmBadgeError.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(call.wasmBadgeError.timestamp).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('showError', () => {
    it('should set error badge text', async () => {
      await badgeManager.showError();

      expect(fakeBrowser.action.setBadgeText).toHaveBeenCalledWith({ text: '!' });
    });

    it('should set error badge background color', async () => {
      await badgeManager.showError();

      expect(fakeBrowser.action.setBadgeBackgroundColor).toHaveBeenCalledWith({
        color: '#DC2626',
      });
    });

    it('should call both setBadgeText and setBadgeBackgroundColor', async () => {
      await badgeManager.showError();

      expect(fakeBrowser.action.setBadgeText).toHaveBeenCalledOnce();
      expect(fakeBrowser.action.setBadgeBackgroundColor).toHaveBeenCalledOnce();
    });

    it('should complete without throwing', async () => {
      await expect(badgeManager.showError()).resolves.toBeUndefined();
    });

    it('should handle badge API error gracefully', async () => {
      vi.mocked(fakeBrowser.action.setBadgeText).mockRejectedValueOnce(
        new Error('Badge API unavailable'),
      );

      // Should not throw despite badge error
      await expect(badgeManager.showError()).resolves.toBeUndefined();
    });

    it('should log badge error to storage when badge update fails', async () => {
      vi.mocked(fakeBrowser.action.setBadgeText).mockRejectedValueOnce(new Error('Badge error'));

      await badgeManager.showError();

      expect(fakeBrowser.storage.local.set).toHaveBeenCalledWith(
        expect.objectContaining({
          wasmBadgeError: expect.objectContaining({
            hasError: true,
            errorMessage: 'Badge update failed (non-critical)',
            timestamp: expect.any(Number),
          }),
        }),
      );
    });

    it('should handle storage error when logging badge error', async () => {
      vi.mocked(fakeBrowser.action.setBadgeText).mockRejectedValueOnce(new Error('Badge error'));
      vi.mocked(fakeBrowser.storage.local.set).mockRejectedValueOnce(new Error('Storage error'));

      // Should not throw even if both badge and storage fail
      await expect(badgeManager.showError()).resolves.toBeUndefined();
    });

    it('should handle background color API error', async () => {
      vi.mocked(fakeBrowser.action.setBadgeText).mockRejectedValueOnce(
        new Error('Background color error'),
      );

      await expect(badgeManager.showError()).resolves.toBeUndefined();
    });

  });

  describe('error logging', () => {
    it('should log with correct message format', async () => {
      vi.mocked(fakeBrowser.action.setBadgeText).mockRejectedValueOnce(new Error('Badge error'));

      await badgeManager.showSuccess();

      const call = vi.mocked(fakeBrowser.storage.local.set).mock.calls[0][0] as {
        wasmBadgeError: { errorMessage: string };
      };
      expect(call.wasmBadgeError.errorMessage).toBe('Badge update failed (non-critical)');
    });

    it('should include timestamp in error log', async () => {
      vi.mocked(fakeBrowser.action.setBadgeText).mockRejectedValueOnce(new Error('Badge error'));

      await badgeManager.showSuccess();

      const call = vi.mocked(fakeBrowser.storage.local.set).mock.calls[0][0] as {
        wasmBadgeError: { timestamp: number };
      };
      expect(call.wasmBadgeError.timestamp).toBeTypeOf('number');
    });

    it('should include hasError flag in error log', async () => {
      vi.mocked(fakeBrowser.action.setBadgeText).mockRejectedValueOnce(new Error('Badge error'));

      await badgeManager.showError();

      const call = vi.mocked(fakeBrowser.storage.local.set).mock.calls[0][0] as {
        wasmBadgeError: { hasError: boolean };
      };
      expect(call.wasmBadgeError.hasError).toBe(true);
    });

    it('should not call storage.set if badge update succeeds', async () => {
      await badgeManager.showSuccess();

      expect(fakeBrowser.storage.local.set).not.toHaveBeenCalled();
    });

    it('should silently ignore storage failures', async () => {
      vi.mocked(fakeBrowser.action.setBadgeText).mockRejectedValueOnce(new Error('Badge error'));
      vi.mocked(fakeBrowser.storage.local.set).mockRejectedValueOnce(new Error('Storage error'));

      // Should complete without throwing
      await expect(badgeManager.showSuccess()).resolves.toBeUndefined();

      // Storage.set was attempted but failed
      expect(fakeBrowser.storage.local.set).toHaveBeenCalledOnce();
    });
  });

  describe('non-critical behavior', () => {
    it('should never throw errors from showSuccess', async () => {
      vi.mocked(fakeBrowser.action.setBadgeText).mockRejectedValue(new Error('Badge error'));
      vi.mocked(fakeBrowser.storage.local.set).mockRejectedValue(new Error('Storage error'));

      await expect(badgeManager.showSuccess()).resolves.toBeUndefined();
      await expect(badgeManager.showSuccess()).resolves.toBeUndefined();
      await expect(badgeManager.showSuccess()).resolves.toBeUndefined();
    });

    it('should never throw errors from showError', async () => {
      vi.mocked(fakeBrowser.action.setBadgeText).mockRejectedValue(new Error('Badge error'));
      vi.mocked(fakeBrowser.action.setBadgeText).mockRejectedValue(
        new Error('Color error'),
      );
      vi.mocked(fakeBrowser.storage.local.set).mockRejectedValue(new Error('Storage error'));

      await expect(badgeManager.showError()).resolves.toBeUndefined();
      await expect(badgeManager.showError()).resolves.toBeUndefined();
      await expect(badgeManager.showError()).resolves.toBeUndefined();
    });

    it('should handle complete badge API failure', async () => {
      vi.mocked(fakeBrowser.action.setBadgeText).mockRejectedValue(new Error('Badge API broken'));
      vi.mocked(fakeBrowser.action.setBadgeText).mockRejectedValue(
        new Error('Badge API broken'),
      );

      await expect(badgeManager.showSuccess()).resolves.toBeUndefined();
      await expect(badgeManager.showError()).resolves.toBeUndefined();
    });

    it('should handle complete storage failure', async () => {
      vi.mocked(fakeBrowser.action.setBadgeText).mockRejectedValue(new Error('Badge error'));
      vi.mocked(fakeBrowser.storage.local.set).mockRejectedValue(new Error('Storage broken'));

      await expect(badgeManager.showSuccess()).resolves.toBeUndefined();
      await expect(badgeManager.showError()).resolves.toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('should handle concurrent showSuccess calls', async () => {
      await Promise.all([
        badgeManager.showSuccess(),
        badgeManager.showSuccess(),
        badgeManager.showSuccess(),
      ]);

      expect(fakeBrowser.action.setBadgeText).toHaveBeenCalledTimes(3);
    });

    it('should handle concurrent showError calls', async () => {
      await Promise.all([
        badgeManager.showError(),
        badgeManager.showError(),
        badgeManager.showError(),
      ]);

      expect(fakeBrowser.action.setBadgeText).toHaveBeenCalledTimes(3);
      expect(fakeBrowser.action.setBadgeBackgroundColor).toHaveBeenCalledTimes(3);
    });

    it('should handle alternating success and error calls', async () => {
      await badgeManager.showSuccess();
      await badgeManager.showError();
      await badgeManager.showSuccess();

      expect(fakeBrowser.action.setBadgeText).toHaveBeenCalledTimes(3);
      expect(fakeBrowser.action.setBadgeText).toHaveBeenNthCalledWith(1, { text: '' });
      expect(fakeBrowser.action.setBadgeText).toHaveBeenNthCalledWith(2, { text: '!' });
      expect(fakeBrowser.action.setBadgeText).toHaveBeenNthCalledWith(3, { text: '' });
    });
  });
});
