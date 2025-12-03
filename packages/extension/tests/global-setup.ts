/**
 * Playwright Global Setup
 *
 * Runs once before all tests to:
 * 1. Clean up stale test profile directories from previous runs
 * 2. Build the extension
 */

import { execSync } from 'node:child_process';
import { readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Clean up stale test profile directories
 */
async function cleanupStaleProfiles(packageDir: string): Promise<void> {
  try {
    const entries = await readdir(packageDir, { withFileTypes: true });
    const staleProfiles = entries.filter(
      (entry) => entry.isDirectory() && entry.name.startsWith('.test-profile-'),
    );

    if (staleProfiles.length > 0) {
      console.warn(`[Global Setup] Cleaning up ${staleProfiles.length} stale test profile(s)...`);
      await Promise.all(
        staleProfiles.map((profile) =>
          rm(path.join(packageDir, profile.name), { recursive: true, force: true }),
        ),
      );
      console.warn('[Global Setup] ✓ Stale profiles cleaned up');
    }
  } catch (error) {
    console.warn('[Global Setup] Warning: Could not clean up stale profiles:', error);
  }
}

export default async function globalSetup() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const packageDir = path.resolve(__dirname, '..');

  // Clean up stale test profiles from crashed/interrupted previous runs
  await cleanupStaleProfiles(packageDir);

  console.warn('[Global Setup] Building extension before running e2e tests...');

  try {
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
