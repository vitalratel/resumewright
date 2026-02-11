/**
 * ABOUTME: Tests for settings-related reactive functions.
 * ABOUTME: Validates unsaved changes detection with deep equality.
 */

import { renderHook } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { describe, expect, it } from 'vitest';
import { createUnsavedChanges } from '../settings';

describe('createUnsavedChanges', () => {
  describe('Basic Detection', () => {
    it('returns not dirty when current equals original', () => {
      const { result } = renderHook(() =>
        createUnsavedChanges(
          () => ({ name: 'test' }),
          () => ({ name: 'test' }),
        ),
      );

      expect(result.isDirty()).toBe(false);
    });

    it('returns dirty when current differs from original', () => {
      const { result } = renderHook(() =>
        createUnsavedChanges(
          () => ({ name: 'changed' }),
          () => ({ name: 'test' }),
        ),
      );

      expect(result.isDirty()).toBe(true);
    });

    it('returns not dirty when both are null', () => {
      const { result } = renderHook(() =>
        createUnsavedChanges(
          () => null,
          () => null,
        ),
      );

      expect(result.isDirty()).toBe(false);
    });

    it('returns not dirty when current is null', () => {
      const { result } = renderHook(() =>
        createUnsavedChanges(
          () => null,
          () => ({ name: 'test' }),
        ),
      );

      expect(result.isDirty()).toBe(false);
    });

    it('returns not dirty when original is null', () => {
      const { result } = renderHook(() =>
        createUnsavedChanges(
          () => ({ name: 'test' }),
          () => null,
        ),
      );

      expect(result.isDirty()).toBe(false);
    });
  });

  describe('Deep Equality', () => {
    it('detects changes in nested objects', () => {
      const { result } = renderHook(() =>
        createUnsavedChanges(
          () => ({ config: { margin: { top: 1 } } }),
          () => ({ config: { margin: { top: 0.5 } } }),
        ),
      );

      expect(result.isDirty()).toBe(true);
    });

    it('considers equal nested objects as not dirty', () => {
      const { result } = renderHook(() =>
        createUnsavedChanges(
          () => ({ config: { margin: { top: 1, bottom: 1 } } }),
          () => ({ config: { margin: { top: 1, bottom: 1 } } }),
        ),
      );

      expect(result.isDirty()).toBe(false);
    });

    it('detects array changes', () => {
      const { result } = renderHook(() =>
        createUnsavedChanges(
          () => ({ items: [1, 2, 3] }),
          () => ({ items: [1, 2] }),
        ),
      );

      expect(result.isDirty()).toBe(true);
    });

    it('considers equal arrays as not dirty', () => {
      const { result } = renderHook(() =>
        createUnsavedChanges(
          () => ({ items: [1, 2, 3] }),
          () => ({ items: [1, 2, 3] }),
        ),
      );

      expect(result.isDirty()).toBe(false);
    });
  });

  describe('Reactivity', () => {
    it('updates isDirty when current changes', () => {
      const [current, setCurrent] = createSignal({ name: 'test' });
      const original = () => ({ name: 'test' });

      const { result } = renderHook(() => createUnsavedChanges(current, original));

      expect(result.isDirty()).toBe(false);

      setCurrent({ name: 'changed' });

      expect(result.isDirty()).toBe(true);
    });

    it('updates isDirty when original changes', () => {
      const current = () => ({ name: 'test' });
      const [original, setOriginal] = createSignal({ name: 'test' });

      const { result } = renderHook(() => createUnsavedChanges(current, original));

      expect(result.isDirty()).toBe(false);

      setOriginal({ name: 'different' });

      expect(result.isDirty()).toBe(true);
    });
  });
});
