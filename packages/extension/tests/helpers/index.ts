/**
 * Test Helpers - Barrel Export
 *
 * Re-exports all test helper utilities for convenient imports.
 */

// E2E helpers
export {
  assertPdfProperties,
  type BothWasmReadinessResult,
  type BrowserConfig,
  browserConfigs,
  captureDiagnostics,
  type ConsoleLogEntry,
  type DiagnosticInfo,
  type DownloadResult,
  expectValidationError,
  measureDuration,
  openExtensionPopup,
  type ServiceWorkerWasmReadinessResult,
  setupConsoleCapture,
  triggerPdfDownload,
  type UploadOptions,
  uploadTsxContent,
  uploadTsxFile,
  waitForBothWasmReady,
  waitForPdfDownload,
  waitForProgressIndicator,
  waitForServiceWorkerWasmReady,
  waitForWasmReady,
  type WasmReadinessResult,
} from './e2eHelpers';

// Fixture registry
export {
  FIXTURE_PATHS,
  type FixtureKey,
  type FixtureMetadata,
  getFixtureMetadata,
  getFixturePath,
  getFixturesByCategory,
  getInvalidFixtures,
  getValidFixtures,
  PERFORMANCE_THRESHOLDS,
  TEST_FIXTURES,
} from './fixtures';
