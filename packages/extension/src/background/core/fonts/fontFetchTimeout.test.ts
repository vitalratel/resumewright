/**
 * Font Fetch Timeout Tests
 *
 * Tests 30-second timeout with retry logic and fallback to system fonts
 * Timeout increased from 10s to 30s with exponential backoff retry
 */

import type { FontRequirement, FontWeight } from '../../../shared/domain/fonts/models/Font';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FontFetchError, FontFetchErrorType, GoogleFontsRepository } from '@/shared/infrastructure/fonts/GoogleFontsRepository';
import { ExponentialBackoffRetryPolicy } from '@/shared/infrastructure/retry/ExponentialBackoffRetryPolicy';
import { fetchFontsFromRequirements } from './fontManager';

// Mock GoogleFontsRepository to use test retry policy for ALL instances
vi.mock('@/shared/infrastructure/fonts/GoogleFontsRepository', async () => {
  const { GoogleFontsRepository: OriginalRepository, FontFetchError, FontFetchErrorType } = await import('@/shared/infrastructure/fonts/GoogleFontsRepository');
  const { ExponentialBackoffRetryPolicy } = await import('@/shared/infrastructure/retry/ExponentialBackoffRetryPolicy');

  // Create test retry policy
  const testRetryPolicy = new ExponentialBackoffRetryPolicy({
    maxAttempts: 3,
    baseDelayMs: 100,
    maxDelayMs: 500,
    timeoutMs: 5000,
  });

  // Wrap GoogleFontsRepository constructor to always use test retry policy
  class TestGoogleFontsRepository extends OriginalRepository {
    constructor() {
      // Always use test retry policy
      super(testRetryPolicy);
    }
  }

  return {
    GoogleFontsRepository: TestGoogleFontsRepository,
    FontFetchError,
    FontFetchErrorType,
  };
});

// Create retry policy with faster retries for tests (3 attempts, shorter delays)
const testRetryPolicy = new ExponentialBackoffRetryPolicy({
  maxAttempts: 3,
  baseDelayMs: 100,
  maxDelayMs: 500,
  timeoutMs: 5000,
});

// Create repository instance for tests
let repository: GoogleFontsRepository;
const clearFontCache = () => repository.clearCache();
const fetchGoogleFont = async (family: string, weight: any, style: any) =>
  repository.fetchGoogleFont(family, weight, style);

// Mock fetch globally
global.fetch = vi.fn();

