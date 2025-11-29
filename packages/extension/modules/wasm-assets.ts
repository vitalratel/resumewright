import { defineWxtModule } from 'wxt/modules';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * WXT Module: WASM Asset Handler
 *
 * Copies the WASM file from the Rust build output to the extension's
 * public assets during build. This makes the WASM file accessible via
 * browser.runtime.getURL() in the service worker context.
 *
 * Why needed:
 * - Service workers can't use `import wasmUrl from '*.wasm?url'` pattern
 * - Vite's ?url imports don't work reliably in service worker context
 * - WASM file needs to be in public assets for browser.runtime.getURL()
 */

// Get the directory path of this module (ES modules don't have __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineWxtModule((wxt) => {
  wxt.hook('build:publicAssets', (_, assets) => {
    // Copy WASM file from Rust build output to extension public assets
    assets.push({
      // Source: Built WASM file from rust-core package
      absoluteSrc: resolve(__dirname, '../../../packages/rust-core/wasm-bridge/pkg/wasm_bridge_bg.wasm'),
      // Destination: Root of extension build output
      relativeDest: 'wasm_bridge_bg.wasm',
    });

    wxt.logger.info('Added WASM file to public assets: wasm_bridge_bg.wasm');
  });
});
