// ABOUTME: Dark mode management with system detection and persistence.
// ABOUTME: Uses localStorage cache for instant load, settings functions for persistence.

import type { Accessor } from 'solid-js';
import { createEffect, createSignal, onCleanup } from 'solid-js';
import { loadSettings, saveSettings } from '@/shared/infrastructure/settings/SettingsStore';
import { getCachedTheme, setCachedTheme } from '@/shared/infrastructure/settings/themeCache';

type Theme = 'light' | 'dark' | 'auto';

/**
 * Dark mode management with system preference detection, caching, and persistence.
 *
 * @returns Object with theme accessor, isDark derived accessor, and setTheme function
 */
export function createDarkMode(): {
  theme: Accessor<Theme>;
  isDark: Accessor<boolean>;
  setTheme: (theme: Theme) => void;
} {
  const [theme, setThemeSignal] = createSignal<Theme>(getCachedTheme());
  const [systemPrefersDark, setSystemPrefersDark] = createSignal(
    window.matchMedia('(prefers-color-scheme: dark)').matches,
  );

  const isDark = () => (theme() === 'auto' ? systemPrefersDark() : theme() === 'dark');

  // Apply theme to document element
  createEffect(() => {
    document.documentElement.classList.toggle('dark', isDark());
  });

  // Listen for system preference changes
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handleChange = (e: MediaQueryListEvent) => {
    setSystemPrefersDark(e.matches);
  };
  mediaQuery.addEventListener('change', handleChange);
  onCleanup(() => mediaQuery.removeEventListener('change', handleChange));

  // Sync with settings on mount (in case cache is stale)
  loadSettings().then((settings) => {
    const cachedTheme = getCachedTheme();
    if (settings.theme !== cachedTheme) {
      setThemeSignal(settings.theme);
      setCachedTheme(settings.theme);
    }
  });

  const setTheme = (newTheme: Theme) => {
    setThemeSignal(newTheme);
    setCachedTheme(newTheme);

    // Persist to storage (async, source of truth)
    loadSettings().then((settings) => {
      saveSettings({ ...settings, theme: newTheme });
    });
  };

  return { theme, isDark, setTheme };
}
