/**
 * PDF Downloader Tests
 */

import type { Logger } from '../../infrastructure/logging';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetLogger, setLogger } from '../../infrastructure/logging';
import { downloadPDF } from './downloader';

// Mock browser
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

vi.mock('webextension-polyfill', () => ({
  default: {
    downloads: {
      download: vi.fn(),
    },
  },
}));



describe('downloader', () => {
  const mockLogger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  } as unknown as Logger;

  beforeEach(() => {
    vi.clearAllMocks();
    setLogger(mockLogger);
    vi.useFakeTimers();
  });

  afterEach(() => {
    resetLogger();
    vi.useRealTimers();
  });

  describe('downloadPDF', () => {
    const mockPdfBytes = new Uint8Array([37, 80, 68, 70, 45, 49, 46, 52]); // "%PDF-1.4"

    it('should download PDF with browser.downloads API', async () => {
      const browser = (await import('webextension-polyfill')).default;
      vi.mocked(browser.downloads.download).mockResolvedValue(123);

      await downloadPDF(mockPdfBytes, 'test.pdf');

      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(browser.downloads.download).toHaveBeenCalledWith({
        url: 'blob:mock-url',
        filename: 'test.pdf',
        saveAs: false,
      });
    });

    it('should use generated filename when not provided', async () => {
      const browser = (await import('webextension-polyfill')).default;
      vi.mocked(browser.downloads.download).mockResolvedValue(123);

      await downloadPDF(mockPdfBytes);

      const call = vi.mocked(browser.downloads.download).mock.calls[0][0];
      expect(call.filename).toMatch(/Resume_\d{4}-\d{2}-\d{2}\.pdf/);
      expect(call.saveAs).toBe(false);
      expect(call.url).toBe('blob:mock-url');
    });

    it('should revoke blob URL after timeout', async () => {
      const browser = (await import('webextension-polyfill')).default;
      vi.mocked(browser.downloads.download).mockResolvedValue(123);

      await downloadPDF(mockPdfBytes, 'test.pdf');

      expect(global.URL.revokeObjectURL).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1000);

      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('should throw when browser.downloads not available', async () => {
      const module = await import('webextension-polyfill');
      const originalDownloads = module.default.downloads;
      Object.defineProperty(module.default, 'downloads', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      await expect(downloadPDF(mockPdfBytes, 'test.pdf')).rejects.toThrow(
        'browser.downloads API not available',
      );

      Object.defineProperty(module.default, 'downloads', {
        value: originalDownloads,
        writable: true,
        configurable: true,
      });
    });

    it('should revoke URL on download error', async () => {
      const browser = (await import('webextension-polyfill')).default;
      vi.mocked(browser.downloads.download).mockRejectedValue(new Error('Download failed'));

      await expect(downloadPDF(mockPdfBytes, 'test.pdf')).rejects.toThrow('Download failed');

      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('should handle empty PDF bytes', async () => {
      const browser = (await import('webextension-polyfill')).default;
      vi.mocked(browser.downloads.download).mockResolvedValue(123);
      const emptyBytes = new Uint8Array([]);

      await downloadPDF(emptyBytes, 'test.pdf');

      expect(browser.downloads.download).toHaveBeenCalled();
    });
  });
});
