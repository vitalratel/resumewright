/**
 * Custom Font Store Adapter
 *
 * Infrastructure adapter that wraps CustomFontStore functions
 * to implement ICustomFontStore interface.
 *
 * This adapter follows the Adapter pattern to bridge between
 * functional module exports and interface-based dependency injection.
 *
 * @module Infrastructure/Fonts
 */

import type { CustomFont } from '../../domain/fonts/models/Font';
import type { ICustomFontStore, StorageStats } from '../../domain/fonts/repositories/ICustomFontStore';
import * as CustomFontStore from './CustomFontStore';

/**
 * Adapter class implementing ICustomFontStore
 *
 * Wraps functional CustomFontStore module to provide interface-based access.
 * Enables dependency injection in application layer.
 */
export class CustomFontStoreAdapter implements ICustomFontStore {
  async getAllCustomFonts(): Promise<CustomFont[]> {
    return CustomFontStore.getAllCustomFonts();
  }

  async getCustomFontById(id: string): Promise<CustomFont | null> {
    return CustomFontStore.getCustomFontById(id);
  }

  async saveCustomFont(font: CustomFont): Promise<void> {
    return CustomFontStore.saveCustomFont(font);
  }

  async deleteCustomFont(id: string): Promise<void> {
    return CustomFontStore.deleteCustomFont(id);
  }

  async deleteAllCustomFonts(): Promise<void> {
    return CustomFontStore.deleteAllCustomFonts();
  }

  async getStorageStats(): Promise<StorageStats> {
    const stats = await CustomFontStore.getStorageStats();
    const maxBytes = 50 * 1024 * 1024; // 50MB limit
    return {
      count: stats.count,
      totalBytes: stats.totalSize,
      maxBytes,
      percentUsed: (stats.totalSize / maxBytes) * 100,
    };
  }
}
