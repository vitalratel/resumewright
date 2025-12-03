/**
 * Test Fixture Registry
 *
 * Central registry for test fixtures with metadata.
 * Provides type-safe access to fixture files and expected properties.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Fixture metadata interface
 */
export interface FixtureMetadata {
  /** Fixture filename */
  name: string;
  /** Human-readable description */
  description: string;
  /** Expected PDF size range (KB) */
  expectedSize: {
    min: number;
    max: number;
  };
  /** Expected conversion duration (ms) - for performance testing */
  expectedDuration?: {
    fast: number; // High-end devices
    slow: number; // Low-end devices (4x CPU slowdown)
  };
  /** Whether fixture should pass validation */
  shouldValidate: boolean;
  /** Category for organization */
  category: 'single-page' | 'multi-page' | 'invalid';
}

/**
 * Test fixtures registry
 *
 * Add new fixtures here to make them available throughout the test suite.
 */
export const TEST_FIXTURES = {
  // ===== Single-Page Fixtures =====
  singleColumnTraditional: {
    name: '01-single-column-traditional.tsx',
    description: 'Traditional single-column resume layout',
    expectedSize: { min: 50, max: 300 },
    expectedDuration: { fast: 5000, slow: 15000 },
    shouldValidate: true,
    category: 'single-page',
  },
  twoColumnModern: {
    name: '02-two-column-modern.tsx',
    description: 'Modern two-column layout with sidebar',
    expectedSize: { min: 80, max: 350 },
    expectedDuration: { fast: 5000, slow: 15000 },
    shouldValidate: true,
    category: 'single-page',
  },
  compactDense: {
    name: '03-compact-dense.tsx',
    description: 'Compact layout with dense information',
    expectedSize: { min: 60, max: 320 },
    expectedDuration: { fast: 5000, slow: 15000 },
    shouldValidate: true,
    category: 'single-page',
  },
  minimalElegant: {
    name: '04-minimal-elegant.tsx',
    description: 'Minimal elegant design with whitespace',
    expectedSize: { min: 40, max: 250 },
    expectedDuration: { fast: 5000, slow: 15000 },
    shouldValidate: true,
    category: 'single-page',
  },

  // ===== Multi-Page Fixtures =====
  // Add multi-page fixtures here when available

  // ===== Invalid Fixtures (for validation testing) =====
  invalidNoJsx: {
    name: 'invalid-no-jsx.tsx',
    description: 'Invalid file without JSX markup',
    expectedSize: { min: 0, max: 0 }, // No PDF generated
    shouldValidate: false,
    category: 'invalid',
  },
  invalidNoExport: {
    name: 'invalid-no-export.tsx',
    description: 'Invalid file missing export statement',
    expectedSize: { min: 0, max: 0 },
    shouldValidate: false,
    category: 'invalid',
  },
} as const satisfies Record<string, FixtureMetadata>;

/**
 * Fixture keys for type safety
 */
export type FixtureKey = keyof typeof TEST_FIXTURES;

/**
 * Base paths for fixture directories
 */
export const FIXTURE_PATHS = {
  singlePage: fileURLToPath(
    new URL('../../../../test-fixtures/tsx-samples/single-page', import.meta.url),
  ),
  multiPage: fileURLToPath(
    new URL('../../../../test-fixtures/tsx-samples/multi-page', import.meta.url),
  ),
  invalid: fileURLToPath(new URL('../../../../test-fixtures/tsx-samples/invalid', import.meta.url)),
} as const;

/**
 * Get absolute path to fixture file
 *
 * @param fixture - Fixture key
 * @returns Absolute path to fixture file
 *
 * @example
 * ```typescript
 * const fixturePath = getFixturePath('singleColumnTraditional');
 * await uploadTsxFile(page, fixturePath);
 * ```
 */
export function getFixturePath(fixture: FixtureKey): string {
  const metadata = TEST_FIXTURES[fixture];
  const categoryMap: Record<FixtureMetadata['category'], string> = {
    'single-page': FIXTURE_PATHS.singlePage,
    'multi-page': FIXTURE_PATHS.multiPage,
    invalid: FIXTURE_PATHS.invalid,
  };
  const basePath = categoryMap[metadata.category];
  return path.join(basePath, metadata.name);
}

/**
 * Get fixture metadata
 *
 * @param fixture - Fixture key
 * @returns Fixture metadata
 *
 * @example
 * ```typescript
 * const meta = getFixtureMetadata('singleColumnTraditional');
 * expect(result.sizeKB).toBeLessThan(meta.expectedSize.max);
 * ```
 */
export function getFixtureMetadata(fixture: FixtureKey): FixtureMetadata {
  return TEST_FIXTURES[fixture];
}

/**
 * Get all fixtures by category
 *
 * @param category - Fixture category
 * @returns Array of fixture keys
 *
 * @example
 * ```typescript
 * const singlePageFixtures = getFixturesByCategory('single-page');
 * for (const fixture of singlePageFixtures) {
 *   test(`should convert ${fixture}`, async () => {
 *     const path = getFixturePath(fixture);
 *     // ...
 *   });
 * }
 * ```
 */
export function getFixturesByCategory(category: FixtureMetadata['category']): FixtureKey[] {
  return (Object.keys(TEST_FIXTURES) as FixtureKey[]).filter(
    (key) => TEST_FIXTURES[key].category === category,
  );
}

/**
 * Get fixtures that should pass validation
 *
 * @returns Array of valid fixture keys
 */
export function getValidFixtures(): FixtureKey[] {
  return (Object.keys(TEST_FIXTURES) as FixtureKey[]).filter(
    (key) => TEST_FIXTURES[key].shouldValidate,
  );
}

/**
 * Get fixtures that should fail validation
 *
 * @returns Array of invalid fixture keys
 */
export function getInvalidFixtures(): FixtureKey[] {
  return (Object.keys(TEST_FIXTURES) as FixtureKey[]).filter(
    (key) => !TEST_FIXTURES[key].shouldValidate,
  );
}

/**
 * Performance thresholds for testing
 */
export const PERFORMANCE_THRESHOLDS = {
  /** Single-page conversion on high-end devices (AC1) */
  SINGLE_PAGE_FAST: 5000,
  /** Single-page conversion on low-end devices (4x slowdown) */
  SINGLE_PAGE_SLOW: 8000,
  /** Multi-page conversion on high-end devices */
  MULTI_PAGE_FAST: 10000,
  /** Multi-page conversion on low-end devices */
  MULTI_PAGE_SLOW: 15000,
  /** Maximum PDF file size (AC7) */
  MAX_FILE_SIZE_KB: 500,
} as const;
