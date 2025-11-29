/**
 * Vitest Setup File
 * Configures global mocks for all tests
 */
import { fakeBrowser } from '@webext-core/fake-browser';
import { vi } from 'vitest';

// Mock webextension-polyfill with fakeBrowser
// Must use factory function for proper module replacement
vi.mock('webextension-polyfill', () => ({
  default: fakeBrowser,
}));

// Note: fakeBrowser.reset() is called in src/__tests__/setup.ts afterEach hook
// to ensure it runs after React cleanup and store resets
