/**
 * Google Fonts Fetching Tests
 * Unit tests for font fetching
 */

import {
  GoogleFontsRepository,
} from '@/shared/infrastructure/fonts/GoogleFontsRepository';

// Create repository instance for tests
let repository: GoogleFontsRepository;
const clearFontCache = () => repository.clearCache();
const fetchGoogleFont = async (family: string, weight: any, style: any) => 
  repository.fetchGoogleFont(family, weight, style);
const getFontCacheStats = () => repository.getCacheStats();

// Mock fetch globally
global.fetch = vi.fn();

// Mock AbortSignal.timeout to prevent 30-second timers from being created
// This prevents vitest from hanging waiting for timers to complete
const originalAbortSignalTimeout = AbortSignal.timeout;
AbortSignal.timeout = vi.fn((_ms: number) => {
  // Return a mock signal that never aborts (tests complete before 30s would expire anyway)
  const controller = new AbortController();
  return controller.signal;
});

describe('googleFonts', () => {
  beforeEach(() => {
    // Create fresh repository instance for each test
    repository = new GoogleFontsRepository();
    // Clear cache before each test
    clearFontCache();

    // Reset fetch mock
    vi.clearAllMocks();
  });

  afterAll(() => {
    // Restore original AbortSignal.timeout
    AbortSignal.timeout = originalAbortSignalTimeout;
  });

  describe('fetchGoogleFont', () => {
    it('should fetch font successfully', async () => {
      // Mock CSS response
      const mockCssResponse = `
        @font-face {
          font-family: 'Roboto';
          src: url(https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.ttf) format('truetype');
        }
      `;

      // Mock font file bytes
      const mockFontBytes = new Uint8Array([0x00, 0x01, 0x00, 0x00]); // TTF magic number

      // Mock fetch calls
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          text: async () => mockCssResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: async () => mockFontBytes.buffer,
        });

      const result = await fetchGoogleFont('Roboto', 400, 'normal');

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(4);
      expect(global.fetch).toHaveBeenCalledTimes(2);

      // Verify API URL construction
      expect(global.fetch).toHaveBeenNthCalledWith(
        1,
        'https://fonts.googleapis.com/css2?family=Roboto:wght@400&display=swap',
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        }),
      );
    });

    it('should cache fetched fonts', async () => {
      const mockCssResponse = `
        @font-face {
          src: url(https://fonts.gstatic.com/test.ttf) format('truetype');
        }
      `;

      const mockFontBytes = new Uint8Array([0x00, 0x01, 0x00, 0x00]);

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          text: async () => mockCssResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: async () => mockFontBytes.buffer,
        });

      // First fetch - should hit network
      await fetchGoogleFont('Roboto', 400, 'normal');
      expect(global.fetch).toHaveBeenCalledTimes(2);

      // Second fetch - should hit cache
      await fetchGoogleFont('Roboto', 400, 'normal');
      expect(global.fetch).toHaveBeenCalledTimes(2); // No additional calls

      // Verify cache stats
      const stats = getFontCacheStats();
      expect(stats.size).toBe(1);
    });

    it('should handle NOT_FOUND error when API returns 404', async () => {
      // Mock API 404 response
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(fetchGoogleFont('NonExistentFont', 400, 'normal')).rejects.toThrow('Google Fonts API returned 404');
    });

    it('should handle PARSE_ERROR when CSS has no font URL', async () => {
      // Mock CSS response without font URL
      const mockCssResponse = `
        @font-face {
          font-family: 'Test';
          /* No src property */
        }
      `;

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        text: async () => mockCssResponse,
      });

      await expect(fetchGoogleFont('Test', 400, 'normal')).rejects.toThrow('Failed to extract font URL');
    });

    it('should handle NETWORK_ERROR when font file fetch fails', async () => {
      const mockCssResponse = `
        @font-face {
          src: url(https://fonts.gstatic.com/test.ttf) format('truetype');
        }
      `;

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          text: async () => mockCssResponse,
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
        });

      await expect(fetchGoogleFont('Test', 400, 'normal')).rejects.toThrow('Failed to download font file: 500');
    });

    it('should handle CSS with no valid font URL', async () => {
      const mockCssResponse = `
        @font-face {
          font-family: 'Inter';
          /* No URL, just CSS */
        }
      `;

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          text: async () => mockCssResponse,
        });

      await expect(fetchGoogleFont('Inter', 400, 'normal')).rejects.toThrow('Failed to extract font URL from CSS');
    });

    it('should handle cache eviction when exceeding MAX_CACHED_FONTS', async () => {
      const mockCssResponse = `
        @font-face {
          src: url(https://fonts.gstatic.com/test.ttf) format('truetype');
        }
      `;

      const mockFontBytes = new Uint8Array([0x00, 0x01, 0x00, 0x00]);

      /**
       * Recursive function to fetch fonts sequentially
       * Avoids await-in-loop ESLint warning
       */
      async function fetchFont(i: number): Promise<void> {
        if (i >= 55) {
          return;
        }

        (global.fetch as ReturnType<typeof vi.fn>)
          .mockResolvedValueOnce({
            ok: true,
            text: async () => mockCssResponse,
          })
          .mockResolvedValueOnce({
            ok: true,
            arrayBuffer: async () => mockFontBytes.buffer,
          });

        await fetchGoogleFont(`Font${i}`, 400, 'normal');
        
        return fetchFont(i + 1);
      }

      await fetchFont(0);

      const stats = getFontCacheStats();
      expect(stats.size).toBeLessThanOrEqual(50);
      expect(stats.size).toBeGreaterThan(0);
    });

    // Note: Size validation happens in fontValidator.ts, not in googleFonts.ts
    // googleFonts.ts downloads and caches fonts without size limits
  });
});
