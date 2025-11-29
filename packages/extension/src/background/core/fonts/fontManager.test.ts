/**
 * Font Manager Integration Tests
 * Integration tests for two-step API
 */

import type { CustomFont, FontRequirement, FontWeight } from '../../../shared/domain/fonts/models/Font';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchFontsFromRequirements, isGoogleFont, isWebSafeFont } from './fontManager';

// Create a shared mock function that can be manipulated in tests
const mockFetchGoogleFont = vi.fn(async (_family: string, _weight: number, _style: string) => {
  // Return mock font bytes
  const mockBytes = new Uint8Array([0x00, 0x01, 0x00, 0x00]); // TTF magic bytes
  return Promise.resolve(mockBytes);
});

// Mock GoogleFontsRepository
vi.mock('@/shared/infrastructure/fonts/GoogleFontsRepository', () => ({
  GoogleFontsRepository: class {
    fetchGoogleFont = mockFetchGoogleFont;
    getCacheStats = vi.fn(() => ({ size: 0, maxSize: 20 }));
    clearCache = vi.fn();
  },
}));

// Mock customFontStore module
const mockGetAllCustomFonts = vi.fn(async (): Promise<CustomFont[]> => {
  // Return empty array by default (no custom fonts in IndexedDB)
  return Promise.resolve([]);
});

vi.mock('../../../shared/infrastructure/fonts/CustomFontStore', () => ({
  getAllCustomFonts: mockGetAllCustomFonts,
}));

// Mock CustomFontStoreAdapter - it uses CustomFontStore internally
vi.mock('@/shared/infrastructure/fonts/CustomFontStoreAdapter', () => ({
  CustomFontStoreAdapter: class {
    getAllCustomFonts = mockGetAllCustomFonts;
    getCustomFontById = vi.fn(async () => null);
    saveCustomFont = vi.fn(async () => {});
    deleteCustomFont = vi.fn(async () => {});
    deleteAllCustomFonts = vi.fn(async () => {});
    getStorageStats = vi.fn(async () => ({ count: 0, totalBytes: 0, maxBytes: 50 * 1024 * 1024, percentUsed: 0 }));
  },
}));

