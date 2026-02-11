/**
 * ABOUTME: Tests for keyboard shortcut reactive functions.
 * ABOUTME: Validates shortcut matching, formatting, and event listener management.
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

const {
  createKeyboardShortcuts,
  formatShortcut,
  getAvailableShortcuts,
  getModifierKey,
  getModifierKeyName,
} = await import('../keyboard');

describe('getModifierKey', () => {
  it('returns ⌘ on Mac', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X)',
    );
    expect(getModifierKey()).toBe('⌘');
  });

  it('returns Ctrl on non-Mac', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (Windows NT 10.0)');
    expect(getModifierKey()).toBe('Ctrl');
  });
});

describe('getModifierKeyName', () => {
  it('returns Cmd on Mac', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X)',
    );
    expect(getModifierKeyName()).toBe('Cmd');
  });

  it('returns Ctrl on non-Mac', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (Windows NT 10.0)');
    expect(getModifierKeyName()).toBe('Ctrl');
  });
});

describe('formatShortcut', () => {
  beforeEach(() => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (Windows NT 10.0)');
  });

  it('formats a simple key shortcut', () => {
    const result = formatShortcut({
      key: 'Escape',
      handler: vi.fn(),
      description: 'Close',
    });
    expect(result).toBe('Esc');
  });

  it('formats ctrl+key shortcut', () => {
    const result = formatShortcut({
      key: 'e',
      ctrl: true,
      handler: vi.fn(),
      description: 'Export',
    });
    expect(result).toBe('CtrlE');
  });

  it('formats shortcut with shift', () => {
    const result = formatShortcut({
      key: 'r',
      ctrl: true,
      shift: true,
      handler: vi.fn(),
      description: 'Reload',
    });
    expect(result).toBe('Ctrl⇧R');
  });

  it('formats space key', () => {
    const result = formatShortcut({
      key: ' ',
      handler: vi.fn(),
      description: 'Toggle',
    });
    expect(result).toBe('Space');
  });

  it('formats shortcut with alt', () => {
    const result = formatShortcut({
      key: 'a',
      alt: true,
      handler: vi.fn(),
      description: 'Select all',
    });
    expect(result).toBe('AltA');
  });
});

describe('getAvailableShortcuts', () => {
  it('returns enabled shortcuts with formatted display', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (Windows NT 10.0)');

    const shortcuts = [
      { key: 'e', ctrl: true, handler: vi.fn(), description: 'Export' },
      { key: 'Escape', handler: vi.fn(), description: 'Close', enabled: false },
      { key: '/', handler: vi.fn(), description: 'Search' },
    ];

    const result = getAvailableShortcuts(shortcuts);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ shortcut: 'CtrlE', description: 'Export' });
    expect(result[1]).toEqual({ shortcut: '/', description: 'Search' });
  });
});

describe('createKeyboardShortcuts', () => {
  beforeEach(() => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (Windows NT 10.0)');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('registers a keydown listener on window', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');

    renderHook(() =>
      createKeyboardShortcuts([{ key: 'e', ctrl: true, handler: vi.fn(), description: 'Export' }]),
    );

    expect(addSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('removes listener on cleanup', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const { cleanup } = renderHook(() =>
      createKeyboardShortcuts([{ key: 'e', ctrl: true, handler: vi.fn(), description: 'Export' }]),
    );

    cleanup();

    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('calls handler when matching shortcut is triggered', () => {
    const handler = vi.fn();

    renderHook(() =>
      createKeyboardShortcuts([{ key: 'e', ctrl: true, handler, description: 'Export' }]),
    );

    const event = new KeyboardEvent('keydown', {
      key: 'e',
      ctrlKey: true,
      bubbles: true,
    });
    window.dispatchEvent(event);

    expect(handler).toHaveBeenCalledWith(event);
  });

  it('prevents default by default', () => {
    const handler = vi.fn();

    renderHook(() =>
      createKeyboardShortcuts([{ key: 'e', ctrl: true, handler, description: 'Export' }]),
    );

    const event = new KeyboardEvent('keydown', {
      key: 'e',
      ctrlKey: true,
      bubbles: true,
    });
    const preventSpy = vi.spyOn(event, 'preventDefault');
    window.dispatchEvent(event);

    expect(preventSpy).toHaveBeenCalled();
  });

  it('does not prevent default when preventDefault is false', () => {
    const handler = vi.fn();

    renderHook(() =>
      createKeyboardShortcuts([
        { key: 'e', ctrl: true, handler, description: 'Export', preventDefault: false },
      ]),
    );

    const event = new KeyboardEvent('keydown', {
      key: 'e',
      ctrlKey: true,
      bubbles: true,
    });
    const preventSpy = vi.spyOn(event, 'preventDefault');
    window.dispatchEvent(event);

    expect(preventSpy).not.toHaveBeenCalled();
  });

  it('skips disabled shortcuts', () => {
    const handler = vi.fn();

    renderHook(() =>
      createKeyboardShortcuts([
        { key: 'e', ctrl: true, handler, description: 'Export', enabled: false },
      ]),
    );

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'e', ctrlKey: true, bubbles: true }));

    expect(handler).not.toHaveBeenCalled();
  });

  it('does not trigger on non-matching keys', () => {
    const handler = vi.fn();

    renderHook(() =>
      createKeyboardShortcuts([{ key: 'e', ctrl: true, handler, description: 'Export' }]),
    );

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'x', ctrlKey: true, bubbles: true }));

    expect(handler).not.toHaveBeenCalled();
  });

  it('does not trigger when modifier is missing', () => {
    const handler = vi.fn();

    renderHook(() =>
      createKeyboardShortcuts([{ key: 'e', ctrl: true, handler, description: 'Export' }]),
    );

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'e', bubbles: true }));

    expect(handler).not.toHaveBeenCalled();
  });

  it('matches meta key for meta shortcuts', () => {
    const handler = vi.fn();

    renderHook(() =>
      createKeyboardShortcuts([{ key: 'e', meta: true, handler, description: 'Export' }]),
    );

    const event = new KeyboardEvent('keydown', {
      key: 'e',
      metaKey: true,
      bubbles: true,
    });
    window.dispatchEvent(event);

    expect(handler).toHaveBeenCalled();
  });

  it('checks shift modifier correctly', () => {
    const handler = vi.fn();

    renderHook(() =>
      createKeyboardShortcuts([
        { key: 'r', ctrl: true, shift: true, handler, description: 'Reload' },
      ]),
    );

    // Without shift — should not match
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r', ctrlKey: true, bubbles: true }));
    expect(handler).not.toHaveBeenCalled();

    // With shift — should match
    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'r', ctrlKey: true, shiftKey: true, bubbles: true }),
    );
    expect(handler).toHaveBeenCalled();
  });
});
