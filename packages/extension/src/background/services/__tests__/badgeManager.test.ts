/**
 * Badge Manager Tests
 *
 * Comprehensive tests for badge management functions.
 * Coverage: Success badge, error badge, error logging, non-critical failure handling
 */

import { fakeBrowser } from '@webext-core/fake-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetLogger, setLogger } from '@/shared/infrastructure/logging/instance';
import { Logger, LogLevel } from '@/shared/infrastructure/logging/logger';
import { showBadgeError, showBadgeSuccess } from '../badgeManager';

// Mock dependencies
// webextension-polyfill is mocked globally with fakeBrowser

describe('Badge Manager Functions', () => {
  beforeEach(() => {
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

  describe('showBadgeSuccess', () => {
    it('should clear badge text on success', async () => {
      await showBadgeSuccess();

      expect(fakeBrowser.action.setBadgeText).toHaveBeenCalledWith({ text: '' });
    });

    it('should complete without throwing', async () => {
      await expect(showBadgeSuccess()).resolves.toBeUndefined();
    });

    it('should only call setBadgeText (no background color change)', async () => {
      await showBadgeSuccess();

      expect(fakeBrowser.action.setBadgeText).toHaveBeenCalledOnce();
      expect(fakeBrowser.action.setBadgeBackgroundColor).not.toHaveBeenCalled();
    });

    it('should handle badge API error gracefully', async () => {
      vi.mocked(fakeBrowser.action.setBadgeText).mockRejectedValueOnce(
        new Error('Badge API unavailable'),
      );

      // Should not throw despite badge error
      await expect(showBadgeSuccess()).resolves.toBeUndefined();
    });

    it('should log badge error to storage when badge update fails', async () => {
      vi.mocked(fakeBrowser.action.setBadgeText).mockRejectedValueOnce(new Error('Badge error'));

      await showBadgeSuccess();

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
      await expect(showBadgeSuccess()).resolves.toBeUndefined();
    });

    it('should set timestamp when logging error', async () => {
      vi.mocked(fakeBrowser.action.setBadgeText).mockRejectedValueOnce(new Error('Badge error'));

      const beforeTime = Date.now();
      await showBadgeSuccess();
      const afterTime = Date.now();

      const call = vi.mocked(fakeBrowser.storage.local.set).mock.calls[0][0] as {
        wasmBadgeError: { timestamp: number };
      };
      expect(call.wasmBadgeError.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(call.wasmBadgeError.timestamp).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('showBadgeError', () => {
    it('should set error badge text', async () => {
      await showBadgeError();

      expect(fakeBrowser.action.setBadgeText).toHaveBeenCalledWith({ text: '!' });
    });

    it('should set error badge background color', async () => {
      await showBadgeError();

      expect(fakeBrowser.action.setBadgeBackgroundColor).toHaveBeenCalledWith({
        color: '#DC2626',
      });
    });

    it('should call both setBadgeText and setBadgeBackgroundColor', async () => {
      await showBadgeError();

      expect(fakeBrowser.action.setBadgeText).toHaveBeenCalledOnce();
      expect(fakeBrowser.action.setBadgeBackgroundColor).toHaveBeenCalledOnce();
    });

    it('should complete without throwing', async () => {
      await expect(showBadgeError()).resolves.toBeUndefined();
    });

    it('should handle badge API error gracefully', async () => {
      vi.mocked(fakeBrowser.action.setBadgeText).mockRejectedValueOnce(
        new Error('Badge API unavailable'),
      );

      // Should not throw despite badge error
      await expect(showBadgeError()).resolves.toBeUndefined();
    });

    it('should log badge error to storage when badge update fails', async () => {
      vi.mocked(fakeBrowser.action.setBadgeText).mockRejectedValueOnce(new Error('Badge error'));

      await showBadgeError();

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
      await expect(showBadgeError()).resolves.toBeUndefined();
    });

    it('should handle background color API error', async () => {
      vi.mocked(fakeBrowser.action.setBadgeText).mockRejectedValueOnce(
        new Error('Background color error'),
      );

      await expect(showBadgeError()).resolves.toBeUndefined();
    });
  });

  describe('error logging', () => {
    it('should log with correct message format', async () => {
      vi.mocked(fakeBrowser.action.setBadgeText).mockRejectedValueOnce(new Error('Badge error'));

      await showBadgeSuccess();

      const call = vi.mocked(fakeBrowser.storage.local.set).mock.calls[0][0] as {
        wasmBadgeError: { errorMessage: string };
      };
      expect(call.wasmBadgeError.errorMessage).toBe('Badge update failed (non-critical)');
    });

    it('should include timestamp in error log', async () => {
      vi.mocked(fakeBrowser.action.setBadgeText).mockRejectedValueOnce(new Error('Badge error'));

      await showBadgeSuccess();

      const call = vi.mocked(fakeBrowser.storage.local.set).mock.calls[0][0] as {
        wasmBadgeError: { timestamp: number };
      };
      expect(call.wasmBadgeError.timestamp).toBeTypeOf('number');
    });

    it('should include hasError flag in error log', async () => {
      vi.mocked(fakeBrowser.action.setBadgeText).mockRejectedValueOnce(new Error('Badge error'));

      await showBadgeError();

      const call = vi.mocked(fakeBrowser.storage.local.set).mock.calls[0][0] as {
        wasmBadgeError: { hasError: boolean };
      };
      expect(call.wasmBadgeError.hasError).toBe(true);
    });

    it('should not call storage.set if badge update succeeds', async () => {
      await showBadgeSuccess();

      expect(fakeBrowser.storage.local.set).not.toHaveBeenCalled();
    });

    it('should silently ignore storage failures', async () => {
      vi.mocked(fakeBrowser.action.setBadgeText).mockRejectedValueOnce(new Error('Badge error'));
      vi.mocked(fakeBrowser.storage.local.set).mockRejectedValueOnce(new Error('Storage error'));

      // Should complete without throwing
      await expect(showBadgeSuccess()).resolves.toBeUndefined();

      // Storage.set was attempted but failed
      expect(fakeBrowser.storage.local.set).toHaveBeenCalledOnce();
    });
  });

  describe('non-critical behavior', () => {
    it('should never throw errors from showBadgeSuccess', async () => {
      vi.mocked(fakeBrowser.action.setBadgeText).mockRejectedValue(new Error('Badge error'));
      vi.mocked(fakeBrowser.storage.local.set).mockRejectedValue(new Error('Storage error'));

      await expect(showBadgeSuccess()).resolves.toBeUndefined();
      await expect(showBadgeSuccess()).resolves.toBeUndefined();
      await expect(showBadgeSuccess()).resolves.toBeUndefined();
    });

    it('should never throw errors from showBadgeError', async () => {
      vi.mocked(fakeBrowser.action.setBadgeText).mockRejectedValue(new Error('Badge error'));
      vi.mocked(fakeBrowser.action.setBadgeText).mockRejectedValue(new Error('Color error'));
      vi.mocked(fakeBrowser.storage.local.set).mockRejectedValue(new Error('Storage error'));

      await expect(showBadgeError()).resolves.toBeUndefined();
      await expect(showBadgeError()).resolves.toBeUndefined();
      await expect(showBadgeError()).resolves.toBeUndefined();
    });

    it('should handle complete badge API failure', async () => {
      vi.mocked(fakeBrowser.action.setBadgeText).mockRejectedValue(new Error('Badge API broken'));
      vi.mocked(fakeBrowser.action.setBadgeText).mockRejectedValue(new Error('Badge API broken'));

      await expect(showBadgeSuccess()).resolves.toBeUndefined();
      await expect(showBadgeError()).resolves.toBeUndefined();
    });

    it('should handle complete storage failure', async () => {
      vi.mocked(fakeBrowser.action.setBadgeText).mockRejectedValue(new Error('Badge error'));
      vi.mocked(fakeBrowser.storage.local.set).mockRejectedValue(new Error('Storage broken'));

      await expect(showBadgeSuccess()).resolves.toBeUndefined();
      await expect(showBadgeError()).resolves.toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('should handle concurrent showBadgeSuccess calls', async () => {
      await Promise.all([showBadgeSuccess(), showBadgeSuccess(), showBadgeSuccess()]);

      expect(fakeBrowser.action.setBadgeText).toHaveBeenCalledTimes(3);
    });

    it('should handle concurrent showBadgeError calls', async () => {
      await Promise.all([showBadgeError(), showBadgeError(), showBadgeError()]);

      expect(fakeBrowser.action.setBadgeText).toHaveBeenCalledTimes(3);
      expect(fakeBrowser.action.setBadgeBackgroundColor).toHaveBeenCalledTimes(3);
    });

    it('should handle alternating success and error calls', async () => {
      await showBadgeSuccess();
      await showBadgeError();
      await showBadgeSuccess();

      expect(fakeBrowser.action.setBadgeText).toHaveBeenCalledTimes(3);
      expect(fakeBrowser.action.setBadgeText).toHaveBeenNthCalledWith(1, { text: '' });
      expect(fakeBrowser.action.setBadgeText).toHaveBeenNthCalledWith(2, { text: '!' });
      expect(fakeBrowser.action.setBadgeText).toHaveBeenNthCalledWith(3, { text: '' });
    });
  });
});
