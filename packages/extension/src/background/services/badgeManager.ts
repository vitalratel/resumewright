// ABOUTME: Extension badge functions for WASM initialization status.
// ABOUTME: Uses Manifest V3 badge API (browser.action).

import { getLogger } from '@/shared/infrastructure/logging/instance';

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
    getLogger().error('BadgeManager', 'Failed to update badge (success_clear)', error);
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
    getLogger().error('BadgeManager', 'Failed to update badge (error_display)', error);
  }
}
