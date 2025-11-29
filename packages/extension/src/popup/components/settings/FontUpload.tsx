/**
 * FontUpload Component
 * Settings UI for custom font upload
 * Refactored to use useFontUpload hook
 *
 * Features:
 * - Font metadata form (family, weight, style)
 * - File upload with validation
 * - Decompression status for WOFF/WOFF2
 * - Storage limit enforcement
 */

import React, { useCallback } from 'react';
import { CUSTOM_FONT_LIMITS } from '@/shared/domain/fonts/models/Font';
import { useFontUpload } from '../../hooks/settings';
import { tokens } from '../../styles/tokens';
import { formatFileSize } from '../../utils/formatting';
import { Spinner } from '../common';
import { ProgressBar } from '../conversion/ProgressBar';

interface FontUploadProps {
  /** Callback when font upload succeeds */
  onUploadSuccess: () => Promise<void>;

  /** Callback when error occurs */
  onError: (error: string) => void;

  /** Current storage stats */
  storageStats: { count: number; totalSize: number };
}

/**
 * FontUpload displays form for uploading custom fonts
 */
export const FontUpload = React.memo(
  ({ onUploadSuccess, onError, storageStats }: FontUploadProps) => {
    // Extract upload logic to custom hook
    const {
      fontFamily,
      fontWeight,
      fontStyle,
      fontFamilyError,
      uploading,
      decompressing,
      uploadProgress,
      setFontFamily,
      setFontWeight,
      setFontStyle,
      setFontFamilyError,
      handleFileSelect,
      validateFontFamily,
      fileInputRef,
    } = useFontUpload({
      onUploadSuccess,
      onError,
    });

    // Wrapper for file input onChange
    const handleFileInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
          void handleFileSelect(file);
        }
      },
      [handleFileSelect]
    );

    // Memoize handlers to prevent recreation on every render
    const handleFontFamilyChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setFontFamily(e.target.value);
        // Clear error on change
        if (fontFamilyError && e.target.value.trim()) {
          setFontFamilyError('');
        }
      },
      [fontFamilyError, setFontFamily, setFontFamilyError]
    );

    // Validate font family on blur for real-time feedback
    const handleFontFamilyBlur = useCallback(() => {
      validateFontFamily();
    }, [validateFontFamily]);

    const handleFontWeightChange = useCallback(
      (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFontWeight(Number.parseInt(e.target.value, 10));
      },
      [setFontWeight]
    );

    const handleFontStyleChange = useCallback(
      (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFontStyle(e.target.value as 'normal' | 'italic');
      },
      [setFontStyle]
    );

    const isUploadDisabled = uploading || storageStats.count >= CUSTOM_FONT_LIMITS.MAX_FONT_COUNT;

    return (
      <div
        className={`${tokens.spacing.marginMedium} ${tokens.spacing.card} border ${tokens.colors.neutral.border} ${tokens.borders.rounded}`}
      >
        <h3
          className={`${tokens.typography.small} ${tokens.typography.medium} ${tokens.spacing.marginSmall}`}
        >
          Upload Font
        </h3>

        {/* Font Family */}
        <div className={tokens.spacing.marginSmall}>
          <label
            htmlFor="font-family"
            className={`block ${tokens.typography.xs} ${tokens.typography.medium} ${tokens.spacing.marginSmall}`}
          >
            Font Family Name
          </label>
          <input
            id="font-family"
            type="text"
            value={fontFamily}
            onChange={handleFontFamilyChange}
            onBlur={handleFontFamilyBlur}
            placeholder="e.g., Roboto, Open Sans"
            className={`w-full px-3 py-2 border ${tokens.borders.rounded} ${tokens.typography.small} ${tokens.effects.focusRing} ${tokens.effects.hoverBorder} ${tokens.transitions.default} ${tokens.effects.disabledState} ${
              fontFamilyError ? tokens.colors.error.border : tokens.colors.neutral.border
            }`}
            disabled={uploading}
            aria-invalid={!!fontFamilyError}
            aria-describedby={fontFamilyError ? 'font-family-error' : undefined}
          />
          {fontFamilyError && (
            <p
              id="font-family-error"
              className={`${tokens.typography.xs} ${tokens.colors.error.text} ${tokens.spacing.marginSmall}`}
              role="alert"
            >
              {fontFamilyError}
            </p>
          )}
        </div>

        {/* Font Weight */}
        <div className={tokens.spacing.marginSmall}>
          <label
            htmlFor="font-weight"
            className={`block ${tokens.typography.xs} ${tokens.typography.medium} ${tokens.spacing.marginSmall}`}
          >
            Weight
          </label>
          <select
            id="font-weight"
            value={fontWeight}
            onChange={handleFontWeightChange}
            className={`w-full px-3 py-2 border ${tokens.colors.neutral.border} ${tokens.borders.rounded} ${tokens.typography.small} ${tokens.effects.focusRing} ${tokens.effects.hoverBorder} ${tokens.transitions.default} ${tokens.effects.disabledState}`}
            disabled={uploading}
          >
            <option value="100">100 - Thin</option>
            <option value="200">200 - Extra Light</option>
            <option value="300">300 - Light</option>
            <option value="400">400 - Normal</option>
            <option value="500">500 - Medium</option>
            <option value="600">600 - Semi Bold</option>
            <option value="700">700 - Bold</option>
            <option value="800">800 - Extra Bold</option>
            <option value="900">900 - Black</option>
          </select>
        </div>

        {/* Font Style */}
        <div className={tokens.spacing.marginSmall}>
          <label
            htmlFor="font-style"
            className={`block ${tokens.typography.xs} ${tokens.typography.medium} ${tokens.spacing.marginSmall}`}
          >
            Style
          </label>
          <select
            id="font-style"
            value={fontStyle}
            onChange={handleFontStyleChange}
            className={`w-full px-3 py-2 border ${tokens.colors.neutral.border} ${tokens.borders.rounded} ${tokens.typography.small} ${tokens.effects.focusRing} ${tokens.effects.hoverBorder} ${tokens.transitions.default} ${tokens.effects.disabledState}`}
            disabled={uploading}
          >
            <option value="normal">Normal</option>
            <option value="italic">Italic</option>
          </select>
        </div>

        {/* File Input - Added .otf and MIME types */}
        <div className={tokens.spacing.marginSmall}>
          <label
            htmlFor="font-file"
            className={`block ${tokens.typography.xs} ${tokens.typography.medium} ${tokens.spacing.marginSmall}`}
          >
            Font File (.ttf, .otf, .woff, .woff2)
          </label>
          <input
            id="font-file"
            ref={fileInputRef}
            type="file"
            accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2"
            onChange={handleFileInputChange}
            disabled={isUploadDisabled}
            className={`w-full ${tokens.typography.small}`}
            aria-describedby="file-size-limit"
          />
          <p
            id="file-size-limit"
            className={`${tokens.typography.xs} ${tokens.colors.neutral.textMuted} ${tokens.spacing.marginSmall}`}
          >
            Max {formatFileSize(CUSTOM_FONT_LIMITS.MAX_FILE_SIZE)} per file. Supports TrueType
            (TTF), OpenType (OTF), WOFF, and WOFF2 formats.
            <br />
            <strong>Not supported:</strong> OTF with CFF outlines, SVG fonts, variable fonts, icon
            fonts
          </p>

          {/* Upload Progress Indicator */}
          {uploading && (
            <div className={tokens.spacing.marginSmall}>
              <ProgressBar percentage={uploadProgress} animated />
              <div
                className={`${tokens.typography.xs} ${tokens.colors.info.text} mt-1 flex items-center justify-center`}
              >
                {decompressing ? (
                  <>
                    <Spinner size="small" className="mr-2" />
                    Decompressing font file...
                  </>
                ) : uploadProgress < 100 ? (
                  'Processing font file...'
                ) : (
                  'Upload complete!'
                )}
              </div>
            </div>
          )}
        </div>

        {/* Upload disabled message */}
        {storageStats.count >= CUSTOM_FONT_LIMITS.MAX_FONT_COUNT && (
          <div
            className={`${tokens.typography.xs} ${tokens.colors.error.text} ${tokens.spacing.marginSmall}`}
          >
            Maximum number of fonts reached. Delete a font to upload more.
          </div>
        )}
      </div>
    );
  }
);
