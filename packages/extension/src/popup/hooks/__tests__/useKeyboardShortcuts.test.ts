/**
 * Tests for useKeyboardShortcuts hook
 * Keyboard shortcuts for power users and accessibility
 */

import type { ShortcutConfig } from '../ui/useKeyboardShortcuts';
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, vi } from 'vitest';
import {
  formatShortcut,
  getAvailableShortcuts,
  getModifierKey,
  getModifierKeyName,
  useKeyboardShortcuts,
} from '../ui/useKeyboardShortcuts';

function dispatchKey(
  key: string,
  mods: { ctrl?: boolean; shift?: boolean; alt?: boolean; meta?: boolean } = {}
) {
  const event = new KeyboardEvent('keydown', {
    key,
    ctrlKey: mods.ctrl,
    shiftKey: mods.shift,
    altKey: mods.alt,
    metaKey: mods.meta,
    bubbles: true,
  });
  const spy = vi.spyOn(event, 'preventDefault');
  window.dispatchEvent(event);
  return spy;
}

function createShortcut(
  key: string,
  desc: string,
  handler = vi.fn(),
  opts?: Partial<ShortcutConfig>
): ShortcutConfig {
  return {
    key,
    ctrl: true,
    meta: true,
    handler,
    description: desc,
    ...opts,
  };
}

describe('useKeyboardShortcuts', () => {
  let addSpy: ReturnType<typeof vi.spyOn>;
  let removeSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    addSpy = vi.spyOn(window, 'addEventListener');
    removeSpy = vi.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('registers/removes keydown event listener on mount/unmount', () => {
    const { unmount } = renderHook(() => useKeyboardShortcuts([createShortcut('e', 'Test')]));

    expect(addSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

    unmount();

    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('calls handler when matching shortcut pressed', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcuts([createShortcut('e', 'Test', handler)]));

    dispatchKey('e', { ctrl: true });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('does not call handler when shortcut disabled', () => {
    const handler = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts([createShortcut('e', 'Test', handler, { enabled: false })])
    );

    dispatchKey('e', { ctrl: true });

    expect(handler).not.toHaveBeenCalled();
  });

  it('prevents default behavior by default', () => {
    renderHook(() => useKeyboardShortcuts([createShortcut('e', 'Test')]));

    const preventSpy = dispatchKey('e', { ctrl: true });

    expect(preventSpy).toHaveBeenCalled();
  });

  it('does not prevent default when preventDefault is false', () => {
    renderHook(() =>
      useKeyboardShortcuts([createShortcut('e', 'Test', vi.fn(), { preventDefault: false })])
    );

    const preventSpy = dispatchKey('e', { ctrl: true });

    expect(preventSpy).not.toHaveBeenCalled();
  });

  it('handles Escape key without modifiers', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcuts([{ key: 'Escape', handler, description: 'Close' }]));

    dispatchKey('Escape');

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('handles Space key', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcuts([{ key: ' ', handler, description: 'Toggle' }]));

    dispatchKey(' ');

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('does not call handler when modifier key mismatch', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcuts([createShortcut('e', 'Test', handler)]));

    dispatchKey('e');

    expect(handler).not.toHaveBeenCalled();
  });

  it('handles shift modifier', () => {
    const handler = vi.fn();
    const shortcut = { key: 'T', shift: true, handler, description: 'Test' };
    renderHook(() => useKeyboardShortcuts([shortcut]));

    dispatchKey('T', { shift: true });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('handles alt modifier', () => {
    const handler = vi.fn();
    const shortcut = { key: 'a', alt: true, handler, description: 'Test' };
    renderHook(() => useKeyboardShortcuts([shortcut]));

    dispatchKey('a', { alt: true });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('only triggers first matching shortcut', () => {
    const [h1, h2] = [vi.fn(), vi.fn()];
    renderHook(() =>
      useKeyboardShortcuts([createShortcut('e', 'Test 1', h1), createShortcut('e', 'Test 2', h2)])
    );

    dispatchKey('e', { ctrl: true });

    expect(h1).toHaveBeenCalledTimes(1);
    expect(h2).not.toHaveBeenCalled();
  });

  it('is case-insensitive for key matching', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcuts([createShortcut('E', 'Test', handler)]));

    dispatchKey('e', { ctrl: true });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('updates shortcuts when dependencies change', () => {
    const [h1, h2] = [vi.fn(), vi.fn()];

    const { rerender } = renderHook(({ shortcuts }) => useKeyboardShortcuts(shortcuts), {
      initialProps: { shortcuts: [createShortcut('e', 'Test 1', h1)] },
    });

    dispatchKey('e', { ctrl: true });
    expect(h1).toHaveBeenCalledTimes(1);

    rerender({ shortcuts: [createShortcut('e', 'Test 2', h2)] });

    dispatchKey('e', { ctrl: true });

    expect(h1).toHaveBeenCalledTimes(1);
    expect(h2).toHaveBeenCalledTimes(1);
  });
});

describe('getModifierKey', () => {
  it('returns platform-specific modifier key', () => {
    expect(['⌘', 'Ctrl']).toContain(getModifierKey());
  });
});

describe('getModifierKeyName', () => {
  it('returns platform-specific modifier key name', () => {
    expect(['Cmd', 'Ctrl']).toContain(getModifierKeyName());
  });
});

describe('formatShortcut', () => {
  const format = (key: string, opts?: Partial<ShortcutConfig>) =>
    formatShortcut({ key, handler: vi.fn(), description: 'Test', ...opts });

  it('formats simple key', () => {
    expect(format('e')).toBe('E');
  });

  it('formats key with modifier', () => {
    expect(['⌘E', 'CtrlE']).toContain(format('e', { ctrl: true, meta: true }));
  });

  it('formats key with shift', () => {
    expect(['⌘⇧T', 'Ctrl⇧T']).toContain(format('t', { ctrl: true, meta: true, shift: true }));
  });

  it('formats key with alt', () => {
    expect(format('a', { alt: true })).toBe('AltA');
  });

  it.each([
    ['Escape', 'Esc'],
    [' ', 'Space'],
    [',', ','],
  ])('formats %s key', (key, expected) => {
    const result = format(key);
    expect(result.includes(expected)).toBe(true);
  });
});

describe('getAvailableShortcuts', () => {
  it('returns enabled shortcuts with formatted strings', () => {
    const shortcuts: ShortcutConfig[] = [
      createShortcut('e', 'Export'),
      { key: 'Escape', handler: vi.fn(), description: 'Close' },
    ];

    const result = getAvailableShortcuts(shortcuts);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ description: 'Export' });
    expect(['⌘E', 'CtrlE']).toContain(result[0].shortcut);
    expect(result[1]).toMatchObject({ description: 'Close', shortcut: 'Esc' });
  });

  it('filters out disabled shortcuts', () => {
    const shortcuts: ShortcutConfig[] = [
      createShortcut('e', 'Export', vi.fn(), { enabled: true }),
      createShortcut('r', 'Retry', vi.fn(), { enabled: false }),
    ];

    const result = getAvailableShortcuts(shortcuts);

    expect(result).toHaveLength(1);
    expect(result[0].description).toBe('Export');
  });

  it('returns empty array when all shortcuts disabled', () => {
    const result = getAvailableShortcuts([
      createShortcut('e', 'Export', vi.fn(), { enabled: false }),
    ]);

    expect(result).toHaveLength(0);
  });
});
