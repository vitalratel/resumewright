import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for ResumeWright extension testing.
 *
 * Supports:
 * - Manifest V3 browser extension testing
 * - Visual regression testing with screenshot comparison
 * - Performance testing with CPU throttling
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
  projects: [
    {
      name: 'extension-chrome',
      use: {
        ...devices['Desktop Chrome'],
        // Extension-specific configuration
        // Context will be set up in fixtures (persistent context required)
      },
    },
    
    {
      name: 'extension-firefox',
      use: {
        ...devices['Desktop Firefox'],
        // Firefox extension support - requires firefox fixture
        // Context will be set up in Firefox-specific fixture
      },
    },
  ],
  
  // Visual regression testing settings
  expect: {
    // Screenshot comparison settings
    toHaveScreenshot: {
      // Maximum number of pixels that can differ (adjust based on needs)
      maxDiffPixels: 100,
      
      // Percentage threshold for pixel difference (0.05 = 5% tolerance for 95% fidelity)
      threshold: 0.05,
      
      // Animation handling
      animations: 'disabled',
      
      // Screenshot scale
      scale: 'css',
    },
  },
  
  // Folder for test artifacts (screenshots, videos, traces)
  outputDir: 'test-results/',
  
  // Folder for baseline screenshots
  snapshotDir: 'tests/visual/baselines',
  
  // Test timeout
  timeout: 30000, // 30 seconds per test (fast with pdfium-render)

  // Global setup and teardown
  globalSetup: './tests/global-setup.ts',
  // globalTeardown: require.resolve('./tests/global-teardown'),
});
