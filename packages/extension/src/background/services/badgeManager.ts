/**
 * Badge Manager Service
 *
 * Manages extension badge state for WASM initialization status.
 * Uses Manifest V3 badge API (browser.action).
 */

import { getLogger } from '@/shared/infrastructure/logging';
import { localExtStorage } from '@/shared/infrastructure/storage';

/**
 * Badge Manager for Extension Toolbar Icon
 *
 * Provides a simplified API for updating the extension badge
 * with automatic error handling.
 *
 * Badge updates are non-critical operations - failures are logged
 * but do not throw errors to avoid disrupting the main flow.
 *
 * Note: Uses browser.action (MV3). Firefox 109+ and Chrome 88+ supported.
 */
export class BadgeManager {
  /**
   * Clear badge text (success state)
   *
   * Called after successful WASM initialization.
   * Failures are logged but not thrown (non-critical operation).
   */
  async showSuccess(): Promise<void> {
    try {
      await browser.action.setBadgeText({ text: '' });
    }
    catch (error) {
      await this.logBadgeError('success_clear', error);
    }
  }

  /**
   * Show error indicator on badge
   *
   * Displays "!" with red background to indicate WASM initialization failure.
   * Failures are logged but not thrown (non-critical operation).
   */
  async showError(): Promise<void> {
    try {
      await browser.action.setBadgeText({ text: '!' });
      await browser.action.setBadgeBackgroundColor({ color: '#DC2626' }); // red-600
    }
    catch (error) {
      await this.logBadgeError('error_display', error);
    }
  }

  /**
   * Log badge errors to storage for user visibility
   *
   * Badge failures are non-critical but should be tracked.
   * If storage also fails, we silently ignore (truly non-critical).
   */
  private async logBadgeError(context: string, error: unknown): Promise<void> {
    getLogger().error('BadgeManager', `Failed to update badge (${context})`, error);

    try {
      await localExtStorage.setItem('wasmBadgeError', {
        hasError: true,
        errorMessage: 'Badge update failed (non-critical)',
        timestamp: Date.now(),
      });
    }
    catch {
      // Storage failure is truly non-critical - silently ignore
    }
  }
}
