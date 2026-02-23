// ABOUTME: Settings module — loads and persists user preferences via Chrome storage.
// ABOUTME: Wires the settings form (page size, margins, theme) and syncs to storage on change.

import type { UIView } from './converter';

interface SettingsDeps {
  showView: (view: UIView) => void;
  announce: (message: string, assertive?: boolean) => void;
}

export function initSettings(_deps: SettingsDeps): void {
  // Phase 4: implemented in next phase
}
