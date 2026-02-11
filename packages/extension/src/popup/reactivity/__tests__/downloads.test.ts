/**
 * ABOUTME: Tests for browser downloads reactive functions.
 * ABOUTME: Validates API detection, download search, actions, and error handling.
 */

import { renderHook } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockLogger = {
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
};

vi.mock('@/shared/infrastructure/logging/instance', () => ({
  getLogger: () => mockLogger,
}));

const { createBrowserDownloads } = await import('../downloads');

/** Flush microtask queue so resolved promises settle */
function flushPromises() {
  return new Promise<void>((resolve) => {
    queueMicrotask(resolve);
  });
}

describe('createBrowserDownloads', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('API Detection', () => {
    it('reports apiAvailable=true when browser.downloads exists', () => {
      const { result } = renderHook(() => createBrowserDownloads(undefined));

      expect(result.apiAvailable()).toBe(true);
    });
  });

  describe('Download Search', () => {
    it('starts with downloadId=null', () => {
      const { result } = renderHook(() => createBrowserDownloads(undefined));

      expect(result.downloadId()).toBeNull();
    });

    it('does not search when filename is undefined', async () => {
      vi.mocked(browser.downloads.search).mockClear();

      renderHook(() => createBrowserDownloads(undefined));

      await flushPromises();

      expect(browser.downloads.search).not.toHaveBeenCalled();
    });

    it('does not search when filename is empty string', async () => {
      vi.mocked(browser.downloads.search).mockClear();

      renderHook(() => createBrowserDownloads(''));

      await flushPromises();

      expect(browser.downloads.search).not.toHaveBeenCalled();
    });

    it('searches for download by filename', async () => {
      vi.mocked(browser.downloads.search).mockResolvedValue([
        { id: 42 } as browser.downloads.DownloadItem,
      ]);

      const { result } = renderHook(() => createBrowserDownloads('resume.pdf'));

      await flushPromises();

      expect(browser.downloads.search).toHaveBeenCalledWith(
        expect.objectContaining({ filename: 'resume.pdf' }),
      );
      expect(result.downloadId()).toBe(42);
    });

    it('sets error when download not found', async () => {
      vi.mocked(browser.downloads.search).mockResolvedValue([]);

      const { result } = renderHook(() => createBrowserDownloads('missing.pdf'));

      await flushPromises();

      expect(result.downloadId()).toBeNull();
      expect(result.error()).toBe('Download not found');
    });

    it('handles search error gracefully', async () => {
      vi.mocked(browser.downloads.search).mockRejectedValue(new Error('Search failed'));

      const { result } = renderHook(() => createBrowserDownloads('resume.pdf'));

      await flushPromises();

      expect(result.downloadId()).toBeNull();
      expect(result.error()).toContain('Search failed');
    });
  });

  describe('isAvailable', () => {
    it('is true when API available and download found', async () => {
      vi.mocked(browser.downloads.search).mockResolvedValue([
        { id: 42 } as browser.downloads.DownloadItem,
      ]);

      const { result } = renderHook(() => createBrowserDownloads('resume.pdf'));

      await flushPromises();

      expect(result.isAvailable()).toBe(true);
    });

    it('is false when API available but no download', () => {
      const { result } = renderHook(() => createBrowserDownloads(undefined));

      expect(result.isAvailable()).toBe(false);
    });
  });

  describe('Actions', () => {
    let openSpy: ReturnType<typeof vi.spyOn>;
    let showSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      openSpy = vi.spyOn(browser.downloads, 'open').mockResolvedValue(undefined as never);
      showSpy = vi.spyOn(browser.downloads, 'show').mockReturnValue(undefined as never);
    });

    afterEach(() => {
      openSpy.mockRestore();
      showSpy.mockRestore();
    });

    it('opens download by id', async () => {
      vi.mocked(browser.downloads.search).mockResolvedValue([
        { id: 42 } as browser.downloads.DownloadItem,
      ]);

      const { result } = renderHook(() => createBrowserDownloads('resume.pdf'));

      await flushPromises();

      result.openDownload();

      expect(openSpy).toHaveBeenCalledWith(42);
    });

    it('shows download in folder', async () => {
      vi.mocked(browser.downloads.search).mockResolvedValue([
        { id: 42 } as browser.downloads.DownloadItem,
      ]);

      const { result } = renderHook(() => createBrowserDownloads('resume.pdf'));

      await flushPromises();

      result.showInFolder();

      expect(showSpy).toHaveBeenCalledWith(42);
    });

    it('sets error when opening without download id', () => {
      const { result } = renderHook(() => createBrowserDownloads(undefined));

      result.openDownload();

      expect(result.error()).toBeTruthy();
    });

    it('sets error when showing in folder without download id', () => {
      const { result } = renderHook(() => createBrowserDownloads(undefined));

      result.showInFolder();

      expect(result.error()).toBeTruthy();
    });

    it('handles open error gracefully', async () => {
      vi.mocked(browser.downloads.search).mockResolvedValue([
        { id: 42 } as browser.downloads.DownloadItem,
      ]);
      openSpy.mockRejectedValue(new Error('Cannot open'));

      const { result } = renderHook(() => createBrowserDownloads('resume.pdf'));

      await flushPromises();

      result.openDownload();

      await flushPromises();

      expect(result.error()).toContain('Cannot open');
    });

    it('handles show error gracefully', async () => {
      vi.mocked(browser.downloads.search).mockResolvedValue([
        { id: 42 } as browser.downloads.DownloadItem,
      ]);
      showSpy.mockImplementation(() => {
        throw new Error('Cannot show');
      });

      const { result } = renderHook(() => createBrowserDownloads('resume.pdf'));

      await flushPromises();

      result.showInFolder();

      expect(result.error()).toContain('Cannot show');
    });
  });
});
