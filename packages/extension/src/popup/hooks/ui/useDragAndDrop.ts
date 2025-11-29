/**
 * useDragAndDrop Hook
 *
 * Provides drag-and-drop file handling with state management
 * Handles all drag events and extracts files from drop events
 */

import { useMemo, useState } from 'react';

/**
 * Hook for drag-and-drop file handling
 *
 * @param onFileDrop - Callback invoked when file is dropped
 * @returns Object with dragging state and event handlers
 *
 * @example
 * const { isDragging, dragHandlers } = useDragAndDrop((file) => {
 *   console.log('File dropped:', file);
 * });
 *
 * <div {...dragHandlers}>
 *   {isDragging ? 'Drop here' : 'Drag file here'}
 * </div>
 */
export function useDragAndDrop(onFileDrop: (file: File) => void | Promise<void>) {
  const [isDragging, setIsDragging] = useState(false);

  const dragHandlers = useMemo(() => ({
    onDragEnter: (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    },

    onDragLeave: (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    },

    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    },

    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files?.[0] != null) {
        // Handle both sync and async onFileDrop
        void onFileDrop(files[0]);
      }
    },
  }), [onFileDrop]);

  return { isDragging, dragHandlers };
}
