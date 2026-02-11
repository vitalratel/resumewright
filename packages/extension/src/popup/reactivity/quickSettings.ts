// ABOUTME: Quick settings management for page size and margins.
// ABOUTME: Loads settings with timeout fallback and provides update handlers.

import type { Accessor } from 'solid-js';
import { createSignal, onCleanup } from 'solid-js';
import { DEFAULT_USER_SETTINGS } from '@/shared/domain/settings/defaults';
import { getLogger } from '@/shared/infrastructure/logging/instance';
import { loadSettings, saveSettings } from '@/shared/infrastructure/settings/SettingsStore';
import type { UserSettings } from '@/shared/types/settings';
import { MARGIN_PRESETS } from '../constants/margins';

interface QuickSettingsHandlers {
  handlePageSizeChange: (pageSize: 'A4' | 'Letter' | 'Legal') => Promise<void>;
  handleMarginsChange: (
    preset: 'compact' | 'narrow' | 'normal' | 'wide' | 'spacious',
  ) => Promise<void>;
  handleCustomMarginChange: (
    side: 'top' | 'right' | 'bottom' | 'left',
    value: number,
  ) => Promise<void>;
}

interface QuickSettingsResult {
  settings: Accessor<UserSettings | null>;
  handlers: QuickSettingsHandlers;
  reloadSettings: () => Promise<void>;
}

/**
 * Manage quick settings for page size and margins.
 * Loads settings with a 2s timeout fallback to defaults.
 */
export function createQuickSettings(): QuickSettingsResult {
  const [settings, setSettings] = createSignal<UserSettings | null>(null);

  let cancelled = false;

  // Load with 2s timeout fallback
  const timeoutId = setTimeout(() => {
    if (!cancelled && settings() === null) {
      getLogger().warn('QuickSettings', 'Settings load timeout after 2s, using defaults');
      setSettings(DEFAULT_USER_SETTINGS);
    }
  }, 2000);

  loadSettings()
    .then((loaded) => {
      if (!cancelled) {
        clearTimeout(timeoutId);
        setSettings(loaded);
      }
    })
    .catch((error) => {
      if (!cancelled) {
        clearTimeout(timeoutId);
        getLogger().error('QuickSettings', 'Failed to load settings, using defaults', error);
        setSettings(DEFAULT_USER_SETTINGS);
      }
    });

  onCleanup(() => {
    cancelled = true;
    clearTimeout(timeoutId);
  });

  const reloadSettings = async () => {
    const updated = await loadSettings();
    setSettings(updated);
  };

  const handlePageSizeChange = async (pageSize: 'A4' | 'Letter' | 'Legal') => {
    const current = settings();
    if (!current) return;

    const updated: UserSettings = {
      ...current,
      defaultConfig: {
        ...current.defaultConfig,
        pageSize,
      },
    };

    await saveSettings(updated);
    setSettings(updated);
  };

  const handleMarginsChange = async (
    preset: 'compact' | 'narrow' | 'normal' | 'wide' | 'spacious',
  ) => {
    const current = settings();
    if (!current) return;

    const updated: UserSettings = {
      ...current,
      defaultConfig: {
        ...current.defaultConfig,
        margin: MARGIN_PRESETS[preset],
      },
    };

    await saveSettings(updated);
    setSettings(updated);
  };

  const handleCustomMarginChange = async (
    side: 'top' | 'right' | 'bottom' | 'left',
    value: number,
  ) => {
    const current = settings();
    if (!current) return;

    const roundedValue = Math.round(value / 0.05) * 0.05;
    const clampedValue = Math.max(0, Math.min(2, roundedValue));

    const updated: UserSettings = {
      ...current,
      defaultConfig: {
        ...current.defaultConfig,
        margin: {
          ...current.defaultConfig.margin,
          [side]: clampedValue,
        },
      },
    };

    await saveSettings(updated);
    setSettings(updated);
  };

  return {
    settings,
    handlers: {
      handlePageSizeChange,
      handleMarginsChange,
      handleCustomMarginChange,
    },
    reloadSettings,
  };
}
