/**
 * Tests for useUnsavedChanges hook
 * Deep equality check for reliable dirty detection
 */

import { renderHook } from '@testing-library/react';
import { describe, expect } from 'vitest';
import { useUnsavedChanges } from '../useUnsavedChanges';

interface TestSettings {
  defaultConfig: {
    pageSize: 'Letter' | 'A4' | 'Legal';
    margin: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
  };
  customFonts: string[];
}

describe('useUnsavedChanges', () => {
  const originalSettings: TestSettings = {
    defaultConfig: {
      pageSize: 'Letter',
      margin: { top: 1, right: 1, bottom: 1, left: 1 },
    },
    customFonts: [],
  };

  describe('Basic Functionality', () => {
    it('returns false when both values are null', () => {
      const { result } = renderHook(() => useUnsavedChanges(null, null));

      expect(result.current.isDirty).toBe(false);
    });

    it('returns false when current is null', () => {
      const { result } = renderHook(() => useUnsavedChanges(null, originalSettings));

      expect(result.current.isDirty).toBe(false);
    });

    it('returns false when original is null', () => {
      const { result } = renderHook(() => useUnsavedChanges(originalSettings, null));

      expect(result.current.isDirty).toBe(false);
    });

    it('returns false when values are identical', () => {
      const { result } = renderHook(() =>
        useUnsavedChanges(originalSettings, originalSettings),
      );

      expect(result.current.isDirty).toBe(false);
    });

    it('returns false when values are deep equal but different objects', () => {
      const copy = JSON.parse(JSON.stringify(originalSettings));
      const { result } = renderHook(() => useUnsavedChanges(copy, originalSettings));

      expect(result.current.isDirty).toBe(false);
    });
  });

  describe('Dirty Detection - Top Level Changes', () => {
    it('detects change in page size', () => {
      const modified = {
        ...originalSettings,
        defaultConfig: { ...originalSettings.defaultConfig, pageSize: 'A4' as const },
      };

      const { result } = renderHook(() => useUnsavedChanges(modified, originalSettings));

      expect(result.current.isDirty).toBe(true);
    });

    it('detects change in custom fonts array', () => {
      const modified = {
        ...originalSettings,
        customFonts: ['font1.ttf'],
      };

      const { result } = renderHook(() => useUnsavedChanges(modified, originalSettings));

      expect(result.current.isDirty).toBe(true);
    });
  });

  describe('Dirty Detection - Nested Changes', () => {
    it('detects change in nested margin.top', () => {
      const modified = {
        ...originalSettings,
        defaultConfig: {
          ...originalSettings.defaultConfig,
          margin: { ...originalSettings.defaultConfig.margin, top: 1.5 },
        },
      };

      const { result } = renderHook(() => useUnsavedChanges(modified, originalSettings));

      expect(result.current.isDirty).toBe(true);
    });

    it('detects change in nested margin.right', () => {
      const modified = {
        ...originalSettings,
        defaultConfig: {
          ...originalSettings.defaultConfig,
          margin: { ...originalSettings.defaultConfig.margin, right: 0.75 },
        },
      };

      const { result } = renderHook(() => useUnsavedChanges(modified, originalSettings));

      expect(result.current.isDirty).toBe(true);
    });

    it('detects change in nested margin.bottom', () => {
      const modified = {
        ...originalSettings,
        defaultConfig: {
          ...originalSettings.defaultConfig,
          margin: { ...originalSettings.defaultConfig.margin, bottom: 1.25 },
        },
      };

      const { result } = renderHook(() => useUnsavedChanges(modified, originalSettings));

      expect(result.current.isDirty).toBe(true);
    });

    it('detects change in nested margin.left', () => {
      const modified = {
        ...originalSettings,
        defaultConfig: {
          ...originalSettings.defaultConfig,
          margin: { ...originalSettings.defaultConfig.margin, left: 0.5 },
        },
      };

      const { result } = renderHook(() => useUnsavedChanges(modified, originalSettings));

      expect(result.current.isDirty).toBe(true);
    });
  });

  describe('Array Handling', () => {
    it('detects array length change', () => {
      const modified = {
        ...originalSettings,
        customFonts: ['font1.ttf', 'font2.ttf'],
      };

      const { result } = renderHook(() => useUnsavedChanges(modified, originalSettings));

      expect(result.current.isDirty).toBe(true);
    });

    it('detects array item change', () => {
      const original = { ...originalSettings, customFonts: ['font1.ttf'] };
      const modified = { ...originalSettings, customFonts: ['font2.ttf'] };

      const { result } = renderHook(() => useUnsavedChanges(modified, original));

      expect(result.current.isDirty).toBe(true);
    });

    it('detects array order change', () => {
      const original = { ...originalSettings, customFonts: ['font1.ttf', 'font2.ttf'] };
      const modified = { ...originalSettings, customFonts: ['font2.ttf', 'font1.ttf'] };

      const { result } = renderHook(() => useUnsavedChanges(modified, original));

      expect(result.current.isDirty).toBe(true);
    });

    it('returns false for identical arrays', () => {
      const original = { ...originalSettings, customFonts: ['font1.ttf', 'font2.ttf'] };
      const modified = { ...originalSettings, customFonts: ['font1.ttf', 'font2.ttf'] };

      const { result } = renderHook(() => useUnsavedChanges(modified, original));

      expect(result.current.isDirty).toBe(false);
    });
  });

  describe('Deep Equality Edge Cases', () => {
    it('handles different object key order', () => {
      const original = { defaultConfig: { pageSize: 'Letter' as const, margin: { top: 1, right: 1, bottom: 1, left: 1 } }, customFonts: [] };
      const modified = { customFonts: [], defaultConfig: { margin: { left: 1, bottom: 1, right: 1, top: 1 }, pageSize: 'Letter' as const } };

      const { result } = renderHook(() => useUnsavedChanges(modified, original));

      expect(result.current.isDirty).toBe(false);
    });

    it('detects extra property added', () => {
      const modified = {
        ...originalSettings,
        extraProperty: 'value',
      } as typeof originalSettings & { extraProperty: string };

      const { result } = renderHook(() => useUnsavedChanges(modified, originalSettings));

      expect(result.current.isDirty).toBe(true);
    });

    it('detects property removed', () => {
      const modified = {
        defaultConfig: originalSettings.defaultConfig,
        // customFonts removed
      };

      const { result } = renderHook(() => useUnsavedChanges(modified, originalSettings));

      expect(result.current.isDirty).toBe(true);
    });
  });

  describe('Performance - Memoization', () => {
    it('returns stable isDirty value when inputs unchanged', () => {
      const { result, rerender } = renderHook(
        ({ current, original }) => useUnsavedChanges(current, original),
        { initialProps: { current: originalSettings, original: originalSettings } },
      );

      const firstResult = result.current.isDirty;

      rerender({ current: originalSettings, original: originalSettings });

      expect(result.current.isDirty).toBe(firstResult);
      expect(result.current.isDirty).toBe(false);
    });

    it('updates isDirty when current changes', () => {
      const { result, rerender } = renderHook(
        ({ current, original }) => useUnsavedChanges(current, original),
        { initialProps: { current: originalSettings, original: originalSettings } },
      );

      expect(result.current.isDirty).toBe(false);

      const modified = {
        ...originalSettings,
        defaultConfig: { ...originalSettings.defaultConfig, pageSize: 'A4' as const },
      };

      rerender({ current: modified, original: originalSettings });

      expect(result.current.isDirty).toBe(true);
    });
  });
});
