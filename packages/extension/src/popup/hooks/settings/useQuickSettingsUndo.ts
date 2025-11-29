/**
 * useQuickSettingsUndo Hook
 *
 * Undo functionality for accidental changes
 *
 * Manages undo state for QuickSettings changes.
 * Tracks previous settings and provides undo functionality with timeout.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

type PageSize = 'A4' | 'Letter' | 'Legal';
type MarginPreset = 'compact' | 'narrow' | 'normal' | 'wide' | 'spacious' | 'custom';
type MarginPresetExcludingCustom = Exclude<MarginPreset, 'custom'>;

interface UndoState {
  pageSize: PageSize;
  margins: MarginPreset;
}

interface UseQuickSettingsUndoProps {
  /** Current page size */
  pageSize: PageSize;

  /** Current margin preset */
  margins: MarginPreset;

  /** Callback to change page size */
  onPageSizeChange: (size: PageSize) => void;

  /** Callback to change margin preset */
  onMarginsChange: (preset: MarginPresetExcludingCustom) => void;

  /** Undo timeout in milliseconds (default: 10000ms / 10s) */
  timeout?: number;
}

interface UseQuickSettingsUndoReturn {
  /** Whether undo is currently available */
  canUndo: boolean;

  /** Function to undo last change */
  undo: () => void;

  /** Function to save current state before making a change */
  saveState: () => void;

  /** Handler for page size changes (includes saveState) */
  handlePageSizeChange: (size: PageSize) => void;

  /** Handler for margin preset changes (includes saveState) */
  handleMarginsChange: (preset: MarginPresetExcludingCustom) => void;

  /** Description of what will be undone  */
  undoDescription: string;
}

/**
 * useQuickSettingsUndo - Hook for managing undo state in QuickSettings
 *
 * Provides:
 * - State tracking for undo functionality
 * - Timeout management (auto-clear after 10s)
 * - Restore previous settings
 * - Wrapped handlers that automatically save state
 *
 * Usage:
 * ```tsx
 * const { canUndo, undo, handlePageSizeChange, handleMarginsChange } =
 *   useQuickSettingsUndo({ pageSize, margins, onPageSizeChange, onMarginsChange });
 * ```
 */
export function useQuickSettingsUndo({
  pageSize,
  margins,
  onPageSizeChange,
  onMarginsChange,
  timeout = 10000,
}: UseQuickSettingsUndoProps): UseQuickSettingsUndoReturn {
  const [previousSettings, setPreviousSettings] = useState<UndoState | null>(null);
  const [showUndo, setShowUndo] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Save current state before making a change
   * Enables undo and starts timeout countdown
   */
  const saveState = useCallback(() => {
    setPreviousSettings({ pageSize, margins });
    setShowUndo(true);

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Hide undo after timeout
    timeoutRef.current = setTimeout(() => {
      setShowUndo(false);
      setPreviousSettings(null);
    }, timeout);
  }, [pageSize, margins, timeout]);

  /**
   * Restore previous settings
   */
  const undo = useCallback(() => {
    if (!previousSettings)
      return;

    // Restore page size if changed
    if (previousSettings.pageSize !== pageSize) {
      onPageSizeChange(previousSettings.pageSize);
    }

    // Restore margins if changed (skip custom since it can't be restored)
    if (
      previousSettings.margins !== margins
      && previousSettings.margins !== 'custom'
    ) {
      onMarginsChange(previousSettings.margins as MarginPresetExcludingCustom);
    }

    // Clear undo state
    setShowUndo(false);
    setPreviousSettings(null);

    // Clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, [previousSettings, pageSize, margins, onPageSizeChange, onMarginsChange]);

  /**
   * Handle page size change with automatic state saving
   */
  const handlePageSizeChange = useCallback(
    (newPageSize: PageSize) => {
      saveState();
      onPageSizeChange(newPageSize);
    },
    [saveState, onPageSizeChange],
  );

  /**
   * Handle margin preset change with automatic state saving
   */
  const handleMarginsChange = useCallback(
    (newMargins: MarginPresetExcludingCustom) => {
      saveState();
      onMarginsChange(newMargins);
    },
    [saveState, onMarginsChange],
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Generate description of what will be undone
  const undoDescription = useCallback(() => {
    if (!previousSettings)
      return '';

    const changes: string[] = [];

    if (previousSettings.pageSize !== pageSize) {
      changes.push(`Page Size → ${previousSettings.pageSize}`);
    }

    if (previousSettings.margins !== margins && previousSettings.margins !== 'custom') {
      // Capitalize first letter of margin preset
      const formattedMargin = previousSettings.margins.charAt(0).toUpperCase()
        + previousSettings.margins.slice(1);
      changes.push(`Margins → ${formattedMargin}`);
    }

    return changes.join(', ');
  }, [previousSettings, pageSize, margins]);

  return {
    canUndo: showUndo && previousSettings !== null,
    undo,
    saveState,
    handlePageSizeChange,
    handleMarginsChange,
    undoDescription: undoDescription(),
  };
}
