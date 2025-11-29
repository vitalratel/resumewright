/**
 * Playwright Global Setup
 *
 * Runs once before all tests to ensure the extension is built.
 * This guarantees the dist/ folder is up-to-date before running e2e tests.
 */

import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export default async function globalSetup() {
  console.warn('[Global Setup] Building extension before running e2e tests...');

  try {
    // Change to the package directory (ES module compatible)
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const packageDir = path.resolve(__dirname, '..');

    // Run the build command
    execSync('pnpm run build', {
      stdio: 'inherit',
      cwd: packageDir,
    });
    console.warn('[Global Setup] ✓ Extension built successfully');
  } catch (error) {
    console.error('[Global Setup] ✗ Failed to build extension:', error);
    throw error;
  }
}
