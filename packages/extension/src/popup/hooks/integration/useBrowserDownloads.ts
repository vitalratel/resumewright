/**
 * useBrowserDownloads Hook - Refactored Version
 *
 * Clean Architecture Principles:
 * 1. Single Responsibility - Each hook does one thing
 * 2. Separation of Concerns - API, search, actions separated
 * 3. Proper async cleanup
 * 4. No unnecessary queueMicrotask
 */

import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { getLogger } from '@/shared/infrastructure/logging';

// ============================================================================
// TYPES
// ============================================================================

interface UseBrowserDownloadsResult {
  downloadId: number | null;
  isAvailable: boolean;
  apiAvailable: boolean;
  error: string | null;
  openDownload: () => void;
  showInFolder: () => void;
}

// ============================================================================
// UTILITY: API DETECTION
// ============================================================================

/**
 * Check if browser downloads API is available
 * Extracted to pure function for testability
 */
function checkDownloadsAPI(): boolean {
  try {
    return !!(
      browser?.downloads !== null &&
      browser?.downloads !== undefined &&
      typeof browser.downloads.search === 'function' &&
      typeof browser.downloads.open === 'function' &&
      typeof browser.downloads.show === 'function'
    );
  } catch {
    return false;
  }
}

// ============================================================================
// SUB-HOOK: API Availability
// ============================================================================

/**
 * Hook to detect if downloads API is available
 * Single Responsibility: Only checks API availability
 */
function useDownloadsAPIAvailability() {
  const apiAvailable = useState<boolean>(() => checkDownloadsAPI())[0];
  const error = useState<string | null>(() => {
    try {
      const hasAPI = checkDownloadsAPI();
      if (!hasAPI) {
        getLogger().warn('BrowserDownloads', 'Downloads API not available');
        return 'Downloads API unavailable';
      }
      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error checking API';
      getLogger().warn('BrowserDownloads', 'Downloads API check failed', { message });
      return `Downloads API unavailable: ${message}`;
    }
  })[0];

  return { apiAvailable, error };
}

// ============================================================================
// SUB-HOOK: Download Search
// ============================================================================

interface SearchState {
  downloadId: number | null;
  error: string | null;
  isSearching: boolean;
}

type SearchAction =
  | { type: 'SEARCH_START' }
  | { type: 'SEARCH_SUCCESS'; downloadId: number }
  | { type: 'SEARCH_NOT_FOUND' }
  | { type: 'SEARCH_ERROR'; error: string }
  | { type: 'RESET' };

function searchReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case 'SEARCH_START':
      return { downloadId: null, error: null, isSearching: true };
    case 'SEARCH_SUCCESS':
      return { downloadId: action.downloadId, error: null, isSearching: false };
    case 'SEARCH_NOT_FOUND':
      return { downloadId: null, error: 'Download not found', isSearching: false };
    case 'SEARCH_ERROR':
      return { downloadId: null, error: action.error, isSearching: false };
    case 'RESET':
      return { downloadId: null, error: null, isSearching: false };
    default:
      return state;
  }
}

/**
 * Hook to search for downloads by filename
 * Single Responsibility: Only searches for downloads
 * Uses useReducer to avoid setState in useEffect anti-pattern
 */
function useDownloadSearch(filename: string | undefined, apiAvailable: boolean) {
  const [state, dispatch] = useReducer(searchReducer, {
    downloadId: null,
    error: null,
    isSearching: false,
  });

  // Track if we should ignore results (component unmounted or deps changed)
  const ignoreRef = useRef<boolean>(false);

  useEffect(() => {
    // Reset ignore flag for this effect run
    ignoreRef.current = false;

    // Guard: Skip if no filename or API unavailable
    if (filename === null || filename === undefined || filename === '' || !apiAvailable) {
      return;
    }

    // Dispatch search start action
    dispatch({ type: 'SEARCH_START' });

    // Perform search
    browser.downloads
      .search({
        filename,
        orderBy: ['-startTime'],
        limit: 1,
      })
      .then((results) => {
        // Ignore if component unmounted or deps changed
        if (ignoreRef.current) return;

        if (
          results !== null &&
          results !== undefined &&
          results[0] !== null &&
          results[0] !== undefined
        ) {
          dispatch({ type: 'SEARCH_SUCCESS', downloadId: results[0].id });
        } else {
          dispatch({ type: 'SEARCH_NOT_FOUND' });
        }
      })
      .catch((err) => {
        // Ignore if component unmounted or deps changed
        if (ignoreRef.current) return;

        const message = err instanceof Error ? err.message : 'Unknown error';
        getLogger().error('BrowserDownloads', 'Failed to search downloads', { message });
        dispatch({ type: 'SEARCH_ERROR', error: `Failed to search downloads: ${message}` });
      });

    // Cleanup: Mark results as stale
    return () => {
      ignoreRef.current = true;
    };
  }, [filename, apiAvailable]);

  return state;
}

// ============================================================================
// SUB-HOOK: Download Actions
// ============================================================================

/**
 * Hook for download actions (open, show)
 * Single Responsibility: Only provides action methods
 */
function useDownloadActions(downloadId: number | null, apiAvailable: boolean) {
  const [actionError, setActionError] = useState<string | null>(null);

  const openDownload = useCallback(() => {
    if (
      downloadId === null ||
      downloadId === undefined ||
      !apiAvailable ||
      browser?.downloads === null ||
      browser?.downloads === undefined
    ) {
      setActionError('Cannot open download: API not available or download not found');
      return;
    }

    setActionError(null);
    browser.downloads.open(downloadId).catch((err) => {
      const message = err instanceof Error ? err.message : 'Unknown error';
      getLogger().error('BrowserDownloads', 'Failed to open download', { message });
      setActionError(`Failed to open download: ${message}`);
    });
  }, [downloadId, apiAvailable]);

  const showInFolder = useCallback(() => {
    if (
      downloadId === null ||
      downloadId === undefined ||
      !apiAvailable ||
      browser?.downloads === null ||
      browser?.downloads === undefined
    ) {
      setActionError('Cannot show in folder: API not available or download not found');
      return;
    }

    setActionError(null);
    try {
      browser.downloads.show(downloadId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      getLogger().error('BrowserDownloads', 'Failed to show download in folder', { message });
      setActionError(`Failed to show in folder: ${message}`);
    }
  }, [downloadId, apiAvailable]);

  return { openDownload, showInFolder, actionError };
}

// ============================================================================
// MAIN HOOK: Composition
// ============================================================================

/**
 * Main hook that composes sub-hooks
 * Clean Architecture: Composition over complexity
 */
export function useBrowserDownloads(filename: string | undefined): UseBrowserDownloadsResult {
  // Sub-hook: API availability
  const { apiAvailable, error: apiError } = useDownloadsAPIAvailability();

  // Sub-hook: Download search
  const { downloadId, error: searchError } = useDownloadSearch(filename, apiAvailable);

  // Sub-hook: Download actions
  const { openDownload, showInFolder, actionError } = useDownloadActions(downloadId, apiAvailable);

  // Combine errors (priority: action > search > api)
  const error =
    actionError !== null && actionError !== undefined && actionError !== ''
      ? actionError
      : searchError !== null && searchError !== undefined && searchError !== ''
        ? searchError
        : apiError;

  return {
    downloadId,
    isAvailable: Boolean(apiAvailable && downloadId !== null && downloadId !== undefined),
    apiAvailable,
    error,
    openDownload,
    showInFolder,
  };
}
