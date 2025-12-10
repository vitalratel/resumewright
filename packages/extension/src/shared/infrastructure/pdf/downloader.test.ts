// ABOUTME: Tests for PDF download functionality.
// ABOUTME: Verifies browser.downloads API usage and blob URL handling.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { downloadPDF } from './downloader';

// Mock URL APIs
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

// Mock browser downloads API using vi.hoisted for proper hoisting
const mocks = vi.hoisted(() => ({
  download: vi.fn(),
}));

vi.mock('wxt/browser', () => ({
  browser: {
    downloads: {
      download: mocks.download,
    },
  },
}));

// Silence error logs during tests
vi.mock('../../infrastructure/logging/instance', () => ({
  getLogger: () => ({ error: vi.fn() }),
}));

describe('downloader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('downloadPDF', () => {
    const mockPdfBytes = new Uint8Array([37, 80, 68, 70, 45, 49, 46, 52]); // "%PDF-1.4"

    it('should download PDF with browser.downloads API', async () => {
      mocks.download.mockResolvedValue(123);

      await downloadPDF(mockPdfBytes, 'test.pdf');

      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(mocks.download).toHaveBeenCalledWith({
        url: 'blob:mock-url',
        filename: 'test.pdf',
        saveAs: false,
      });
    });

    it('should use generated filename when not provided', async () => {
      mocks.download.mockResolvedValue(123);

      await downloadPDF(mockPdfBytes);

      const call = mocks.download.mock.calls[0][0];
      expect(call.filename).toMatch(/Resume_\d{4}-\d{2}-\d{2}\.pdf/);
      expect(call.saveAs).toBe(false);
      expect(call.url).toBe('blob:mock-url');
    });

    it('should revoke blob URL after timeout', async () => {
      mocks.download.mockResolvedValue(123);

      await downloadPDF(mockPdfBytes, 'test.pdf');

      expect(global.URL.revokeObjectURL).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1000);

      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('should throw when browser.downloads not available', async () => {
      const { browser } = await import('wxt/browser');
      const originalDownloads = browser.downloads;
      Object.defineProperty(browser, 'downloads', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      await expect(downloadPDF(mockPdfBytes, 'test.pdf')).rejects.toThrow(
        'browser.downloads API not available',
      );

      Object.defineProperty(browser, 'downloads', {
        value: originalDownloads,
        writable: true,
        configurable: true,
      });
    });

    it('should revoke URL on download error', async () => {
      mocks.download.mockRejectedValue(new Error('Download failed'));

      await expect(downloadPDF(mockPdfBytes, 'test.pdf')).rejects.toThrow('Download failed');

      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('should handle empty PDF bytes', async () => {
      mocks.download.mockResolvedValue(123);
      const emptyBytes = new Uint8Array([]);

      await downloadPDF(emptyBytes, 'test.pdf');

      expect(mocks.download).toHaveBeenCalled();
    });
  });
});
