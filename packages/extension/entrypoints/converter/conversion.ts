// ABOUTME: Conversion module — drives the PDF conversion pipeline via background messaging.
// ABOUTME: Handles export click, progress updates, success download, error display, and countdown.

import type { UIState } from './converter';

interface ConversionDeps {
  showState: (state: UIState) => void;
  announce: (message: string, assertive?: boolean) => void;
  getCurrentState: () => UIState;
}

export function initConversion(_deps: ConversionDeps): void {
  // Phase 3: implemented in next phase
}
