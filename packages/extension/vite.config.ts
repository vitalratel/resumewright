import type { Plugin } from 'vite';
import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import wasm from 'vite-plugin-wasm';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],

    // Force cleanup between tests
    clearMocks: true,
    mockReset: true,
    restoreMocks: true,

    // Timeout adjustments
    testTimeout: 10000, // 10s per test
    hookTimeout: 5000, // 5s for beforeEach/afterEach
  },
  plugins: [
    // Stub out Node.js-specific loader for browser build
    {
      name: 'stub-node-loader',
      load(id) {
        // Replace loader.node.ts with a stub that throws if ever called
        // This file should never execute in browser - only dynamically imported in Node.js
        if (id.includes('loader.node')) {
          return `
            export function getDefaultNodeWasmPath() {
              throw new Error('Node.js loader should never be called in browser context');
            }
            export function initWASMNode() {
              throw new Error('Node.js loader should never be called in browser context');
            }
          `;
        }
      },
    } as Plugin,
    react({
      jsxRuntime: 'automatic',
      // Use SWC for faster transpilation (4x speedup vs esbuild)
      babel: undefined,
    }),
    wasm() as Plugin,
  ],
  esbuild: {
    // Use SWC for TypeScript transpilation instead of esbuild
    // Note: @vitejs/plugin-react already uses SWC by default
    // This is just to ensure consistency
    tsconfigRaw: {
      compilerOptions: {
        useDefineForClassFields: true,
      },
    },
  },
  resolve: {
    alias: {
      '@/background': path.resolve(__dirname, './src/background'),
      '@/popup': path.resolve(__dirname, './src/popup'),
      '@/shared': path.resolve(__dirname, './src/shared'),
      '@pkg': path.resolve(__dirname, '../../pkg'),
    },
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    // Clean output directory before each build to prevent accumulation
    emptyOutDir: true,
    // Disable source maps in production for security and size
    // Chrome Web Store automatically strips them anyway
    sourcemap: process.env.NODE_ENV !== 'production',
    rollupOptions: {
      output: {
        // Avoid eval/Function to comply with Firefox CSP
        inlineDynamicImports: false,
        manualChunks: undefined,
      },
    },
    // Use esbuild minification (doesn't require unsafe-eval)
    minify: 'esbuild',
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173,
    },
  },
});
