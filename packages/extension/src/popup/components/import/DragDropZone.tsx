/**
 * DragDropZone Component
 * Extracted from FileImport for single responsibility
 *
 * Handles drag-and-drop file upload UI with visual feedback and browse button.
 */

import type { ChangeEvent } from 'react';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';
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

/**
 * DragDropZone - Drag-and-drop file upload UI
 *
 * Features:
 * - Drag-and-drop with visual feedback
 * - Browse button for traditional file selection
 * - Loading state during validation
 * - Accessible labels and states
 */
export const DragDropZone = React.memo(({
  onFileDrop,
  isValidating,
}: DragDropZoneProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isDragging, dragHandlers } = useDragAndDrop(onFileDrop);

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Handle both sync and async onFileDrop
      void onFileDrop(files[0]);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  // Keyboard accessibility for drop zone
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  return (
    <>
      {/* Visible label for file input section */}
      <label htmlFor="file-input" className={`block ${tokens.typography.small} ${tokens.typography.medium} ${tokens.colors.neutral.text} px-3`}>
        Import Your CV File
      </label>

      {/* P2-A11Y-007: Screen reader feedback for drag state */}
      {isDragging && (
        <div role="status" aria-live="assertive" className="sr-only">
          Drop zone active. Release to import file.
        </div>
      )}

      {/* Drop zone - Enhanced visual prominence */}
      {/* Now keyboard accessible with tabIndex, role, and onKeyDown */}
      <div
        {...dragHandlers}
        tabIndex={0}
        role="button"
        onKeyDown={handleKeyDown}
        className={`border-2 border-dashed ${tokens.borders.roundedLg} p-8 text-center ${tokens.transitions.default} ${tokens.effects.focusRing} ${
          isDragging
            ? `${tokens.colors.borders.primary} ${tokens.colors.info.bg} scale-[1.05] ${tokens.effects.shadowMd}`
            : `${tokens.colors.borders.primary} hover:border-blue-400 ${tokens.colors.info.hover} hover:scale-[1.03]`
        }`.trim().replace(/\s+/g, ' ')}
        aria-label="Click or press Enter to select TSX file for import. You can also drag and drop a file here."
      >
        <ArrowUpTrayIcon className={`${tokens.icons.hero} mx-auto ${tokens.spacing.marginSmall} ${isDragging ? tokens.colors.primary.text : 'text-blue-400'} ${tokens.transitions.default}`.trim().replace(/\s+/g, ' ')} aria-hidden="true" />
        <p className={`${tokens.typography.base} ${tokens.colors.neutral.textMuted} mb-1`}>
          {isDragging
            ? (
                <>
                  Release to import (
                  <TSX />
                  {' '}
                  files only)
                </>
              )
            : 'Drag & drop your CV file here'}
        </p>
        <p className={`${tokens.typography.xs} ${tokens.colors.neutral.textMuted} ${tokens.spacing.marginSmall} text-center`}>or</p>
        <button
          onClick={handleBrowseClick}
          disabled={isValidating}
          className={`${tokens.buttons.default.primary} ${tokens.borders.rounded} ${tokens.typography.small} ${tokens.typography.medium} ${tokens.effects.focusRing} ${
            isValidating
              ? `${tokens.effects.disabledState}`
              : `${tokens.colors.primary.bg} ${tokens.colors.primary.hover} text-white`
          } flex items-center justify-center ${tokens.spacing.gapSmall} mx-auto`.trim().replace(/\s+/g, ' ')}
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
        <p className={`${tokens.typography.xs} ${tokens.colors.neutral.textMuted} mt-3`}>
          Supports:
          <TSX />
          {' '}
          files (up to 1MB)
        </p>
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
