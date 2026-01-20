// ABOUTME: Extension badge functions for WASM initialization status.
// ABOUTME: Uses Manifest V3 badge API (browser.action).

import { getLogger } from '@/shared/infrastructure/logging/instance';
import { localExtStorage } from '@/shared/infrastructure/storage/typedStorage';

/**
 * Log badge errors to storage for user visibility
 *
 * Badge failures are non-critical but should be tracked.
 * If storage also fails, we silently ignore (truly non-critical).
 */
async function logBadgeError(context: string, error: unknown): Promise<void> {
  getLogger().error('BadgeManager', `Failed to update badge (${context})`, error);

  try {
    await localExtStorage.setItem('wasmBadgeError', {
      hasError: true,
      errorMessage: 'Badge update failed (non-critical)',
      timestamp: Date.now(),
    });
  } catch {
    // Storage failure is truly non-critical - silently ignore
  }
}

/**
 * Clear badge text (success state)
 *
 * Called after successful WASM initialization.
 * Failures are logged but not thrown (non-critical operation).
 */
export async function showBadgeSuccess(): Promise<void> {
  try {
    await browser.action.setBadgeText({ text: '' });
  } catch (error) {
    await logBadgeError('success_clear', error);
  }
}

/**
 * Show error indicator on badge
 *
 * Displays "!" with red background to indicate WASM initialization failure.
 * Failures are logged but not thrown (non-critical operation).
 */
export async function showBadgeError(): Promise<void> {
  try {
    await browser.action.setBadgeText({ text: '!' });
    await browser.action.setBadgeBackgroundColor({ color: '#DC2626' }); // red-600
  } catch (error) {
    await logBadgeError('error_display', error);
  }
}
