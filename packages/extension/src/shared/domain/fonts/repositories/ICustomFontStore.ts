/**
 * Custom Font Store Interface
 *
 * Domain interface for custom font storage operations.
 * Infrastructure implementations provide IndexedDB or other storage backends.
 *
 * @module Domain/Fonts/Repositories
 */

import type { CustomFont } from '../models/Font';

/**
 * Storage statistics
 */
export interface StorageStats {
  /** Total number of fonts stored */
  count: number;
  /** Total storage used in bytes */
  totalBytes: number;
  /** Maximum storage allowed in bytes */
  maxBytes: number;
  /** Percentage of storage used (0-100) */
  percentUsed: number;
}

/**
 * Custom Font Store Interface
 *
 * Abstracts custom font storage from infrastructure details.
 * Follows Repository pattern from Clean Architecture.
 */
export interface ICustomFontStore {
  /**
   * Retrieve all custom fonts
   *
   * @returns Array of custom fonts
   * @throws {CustomFontError} If storage operation fails
   */
  getAllCustomFonts: () => Promise<CustomFont[]>;

  /**
   * Get a custom font by ID
   *
   * @param id - Font unique identifier
   * @returns Font if found, null otherwise
   * @throws {CustomFontError} If storage operation fails
   */
  getCustomFontById: (id: string) => Promise<CustomFont | null>;

  /**
   * Save a custom font
   *
   * @param font - Font to save
   * @throws {CustomFontError} If storage limit exceeded or operation fails
   */
  saveCustomFont: (font: CustomFont) => Promise<void>;

  /**
   * Delete a custom font by ID
   *
   * @param id - Font unique identifier
   * @throws {CustomFontError} If storage operation fails
   */
  deleteCustomFont: (id: string) => Promise<void>;

  /**
   * Delete all custom fonts
   *
   * @throws {CustomFontError} If storage operation fails
   */
  deleteAllCustomFonts: () => Promise<void>;

  /**
   * Get storage statistics
   *
   * @returns Storage usage information
   * @throws {CustomFontError} If storage operation fails
   */
  getStorageStats: () => Promise<StorageStats>;
}
