// ABOUTME: Drag-and-drop file upload component for CV import.
// ABOUTME: Provides visual feedback during drag operations and a browse button fallback.

import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import type { ChangeEvent } from 'react';
import React, { useRef } from 'react';
import { useDragAndDrop } from '../../hooks/ui/useDragAndDrop';
import { TSX } from '../common/TechTerm';

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
      <label htmlFor="file-input" className="block text-sm font-medium text-foreground px-3">
        Import Your CV File
      </label>

      {isDragging && (
        <output aria-live="assertive" className="sr-only">
          Drop zone active. Release to import file.
        </output>
      )}

      <div
        {...dragHandlers}
        className={`border-2 border-dashed rounded-lg p-4 text-center transition-all duration-200 ${
          isDragging
            ? 'border-primary bg-primary/10 shadow-md'
            : 'border-primary/30 hover:border-primary/50 hover:bg-primary/5'
        }`}
      >
        <ArrowUpTrayIcon
          className={`w-16 h-16 mx-auto mb-2 ${isDragging ? 'text-primary' : 'text-primary/60'} transition-all duration-300`}
          aria-hidden="true"
        />
        <p className="text-base text-muted-foreground mb-1">
          {isDragging ? (
            <>
              Release to import (
              <TSX /> files only)
            </>
          ) : (
            'Drag & drop your CV file here'
          )}
        </p>
        <p className="text-xs text-muted-foreground mt-3">
          Supports: <TSX /> files (up to 1MB)
        </p>
      </div>

      <div className="mt-2 text-center">
        <button
          onClick={handleBrowseClick}
          disabled={isValidating}
          className={`px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-ring-offset ${
            isValidating
              ? 'opacity-50 cursor-not-allowed'
              : 'bg-primary hover:bg-primary/90 text-primary-foreground'
          } flex items-center justify-center gap-2 mx-auto`}
          type="button"
          data-testid="browse-files-button"
          aria-busy={isValidating}
        >
          {isValidating && (
            <svg
              className="animate-spin w-3 h-3"
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
