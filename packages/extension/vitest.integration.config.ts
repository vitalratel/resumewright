/**
 * ABOUTME: Vitest configuration for integration tests.
 * ABOUTME: Runs slower tests that require WASM, real services, and more memory.
 */

import type { Plugin } from 'vite';
import path from 'node:path';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react(), wasm()] as Plugin[],
  test: {
    globals: true,
    environment: 'jsdom',
    server: {
      deps: {
        inline: ['webextension-polyfill', '@webext-core/fake-browser'],
      },
    },
    setupFiles: ['./vitest.setup.ts', './src/__tests__/setup.ts'],
    // Only include integration tests
    include: ['src/__tests__/integration/**/*.test.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    environmentOptions: {
      jsdom: {
        resources: 'usable',
      },
    },

    // Integration tests run sequentially to avoid resource contention
    isolate: true,
    pool: 'forks',
    maxWorkers: 1, // Sequential execution for integration tests
    maxConcurrency: 1,
    fileParallelism: false,
    retry: 0,

    // Longer timeouts for integration tests
    testTimeout: 600000, // 10 minutes per test
    teardownTimeout: 10000,
  },
  resolve: {
    alias: {
      '@/background': path.resolve(__dirname, './src/background'),
      '@/popup': path.resolve(__dirname, './src/popup'),
      '@/shared': path.resolve(__dirname, './src/shared'),
      '@pkg/wasm_bridge': path.resolve(__dirname, '../rust-core/wasm-bridge/pkg/wasm_bridge.js'),
      '@pkg': path.resolve(__dirname, '../rust-core/wasm-bridge/pkg'),
      '@rust': path.resolve(__dirname, '../rust-core'),
    },
  },
});
