/**
 * Tests for useBrowserDownloads hook
 * Custom hooks testing
 * Error handling in hooks
 * Browser API availability detection
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import browser from 'webextension-polyfill';
import { useBrowserDownloads } from '../integration/useBrowserDownloads';
import { mockDownloadItem, mockSearchResult } from './helpers';

vi.mock('webextension-polyfill', () => ({
  default: {
    downloads: {
      search: vi.fn(),
      open: vi.fn(),
      show: vi.fn(),
    },
  },
}));

// Test utilities for browser API manipulation
const withoutBrowserAPI = <T,>(
  testFn: () => T | Promise<T>
): T | Promise<T> => {
  const orig = browser.downloads;
  (browser as { downloads?: typeof browser.downloads }).downloads = undefined;
  try {
    return testFn();
  } finally {
    (browser as { downloads?: typeof browser.downloads }).downloads = orig;
  }
};

const withoutMethod = <K extends keyof typeof browser.downloads>(
  method: K,
  testFn: () => void | Promise<void>
): void | Promise<void> => {
  const orig = browser.downloads[method];
  (browser.downloads as unknown as { [key: string]: unknown })[method] = undefined;
  try {
    return testFn();
  } finally {
    (browser.downloads as unknown as { [key: string]: unknown })[method] = orig;
  }
};

describe('useBrowserDownloads', () => {
  // Store original browser object for restoration
  let originalDownloads: typeof browser.downloads;

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    
    // Store original for tests that temporarily modify it
    originalDownloads = browser.downloads;
    
    // Set default mock behaviors
    vi.mocked(browser.downloads.search).mockResolvedValue([]);
    vi.mocked(browser.downloads.open).mockResolvedValue(undefined as unknown as void);
    vi.mocked(browser.downloads.show).mockResolvedValue(true as unknown as boolean);
  });

  afterEach(() => {
    // Restore any modified properties
    if ((browser as { downloads?: typeof browser.downloads }).downloads !== originalDownloads) {
      (browser as { downloads?: typeof browser.downloads }).downloads = originalDownloads;
    }
  });

  describe('API Availability Check', () => {
    it('detects when downloads API is available', async () => {
      const { result } = renderHook(() => useBrowserDownloads('test.pdf'));

      await waitFor(() => {
        expect(result.current.apiAvailable).toBe(true);
      });
    });

    it('handles missing downloads API', async () => {
      await withoutBrowserAPI(async () => {
        const { result } = renderHook(() => useBrowserDownloads('test.pdf'));

        await waitFor(() => {
          expect(result.current).toMatchObject({ apiAvailable: false, isAvailable: false });
        });
      });
    });

    it('detects missing search method', async () => {
      await withoutMethod('search', async () => {
        const { result } = renderHook(() => useBrowserDownloads('test.pdf'));

        await waitFor(() => {
          expect(result.current.apiAvailable).toBe(false);
        });
      });
    });

    it('detects missing open method', async () => {
      await withoutMethod('open', async () => {
        const { result } = renderHook(() => useBrowserDownloads('test.pdf'));

        await waitFor(() => {
          expect(result.current.apiAvailable).toBe(false);
        });
      });
    });

    it('detects missing show method', async () => {
      await withoutMethod('show', async () => {
        const { result } = renderHook(() => useBrowserDownloads('test.pdf'));

        await waitFor(() => {
          expect(result.current.apiAvailable).toBe(false);
        });
      });
    });

    it('handles errors during API availability check gracefully', async () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Save original before test
      const originalDownloads = browser.downloads;
      
      try {
        // Mock browser object to throw error when accessed
        Object.defineProperty(browser, 'downloads', {
          get() {
            throw new Error('Browser API access denied');
          },
          configurable: true,
        });

        const { result } = renderHook(() => useBrowserDownloads('test.pdf'));

        await waitFor(() => {
          expect(result.current.apiAvailable).toBe(false);
          expect(result.current.error).toBeTruthy();
        });
        
        expect(result.current.error).toMatch(/Downloads API unavailable/);
        expect(spy).toHaveBeenCalled();
      }
      finally {
        // Restore original in finally block to ensure cleanup
        Object.defineProperty(browser, 'downloads', {
          value: originalDownloads,
          writable: true,
          configurable: true,
        });
        spy.mockRestore();
      }
    });
  });

  describe('Download Search', () => {
    it('searches for download by filename', async () => {
      vi.mocked(browser.downloads.search).mockResolvedValue(
        mockSearchResult([mockDownloadItem(123, 'test.pdf')]),
      );

      const { result } = renderHook(() => useBrowserDownloads('test.pdf'));

      await waitFor(() => {
        expect(result.current).toMatchObject({ downloadId: 123, isAvailable: true });
      });

      expect(browser.downloads.search).toHaveBeenCalledWith({
        filename: 'test.pdf',
        orderBy: ['-startTime'],
        limit: 1,
      });
    });

    it('handles no downloads found', async () => {
      // Explicitly mock empty result since previous test may have changed the mock
      vi.mocked(browser.downloads.search).mockResolvedValue([]);

      const { result } = renderHook(() => useBrowserDownloads('nonexistent.pdf'));

      await waitFor(() => {
        expect(result.current).toMatchObject({ downloadId: null, isAvailable: false });
      });
    });

    it('handles undefined filename', async () => {
      const { result } = renderHook(() => useBrowserDownloads(undefined as unknown as string));

      await waitFor(() => {
        expect(result.current).toMatchObject({ downloadId: null, isAvailable: false });
      });

      expect(browser.downloads.search).not.toHaveBeenCalled();
    });

    it('does not search when API unavailable', async () => {
      const orig = browser.downloads;
      Object.defineProperty(browser, 'downloads', {
        value: undefined,
        configurable: true,
      });

      const { result } = renderHook(() => useBrowserDownloads('test.pdf'));

      await waitFor(() => {
        expect(result.current.apiAvailable).toBe(false);
      });

      expect(vi.mocked(orig.search)).not.toHaveBeenCalled();

      Object.defineProperty(browser, 'downloads', {
        value: orig,
        configurable: true,
      });
    });

    it('selects most recent download when multiple exist', async () => {
      vi.mocked(browser.downloads.search).mockResolvedValue(
        mockSearchResult([
          mockDownloadItem(456, 'test.pdf', '2025-01-02T00:00:00Z'),
          mockDownloadItem(123, 'test.pdf', '2025-01-01T00:00:00Z'),
        ]),
      );

      const { result } = renderHook(() => useBrowserDownloads('test.pdf'));

      await waitFor(() => {
        expect(result.current.downloadId).toBe(456);
      });
    });

    it('handles search error gracefully', async () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(browser.downloads.search).mockRejectedValue(new Error('Permission denied'));

      const { result } = renderHook(() => useBrowserDownloads('test.pdf'));

      await waitFor(() => {
        expect(result.current).toMatchObject({ downloadId: null, isAvailable: false });
      });

      expect(spy).toHaveBeenCalledWith('[ResumeWright] [BrowserDownloads] [ERROR] Failed to search downloads', { message: 'Permission denied' });
      spy.mockRestore();
    });

    it('updates search when filename changes', async () => {
      vi.mocked(browser.downloads.search)
        .mockResolvedValueOnce(mockSearchResult([mockDownloadItem(1, 'first.pdf')]))
        .mockResolvedValueOnce(mockSearchResult([mockDownloadItem(2, 'second.pdf')]));

      const { result, rerender } = renderHook(
        ({ filename }) => useBrowserDownloads(filename),
        { initialProps: { filename: 'first.pdf' } },
      );

      await waitFor(() => expect(result.current.downloadId).toBe(1));

      rerender({ filename: 'second.pdf' });

      await waitFor(() => expect(result.current.downloadId).toBe(2));
      expect(browser.downloads.search).toHaveBeenCalledTimes(2);
    });
  });

  describe('openDownload', () => {
    it('opens download when available', async () => {
      vi.mocked(browser.downloads.search).mockResolvedValue(
        mockSearchResult([mockDownloadItem(123, 'test.pdf')]),
      );

      const { result } = renderHook(() => useBrowserDownloads('test.pdf'));

      await waitFor(() => expect(result.current.downloadId).toBe(123));

      act(() => result.current.openDownload());

      expect(browser.downloads.open).toHaveBeenCalledWith(123);
    });

    it('does not call API when download ID is null', async () => {
      const { result } = renderHook(() => useBrowserDownloads('test.pdf'));

      await waitFor(() => {
        expect(result.current.downloadId).toBe(null);
      });

      act(() => result.current.openDownload());

      expect(browser.downloads.open).not.toHaveBeenCalled();
    });

    it('does not call API when downloads API unavailable', async () => {
      const orig = browser.downloads;
      Object.defineProperty(browser, 'downloads', {
        value: undefined,
        configurable: true,
      });

      const { result } = renderHook(() => useBrowserDownloads('test.pdf'));

      await waitFor(() => {
        expect(result.current.apiAvailable).toBe(false);
      });

      act(() => result.current.openDownload());

      expect(vi.mocked(orig.open)).not.toHaveBeenCalled();

      Object.defineProperty(browser, 'downloads', {
        value: orig,
        configurable: true,
      });
    });

    it('handles open error gracefully', async () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(browser.downloads.search).mockResolvedValue(
        mockSearchResult([mockDownloadItem(123, 'test.pdf')]),
      );
      vi.mocked(browser.downloads.open).mockRejectedValue(new Error('File not found'));

      const { result } = renderHook(() => useBrowserDownloads('test.pdf'));

      await waitFor(() => expect(result.current.downloadId).toBe(123));

      await act(async () => {
        result.current.openDownload();
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      expect(spy).toHaveBeenCalledWith('[ResumeWright] [BrowserDownloads] [ERROR] Failed to open download', { message: 'File not found' });
      spy.mockRestore();
    });
  });

  describe('showInFolder', () => {
    it('shows download in folder when available', async () => {
      vi.mocked(browser.downloads.search).mockResolvedValue(
        mockSearchResult([mockDownloadItem(123, 'test.pdf')]),
      );

      const { result } = renderHook(() => useBrowserDownloads('test.pdf'));

      await waitFor(() => expect(result.current.downloadId).toBe(123));

      act(() => result.current.showInFolder());

      expect(browser.downloads.show).toHaveBeenCalledWith(123);
    });

    it('does not call API when download ID is null', async () => {
      const { result } = renderHook(() => useBrowserDownloads('test.pdf'));

      await waitFor(() => {
        expect(result.current.downloadId).toBe(null);
      });

      act(() => result.current.showInFolder());

      expect(browser.downloads.show).not.toHaveBeenCalled();
    });

    it('does not call API when downloads API unavailable', async () => {
      const orig = browser.downloads;
      Object.defineProperty(browser, 'downloads', {
        value: undefined,
        configurable: true,
      });

      const { result } = renderHook(() => useBrowserDownloads('test.pdf'));

      await waitFor(() => {
        expect(result.current.apiAvailable).toBe(false);
      });

      act(() => result.current.showInFolder());

      expect(vi.mocked(orig.show)).not.toHaveBeenCalled();

      Object.defineProperty(browser, 'downloads', {
        value: orig,
        configurable: true,
      });
    });

    it('handles show error gracefully', async () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(browser.downloads.search).mockResolvedValue(
        mockSearchResult([mockDownloadItem(123, 'test.pdf')]),
      );
      vi.mocked(browser.downloads.show).mockRejectedValue(new Error('Folder not found'));

      const { result } = renderHook(() => useBrowserDownloads('test.pdf'));

      await waitFor(() => expect(result.current.downloadId).toBe(123));

      await act(async () => {
        result.current.showInFolder();
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      expect(spy).toHaveBeenCalledWith('[ResumeWright] [BrowserDownloads] [ERROR] Failed to show download in folder', { message: 'Folder not found' });
      spy.mockRestore();
    });
  });

  describe('isAvailable', () => {
    it('is true when API available and download found', async () => {
      vi.mocked(browser.downloads.search).mockResolvedValue(
        mockSearchResult([mockDownloadItem(123, 'test.pdf')]),
      );

      const { result } = renderHook(() => useBrowserDownloads('test.pdf'));

      await waitFor(() => expect(result.current.isAvailable).toBe(true));
    });

    it('is false when API available but no download found', async () => {
      const { result } = renderHook(() => useBrowserDownloads('test.pdf'));

      await waitFor(() => expect(result.current.isAvailable).toBe(false));
    });

    it('is false when API unavailable', async () => {
      const orig = browser.downloads;
      Object.defineProperty(browser, 'downloads', {
        value: undefined,
        configurable: true,
      });

      const { result } = renderHook(() => useBrowserDownloads('test.pdf'));

      await waitFor(() => {
        expect(result.current.isAvailable).toBe(false);
      });

      Object.defineProperty(browser, 'downloads', {
        value: orig,
        configurable: true,
      });
    });

    it('is false when download ID is null', async () => {
      const { result } = renderHook(() => useBrowserDownloads('test.pdf'));

      await waitFor(() => {
        expect(result.current).toMatchObject({ downloadId: null, isAvailable: false });
      });
    });
  });

  describe('Hook Stability', () => {
    it('returns stable function references', async () => {
      vi.mocked(browser.downloads.search).mockResolvedValue(
        mockSearchResult([mockDownloadItem(123, 'test.pdf')]),
      );

      const { result, rerender } = renderHook(() => useBrowserDownloads('test.pdf'));

      await waitFor(() => expect(result.current.downloadId).toBe(123));

      const first = { open: result.current.openDownload, show: result.current.showInFolder };

      rerender();

      const second = { open: result.current.openDownload, show: result.current.showInFolder };

      expect(first.open).toBe(second.open);
      expect(first.show).toBe(second.show);
    });

    it('updates when downloadId changes', async () => {
      vi.mocked(browser.downloads.search)
        .mockResolvedValueOnce(mockSearchResult([mockDownloadItem(1, 'first.pdf')]))
        .mockResolvedValueOnce(mockSearchResult([mockDownloadItem(2, 'second.pdf')]));

      const { result, rerender } = renderHook(
        ({ filename }) => useBrowserDownloads(filename),
        { initialProps: { filename: 'first.pdf' } },
      );

      await waitFor(() => expect(result.current.downloadId).toBe(1));

      rerender({ filename: 'second.pdf' });

      await waitFor(() => expect(result.current.downloadId).toBe(2));
    });
  });

  describe('Edge Cases', () => {
    it('handles empty filename', async () => {
      const { result } = renderHook(() => useBrowserDownloads(''));

      await waitFor(() => {
        expect(result.current).toMatchObject({ downloadId: null, isAvailable: false });
      });
      
      expect(browser.downloads.search).not.toHaveBeenCalled();
    });

    it('handles special characters in filename', async () => {
      const filename = 'résumé-john_doe (2024).pdf';
      vi.mocked(browser.downloads.search).mockResolvedValue(
        mockSearchResult([mockDownloadItem(123, filename)]),
      );

      const { result } = renderHook(() => useBrowserDownloads(filename));

      await waitFor(() => expect(result.current.downloadId).toBe(123));

      expect(browser.downloads.search).toHaveBeenCalledWith({
        filename,
        orderBy: ['-startTime'],
        limit: 1,
      });
    });

    it('handles null browser downloads object mid-operation', async () => {
      vi.mocked(browser.downloads.search).mockResolvedValue(
        mockSearchResult([mockDownloadItem(123, 'test.pdf')]),
      );

      const { result } = renderHook(() => useBrowserDownloads('test.pdf'));

      await waitFor(() => expect(result.current.downloadId).toBe(123));

      const orig = browser.downloads;
      
      act(() => {
        Object.defineProperty(browser, 'downloads', {
          value: null,
          configurable: true,
        });
      });

      expect(() => {
        result.current.openDownload();
        result.current.showInFolder();
      }).not.toThrow();

      Object.defineProperty(browser, 'downloads', {
        value: orig,
        configurable: true,
      });
    });
  });
});
