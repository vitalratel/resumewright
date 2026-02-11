// ABOUTME: Browser downloads API integration for opening and showing downloads.
// ABOUTME: Searches for downloads by filename and provides open/show actions.

import type { Accessor } from 'solid-js';
import { createEffect, createSignal, onCleanup } from 'solid-js';
import { getLogger } from '@/shared/infrastructure/logging/instance';

interface BrowserDownloadsResult {
  downloadId: Accessor<number | null>;
  isAvailable: Accessor<boolean>;
  apiAvailable: Accessor<boolean>;
  error: Accessor<string | null>;
  openDownload: () => void;
  showInFolder: () => void;
}

/**
 * Check if browser downloads API is available.
 */
function checkDownloadsAPI(): boolean {
  try {
    return !!(
      browser?.downloads != null &&
      typeof browser.downloads.search === 'function' &&
      typeof browser.downloads.open === 'function' &&
      typeof browser.downloads.show === 'function'
    );
  } catch {
    return false;
  }
}

/**
 * Manage browser download lookup and actions for a given filename.
 *
 * @param filename - The filename to search for in browser downloads
 * @returns Object with download state accessors and action methods
 */
export function createBrowserDownloads(filename: string | undefined): BrowserDownloadsResult {
  const isAPIAvailable = checkDownloadsAPI();

  const [apiAvailable] = createSignal(isAPIAvailable);
  const [downloadId, setDownloadId] = createSignal<number | null>(null);
  const [error, setError] = createSignal<string | null>(
    isAPIAvailable ? null : 'Downloads API unavailable',
  );

  if (!isAPIAvailable) {
    getLogger().warn('BrowserDownloads', 'Downloads API not available');
  }

  // Search for download when filename is provided and API is available
  if (isAPIAvailable && filename != null && filename !== '') {
    let cancelled = false;

    browser.downloads
      .search({
        filename,
        orderBy: ['-startTime'],
        limit: 1,
      })
      .then((results) => {
        if (cancelled) return;

        if (results?.[0] != null) {
          setDownloadId(results[0].id);
        } else {
          setError('Download not found');
        }
      })
      .catch((err) => {
        if (cancelled) return;

        const message = err instanceof Error ? err.message : 'Unknown error';
        getLogger().error('BrowserDownloads', 'Failed to search downloads', { message });
        setError(`Failed to search downloads: ${message}`);
      });

    onCleanup(() => {
      cancelled = true;
    });
  }

  const isAvailable = () => apiAvailable() && downloadId() != null;

  const openDownload = () => {
    const id = downloadId();
    if (id == null || !apiAvailable() || browser?.downloads == null) {
      setError('Cannot open download: API not available or download not found');
      return;
    }

    setError(null);
    browser.downloads.open(id).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : 'Unknown error';
      getLogger().error('BrowserDownloads', 'Failed to open download', { message });
      setError(`Failed to open download: ${message}`);
    });
  };

  const showInFolder = () => {
    const id = downloadId();
    if (id == null || !apiAvailable() || browser?.downloads == null) {
      setError('Cannot show in folder: API not available or download not found');
      return;
    }

    setError(null);
    try {
      browser.downloads.show(id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      getLogger().error('BrowserDownloads', 'Failed to show download in folder', { message });
      setError(`Failed to show in folder: ${message}`);
    }
  };

  return {
    downloadId,
    isAvailable,
    apiAvailable,
    error,
    openDownload,
    showInFolder,
  };
}
