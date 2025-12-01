/**
 * Vitest Configuration
 *
 * Uses WxtVitest plugin for seamless WXT integration including:
 * - Browser API polyfill via @webext-core/fake-browser
 * - WXT aliases and auto-imports
 * - Internal Vite plugins
 */

import type { Plugin } from 'vite';
import path from 'node:path';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';
import { defineConfig } from 'vitest/config';
import { WxtVitest } from 'wxt/testing/vitest-plugin';

export default defineConfig({
  plugins: [
    WxtVitest(),
    react(),
    wasm(),
  ] as Plugin[],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/__tests__/setup.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/tests/**', '**/archive/**', '**/__tests__/integration/**'],

    // Memory management and test isolation
    isolate: true,
    pool: 'forks',
    maxWorkers: 4,
    maxConcurrency: 5,
    fileParallelism: true,
    retry: 0,

    // Timeouts
    testTimeout: 300000,
    teardownTimeout: 5000,

    coverage: {
      provider: 'v8',
      reporter: ['json', 'json-summary'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/*.config.{ts,js}',
        '**/__tests__/utils/**',
        '**/__tests__/fixtures/**',
        '**/__tests__/__mocks__/**',
        'tests/**',
        '**/index.{ts,tsx}',
        '**/*.d.ts',
        '.wxt/**',
        '.output/**',
        'entrypoints/**',
        'modules/**',
        'scripts/**',
        'coverage/**',
      ],
    },
  },
  resolve: {
    alias: {
      // Path aliases must be defined here for Vitest
      // WxtVitest only inherits some settings, not all resolve.alias
      '@/background': path.resolve(__dirname, './src/background'),
      '@/popup': path.resolve(__dirname, './src/popup'),
      '@/shared': path.resolve(__dirname, './src/shared'),
      '@pkg/wasm_bridge': path.resolve(__dirname, '../rust-core/wasm-bridge/pkg/wasm_bridge.js'),
      '@pkg': path.resolve(__dirname, '../rust-core/wasm-bridge/pkg'),
      '@rust': path.resolve(__dirname, '../rust-core'),
    },
  },
});
