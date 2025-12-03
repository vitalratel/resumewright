/**
 * useQuickSettings Hook
 * Quick settings management
 *
 * Manages loading and updating user settings for quick access
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { DEFAULT_USER_SETTINGS } from '@/shared/domain/settings/defaults';
import { getLogger } from '@/shared/infrastructure/logging/instance';
import { settingsStore } from '@/shared/infrastructure/settings/SettingsStore';
import type { UserSettings } from '@/shared/types/settings';
import { MARGIN_PRESETS } from '../../constants/margins';

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

interface UseQuickSettingsReturn {
  settings: UserSettings | null;
  handlers: QuickSettingsHandlers;
  reloadSettings: () => Promise<void>;
}

/**
 * Hook for managing quick settings
 */
export function useQuickSettings(): UseQuickSettingsReturn {
  const [settings, setSettings] = useState<UserSettings | null>(null);

  // Load settings on mount with timeout/fallback
  // CRITICAL FIX: browser.storage.sync may fail or never initialize (especially in E2E tests)
  // If loading takes >2s, fallback to defaults to prevent infinite loading state
  useEffect(() => {
    let mounted = true;

    // Set timeout to fallback to defaults after 2s
    // Reduced from 5s to ensure faster fallback in E2E tests
    const timeoutId = setTimeout(() => {
      if (mounted) {
        getLogger().warn('QuickSettings', 'Settings load timeout after 2s, using defaults');
        setSettings(DEFAULT_USER_SETTINGS);
      }
    }, 2000);

    // Attempt to load settings
    settingsStore
      .loadSettings()
      .then((loadedSettings) => {
        if (mounted) {
          clearTimeout(timeoutId);
          setSettings(loadedSettings);
        }
      })
      .catch((error) => {
        if (mounted) {
          clearTimeout(timeoutId);
          getLogger().error('QuickSettings', 'Failed to load settings, using defaults', error);
          setSettings(DEFAULT_USER_SETTINGS);
        }
      });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  // Reload settings (useful after closing settings view)
  const reloadSettings = useCallback(async () => {
    const updatedSettings = await settingsStore.loadSettings();
    setSettings(updatedSettings);
  }, []);

  // Handle quick settings page size change
  const handlePageSizeChange = useCallback(
    async (pageSize: 'A4' | 'Letter' | 'Legal') => {
      if (!settings) return;

      const updatedSettings: UserSettings = {
        ...settings,
        defaultConfig: {
          ...settings.defaultConfig,
          pageSize,
        },
      };

      await settingsStore.saveSettings(updatedSettings);
      setSettings(updatedSettings);
    },
    [settings],
  );

  // Handle quick settings margins change
  // Support for compact and spacious presets
  const handleMarginsChange = useCallback(
    async (preset: 'compact' | 'narrow' | 'normal' | 'wide' | 'spacious') => {
      if (!settings) return;

      const updatedSettings: UserSettings = {
        ...settings,
        defaultConfig: {
          ...settings.defaultConfig,
          margin: MARGIN_PRESETS[preset],
        },
      };

      await settingsStore.saveSettings(updatedSettings);
      setSettings(updatedSettings);
    },
    [settings],
  );

  // Handle custom margin changes
  const handleCustomMarginChange = useCallback(
    async (side: 'top' | 'right' | 'bottom' | 'left', value: number) => {
      if (!settings) return;

      // Validate: 0-2 inches in 0.05" increments
      const roundedValue = Math.round(value / 0.05) * 0.05;
      const clampedValue = Math.max(0, Math.min(2, roundedValue));

      const updatedSettings: UserSettings = {
        ...settings,
        defaultConfig: {
          ...settings.defaultConfig,
          margin: {
            ...settings.defaultConfig.margin,
            [side]: clampedValue,
          },
        },
      };

      await settingsStore.saveSettings(updatedSettings);
      setSettings(updatedSettings);
    },
    [settings],
  );

  // Memoize handlers object to prevent unnecessary re-renders
  // Object only recreates when the callbacks change (i.e., when settings changes)
  const handlers = useMemo(
    () => ({
      handlePageSizeChange,
      handleMarginsChange,
      handleCustomMarginChange,
    }),
    [handlePageSizeChange, handleMarginsChange, handleCustomMarginChange],
  );

  return {
    settings,
    handlers,
    reloadSettings,
  };
}
