/**
 * Custom Font Manager
 * Orchestrates custom font operations
 *
 * High-level API for custom font upload, validation, and retrieval.
 */

import type { CustomFont } from '@/shared/domain/fonts/models/Font';
import { CustomFontError, CustomFontErrorType } from '@/shared/domain/fonts/models/Font';
import { quickValidateFont, validateAndProcessFont } from '@/shared/infrastructure/fonts/BinaryFontValidator';
import {
  deleteAllCustomFonts,
  deleteCustomFont,
  getAllCustomFonts,
  getCustomFontById,
  getStorageStats,
  saveCustomFont,
} from '@/shared/infrastructure/fonts/CustomFontStore';
import { getLogger } from '@/shared/infrastructure/logging';

/**
 * Uploads and stores a custom font
 *
 * @param file - Font file from user upload
 * @param metadata - User-provided metadata
 * @param metadata.family - Font family name
 * @param metadata.weight - Font weight (e.g., 400, 700)
 * @param metadata.style - Font style (normal or italic)
 * @returns Saved custom font
 * @throws {CustomFontError} If validation or storage fails
 */
export async function uploadCustomFont(
  file: File,
  metadata: {
    family: string;
    weight: number;
    style: 'normal' | 'italic';
  }
): Promise<CustomFont> {
  getLogger().debug('CustomFontManager', `Uploading font: ${file.name} (${file.size} bytes)`);

  // Quick validation
  const quickCheck = quickValidateFont(file);
  if (!quickCheck.valid) {
    throw new CustomFontError(CustomFontErrorType.INVALID_FORMAT, quickCheck.error!);
  }

  // Full validation and processing
  const validation = await validateAndProcessFont(file, metadata);

  if (!validation.valid || !validation.metadata) {
    throw new CustomFontError(
      CustomFontErrorType.VALIDATION_FAILED,
      validation.error !== null && validation.error !== undefined && validation.error !== ''
        ? validation.error
        : 'Font validation failed'
    );
  }

  // Create custom font object
  const customFont: CustomFont = {
    id: crypto.randomUUID(),
    family: validation.metadata.family,
    weight: validation.metadata.weight,
    style: validation.metadata.style,
    format: validation.metadata.format,
    bytes: new Uint8Array(), // Will be set below
    uploadedAt: Date.now(),
    fileSize: validation.metadata.fileSize,
  };

  // Read font bytes (already converted to TrueType by validator)
  const arrayBuffer = await file.arrayBuffer();
  customFont.bytes = new Uint8Array(arrayBuffer);

  // Save to IndexedDB
  await saveCustomFont(customFont);

  getLogger().debug(
    'CustomFontManager',
    `✓ Font uploaded: ${customFont.family} (${customFont.id})`
  );

  return customFont;
}

/**
 * Retrieves all custom fonts
 */
export async function listCustomFonts(): Promise<CustomFont[]> {
  return getAllCustomFonts();
}

/**
 * Retrieves a specific custom font
 */
export async function getCustomFont(id: string): Promise<CustomFont | null> {
  return getCustomFontById(id);
}

/**
 * Deletes a custom font
 */
export async function removeCustomFont(id: string): Promise<void> {
  await deleteCustomFont(id);
  getLogger().debug('CustomFontManager', `Deleted font: ${id}`);
}

/**
 * Deletes all custom fonts
 */
export async function clearAllCustomFonts(): Promise<void> {
  await deleteAllCustomFonts();
  getLogger().debug('CustomFontManager', 'Cleared all custom fonts');
}

/**
 * Gets storage usage statistics
 */
export async function getCustomFontStats(): Promise<{
  count: number;
  totalSize: number;
  totalSizeMB: string;
  fonts: Array<{ id: string; family: string; size: number; sizeMB: string }>;
}> {
  const stats = await getStorageStats();

  return {
    count: stats.count,
    totalSize: stats.totalSize,
    totalSizeMB: (stats.totalSize / (1024 * 1024)).toFixed(2),
    fonts: stats.fonts.map((f) => ({
      ...f,
      sizeMB: (f.size / (1024 * 1024)).toFixed(2),
    })),
  };
}

/**
 * Checks if a custom font with the given family/weight/style already exists
 */
export async function isCustomFontDuplicate(
  family: string,
  weight: number,
  style: 'normal' | 'italic'
): Promise<boolean> {
  const fonts = await getAllCustomFonts();

  return fonts.some((f) => f.family === family && f.weight === weight && f.style === style);
}

/**
 * Loads custom fonts on extension startup
 * Returns fonts for preloading into font cache
 */
export async function loadCustomFontsOnStartup(): Promise<CustomFont[]> {
  try {
    const fonts = await getAllCustomFonts();
    getLogger().debug('CustomFontManager', `Loaded ${fonts.length} custom fonts on startup`);
    return fonts;
  } catch (error) {
    getLogger().error('CustomFontManager', 'Failed to load custom fonts', error);
    return [];
  }
}
