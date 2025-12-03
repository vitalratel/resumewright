/**
 * ABOUTME: Drag-and-drop file upload component for CV import.
 * ABOUTME: Provides visual feedback during drag operations and a browse button fallback.
 */

import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import type { ChangeEvent } from 'react';
import React, { useRef } from 'react';
import { useDragAndDrop } from '../../hooks';
import { tokens } from '../../styles/tokens';
import { TSX } from '../common';

interface DragDropZoneProps {
  /** Callback when file is dropped or selected - can be async */
  onFileDrop: (file: File) => void | Promise<void>;
  /** Whether file is currently being validated */
  isValidating: boolean;
}

export const DragDropZone = React.memo(({ onFileDrop, isValidating }: DragDropZoneProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isDragging, dragHandlers } = useDragAndDrop(onFileDrop);

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      void onFileDrop(files[0]);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <label
        htmlFor="file-input"
        className={`block ${tokens.typography.small} ${tokens.typography.medium} ${tokens.colors.neutral.text} px-3`}
      >
        Import Your CV File
      </label>

      {isDragging && (
        <output aria-live="assertive" className="sr-only">
          Drop zone active. Release to import file.
        </output>
      )}

      {/* Drop zone - handles drag-and-drop only */}
      <div
        {...dragHandlers}
        className={`border-2 border-dashed ${tokens.borders.roundedLg} p-4 text-center ${tokens.transitions.default} ${
          isDragging
            ? `${tokens.colors.borders.primary} ${tokens.colors.info.bg} scale-[1.05] ${tokens.effects.shadowMd}`
            : `${tokens.colors.borders.primary} hover:border-blue-400 ${tokens.colors.info.hover} hover:scale-[1.03]`
        }`
          .trim()
          .replace(/\s+/g, ' ')}
      >
        <ArrowUpTrayIcon
          className={`${tokens.icons.hero} mx-auto ${tokens.spacing.marginSmall} ${isDragging ? tokens.colors.primary.text : 'text-blue-400'} ${tokens.transitions.default}`
            .trim()
            .replace(/\s+/g, ' ')}
          aria-hidden="true"
        />
        <p className={`${tokens.typography.base} ${tokens.colors.neutral.textMuted} mb-1`}>
          {isDragging ? (
            <>
              Release to import (
              <TSX /> files only)
            </>
          ) : (
            'Drag & drop your CV file here'
          )}
        </p>
        <p className={`${tokens.typography.xs} ${tokens.colors.neutral.textMuted} mt-3`}>
          Supports: <TSX /> files (up to 1MB)
        </p>
      </div>

      {/* Browse button - outside drop zone for proper accessibility */}
      <div className="mt-2 text-center">
        <button
          onClick={handleBrowseClick}
          disabled={isValidating}
          className={`${tokens.buttons.default.primary} ${tokens.borders.rounded} ${tokens.typography.small} ${tokens.typography.medium} ${tokens.effects.focusRing} ${
            isValidating
              ? `${tokens.effects.disabledState}`
              : `${tokens.colors.primary.bg} ${tokens.colors.primary.hover} text-white`
          } flex items-center justify-center ${tokens.spacing.gapSmall} mx-auto`
            .trim()
            .replace(/\s+/g, ' ')}
          type="button"
          data-testid="browse-files-button"
          aria-busy={isValidating}
        >
          {isValidating && (
            <svg
              className={`${tokens.animations.spin} ${tokens.icons.xs}`.trim().replace(/\s+/g, ' ')}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}
          {isValidating ? 'Validating...' : 'Browse Files'}
        </button>
      </div>

      <input
        ref={fileInputRef}
        id="file-input"
        type="file"
        accept=".tsx"
        onChange={handleFileInputChange}
        className="hidden"
        aria-label="File input for CV import"
        data-testid="file-input"
      />
    </>
  );
});
