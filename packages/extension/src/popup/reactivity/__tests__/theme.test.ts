/**
 * ABOUTME: Tests for createDarkMode reactive function.
 * ABOUTME: Validates theme management with system detection, persistence, and DOM updates.
 */

import { renderHook } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock dependencies
const mockGetCachedTheme = vi.fn(() => 'auto' as 'light' | 'dark' | 'auto');
const mockSetCachedTheme = vi.fn();
const mockLoadSettings = vi.fn();
const mockSaveSettings = vi.fn();

vi.mock('@/shared/infrastructure/settings/themeCache', () => ({
  getCachedTheme: () => mockGetCachedTheme(),
  setCachedTheme: (theme: string) => mockSetCachedTheme(theme),
}));

vi.mock('@/shared/infrastructure/settings/SettingsStore', () => ({
  loadSettings: () => mockLoadSettings(),
  saveSettings: (settings: unknown) => mockSaveSettings(settings),
}));

// Mock matchMedia
const mockMediaQuery = {
  matches: false,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

const { createDarkMode } = await import('../theme');

describe('createDarkMode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCachedTheme.mockReturnValue('auto');
    mockLoadSettings.mockResolvedValue({ theme: 'auto' });
    mockMediaQuery.matches = false;
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => mockMediaQuery),
    );
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('Initialization', () => {
    it('loads theme from cache on init', () => {
      mockGetCachedTheme.mockReturnValue('dark');

      const { result } = renderHook(() => createDarkMode());

      expect(result.theme()).toBe('dark');
    });

    it('defaults to auto when no cache', () => {
      mockGetCachedTheme.mockReturnValue('auto');

      const { result } = renderHook(() => createDarkMode());

      expect(result.theme()).toBe('auto');
    });

    it('detects system dark preference', () => {
      mockMediaQuery.matches = true;
      mockGetCachedTheme.mockReturnValue('auto');

      const { result } = renderHook(() => createDarkMode());

      expect(result.isDark()).toBe(true);
    });

    it('detects system light preference', () => {
      mockMediaQuery.matches = false;
      mockGetCachedTheme.mockReturnValue('auto');

      const { result } = renderHook(() => createDarkMode());

      expect(result.isDark()).toBe(false);
    });
  });

  describe('isDark Derivation', () => {
    it('returns true when theme is dark', () => {
      mockGetCachedTheme.mockReturnValue('dark');

      const { result } = renderHook(() => createDarkMode());

      expect(result.isDark()).toBe(true);
    });

    it('returns false when theme is light', () => {
      mockGetCachedTheme.mockReturnValue('light');

      const { result } = renderHook(() => createDarkMode());

      expect(result.isDark()).toBe(false);
    });

    it('follows system preference when theme is auto', () => {
      mockMediaQuery.matches = true;
      mockGetCachedTheme.mockReturnValue('auto');

      const { result } = renderHook(() => createDarkMode());

      expect(result.isDark()).toBe(true);
    });
  });

  describe('DOM Class Toggle', () => {
    it('adds dark class when isDark is true', () => {
      mockGetCachedTheme.mockReturnValue('dark');

      renderHook(() => createDarkMode());

      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('removes dark class when isDark is false', () => {
      document.documentElement.classList.add('dark');
      mockGetCachedTheme.mockReturnValue('light');

      renderHook(() => createDarkMode());

      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });

  describe('setTheme', () => {
    it('updates theme signal', () => {
      const { result } = renderHook(() => createDarkMode());

      result.setTheme('dark');

      expect(result.theme()).toBe('dark');
    });

    it('updates cache', () => {
      const { result } = renderHook(() => createDarkMode());

      result.setTheme('dark');

      expect(mockSetCachedTheme).toHaveBeenCalledWith('dark');
    });

    it('persists to settings storage', () => {
      mockLoadSettings.mockResolvedValue({ theme: 'auto', other: 'value' });

      const { result } = renderHook(() => createDarkMode());

      result.setTheme('light');

      expect(mockLoadSettings).toHaveBeenCalled();
    });

    it('updates isDark when switching to dark', () => {
      mockGetCachedTheme.mockReturnValue('light');

      const { result } = renderHook(() => createDarkMode());

      expect(result.isDark()).toBe(false);

      result.setTheme('dark');

      expect(result.isDark()).toBe(true);
    });
  });

  describe('System Preference Listener', () => {
    it('registers media query listener', () => {
      renderHook(() => createDarkMode());

      expect(mockMediaQuery.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('cleans up media query listener on cleanup', () => {
      const { cleanup } = renderHook(() => createDarkMode());

      cleanup();

      expect(mockMediaQuery.removeEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function),
      );
    });
  });
});
