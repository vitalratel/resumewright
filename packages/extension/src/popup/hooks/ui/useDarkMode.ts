/**
 * Dark Mode Hook
 *
 * Manages theme preference with system detection and persistence.
 * Supports light, dark, and auto (system preference) modes.
 */

import { useEffect, useState } from 'react';
import { loadSettings, saveSettings } from '@/shared/infrastructure/settings/storage';

type Theme = 'light' | 'dark' | 'auto';

export function useDarkMode() {
  // Load saved theme preference
  const [theme, setTheme] = useState<Theme>(() => {
    const settings = loadSettings();
    return settings.theme;
  });

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

  const setThemePreference = (newTheme: Theme) => {
    setTheme(newTheme);

    // Persist to localStorage
    const settings = loadSettings();
    const updated = { ...settings, theme: newTheme };
    saveSettings(updated);
  };

  return {
    theme,
    isDark,
    setTheme: setThemePreference,
  };
}
