import type { BrowserContext } from '@playwright/test';
import fs from 'node:fs';

/**
 * Discovers Firefox extension ID from manifest.json.
 *
 * Firefox uses static IDs defined in manifest.json under browser_specific_settings.gecko.id.
 * No discovery algorithm needed - just read from manifest.
 *
 * The ID typically follows an email format (e.g., "extension@resumewright.com")
 * and is stable across extension installations.
 *
 * @param _context - Browser context with extension loaded (unused for Firefox)
 * @param manifestPath - Path to extension manifest.json
 * @returns Extension ID (email-style format)
 * @throws Error if extension ID is not configured in manifest
 */
export async function discoverFirefoxExtensionId(
  _context: BrowserContext,
  manifestPath: string
): Promise<string> {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

  // Firefox requires static ID in manifest.json
  const firefoxId = manifest.browser_specific_settings?.gecko?.id;

  if (!firefoxId) {
    throw new Error(
      'Firefox extension ID not found in manifest.json. ' +
        'Expected browser_specific_settings.gecko.id field. ' +
        'Ensure Firefox manifest is properly configured with a static extension ID.'
    );
  }

  console.warn('[Firefox] Using static extension ID from manifest:', firefoxId);
  return firefoxId;
}