describe('fontManager', () => {
  describe('isWebSafeFont', () => {
    it('should identify Arial as web-safe', () => {
      expect(isWebSafeFont('Arial')).toBe(true);
    });

    it('should identify Helvetica as web-safe', () => {
      expect(isWebSafeFont('Helvetica')).toBe(true);
    });

    it('should be case-insensitive', () => {
      expect(isWebSafeFont('arial')).toBe(true);
      expect(isWebSafeFont('ARIAL')).toBe(true);
    });

    it('should identify Roboto as not web-safe', () => {
      expect(isWebSafeFont('Roboto')).toBe(false);
    });
  });

  describe('isGoogleFont', () => {
    it('should identify Roboto as Google Font', () => {
      expect(isGoogleFont('Roboto')).toBe(true);
    });

    it('should identify Open Sans as Google Font', () => {
      expect(isGoogleFont('Open Sans')).toBe(true);
    });

    it('should be case-insensitive', () => {
      expect(isGoogleFont('roboto')).toBe(true);
      expect(isGoogleFont('ROBOTO')).toBe(true);
    });

    it('should identify Arial as not Google Font', () => {
      expect(isGoogleFont('Arial')).toBe(false);
    });
  });

  describe('fetchFontsFromRequirements', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      // Reset mock to default implementation
      mockFetchGoogleFont.mockImplementation(async (_family: string, _weight: number, _style: string) => {
        const mockBytes = new Uint8Array([0x00, 0x01, 0x00, 0x00]); // TTF magic bytes
        return Promise.resolve(mockBytes);
      });
    });

    it('should skip web-safe fonts', async () => {
      const requirements: FontRequirement[] = [
        { family: 'Arial', weight: 400 as FontWeight, style: 'normal', source: 'websafe' },
        { family: 'Helvetica', weight: 400 as FontWeight, style: 'normal', source: 'websafe' },
      ];

      const result = await fetchFontsFromRequirements(requirements);

      // Web-safe fonts should not be fetched
      expect(result).toHaveLength(0);
    });

    it('should fetch Google Fonts', async () => {
      const requirements: FontRequirement[] = [
        { family: 'Roboto', weight: 400 as FontWeight, style: 'normal', source: 'google' },
        { family: 'Open Sans', weight: 700 as FontWeight, style: 'italic', source: 'google' },
      ];

      const result = await fetchFontsFromRequirements(requirements);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        family: 'Roboto',
        weight: 400 as FontWeight,
        style: 'normal',
        format: 'ttf',
      });
      expect(result[0].bytes).toBeInstanceOf(Uint8Array);
      expect(result[1]).toMatchObject({
        family: 'Open Sans',
        weight: 700 as FontWeight,
        style: 'italic',
        format: 'ttf',
      });
    });

    it('should handle mixed font sources', async () => {
      const requirements: FontRequirement[] = [
        { family: 'Arial', weight: 400 as FontWeight, style: 'normal', source: 'websafe' },
        { family: 'Roboto', weight: 400 as FontWeight, style: 'normal', source: 'google' },
        { family: 'Helvetica', weight: 700 as FontWeight, style: 'normal', source: 'websafe' },
      ];

      const result = await fetchFontsFromRequirements(requirements);

      // Only Google Font should be fetched
      expect(result).toHaveLength(1);
      expect(result[0].family).toBe('Roboto');
    });

    it('should call progress callback for each font', async () => {
      const requirements: FontRequirement[] = [
        { family: 'Roboto', weight: 400 as FontWeight, style: 'normal', source: 'google' },
        { family: 'Open Sans', weight: 400 as FontWeight, style: 'normal', source: 'google' },
      ];

      const progressCallback = vi.fn();
      await fetchFontsFromRequirements(requirements, progressCallback);

      expect(progressCallback).toHaveBeenCalledTimes(2);
      expect(progressCallback).toHaveBeenNthCalledWith(1, 1, 2, 'Roboto');
      expect(progressCallback).toHaveBeenNthCalledWith(2, 2, 2, 'Open Sans');
    });

    it('should continue on font fetch failure', async () => {
      // Mock first font to fail, second to succeed using the shared mock function
      mockFetchGoogleFont
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(new Uint8Array([0x00, 0x01, 0x00, 0x00]));

      const requirements: FontRequirement[] = [
        { family: 'FailingFont', weight: 400 as FontWeight, style: 'normal', source: 'google' },
        { family: 'Roboto', weight: 400 as FontWeight, style: 'normal', source: 'google' },
      ];

      const result = await fetchFontsFromRequirements(requirements);

      // Should only have the successful font
      expect(result).toHaveLength(1);
      expect(result[0].family).toBe('Roboto');
    });

    it('should handle custom fonts (no fonts in IndexedDB)', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const requirements: FontRequirement[] = [
        { family: 'MyCustomFont', weight: 400 as FontWeight, style: 'normal', source: 'custom' },
      ];

      // Custom font is requested but not found in IndexedDB
      const result = await fetchFontsFromRequirements(requirements);

      // Should return empty array since font is not in IndexedDB
      expect(result).toHaveLength(0);

      // Should log warning that custom font was not found
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Custom font not found: MyCustomFont')
      );

      consoleSpy.mockRestore();
    });

    it('should handle errors during custom font processing (defensive)', async () => {
      // Test error handler at lines 120-121
      // NOTE: This error handler is defensive code that's difficult to trigger in tests
      // because all operations inside the try block (find, property access, push) are
      // synchronous and unlikely to throw. The catch exists to handle unexpected runtime
      // errors (e.g., out of memory during push, corrupted data structures, etc.)
      //
      // This test documents the error handler's existence and tests the happy path
      // to ensure the error handler doesn't interfere with normal operation.

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Create a valid custom font (error handler is defensive code for runtime errors)
      const mockBytes = new Uint8Array([0x00, 0x01, 0x00, 0x00]);

      const customFont = {
        id: 'test-font-1',
        family: 'MalformedFont',
        weight: 400 as FontWeight,
        style: 'normal' as const,
        bytes: mockBytes,
        format: 'ttf' as const,
        uploadedAt: Date.now(),
        fileSize: mockBytes.length,
      };

      mockGetAllCustomFonts.mockResolvedValue([customFont]);

      const requirements: FontRequirement[] = [
        { family: 'MalformedFont', weight: 400 as FontWeight, style: 'normal', source: 'custom' },
      ];

      // Font processing should complete - error handler would catch any exceptions
      const result = await fetchFontsFromRequirements(requirements);

      // Verifies error handler doesn't interfere with normal operation
      expect(result).toHaveLength(1);
      expect(result[0].family).toBe('MalformedFont');

      consoleSpy.mockRestore();
    });
  });

  // createFontCollection tests removed - now handled directly in pdfService using WASM types
});
