// ABOUTME: Service worker lifecycle event handling for install, update, and startup.
// ABOUTME: Manages first-time initialization and extension update handling.

import { getLogger } from '@/shared/infrastructure/logging/instance';
import { loadSettings } from '@/shared/infrastructure/settings/SettingsStore';

/**
 * Initialize extension on first install
 */
async function initializeExtension(): Promise<void> {
  getLogger().info('LifecycleManager', 'Performing first-time initialization');

  // Initialize default settings
  try {
    await loadSettings();
    getLogger().info('LifecycleManager', 'Default settings initialized');
  } catch (error) {
    getLogger().error('LifecycleManager', '[Lifecycle] Failed to initialize settings', error);
  }
}

/**
 * Handle extension update
 */
async function handleUpdate(previousVersion?: string): Promise<void> {
  getLogger().info('LifecycleManager', ` Handling update from ${previousVersion}`);
  // Future: Run data migrations here
}

/**
 * Setup service worker lifecycle event listeners
 *
 * Registers handlers for:
 * - onInstalled: First-time install and updates
 * - onStartup: Browser startup / extension reload
 */
export function setupLifecycleListeners(): void {
  // Install event - first time extension is installed
  browser.runtime.onInstalled.addListener((details) => {
    getLogger().info('LifecycleManager', ` onInstalled: ${details.reason}`);

    if (details.reason === 'install') {
      getLogger().info('LifecycleManager', 'Extension installed. Initializing...');
      void initializeExtension();
    } else if (details.reason === 'update') {
      const previousVersion = details.previousVersion;
      getLogger().info('LifecycleManager', ` Updated from version ${previousVersion}`);
      void handleUpdate(previousVersion);
    }
  });

  // Startup event - browser starts / extension reloads
  browser.runtime.onStartup.addListener(() => {
    getLogger().info('LifecycleManager', 'onStartup: Browser started');
  });
}
