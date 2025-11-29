/**
 * Custom Fonts Component
 * Settings UI for custom font upload
 *
 * Features:
 * - Upload .ttf/.woff/.woff2 font files
 * - Display uploaded fonts with metadata
 * - Delete custom fonts
 * - Show storage usage statistics
 */

import type { CustomFont } from '@/shared/domain/fonts/models/Font';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import browser from 'webextension-polyfill';
import { CUSTOM_FONT_LIMITS } from '@/shared/domain/fonts/models/Font';
import { getLogger } from '@/shared/infrastructure/logging';
import { MessageType } from '@/shared/types/messages';
import { tokens } from '../styles/tokens';
import { formatFileSize } from '../utils/formatting';
import { Alert } from './common';
import { FontList } from './settings/FontList';
import { FontUpload } from './settings/FontUpload';

export const CustomFonts = React.memo(() => {
  const [fonts, setFonts] = useState<CustomFont[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [storageStats, setStorageStats] = useState({ count: 0, totalSize: 0 });

  // Load fonts on mount
  useEffect(() => {
    const loadFontsAsync = async () => {
      try {
        // Fetch fonts via message passing
        const fontsResponse: { fonts: CustomFont[] } = await browser.runtime.sendMessage({
          type: MessageType.LIST_CUSTOM_FONTS,
          payload: {},
        });
        setFonts(fontsResponse.fonts);

        // Fetch stats via message passing
        const statsResponse: { count: number; totalSize: number } = await browser.runtime.sendMessage({
          type: MessageType.GET_CUSTOM_FONT_STATS,
          payload: {},
        });
        setStorageStats(statsResponse);
      }
      catch (err) {
        getLogger().error('CustomFonts', 'Failed to load custom fonts', err);
      }
    };

    void loadFontsAsync();
  }, []);

  const loadFonts = useCallback(async () => {
    try {
      // Fetch fonts via message passing
      const fontsResponse: { fonts: CustomFont[] } = await browser.runtime.sendMessage({
        type: MessageType.LIST_CUSTOM_FONTS,
        payload: {},
      });
      setFonts(fontsResponse.fonts);

      // Fetch stats via message passing
      const statsResponse: { count: number; totalSize: number } = await browser.runtime.sendMessage({
        type: MessageType.GET_CUSTOM_FONT_STATS,
        payload: {},
      });
      setStorageStats(statsResponse);
    }
    catch (err) {
      getLogger().error('CustomFonts', 'Failed to load custom fonts', err);
    }
  }, []);

  const handleUploadSuccess = async () => {
    setSuccess('Font uploaded successfully');
    setTimeout(() => setSuccess(null), 3000);
    setError(null);
    await loadFonts();
  };

  const handleDeleteSuccess = (_id: string, family: string) => {
    setSuccess(`Deleted ${family}`);
    setTimeout(() => setSuccess(null), 3000);
    void loadFonts();
  };

  const handleDeleteError = (err: Error) => {
    setError(err.message);
  };

  const storagePercentage = (storageStats.totalSize / CUSTOM_FONT_LIMITS.MAX_TOTAL_SIZE) * 100;

  // Memoize inline style to prevent unnecessary re-renders
  const storageBarStyle = useMemo(() => ({
    width: `${Math.min(storagePercentage, 100)}%`,
  }), [storagePercentage]);

  // P1-REACT-PERF: Memoize error dismiss handler
  const handleDismissError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <div className={`border-t ${tokens.spacing.card} ${tokens.spacing.marginMedium} ${tokens.spacing.marginSmall}`}>
      <h2 className={`${tokens.typography.base} ${tokens.typography.semibold} ${tokens.spacing.marginMedium}`}>Custom Fonts</h2>

      {/* Storage Stats */}
      <div className={`${tokens.spacing.marginMedium} ${tokens.spacing.alert} ${tokens.colors.neutral.bg} ${tokens.borders.rounded} ${tokens.typography.small}`}>
        <div className={`flex justify-between ${tokens.spacing.marginSmall}`}>
          <span>Storage Used:</span>
          <span data-testid="storage-usage">
            {formatFileSize(storageStats.totalSize)} / {formatFileSize(CUSTOM_FONT_LIMITS.MAX_TOTAL_SIZE)}
          </span>
        </div>
        <div className={`w-full ${tokens.colors.neutral.bg} ${tokens.borders.full} h-2 ${tokens.spacing.marginSmall}`}>
          <div
            className={`h-2 ${tokens.borders.full} ${tokens.transitions.default} ${
              storagePercentage > 90 ? 'bg-red-500' : storagePercentage > 70 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={storageBarStyle}
          />
        </div>
        <div className={`${tokens.typography.xs} ${tokens.colors.neutral.textMuted}`} data-testid="font-count">
          {storageStats.count} / {CUSTOM_FONT_LIMITS.MAX_FONT_COUNT} fonts
        </div>
      </div>

      {/* Font Upload Form */}
      <FontUpload
        onUploadSuccess={handleUploadSuccess}
        onError={setError}
        storageStats={storageStats}
      />

      {/* Success Message */}
      {(success !== null && success !== undefined && success !== '') && (
        <Alert variant="success" className={tokens.spacing.marginMedium}>
          <div className={`flex items-center ${tokens.spacing.gapSmall}`}>
            <span>✓</span>
            {success}
          </div>
        </Alert>
      )}

      {/* Enhanced error message with recovery actions */}
      {(error !== null && error !== undefined && error !== '') && (
        <Alert variant="error" className={tokens.spacing.marginMedium}>
          <div className="space-y-3">
            <p className={tokens.typography.small}>{error}</p>
            <button
              type="button"
              onClick={handleDismissError}
              className={`px-3 py-1.5 ${tokens.typography.small} ${tokens.typography.medium} ${tokens.colors.neutral.bgWhite} ${tokens.borders.default} ${tokens.borders.rounded} ${tokens.colors.neutral.hover} ${tokens.effects.focusRing} ${tokens.transitions.default}`}
              aria-label="Dismiss error and try another file"
            >
              Try Another File
            </button>
          </div>
        </Alert>
      )}

      {/* Font List */}
      <FontList
        fonts={fonts}
        onDeleteSuccess={handleDeleteSuccess}
        onDeleteError={handleDeleteError}
      />
    </div>
  );
});
