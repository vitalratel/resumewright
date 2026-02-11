// ABOUTME: Drag-and-drop file upload component for CV import.
// ABOUTME: Provides visual feedback during drag operations and a browse button fallback.

import { HiOutlineArrowUpTray } from 'solid-icons/hi';
import { Show } from 'solid-js';
import { createDragAndDrop } from '../../reactivity/file';
import { TSX } from '../common/TechTerm';

interface DragDropZoneProps {
  /** Callback when file is dropped or selected - can be async */
  onFileDrop: (file: File) => void | Promise<void>;
  /** Whether file is currently being validated */
  isValidating: boolean;
}

export function DragDropZone(props: DragDropZoneProps) {
  let fileInputRef: HTMLInputElement | undefined;
  const { isDragging, dragHandlers } = createDragAndDrop((file) => props.onFileDrop(file));

  const handleFileInputChange = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const files = input.files;
    if (files && files.length > 0) {
      void props.onFileDrop(files[0]);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef?.click();
  };

  return (
    <>
      <label for="file-input" class="block text-sm font-medium text-foreground px-3">
        Import Your CV File
      </label>

      <Show when={isDragging()}>
        <output aria-live="assertive" class="sr-only">
          Drop zone active. Release to import file.
        </output>
      </Show>

      <div
        {...dragHandlers}
        class={`border-2 border-dashed rounded-lg p-4 text-center transition-all duration-200 ${
          isDragging()
            ? 'border-primary bg-primary/10 shadow-md'
            : 'border-primary/30 hover:border-primary/50 hover:bg-primary/5'
        }`}
      >
        <HiOutlineArrowUpTray
          class={`w-16 h-16 mx-auto mb-2 ${isDragging() ? 'text-primary' : 'text-primary/60'} transition-all duration-300`}
          aria-hidden="true"
        />
        <p class="text-base text-muted-foreground mb-1">
          {isDragging() ? (
            <>
              Release to import (
              <TSX /> files only)
            </>
          ) : (
            'Drag & drop your CV file here'
          )}
        </p>
        <p class="text-xs text-muted-foreground mt-3">
          Supports: <TSX /> files (up to 1MB)
        </p>
      </div>

      <div class="mt-2 text-center">
        <button
          onClick={handleBrowseClick}
          disabled={props.isValidating}
          class={`px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-ring-offset ${
            props.isValidating
              ? 'opacity-50 cursor-not-allowed'
              : 'bg-primary hover:bg-primary/90 text-primary-foreground'
          } flex items-center justify-center gap-2 mx-auto`}
          type="button"
          data-testid="browse-files-button"
          aria-busy={props.isValidating}
        >
          <Show when={props.isValidating}>
            <svg
              class="animate-spin w-3 h-3"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </Show>
          {props.isValidating ? 'Validating...' : 'Browse Files'}
        </button>
      </div>

      <input
        ref={fileInputRef}
        id="file-input"
        type="file"
        accept=".tsx"
        onChange={handleFileInputChange}
        class="hidden"
        aria-label="File input for CV import"
        data-testid="file-input"
      />
    </>
  );
}
