// ABOUTME: File reading utilities and drag-and-drop handling.
// ABOUTME: Provides Promise-based FileReader access and reactive drag state management.

import type { Accessor, JSX } from 'solid-js';
import { createSignal } from 'solid-js';

/**
 * Read file as text
 * @param file - File to read
 * @returns Promise resolving to file content as string
 * @throws Error if reading fails
 */
export async function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        resolve(content);
      } else {
        reject(new Error('Failed to read file as text'));
      }
    };

    reader.onerror = () => reject(new Error('File read error'));

    reader.readAsText(file);
  });
}

/**
 * Read file as data URL (for images, fonts, etc.)
 * @param file - File to read
 * @returns Promise resolving to data URL string
 * @throws Error if reading fails
 */
export async function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        resolve(content);
      } else {
        reject(new Error('Failed to read file as data URL'));
      }
    };

    reader.onerror = () => reject(new Error('File read error'));

    reader.readAsDataURL(file);
  });
}

/**
 * Drag-and-drop file handling with reactive state.
 *
 * @param onFileDrop - Callback invoked when a file is dropped
 * @returns Object with isDragging accessor and drag event handlers
 */
export function createDragAndDrop(onFileDrop: (file: File) => void | Promise<void>): {
  isDragging: Accessor<boolean>;
  dragHandlers: {
    onDragEnter: JSX.EventHandler<HTMLElement, DragEvent>;
    onDragLeave: JSX.EventHandler<HTMLElement, DragEvent>;
    onDragOver: JSX.EventHandler<HTMLElement, DragEvent>;
    onDrop: JSX.EventHandler<HTMLElement, DragEvent>;
  };
} {
  const [isDragging, setIsDragging] = createSignal(false);

  const dragHandlers = {
    onDragEnter: (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    },

    onDragLeave: (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    },

    onDragOver: (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    },

    onDrop: (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer?.files;
      if (files?.[0] != null) {
        void onFileDrop(files[0]);
      }
    },
  };

  return { isDragging, dragHandlers };
}
