/**
 * Centralized path resolution for integration tests
 * 
 * All paths are resolved relative to process.cwd() which is packages/extension
 * This makes tests resilient to file moves and easier to maintain.
 * 
 * Usage:
 * - ATS tests: import { paths } from '../paths';
 * - Visual tests: import { paths } from '../paths';
 * - Benchmark tests: import { paths } from '../paths';
 */

import { resolve } from 'node:path';

// Base directories (from packages/extension)
const REPO_ROOT = resolve(process.cwd(), '../..');
const RUST_CORE = resolve(REPO_ROOT, 'packages/rust-core');
const TEST_FIXTURES = resolve(REPO_ROOT, 'test-fixtures');

/**
 * Path utilities for integration test fixtures and outputs
 */
export const paths = {
  /**
   * Get path to a TSX fixture file
   * @param relativePath - Path relative to test-fixtures/tsx-samples/ (e.g., 'single-page/01-single-column-traditional.tsx')
   */
  tsxFixture: (relativePath: string): string =>
    resolve(TEST_FIXTURES, 'tsx-samples', relativePath),

  /**
   * Get path to test fixtures directory
   * @param subdir - Subdirectory within test-fixtures/tsx-samples (e.g., 'single-page', 'multi-page', 'fonts')
   */
  fixturesDir: (subdir: string): string =>
    resolve(TEST_FIXTURES, 'tsx-samples', subdir),

  /**
   * Get path to a generated PDF output
   * @param filename - PDF filename (e.g., '01-single-column-traditional.pdf')
   */
  pdfOutput: (filename: string): string =>
    resolve(TEST_FIXTURES, 'pdf-output', filename),

  /**
   * Get path to PDF output directory
   */
  pdfOutputDir: (): string =>
    resolve(TEST_FIXTURES, 'pdf-output'),

  /**
   * Get path to baselines directory
   * @param subdir - Subdirectory within baselines (e.g., 'fonts', 'multi-page')
   */
  baselinesDir: (subdir: string): string =>
    resolve(TEST_FIXTURES, 'baselines', subdir),

  /**
   * Get path to Rust CLI binary
   * @param binaryName - Binary name (e.g., 'pdf-to-png')
   */
  rustBinary: (binaryName: string): string =>
    resolve(REPO_ROOT, 'target/release', binaryName),

  /**
   * Get path to ATS test reports directory
   */
  atsReportsDir: (): string =>
    resolve(process.cwd(), 'src/__tests__/integration/ats/reports'),

  /**
   * Get path to a specific ATS report file
   * @param filename - Report filename (e.g., 'ats-extraction-results.md')
   */
  atsReport: (filename: string): string =>
    resolve(process.cwd(), 'src/__tests__/integration/ats/reports', filename),

  /**
   * Get path to WASM bridge module
   */
  wasmModule: (): string =>
    resolve(RUST_CORE, 'wasm-bridge/pkg/wasm_bridge_bg.wasm'),
};
