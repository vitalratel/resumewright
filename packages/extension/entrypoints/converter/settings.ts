// ABOUTME: Settings module — loads and persists user preferences via Chrome storage.
// ABOUTME: Wires the settings form (page size, margins, theme) and syncs to storage on change.

import { MARGIN_PRESETS } from '@/popup/constants/margins';
import { DEFAULT_USER_SETTINGS } from '@/shared/domain/settings/defaults';
import { getLogger } from '@/shared/infrastructure/logging/instance';
import type { UserSettings } from '@/shared/types/settings';
import type { UIView } from './converter';

interface SettingsDeps {
  showView: (view: UIView) => void;
  announce: (message: string, assertive?: boolean) => void;
}

const STORAGE_KEY = 'resumewright-settings';
const MARGIN_MIN = 0.25;
const MARGIN_MAX = 1.5;
const MARGIN_STEP = 0.05;

// In-memory current settings (loaded once, mutated on change)
let current: UserSettings = structuredClone(DEFAULT_USER_SETTINGS);

// Debounce handle for margin saves
let saveTimer: ReturnType<typeof setTimeout> | null = null;

// ─── Init ─────────────────────────────────────────────────────────────────────

export function initSettings(deps: SettingsDeps): void {
  const { showView, announce } = deps;

  // Back button
  document.getElementById('btn-settings-back')!.addEventListener('click', () => {
    showView('main');
    announce('Converter');
  });

  // Tabs
  document.getElementById('tab-page')!.addEventListener('click', () => switchTab('page'));
  document.getElementById('tab-general')!.addEventListener('click', () => switchTab('general'));

  // Page size
  for (const radio of document.querySelectorAll<HTMLInputElement>('input[name="page-size"]')) {
    radio.addEventListener('change', () => {
      current.defaultConfig.pageSize = radio.value as UserSettings['defaultConfig']['pageSize'];
      updateSettingsSummary();
      saveSettings();
      announce(`Page size set to ${radio.value}`);
    });
  }

  // Margin sliders
  for (const side of ['top', 'bottom', 'left', 'right'] as const) {
    const slider = document.getElementById(`margin-${side}`) as HTMLInputElement;
    const minusBtn = document.getElementById(`margin-${side}-minus`)!;
    const plusBtn = document.getElementById(`margin-${side}-plus`)!;

    slider.addEventListener('input', () => {
      const val = parseFloat(slider.value);
      current.defaultConfig.margin[side] = val;
      updateMarginDisplay(side, val);
      updateMarginPreview();
      updateSettingsSummary();
      debouncedSave();
    });

    minusBtn.addEventListener('click', () => {
      const val = Math.max(MARGIN_MIN, parseFloat(slider.value) - MARGIN_STEP);
      const rounded = Math.round(val / MARGIN_STEP) * MARGIN_STEP;
      slider.value = String(rounded);
      current.defaultConfig.margin[side] = rounded;
      updateMarginDisplay(side, rounded);
      updateMarginPreview();
      updateSettingsSummary();
      debouncedSave();
    });

    plusBtn.addEventListener('click', () => {
      const val = Math.min(MARGIN_MAX, parseFloat(slider.value) + MARGIN_STEP);
      const rounded = Math.round(val / MARGIN_STEP) * MARGIN_STEP;
      slider.value = String(rounded);
      current.defaultConfig.margin[side] = rounded;
      updateMarginDisplay(side, rounded);
      updateMarginPreview();
      updateSettingsSummary();
      debouncedSave();
    });
  }

  // Theme buttons
  for (const themeId of ['light', 'dark', 'auto'] as const) {
    document.getElementById(`theme-${themeId}`)!.addEventListener('click', () => {
      setTheme(themeId, announce);
    });
  }

  // Reset
  document.getElementById('btn-reset-settings')!.addEventListener('click', () => {
    document.getElementById('reset-confirm')!.hidden = false;
  });

  document.getElementById('btn-reset-cancel')!.addEventListener('click', () => {
    document.getElementById('reset-confirm')!.hidden = true;
  });

  document.getElementById('btn-reset-confirm')!.addEventListener('click', () => {
    document.getElementById('reset-confirm')!.hidden = true;
    resetToDefaults(announce);
  });

  // Load settings on init
  loadSettings()
    .then(() => {
      populateForm();
      updateSettingsSummary();
      applyTheme(current.theme);
    })
    .catch((err) => {
      getLogger().error('Settings', 'Failed to load settings', err);
    });
}

// ─── Tab switching ────────────────────────────────────────────────────────────

function switchTab(tab: 'page' | 'general'): void {
  const pagePanel = document.getElementById('settings-page')!;
  const generalPanel = document.getElementById('settings-general')!;
  const pageTab = document.getElementById('tab-page')!;
  const generalTab = document.getElementById('tab-general')!;

  const isPage = tab === 'page';
  pagePanel.hidden = !isPage;
  generalPanel.hidden = isPage;
  pageTab.setAttribute('aria-selected', String(isPage));
  generalTab.setAttribute('aria-selected', String(!isPage));
}

