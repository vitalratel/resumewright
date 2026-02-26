// ABOUTME: Converter entry point that initialises the full-page conversion UI.
// ABOUTME: Wires together file import, conversion, settings, keyboard, and accessibility modules.

import { initConversion } from './conversion';
import { getElement } from './dom';
import { initFileImport } from './file-import';
import { initSettings } from './settings';

// ─── State ───────────────────────────────────────────────────────────────────

export type UIState = 'import' | 'ready' | 'converting' | 'success' | 'error';
export type UIView = 'main' | 'settings';

let currentView: UIView = 'main';
let currentState: UIState = 'import';

// ─── View / State toggles ────────────────────────────────────────────────────

export function showView(view: UIView): void {
  currentView = view;
  const viewMain = getElement('view-main');
  const viewSettings = getElement('view-settings');
  viewMain.hidden = view !== 'main';
  viewSettings.hidden = view !== 'settings';
  announce(view === 'settings' ? 'Settings opened' : 'Converter');
}

export function showState(state: UIState): void {
  currentState = state;
  const states: UIState[] = ['import', 'ready', 'converting', 'success', 'error'];
  for (const s of states) {
    const el = getElement(`state-${s}`);
    el.hidden = s !== state;
  }
  // Move focus to the newly visible section for accessibility
  const active = getElement(`state-${state}`);
  active.focus?.();
}

export function getCurrentState(): UIState {
  return currentState;
}

// ─── Screen reader announcer ─────────────────────────────────────────────────

export function announce(message: string, assertive = false): void {
  const el = getElement(assertive ? 'error-announcer' : 'announcer');
  // Clear then set — forces screen reader to re-read even if same text
  el.textContent = '';
  requestAnimationFrame(() => {
    el.textContent = message;
  });
}

// ─── Header / Footer wiring ──────────────────────────────────────────────────

function initNav(): void {
  getElement('btn-settings').addEventListener('click', () => showView('settings'));
  getElement('btn-change-settings').addEventListener('click', () => showView('settings'));
  getElement('btn-help').addEventListener('click', openHelp);

  // Help dialog
  const helpDialog = getElement<HTMLDialogElement>('help-dialog');
  getElement('btn-help-close').addEventListener('click', () => helpDialog.close());
  helpDialog.addEventListener('click', (e) => {
    if (e.target === helpDialog) helpDialog.close();
  });
}

function openHelp(): void {
  getElement<HTMLDialogElement>('help-dialog').showModal();
}

// ─── Keyboard shortcuts ───────────────────────────────────────────────────────

function initKeyboard(): void {
  document.addEventListener('keydown', (e) => {
    const ctrl = e.ctrlKey || e.metaKey;

    // Escape: close dialog or go back from settings
    if (e.key === 'Escape') {
      const helpDialog = getElement<HTMLDialogElement>('help-dialog');
      if (helpDialog.open) {
        helpDialog.close();
        return;
      }
      if (currentView === 'settings') {
        showView('main');
        return;
      }
    }

    // F1: open help
    if (e.key === 'F1') {
      e.preventDefault();
      openHelp();
      return;
    }

    // Ctrl+,: open settings
    if (ctrl && e.key === ',') {
      e.preventDefault();
      showView('settings');
      return;
    }

    // Ctrl+E: export (only when file is ready)
    if (ctrl && e.key === 'e') {
      if (currentState === 'ready') {
        e.preventDefault();
        document.getElementById('btn-export')?.click();
      }
      return;
    }

    // Ctrl+R: retry (only on error)
    if (ctrl && e.key === 'r' && currentState === 'error') {
      e.preventDefault();
      document.getElementById('btn-retry')?.click();
    }
  });
}

// ─── Boot ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initKeyboard();
  initFileImport({ showState, announce });
  initConversion({ showState, announce, getCurrentState });
  initSettings({ showView, announce });

  // Set version from manifest
  const version = browser.runtime.getManifest().version;
  const versionEl = document.getElementById('app-version');
  if (versionEl) versionEl.textContent = `v${version}`;
});
