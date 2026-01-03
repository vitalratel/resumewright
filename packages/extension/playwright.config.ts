import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for ResumeWright extension testing.
 *
 * Supports:
 * - Manifest V3 browser extension testing
 * - E2E testing across extension components
 *
 * IMPORTANT: Uses tsconfig.playwright.json to avoid loading wxt type definitions
 * which would import webextension-polyfill in Node.js context and cause errors.
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Use separate tsconfig to exclude wxt type definitions
  tsconfig: './tsconfig.playwright.json',
  // Test directory
  testDir: './tests',
  
  // Run tests in files in parallel
  fullyParallel: true,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Parallel test execution restored with pdfium-render (80x faster PDF rendering)
  workers: process.env.CI ? 4 : undefined, // Use default (CPU cores)
  
  // Reporter to use
  reporter: [
    // HTML report: never open interactively (avoids "Press Ctrl+C" blocking)
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
    ...(process.env.CI ? [['github']] : []),
  ],
  
  // Shared settings for all projects
  use: {
    // Base URL for navigation (not used for extension testing)
    // baseURL: 'http://localhost:3000',
    
    // Collect trace when retrying failed tests
    trace: 'on-first-retry',
    
    // Record video only on test failure
    video: 'retain-on-failure',
    
    // Take screenshot on test failure
    screenshot: 'only-on-failure',
    
    // Timeout for each test assertion
    actionTimeout: 10000,
  },

  // Projects for different testing scenarios
  // Note: Firefox not supported - Playwright cannot load Firefox extensions
  projects: [
    {
      name: 'extension-chrome',
      use: {
        ...devices['Desktop Chrome'],
        // Extension-specific configuration
        // Context will be set up in fixtures (persistent context required)
      },
    },
  ],
  
  // Folder for test artifacts (screenshots, videos, traces)
  outputDir: 'test-results/',
  
  // Test timeout
  timeout: 30000, // 30 seconds per test (fast with pdfium-render)

  // Global setup and teardown
  globalSetup: './tests/global-setup.ts',
  // globalTeardown: require.resolve('./tests/global-teardown'),
});