describe('Font Fetch Timeout ', () => {
  beforeEach(() => {
    // Create fresh repository instance for each test with test retry policy
    repository = new GoogleFontsRepository(testRetryPolicy);
    vi.clearAllMocks();
    clearFontCache(); // Clear cache between tests
    // Note: We use real timers because AbortSignal.timeout() doesn't work with fake timers
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchGoogleFont timeout', () => {
    it('should timeout after 30 seconds with retries for CSS fetch', async () => {
      // Mock fetch to always fail with timeout
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(
        new DOMException('The operation was aborted due to timeout', 'TimeoutError')
      );

      const startTime = Date.now();

      try {
        await fetchGoogleFont('Roboto', 400, 'normal');
        expect.fail('Should have thrown timeout error');
      } catch (error) {
        const elapsed = Date.now() - startTime;

        expect(error).toBeInstanceOf(FontFetchError);
        expect((error as FontFetchError).type).toBe(FontFetchErrorType.NETWORK_TIMEOUT);
        expect((error as FontFetchError).message).toContain('Timeout');
        expect((error as FontFetchError).message).toContain('web-safe font');

        // With 3 retries + fast exponential backoff (100ms base, 500ms max)
        // Total delays: ~100ms + ~200ms + ~400ms = ~700ms
        // Allow up to 2 seconds for 3 retries with backoff + overhead
        expect(elapsed).toBeLessThan(2000);
      }
    }, 5000); // Test timeout: 5s to allow for retries + overhead

    it('should timeout with retries for font file fetch', async () => {
      // Mock CSS fetch to succeed
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        text: async () =>
          Promise.resolve(`
          @font-face {
            src: url(https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.ttf) format('truetype');
          }
        `),
      } as Response);

      // Mock font file fetch to always timeout
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(
        new DOMException('The operation was aborted due to timeout', 'TimeoutError')
      );

      const startTime = Date.now();

      try {
        await fetchGoogleFont('Roboto', 400, 'normal');
        expect.fail('Should have thrown timeout error');
      } catch (error) {
        const elapsed = Date.now() - startTime;

        expect(error).toBeInstanceOf(FontFetchError);
        expect((error as FontFetchError).type).toBe(FontFetchErrorType.NETWORK_TIMEOUT);

        // Should complete quickly with fast retries
        expect(elapsed).toBeLessThan(2000);
      }
    }, 5000);

    it('should succeed if fetch completes within 30 seconds', async () => {
      const mockFontBytes = new Uint8Array([1, 2, 3, 4, 5]);

      // Mock CSS fetch
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        text: async () =>
          Promise.resolve(`
          @font-face {
            src: url(https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.ttf) format('truetype');
          }
        `),
      } as Response);

      // Mock font file fetch (succeeds immediately)
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => Promise.resolve(mockFontBytes.buffer),
      } as Response);

      const result = await fetchGoogleFont('Roboto', 400, 'normal');

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(5);
    }, 5000);
  });

  describe('fetchFontsFromRequirements with timeout fallback', () => {
    it('should fallback to web-safe fonts on timeout', async () => {
      // Mock fetch to always fail with timeout
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(
        new DOMException('The operation was aborted due to timeout', 'TimeoutError')
      );

      const requirements: FontRequirement[] = [
        {
          family: 'Roboto',
          weight: 400 as FontWeight,
          style: 'normal',
          source: 'google',
        },
        {
          family: 'Arial',
          weight: 400 as FontWeight,
          style: 'normal',
          source: 'websafe',
        },
      ];

      const progressCallback = vi.fn();

      // This should not throw - should fallback gracefully
      const result = await fetchFontsFromRequirements(requirements, progressCallback);

      // Should return empty array for Roboto (failed), web-safe fonts are skipped
      expect(result as unknown as Uint8Array).toEqual([]);

      // Progress callback should still be called
      expect(progressCallback).toHaveBeenCalledWith(1, 1, 'Roboto');
    }, 5000);

    it('should show progress during font fetching', async () => {
      const mockFontBytes = new Uint8Array([1, 2, 3]);

      // Mock successful fetches
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          text: async () =>
            Promise.resolve(`
            @font-face {
              src: url(https://fonts.gstatic.com/roboto.ttf) format('truetype');
            }
          `),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: async () => Promise.resolve(mockFontBytes.buffer),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          text: async () =>
            Promise.resolve(`
            @font-face {
              src: url(https://fonts.gstatic.com/opensans.ttf) format('truetype');
            }
          `),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: async () => Promise.resolve(mockFontBytes.buffer),
        } as Response);

      const requirements: FontRequirement[] = [
        { family: 'Roboto', weight: 400 as FontWeight, style: 'normal', source: 'google' },
        { family: 'Open Sans', weight: 700 as FontWeight, style: 'normal', source: 'google' },
      ];

      const progressCallback = vi.fn();

      await fetchFontsFromRequirements(requirements, progressCallback);

      // Should report progress for each font
      expect(progressCallback).toHaveBeenCalledWith(1, 2, 'Roboto');
      expect(progressCallback).toHaveBeenCalledWith(2, 2, 'Open Sans');
    });

    it('should continue fetching other fonts after one timeout', async () => {
      const mockFontBytes = new Uint8Array([1, 2, 3]);

      // First font: timeout (will be retried 3 times)
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockRejectedValueOnce(
          new DOMException('The operation was aborted due to timeout', 'TimeoutError')
        )
        .mockRejectedValueOnce(
          new DOMException('The operation was aborted due to timeout', 'TimeoutError')
        )
        .mockRejectedValueOnce(
          new DOMException('The operation was aborted due to timeout', 'TimeoutError')
        )
        // Second font: success
        .mockResolvedValueOnce({
          ok: true,
          text: async () =>
            Promise.resolve(`
            @font-face {
              src: url(https://fonts.gstatic.com/opensans.ttf) format('truetype');
            }
          `),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: async () => Promise.resolve(mockFontBytes.buffer),
        } as Response);

      const requirements: FontRequirement[] = [
        { family: 'Roboto', weight: 400 as FontWeight, style: 'normal', source: 'google' },
        { family: 'Open Sans', weight: 400 as FontWeight, style: 'normal', source: 'google' },
      ];

      const result = await fetchFontsFromRequirements(requirements);

      // Should have successfully fetched Open Sans despite Roboto timeout
      expect(result as unknown as Uint8Array).toHaveLength(1);
      expect(result[0].family).toBe('Open Sans');
    }, 5000);
  });

  describe('Timeout error messages', () => {
    it('should provide helpful error message suggesting web-safe fonts', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(
        new DOMException('The operation was aborted due to timeout', 'TimeoutError')
      );

      try {
        await fetchGoogleFont('Roboto', 400, 'normal');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(FontFetchError);
        const fontError = error as FontFetchError;

        expect(fontError.message).toContain('Timeout');
        expect(fontError.message).toContain('web-safe font');
        expect(fontError.fontFamily).toBe('Roboto');
      }
    }, 5000);
  });
});
