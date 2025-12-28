// ABOUTME: Service worker lifecycle event handling for install, update, and startup.
// ABOUTME: Manages first-time initialization and extension update handling.

import { getLogger } from '@/shared/infrastructure/logging/instance';
import { settingsStore } from '@/shared/infrastructure/settings/SettingsStore';

export class LifecycleManager {
  constructor() {
    this.setupLifecycleListeners();
  }

  /**
   * Setup service worker lifecycle event listeners
   */
  private setupLifecycleListeners(): void {
    // Install event - first time extension is installed
    browser.runtime.onInstalled.addListener((details) => {
      getLogger().info('LifecycleManager', ` onInstalled: ${details.reason}`);

      if (details.reason === 'install') {
        getLogger().info('LifecycleManager', 'Extension installed. Initializing...');
        void this.initialize();
      } else if (details.reason === 'update') {
        const previousVersion = details.previousVersion;
        getLogger().info('LifecycleManager', ` Updated from version ${previousVersion}`);
        void this.handleUpdate(previousVersion);
      }
    });

    // Startup event - browser starts / extension reloads
    browser.runtime.onStartup.addListener(() => {
      getLogger().info('LifecycleManager', 'onStartup: Browser started');
    });
  }

  /**
   * Initialize extension on first install
   */
  async initialize(): Promise<void> {
    getLogger().info('LifecycleManager', 'Performing first-time initialization');

    // Initialize default settings
    try {
      await settingsStore.loadSettings();
      getLogger().info('LifecycleManager', 'Default settings initialized');
    } catch (error) {
      getLogger().error('LifecycleManager', '[Lifecycle] Failed to initialize settings', error);
    }
  }

  /**
   * Handle extension update
   */
  private async handleUpdate(previousVersion?: string): Promise<void> {
    getLogger().info('LifecycleManager', ` Handling update from ${previousVersion}`);
    // Future: Run data migrations here
  }
}
