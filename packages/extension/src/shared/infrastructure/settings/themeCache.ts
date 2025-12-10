// ABOUTME: Synchronous theme cache for instant dark mode loading.
// ABOUTME: Prevents flash of wrong theme by caching in localStorage.

type Theme = 'light' | 'dark' | 'auto';

const THEME_CACHE_KEY = 'resumewright-theme-cache';
const DEFAULT_THEME: Theme = 'auto';

/**
 * Get cached theme synchronously (for initial render).
 */
export function getCachedTheme(): Theme {
  if (typeof localStorage === 'undefined') {
    return DEFAULT_THEME;
  }

  const cached = localStorage.getItem(THEME_CACHE_KEY);
  if (cached === 'light' || cached === 'dark' || cached === 'auto') {
    return cached;
  }
  return DEFAULT_THEME;
}

/**
 * Update theme cache (call after saving to settingsStore).
 */
export function setCachedTheme(theme: Theme): void {
  if (typeof localStorage === 'undefined') {
    return;
  }
  localStorage.setItem(THEME_CACHE_KEY, theme);
}
