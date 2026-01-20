// ABOUTME: Dark mode hook with system detection and persistence.
// ABOUTME: Uses localStorage cache for instant load, settings functions for persistence.

import { useEffect, useState } from 'react';
import { loadSettings, saveSettings } from '@/shared/infrastructure/settings/SettingsStore';
import { getCachedTheme, setCachedTheme } from '@/shared/infrastructure/settings/themeCache';

type Theme = 'light' | 'dark' | 'auto';

export function useDarkMode() {
  // Load from localStorage cache (sync, prevents flash)
  const [theme, setTheme] = useState<Theme>(getCachedTheme);

  // Track system preference separately
  const [systemPrefersDark, setSystemPrefersDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches,
  );

  // Compute isDark as a derived value (not state)
  const isDark = theme === 'auto' ? systemPrefersDark : theme === 'dark';

  // Apply theme to document element
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemPrefersDark(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Sync with settings on mount (in case cache is stale)
  useEffect(() => {
    const cachedTheme = getCachedTheme();
    loadSettings().then((settings) => {
      if (settings.theme !== cachedTheme) {
        setTheme(settings.theme);
        setCachedTheme(settings.theme);
      }
    });
  }, []);

  const setThemePreference = (newTheme: Theme) => {
    setTheme(newTheme);
    setCachedTheme(newTheme);

    // Persist to storage (async, source of truth)
    loadSettings().then((settings) => {
      saveSettings({ ...settings, theme: newTheme });
    });
  };

  return {
    theme,
    isDark,
    setTheme: setThemePreference,
  };
}
