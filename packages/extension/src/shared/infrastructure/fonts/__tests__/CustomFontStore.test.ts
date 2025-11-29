/**
 * CustomFontStore Unit Tests
 *
 * Tests IndexedDB CRUD operations for custom fonts with storage limits
 */

import type { CustomFont, FontWeight } from '@/shared/domain/fonts/models/Font';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CUSTOM_FONT_LIMITS, CustomFontError } from '@/shared/domain/fonts/models/Font';
import {
  deleteAllCustomFonts,
  deleteCustomFont,
  getAllCustomFonts,
  getCustomFontById,
  getStorageStats,
  saveCustomFont,
} from '../CustomFontStore';
import 'fake-indexeddb/auto';

// Mock logger
vi.mock('@/shared/logging', () => ({
  getLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

// Helper to create mock font
function createMockFont(overrides?: Partial<CustomFont>): CustomFont {
  return {
    id: `font-${Date.now()}-${Math.random()}`,
    family: 'Test Font',
    weight: 400 as FontWeight,
    style: 'normal' as const,
    format: 'woff2' as const,
    bytes: new Uint8Array([0x00, 0x01, 0x00, 0x00]),
    fileSize: 1024,
    uploadedAt: Date.now(),
    ...overrides,
  };
}

describe('CustomFontStore', () => {
  beforeEach(async () => {
    // Clear all fonts before each test
    await deleteAllCustomFonts();
  });

  afterEach(async () => {
    // Clean up after each test
    await deleteAllCustomFonts();
  });

  describe('saveCustomFont', () => {
    it('saves a custom font successfully', async () => {
      const font = createMockFont();

      await saveCustomFont(font);

      const saved = await getCustomFontById(font.id);
      expect(saved).toBeDefined();
      expect(saved?.family).toBe(font.family);
      expect(saved?.fileSize).toBe(font.fileSize);
    });

    it('updates existing font when saving with same id', async () => {
      const font = createMockFont({ family: 'Original' });
      await saveCustomFont(font);

      const updated = { ...font, family: 'Updated' };
      await saveCustomFont(updated);

      const saved = await getCustomFontById(font.id);
      expect(saved?.family).toBe('Updated');

      const all = await getAllCustomFonts();
      expect(all).toHaveLength(1); // Should not create duplicate
    });

    it('throws error when exceeding font count limit', async () => {
      // Add maximum number of fonts
      const promises = Array.from({ length: CUSTOM_FONT_LIMITS.MAX_FONT_COUNT }, async (_, i) =>
        saveCustomFont(createMockFont({ id: `font-${i}`, family: `Font ${i}` })));
      await Promise.all(promises);

      // Try to add one more
      const extraFont = createMockFont({ id: 'font-extra' });

      await expect(saveCustomFont(extraFont)).rejects.toThrow(CustomFontError);
      await expect(saveCustomFont(extraFont)).rejects.toThrow(
        `Maximum ${CUSTOM_FONT_LIMITS.MAX_FONT_COUNT} custom fonts allowed`,
      );
    });

    it('throws error when exceeding total storage limit', async () => {
      // Create large fonts that exceed total limit
      const largeSize = Math.floor(CUSTOM_FONT_LIMITS.MAX_TOTAL_SIZE / 2) + 1024;
      const font1 = createMockFont({
        id: 'font-1',
        bytes: new Uint8Array(largeSize),
        fileSize: largeSize,
      });
      const font2 = createMockFont({
        id: 'font-2',
        bytes: new Uint8Array(largeSize),
        fileSize: largeSize,
      });

      await saveCustomFont(font1);

      await expect(saveCustomFont(font2)).rejects.toThrow(CustomFontError);
      await expect(saveCustomFont(font2)).rejects.toThrow(/Total storage would exceed/);
    });
  });

  describe('getAllCustomFonts', () => {
    it('returns empty array when no fonts are stored', async () => {
      const fonts = await getAllCustomFonts();

      expect(fonts).toEqual([]);
    });

    it('returns all stored fonts', async () => {
      const font1 = createMockFont({ id: 'font-1', family: 'Font 1' });
      const font2 = createMockFont({ id: 'font-2', family: 'Font 2' });

      await saveCustomFont(font1);
      await saveCustomFont(font2);

      const fonts = await getAllCustomFonts();

      expect(fonts).toHaveLength(2);
      expect(fonts.map(f => f.family)).toContain('Font 1');
      expect(fonts.map(f => f.family)).toContain('Font 2');
    });
  });

  describe('getCustomFontById', () => {
    it('returns font when it exists', async () => {
      const font = createMockFont();
      await saveCustomFont(font);

      const retrieved = await getCustomFontById(font.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(font.id);
      expect(retrieved?.family).toBe(font.family);
    });

    it('returns null when font does not exist', async () => {
      const retrieved = await getCustomFontById('non-existent-id');

      expect(retrieved).toBeNull();
    });
  });

  describe('deleteCustomFont', () => {
    it('deletes existing font', async () => {
      const font = createMockFont();
      await saveCustomFont(font);

      await deleteCustomFont(font.id);

      const retrieved = await getCustomFontById(font.id);
      expect(retrieved).toBeNull();
    });

    it('succeeds silently when deleting non-existent font', async () => {
      await expect(deleteCustomFont('non-existent-id')).resolves.toBeUndefined();
    });
  });

  describe('deleteAllCustomFonts', () => {
    it('deletes all fonts', async () => {
      const font1 = createMockFont({ id: 'font-1' });
      const font2 = createMockFont({ id: 'font-2' });

      await saveCustomFont(font1);
      await saveCustomFont(font2);

      await deleteAllCustomFonts();

      const fonts = await getAllCustomFonts();
      expect(fonts).toHaveLength(0);
    });

    it('succeeds when no fonts exist', async () => {
      await expect(deleteAllCustomFonts()).resolves.toBeUndefined();
    });
  });

  describe('getStorageStats', () => {
    it('returns correct stats for empty storage', async () => {
      const stats = await getStorageStats();

      expect(stats.count).toBe(0);
      expect(stats.totalSize).toBe(0);
      expect(stats.fonts).toEqual([]);
    });

    it('returns correct stats with stored fonts', async () => {
      const font1 = createMockFont({ fileSize: 1000 });
      const font2 = createMockFont({ fileSize: 2000 });

      await saveCustomFont(font1);
      await saveCustomFont(font2);

      const stats = await getStorageStats();

      expect(stats.count).toBe(2);
      expect(stats.totalSize).toBe(3000);
      expect(stats.fonts).toHaveLength(2);
    });

    it('calculates fonts array from getAllCustomFonts', async () => {
      const font = createMockFont();
      await saveCustomFont(font);

      const stats = await getStorageStats();

      expect(stats.fonts).toHaveLength(1);
      expect(stats.fonts[0].id).toBe(font.id);
      expect(stats.fonts[0].family).toBe(font.family);
      expect(stats.fonts[0].size).toBe(font.fileSize);
    });
  });
});
