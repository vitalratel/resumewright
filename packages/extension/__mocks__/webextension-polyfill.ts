/**
 * Global mock for wxt/browser
 * Uses @webext-core/fake-browser for in-memory browser API implementation
 */
import { fakeBrowser } from '@webext-core/fake-browser';

export { fakeBrowser as browser };
export default fakeBrowser;
