/**
 * ABOUTME: Tests for quick settings reactive function.
 * ABOUTME: Validates settings loading with timeout, page size, margins, and custom margin changes.
 */

import { renderHook } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockLogger = {
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
};

vi.mock('@/shared/infrastructure/logging/instance', () => ({
  getLogger: () => mockLogger,
}));

const mockLoadSettings = vi.fn();
const mockSaveSettings = vi.fn();

vi.mock('@/shared/infrastructure/settings/SettingsStore', () => ({
  loadSettings: () => mockLoadSettings(),
  saveSettings: (...args: unknown[]) => mockSaveSettings(...args),
}));

const { createQuickSettings } = await import('../quickSettings');

function createTestSettings() {
  return {
    theme: 'auto' as const,
    defaultConfig: {
      pageSize: 'A4' as const,
      margin: { top: 0.75, right: 0.75, bottom: 0.75, left: 0.75 },
      fontFamily: 'sans-serif',
      baseFontSize: 10,
    },
    autoDetectCV: true,
    showConvertButtons: true,
    telemetryEnabled: false,
    retentionDays: 30,
    settingsVersion: 1,
    lastUpdated: Date.now(),
  };
}

describe('createQuickSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('Loading', () => {
    it('starts with settings=null', () => {
      mockLoadSettings.mockReturnValue(new Promise(() => {}));

      const { result } = renderHook(() => createQuickSettings());

      expect(result.settings()).toBeNull();
    });

    it('loads settings on creation', async () => {
      const testSettings = createTestSettings();
      mockLoadSettings.mockResolvedValue(testSettings);

      const { result } = renderHook(() => createQuickSettings());

      await vi.advanceTimersByTimeAsync(0);

      expect(result.settings()).toEqual(testSettings);
    });

    it('falls back to defaults on load error', async () => {
      mockLoadSettings.mockRejectedValue(new Error('Storage error'));

      const { result } = renderHook(() => createQuickSettings());

      await vi.advanceTimersByTimeAsync(0);

      expect(result.settings()).toBeTruthy();
      expect(mockLogger.error).toHaveBeenCalledWith(
        'QuickSettings',
        expect.stringContaining('Failed to load'),
        expect.anything(),
      );
    });

    it('falls back to defaults after 2s timeout', async () => {
      mockLoadSettings.mockReturnValue(new Promise(() => {}));

      const { result } = renderHook(() => createQuickSettings());

      expect(result.settings()).toBeNull();

      await vi.advanceTimersByTimeAsync(2000);

      expect(result.settings()).toBeTruthy();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'QuickSettings',
        expect.stringContaining('timeout'),
      );
    });
  });

  describe('Page Size', () => {
    it('updates page size and saves', async () => {
      const testSettings = createTestSettings();
      mockLoadSettings.mockResolvedValue(testSettings);
      mockSaveSettings.mockResolvedValue(undefined);

      const { result } = renderHook(() => createQuickSettings());

      await vi.advanceTimersByTimeAsync(0);

      await result.handlers.handlePageSizeChange('Letter');

      expect(mockSaveSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          defaultConfig: expect.objectContaining({ pageSize: 'Letter' }),
        }),
      );
      expect(result.settings()?.defaultConfig.pageSize).toBe('Letter');
    });

    it('does nothing when settings not loaded', async () => {
      mockLoadSettings.mockReturnValue(new Promise(() => {}));

      const { result } = renderHook(() => createQuickSettings());

      await result.handlers.handlePageSizeChange('Letter');

      expect(mockSaveSettings).not.toHaveBeenCalled();
    });
  });

  describe('Margins', () => {
    it('updates margins from preset and saves', async () => {
      const testSettings = createTestSettings();
      mockLoadSettings.mockResolvedValue(testSettings);
      mockSaveSettings.mockResolvedValue(undefined);

      const { result } = renderHook(() => createQuickSettings());

      await vi.advanceTimersByTimeAsync(0);

      await result.handlers.handleMarginsChange('compact');

      expect(mockSaveSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          defaultConfig: expect.objectContaining({
            margin: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
          }),
        }),
      );
    });

    it('handles all margin presets', async () => {
      const testSettings = createTestSettings();
      mockLoadSettings.mockResolvedValue(testSettings);
      mockSaveSettings.mockResolvedValue(undefined);

      const { result } = renderHook(() => createQuickSettings());

      await vi.advanceTimersByTimeAsync(0);

      await result.handlers.handleMarginsChange('wide');

      expect(result.settings()?.defaultConfig.margin).toEqual({
        top: 1.0,
        right: 1.0,
        bottom: 1.0,
        left: 1.0,
      });
    });
  });

  describe('Custom Margins', () => {
    it('updates a single margin side', async () => {
      const testSettings = createTestSettings();
      mockLoadSettings.mockResolvedValue(testSettings);
      mockSaveSettings.mockResolvedValue(undefined);

      const { result } = renderHook(() => createQuickSettings());

      await vi.advanceTimersByTimeAsync(0);

      await result.handlers.handleCustomMarginChange('top', 1.5);

      expect(result.settings()?.defaultConfig.margin.top).toBe(1.5);
      expect(result.settings()?.defaultConfig.margin.right).toBe(0.75);
    });

    it('clamps value to 0-2 range', async () => {
      const testSettings = createTestSettings();
      mockLoadSettings.mockResolvedValue(testSettings);
      mockSaveSettings.mockResolvedValue(undefined);

      const { result } = renderHook(() => createQuickSettings());

      await vi.advanceTimersByTimeAsync(0);

      await result.handlers.handleCustomMarginChange('left', 5.0);

      expect(result.settings()?.defaultConfig.margin.left).toBe(2.0);
    });

    it('rounds to 0.05 inch increments', async () => {
      const testSettings = createTestSettings();
      mockLoadSettings.mockResolvedValue(testSettings);
      mockSaveSettings.mockResolvedValue(undefined);

      const { result } = renderHook(() => createQuickSettings());

      await vi.advanceTimersByTimeAsync(0);

      await result.handlers.handleCustomMarginChange('bottom', 0.73);

      expect(result.settings()?.defaultConfig.margin.bottom).toBe(0.75);
    });
  });

  describe('Reload', () => {
    it('reloads settings from storage', async () => {
      const initialSettings = createTestSettings();
      const updatedSettings = { ...createTestSettings(), theme: 'dark' as const };

      mockLoadSettings
        .mockResolvedValueOnce(initialSettings)
        .mockResolvedValueOnce(updatedSettings);

      const { result } = renderHook(() => createQuickSettings());

      await vi.advanceTimersByTimeAsync(0);
      expect(result.settings()?.theme).toBe('auto');

      await result.reloadSettings();

      expect(result.settings()?.theme).toBe('dark');
    });
  });
});
