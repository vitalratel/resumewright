// ABOUTME: File import module — handles drag-drop, file input, and client-side validation.
// ABOUTME: Calls showState('ready') on valid file or shows inline error on invalid file.

import type { UIState } from './converter';

interface FileImportDeps {
  showState: (state: UIState) => void;
  announce: (message: string, assertive?: boolean) => void;
}

export function initFileImport(_deps: FileImportDeps): void {
  // Phase 2: implemented in next phase
}
