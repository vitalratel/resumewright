/**
 * Font Manager Integration Tests
 * Integration tests for two-step API
 */

import type { FontRequirement, FontWeight } from '../../../shared/domain/fonts/models/Font';
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
  });
});
