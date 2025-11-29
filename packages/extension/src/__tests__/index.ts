/**
 * Test Infrastructure Barrel Export
 *
 * Central export point for all test utilities, mocks, factories, and fixtures.
 * Import from this file for convenient access to test helpers.
 *
 * @example
 * ```typescript
 * // Single import for all test utilities
 * import {
 *   // Error factories
 *   createParseError,
 *   createSizeError,
 *
 *   // Settings fixtures
 *   createMockSettings,
 *   createA4Settings,
 *
 *   // Font fixtures
 *   createMockFont,
 *   MOCK_FONTS,
 *
 *   // Mocks
 *   mockBrowser,
 *   mockWasmConverter,
 *   mockCompatibilityChecker,
 *
 *   // Component helpers
 *   renderWithStore,
 *   triggerStoreError,
 *   resetAllStores,
 *
 *   // User events
 *   clickButton,
 *   uploadFile,
 *   fillFormField,
 *
 *   // Assertions
 *   expectConversionSuccess,
 *   expectErrorState,
 *   expectLoadingState,
 * } from '../__tests__';
 * ```
 */

// ============================================================================
// FACTORIES - Object builders with sensible defaults
// ============================================================================

export * from './factories/errorFactory';

// ============================================================================
// FIXTURES - Test data and constants
// ============================================================================

export * from './fixtures/fonts';
export * from './fixtures/settings';

// ============================================================================
// MOCKS - Mock implementations for external dependencies
// ============================================================================

export * from './mocks/browser';
export * from './mocks/compatibilityChecker';
export * from './mocks/storage';
export * from './mocks/wasm';

// ============================================================================
// UTILS - Test helpers and utilities
// ============================================================================

export * from './utils/assertions';
export * from './utils/componentTestHelpers';
export * from './utils/userEvents';
