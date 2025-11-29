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
    setupFiles: ['./vitest.setup.ts', './src/__tests__/setup.ts'], // Global mock + comprehensive browser API mocks
    exclude: ['**/node_modules/**', '**/dist/**', '**/tests/**', '**/archive/**', '**/__tests__/integration/**'],
    // Suppress React act() warnings for Zustand store updates
    environmentOptions: {
      jsdom: {
        resources: 'usable',
      },
    },

    // Memory management and test isolation
    // Enabled parallel execution to leverage multi-core CPUs.

    isolate: true, // Isolate test files from each other
    pool: 'forks', // Use process isolation instead of threads
    maxWorkers: 4, // Parallel workers to use CPU cores (Vitest 4.x: replaces poolOptions.forks.maxForks)
    maxConcurrency: 5, // Allow concurrent tests within a file
    fileParallelism: true, // Run test files in parallel
    retry: 0, // Disable retries on test failure to prevent OOM

    // Timeouts
    testTimeout: 300000, // 5 minutes per test (sufficient for integration tests)
    teardownTimeout: 5000, // 5s for cleanup

    coverage: {
      provider: 'v8',
      reporter: ['json', 'json-summary'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/*.config.{ts,js}', // All config files
        '**/__tests__/utils/**', // Test utilities
        '**/__tests__/fixtures/**', // Test fixtures
        '**/__tests__/__mocks__/**', // Test mocks
        'tests/**', // E2E/Playwright tests and fixtures (includes large test data files)
        '**/index.{ts,tsx}', // Entry point files
        '**/*.d.ts', // Type declarations
        '.wxt/**', // WXT build artifacts and generated types
        '.output/**', // WXT bundled output (compiled JS)
        'entrypoints/**', // Entry points (thin wrappers)
        'modules/**', // WXT modules
        'scripts/**', // Build scripts
        'coverage/**', // Coverage output
      ],
    },
  },
  resolve: {
    alias: {
      '@/background': path.resolve(__dirname, './src/background'),
      '@/popup': path.resolve(__dirname, './src/popup'),
      '@/shared': path.resolve(__dirname, './src/shared'),
      // Point to actual WASM package for tests
      '@pkg/wasm_bridge': path.resolve(__dirname, '../rust-core/wasm-bridge/pkg/wasm_bridge.js'),
      '@pkg': path.resolve(__dirname, '../rust-core/wasm-bridge/pkg'),
      '@rust': path.resolve(__dirname, '../rust-core'),
    },
  },
});
