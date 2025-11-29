/**
 * Custom Font Manager Tests
 * Tests for custom font upload, validation, and retrieval
 *
 * Tests covering:
 * - Font upload and validation
 * - Error handling for invalid formats
 * - Duplicate detection
 * - Font retrieval and listing
 * - Storage cleanup
 * - Stats tracking
 *
 * Coverage target: >85%
 */

import type { CustomFont, FontWeight } from '@/shared/domain/fonts/models/Font';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CustomFontError } from '@/shared/domain/fonts/models/Font';
import {
  clearAllCustomFonts,
  getCustomFont,
  getCustomFontStats,
  isCustomFontDuplicate,
  listCustomFonts,
  loadCustomFontsOnStartup,
  removeCustomFont,
  uploadCustomFont,
} from './customFontManager';

// Mock dependencies
vi.mock('../../../shared/infrastructure/fonts/CustomFontStore', () => ({
  saveCustomFont: vi.fn(),
  getCustomFontById: vi.fn(),
  getAllCustomFonts: vi.fn(),
  deleteCustomFont: vi.fn(),
  deleteAllCustomFonts: vi.fn(),
  getStorageStats: vi.fn(),
}));

vi.mock('@/shared/infrastructure/fonts/BinaryFontValidator', () => ({
  validateAndProcessFont: vi.fn(),
  quickValidateFont: vi.fn(),
}));