// ─── Form population ──────────────────────────────────────────────────────────

function populateForm(): void {
  // Page size
  const pageSizeInput = document.querySelector<HTMLInputElement>(
    `input[name="page-size"][value="${current.defaultConfig.pageSize}"]`,
  );
  if (pageSizeInput) pageSizeInput.checked = true;

  // Margins
  for (const side of ['top', 'bottom', 'left', 'right'] as const) {
    const val = current.defaultConfig.margin[side];
    const slider = document.getElementById(`margin-${side}`) as HTMLInputElement;
    slider.value = String(val);
    updateMarginDisplay(side, val);
  }
  updateMarginPreview();

  // Theme
  updateThemeButtons(current.theme);
}

// ─── Margin display helpers ───────────────────────────────────────────────────

function updateMarginDisplay(side: 'top' | 'bottom' | 'left' | 'right', val: number): void {
  document.getElementById(`margin-${side}-value`)!.textContent = `${val.toFixed(2)}"`;
}

function updateMarginPreview(): void {
  const m = current.defaultConfig.margin;
  // Preview box is 140x180px; page is 8.5 x 11 inches
  const topPct = (m.top / 11) * 100;
  const bottomPct = (m.bottom / 11) * 100;
  const leftPct = (m.left / 8.5) * 100;
  const rightPct = (m.right / 8.5) * 100;

  document.getElementById('margin-preview-content')!.style.inset =
    `${topPct}% ${rightPct}% ${bottomPct}% ${leftPct}%`;

  document.getElementById('margin-preview-top')!.textContent = `${m.top.toFixed(2)}"`;
  document.getElementById('margin-preview-bottom')!.textContent = `${m.bottom.toFixed(2)}"`;
  document.getElementById('margin-preview-left')!.textContent = `${m.left.toFixed(2)}"`;
  document.getElementById('margin-preview-right')!.textContent = `${m.right.toFixed(2)}"`;
}

// ─── Settings summary (shown in state-ready) ──────────────────────────────────

function updateSettingsSummary(): void {
  const el = document.getElementById('settings-summary-text');
  if (!el) return;
  const presetName = detectMarginPreset(current.defaultConfig.margin);
  const marginLabel = presetName ? `${capitalizeFirst(presetName)} margins` : 'Custom margins';
  el.textContent = `${current.defaultConfig.pageSize}, ${marginLabel}`;
}

function detectMarginPreset(margin: UserSettings['defaultConfig']['margin']): string | null {
  for (const [name, preset] of Object.entries(MARGIN_PRESETS)) {
    if (
      Math.abs(preset.top - margin.top) < 0.001 &&
      Math.abs(preset.bottom - margin.bottom) < 0.001 &&
      Math.abs(preset.left - margin.left) < 0.001 &&
      Math.abs(preset.right - margin.right) < 0.001
    ) {
      return name;
    }
  }
  return null;
}

function capitalizeFirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ─── Theme ────────────────────────────────────────────────────────────────────

function setTheme(theme: UserSettings['theme'], announce: (msg: string) => void): void {
  current.theme = theme;
  applyTheme(theme);
  updateThemeButtons(theme);
  saveSettings();
  announce(`Theme set to ${theme}`);
}

function applyTheme(theme: UserSettings['theme']): void {
  const html = document.documentElement;
  if (theme === 'dark') {
    html.classList.add('dark');
  } else if (theme === 'light') {
    html.classList.remove('dark');
  } else {
    // auto: follow system
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    html.classList.toggle('dark', prefersDark);
  }
}

function updateThemeButtons(theme: UserSettings['theme']): void {
  for (const id of ['light', 'dark', 'auto'] as const) {
    document.getElementById(`theme-${id}`)!.setAttribute('aria-pressed', String(theme === id));
  }
}

// ─── Reset ────────────────────────────────────────────────────────────────────

function resetToDefaults(announce: (msg: string) => void): void {
  current = structuredClone(DEFAULT_USER_SETTINGS);
  populateForm();
  updateSettingsSummary();
  applyTheme(current.theme);
  saveSettings();
  announce('Settings reset to defaults');
}

// ─── Storage ──────────────────────────────────────────────────────────────────

async function loadSettings(): Promise<void> {
  try {
    const result = await browser.storage.sync.get(STORAGE_KEY);
    const stored = result[STORAGE_KEY] as UserSettings | undefined;
    if (stored) {
      // Merge stored over defaults to pick up any new keys from defaults
      current = { ...DEFAULT_USER_SETTINGS, ...stored };
    }
  } catch (err) {
    getLogger().warn('Settings', 'Failed to load from sync storage, using defaults', err);
  }
}

function saveSettings(): void {
  browser.storage.sync.set({ [STORAGE_KEY]: current }).catch((err) => {
    getLogger().error('Settings', 'Failed to save settings', err);
  });
}

function debouncedSave(): void {
  if (saveTimer !== null) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    saveSettings();
  }, 500);
}
