/**
 * Background Script (Service Worker)
 *
 * Handles WASM initialization, message routing, and extension lifecycle.
 */

import { LifecycleManager } from '../src/background/lifecycleManager';
import { setupMessageHandler } from '../src/background/messageHandler';
// Track service worker start time
import {
  getServiceWorkerStartTime,
  resetServiceWorkerStartTime,
} from '../src/background/serviceWorkerState';
import { initializeWASM } from '../src/background/wasmInit';

import { getLogger } from '../src/shared/infrastructure/logging/instance';

const logger = getLogger();

resetServiceWorkerStartTime();

export { getServiceWorkerStartTime };

export default defineBackground({
  type: 'module',
  main: () => {
    const isDev = import.meta.env.DEV;

    if (isDev) {
      logger.info('Background', 'Starting initialization...');
    }

    // Create LifecycleManager instance (DI pattern)
    const lifecycleManager = new LifecycleManager();

    // Setup message handler synchronously (before WASM)
    // Service workers can be terminated at any time, message handlers must be
    // registered immediately to ensure messages are received
    setupMessageHandler(lifecycleManager);

    // Test storage API in development
    if (isDev) {
      logger.debug('Background', 'Testing storage API...');
      browser.storage.local
        .set({ backgroundScriptLoaded: true, loadTime: Date.now() })
        .then(async () => browser.storage.local.get(['backgroundScriptLoaded', 'loadTime']))
        .then((readBack) => {
          if (readBack.backgroundScriptLoaded === true) {
            logger.debug('Background', '✅ Storage API working');
          } else {
            logger.error('Background', '❌ Storage read/write mismatch');
          }
        })
        .catch((err) => {
          logger.error('Background', '❌ Storage API test failed', err);
        });
    }

    // Initialize WASM (async, non-blocking)
    void (async () => {
      try {
        await initializeWASM();
        logger.info('Background', 'Extension initialized');
      } catch (error) {
        logger.error('Background', 'Failed to initialize WASM', error);

        if (isDev && error instanceof Error) {
          logger.error('Background', 'Error details:', error.message);
          logger.error('Background', 'Stack trace:', error.stack);
        }
      }
    })();
  },
});