vi.mock('../../../shared/logging', () => ({
  getLogger: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

describe('CustomFontManager', () => {
  let mockSaveCustomFont: ReturnType<typeof vi.fn>;
  let mockGetCustomFontById: ReturnType<typeof vi.fn>;
  let mockGetAllCustomFonts: ReturnType<typeof vi.fn>;
  let mockDeleteCustomFont: ReturnType<typeof vi.fn>;
  let mockDeleteAllCustomFonts: ReturnType<typeof vi.fn>;
  let mockGetStorageStats: ReturnType<typeof vi.fn>;
  let mockValidateAndProcessFont: ReturnType<typeof vi.fn>;
  let mockQuickValidateFont: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Import mocked modules
    const customFontStore = await import('@/shared/infrastructure/fonts/CustomFontStore');
    const fontValidator = await import('@/shared/infrastructure/fonts/BinaryFontValidator');

    mockSaveCustomFont = vi.mocked(customFontStore.saveCustomFont);
    mockGetCustomFontById = vi.mocked(customFontStore.getCustomFontById);
    mockGetAllCustomFonts = vi.mocked(customFontStore.getAllCustomFonts);
    mockDeleteCustomFont = vi.mocked(customFontStore.deleteCustomFont);
    mockDeleteAllCustomFonts = vi.mocked(customFontStore.deleteAllCustomFonts);
    mockGetStorageStats = vi.mocked(customFontStore.getStorageStats);
    mockValidateAndProcessFont = vi.mocked(fontValidator.validateAndProcessFont);
    mockQuickValidateFont = vi.mocked(fontValidator.quickValidateFont);

    // Mock crypto.randomUUID
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('00000000-0000-0000-0000-000000000000' as `${string}-${string}-${string}-${string}-${string}`);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('uploadCustomFont', () => {
    const createMockFile = (name: string, size: number = 50000): File => {
      const arrayBuffer = new ArrayBuffer(size);
      const blob = new Blob([arrayBuffer], { type: 'font/ttf' });
      const file = new File([blob], name, { type: 'font/ttf' });
      // Mock arrayBuffer method since jsdom File doesn't implement it fully
      Object.defineProperty(file, 'arrayBuffer', {
        value: vi.fn(async () => arrayBuffer),
      });
      return file;
    };

    it('should upload valid font successfully', async () => {
      const mockFile = createMockFile('Roboto-Regular.ttf');
      const metadata = { family: 'Roboto', weight: 400 as FontWeight, style: 'normal' as const };

      mockQuickValidateFont.mockReturnValue({ valid: true });
      mockValidateAndProcessFont.mockResolvedValue({
        valid: true,
        metadata: {
          family: 'Roboto',
          weight: 400 as FontWeight,
          style: 'normal',
          format: 'ttf',
          fileSize: 50000,
        },
      });
      mockSaveCustomFont.mockResolvedValue(undefined);

      const result = await uploadCustomFont(mockFile, metadata);

      expect(result).toMatchObject({
        id: '00000000-0000-0000-0000-000000000000',
        family: 'Roboto',
        weight: 400 as FontWeight,
        style: 'normal',
        format: 'ttf',
        fileSize: 50000,
      });
      expect(result.bytes).toBeInstanceOf(Uint8Array);
      expect(result.uploadedAt).toBeGreaterThan(0);
      expect(mockSaveCustomFont).toHaveBeenCalledWith(result);
    });

    it('should throw error on quick validation failure', async () => {
      const mockFile = createMockFile('invalid.txt');
      const metadata = { family: 'Test', weight: 400 as FontWeight, style: 'normal' as const };

      mockQuickValidateFont.mockReturnValue({
        valid: false,
        error: 'Invalid file extension',
      });

      await expect(uploadCustomFont(mockFile, metadata)).rejects.toThrow(CustomFontError);
      await expect(uploadCustomFont(mockFile, metadata)).rejects.toThrow('Invalid file extension');

      expect(mockValidateAndProcessFont).not.toHaveBeenCalled();
      expect(mockSaveCustomFont).not.toHaveBeenCalled();
    });

    it('should throw error on full validation failure', async () => {
      const mockFile = createMockFile('corrupted.ttf');
      const metadata = { family: 'Test', weight: 400 as FontWeight, style: 'normal' as const };

      mockQuickValidateFont.mockReturnValue({ valid: true });
      mockValidateAndProcessFont.mockResolvedValue({
        valid: false,
        error: 'Corrupted font tables',
      });

      await expect(uploadCustomFont(mockFile, metadata)).rejects.toThrow(CustomFontError);
      await expect(uploadCustomFont(mockFile, metadata)).rejects.toThrow('Corrupted font tables');

      expect(mockSaveCustomFont).not.toHaveBeenCalled();
    });

    it('should throw error when validation returns no metadata', async () => {
      const mockFile = createMockFile('test.ttf');
      const metadata = { family: 'Test', weight: 400 as FontWeight, style: 'normal' as const };

      mockQuickValidateFont.mockReturnValue({ valid: true });
      mockValidateAndProcessFont.mockResolvedValue({
        valid: true,
        metadata: undefined,
      });

      await expect(uploadCustomFont(mockFile, metadata)).rejects.toThrow(CustomFontError);
      await expect(uploadCustomFont(mockFile, metadata)).rejects.toThrow('Font validation failed');
    });

    it.each([
      ['normal', 300, 'light'],
      ['italic', 700, 'bold'],
      ['normal', 900, 'black'],
    ])('should handle different font styles and weights: %s %d', async (style, weight, _label) => {
      const mockFile = createMockFile(`Font-${weight}.ttf`);
      const metadata = { family: 'TestFont', weight, style: style as 'normal' | 'italic' };

      mockQuickValidateFont.mockReturnValue({ valid: true });
      mockValidateAndProcessFont.mockResolvedValue({
        valid: true,
        metadata: {
          family: 'TestFont',
          weight,
          style: style as 'normal' | 'italic',
          format: 'ttf',
          fileSize: 50000,
        },
      });
      mockSaveCustomFont.mockResolvedValue(undefined);

      const result = await uploadCustomFont(mockFile, metadata);

      expect(result.weight).toBe(weight);
      expect(result.style).toBe(style);
    });
  });

  describe('getCustomFont', () => {
    it('should retrieve font by ID', async () => {
      const mockFont: CustomFont = {
        id: 'font-123',
        family: 'Roboto',
        weight: 400 as FontWeight,
        style: 'normal',
        format: 'ttf',
        bytes: new Uint8Array([1, 2, 3]),
        uploadedAt: Date.now(),
        fileSize: 50000,
      };

      mockGetCustomFontById.mockResolvedValue(mockFont);

      const result = await getCustomFont('font-123');

      expect(result).toEqual(mockFont);
      expect(mockGetCustomFontById).toHaveBeenCalledWith('font-123');
    });

    it('should return undefined for non-existent font', async () => {
      mockGetCustomFontById.mockResolvedValue(undefined);

      const result = await getCustomFont('non-existent');

      expect(result).toBeUndefined();
    });
  });

  describe('listCustomFonts', () => {
    it('should return list of all custom fonts', async () => {
      const mockFonts: CustomFont[] = [
        {
          id: 'font-1',
          family: 'Roboto',
          weight: 400 as FontWeight,
          style: 'normal',
          format: 'ttf',
          bytes: new Uint8Array([1, 2, 3]),
          uploadedAt: Date.now(),
          fileSize: 50000,
        },
        {
          id: 'font-2',
          family: 'Open Sans',
          weight: 700 as FontWeight,
          style: 'normal',
          format: 'ttf',
          bytes: new Uint8Array([4, 5, 6]),
          uploadedAt: Date.now(),
          fileSize: 60000,
        },
      ];

      mockGetAllCustomFonts.mockResolvedValue(mockFonts);

      const result = await listCustomFonts();

      expect(result).toEqual(mockFonts);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no fonts exist', async () => {
      mockGetAllCustomFonts.mockResolvedValue([]);

      const result = await listCustomFonts();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('removeCustomFont', () => {
    it('should remove font by ID', async () => {
      mockDeleteCustomFont.mockResolvedValue(undefined);

      await removeCustomFont('font-123');

      expect(mockDeleteCustomFont).toHaveBeenCalledWith('font-123');
    });

    it('should handle removal of non-existent font gracefully', async () => {
      mockDeleteCustomFont.mockResolvedValue(undefined);

      await expect(removeCustomFont('non-existent')).resolves.not.toThrow();
    });
  });

  describe('clearAllCustomFonts', () => {
    it('should clear all custom fonts', async () => {
      mockDeleteAllCustomFonts.mockResolvedValue(undefined);

      await clearAllCustomFonts();

      expect(mockDeleteAllCustomFonts).toHaveBeenCalled();
    });

    it('should handle clearing empty storage', async () => {
      mockDeleteAllCustomFonts.mockResolvedValue(undefined);

      await expect(clearAllCustomFonts()).resolves.not.toThrow();
    });
  });

  describe('getCustomFontStats', () => {
    it('should return storage statistics', async () => {
      const mockStats = {
        count: 2,
        totalSize: 110000,
        fonts: [
          { id: 'font-1', family: 'Roboto', fileSize: 50000 },
          { id: 'font-2', family: 'Open Sans', fileSize: 60000 },
        ],
      };

      mockGetStorageStats.mockResolvedValue(mockStats);

      const result = await getCustomFontStats();

      expect(result.count).toBe(2);
      expect(result.totalSize).toBe(110000);
      expect(result.totalSizeMB).toBe('0.10');
      expect(result.fonts).toHaveLength(2);
      expect(result.fonts[0]).toMatchObject({
        id: 'font-1',
        family: 'Roboto',
        fileSize: 50000,
      });
    });

    it('should return zero stats when no fonts exist', async () => {
      const mockStats = {
        count: 0,
        totalSize: 0,
        fonts: [],
      };

      mockGetStorageStats.mockResolvedValue(mockStats);

      const result = await getCustomFontStats();

      expect(result.count).toBe(0);
      expect(result.totalSize).toBe(0);
      expect(result.totalSizeMB).toBe('0.00');
      expect(result.fonts).toHaveLength(0);
    });
  });

  describe('isCustomFontDuplicate', () => {
    it('should detect duplicate font', async () => {
      const existingFonts: CustomFont[] = [
        {
          id: 'font-1',
          family: 'Roboto',
          weight: 400 as FontWeight,
          style: 'normal',
          format: 'ttf',
          bytes: new Uint8Array([1, 2, 3]),
          uploadedAt: Date.now(),
          fileSize: 50000,
        },
      ];

      mockGetAllCustomFonts.mockResolvedValue(existingFonts);

      const isDuplicate = await isCustomFontDuplicate('Roboto', 400, 'normal');

      expect(isDuplicate).toBe(true);
    });

    it('should return false for non-duplicate font', async () => {
      const existingFonts: CustomFont[] = [
        {
          id: 'font-1',
          family: 'Roboto',
          weight: 400 as FontWeight,
          style: 'normal',
          format: 'ttf',
          bytes: new Uint8Array([1, 2, 3]),
          uploadedAt: Date.now(),
          fileSize: 50000,
        },
      ];

      mockGetAllCustomFonts.mockResolvedValue(existingFonts);

      const isDuplicate = await isCustomFontDuplicate('Open Sans', 400, 'normal');

      expect(isDuplicate).toBe(false);
    });

    it('should distinguish different weights of same family', async () => {
      const existingFonts: CustomFont[] = [
        {
          id: 'font-1',
          family: 'Roboto',
          weight: 400 as FontWeight,
          style: 'normal',
          format: 'ttf',
          bytes: new Uint8Array([1, 2, 3]),
          uploadedAt: Date.now(),
          fileSize: 50000,
        },
      ];

      mockGetAllCustomFonts.mockResolvedValue(existingFonts);

      const isDuplicate = await isCustomFontDuplicate('Roboto', 700, 'normal');

      expect(isDuplicate).toBe(false);
    });

    it('should distinguish different styles of same family and weight', async () => {
      const existingFonts: CustomFont[] = [
        {
          id: 'font-1',
          family: 'Roboto',
          weight: 400 as FontWeight,
          style: 'normal',
          format: 'ttf',
          bytes: new Uint8Array([1, 2, 3]),
          uploadedAt: Date.now(),
          fileSize: 50000,
        },
      ];

      mockGetAllCustomFonts.mockResolvedValue(existingFonts);

      const isDuplicate = await isCustomFontDuplicate('Roboto', 400, 'italic');

      expect(isDuplicate).toBe(false);
    });
  });

  describe('loadCustomFontsOnStartup', () => {
    it('should load all custom fonts on startup', async () => {
      const mockFonts: CustomFont[] = [
        {
          id: 'font-1',
          family: 'Roboto',
          weight: 400 as FontWeight,
          style: 'normal',
          format: 'ttf',
          bytes: new Uint8Array([1, 2, 3]),
          uploadedAt: Date.now(),
          fileSize: 50000,
        },
        {
          id: 'font-2',
          family: 'Open Sans',
          weight: 700 as FontWeight,
          style: 'normal',
          format: 'ttf',
          bytes: new Uint8Array([4, 5, 6]),
          uploadedAt: Date.now(),
          fileSize: 60000,
        },
      ];

      mockGetAllCustomFonts.mockResolvedValue(mockFonts);

      const result = await loadCustomFontsOnStartup();

      expect(result).toEqual(mockFonts);
      expect(mockGetAllCustomFonts).toHaveBeenCalled();
    });

    it('should handle empty font storage on startup', async () => {
      mockGetAllCustomFonts.mockResolvedValue([]);

      const result = await loadCustomFontsOnStartup();

      expect(result).toEqual([]);
    });

    it('should handle storage errors gracefully on startup', async () => {
      mockGetAllCustomFonts.mockRejectedValue(new Error('Storage error'));

      const result = await loadCustomFontsOnStartup();

      expect(result).toEqual([]);
      expect(mockGetAllCustomFonts).toHaveBeenCalled();
    });
  });
});
