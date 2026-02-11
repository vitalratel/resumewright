/**
 * ABOUTME: Tests for focus management reactive functions.
 * ABOUTME: Validates focus-on-mount, screen reader announcements, and focus traps.
 */

import { renderHook } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
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

const { createFocusOnMount, createFocusTrap, createScreenReaderAnnouncement } = await import(
  '../focus'
);

describe('createFocusOnMount', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('returns a ref callback function', () => {
    const { result } = renderHook(() => createFocusOnMount(() => true));

    expect(typeof result).toBe('function');
  });

  it('focuses element after delay when shouldFocus is true', () => {
    const { result: setRef } = renderHook(() => createFocusOnMount(() => true, 100));

    const mockElement = { focus: vi.fn() } as unknown as HTMLDivElement;
    setRef(mockElement);

    // Need to re-trigger effect after ref is set - advance timer
    vi.advanceTimersByTime(100);

    expect(mockElement.focus).toHaveBeenCalled();
  });

  it('does not focus when shouldFocus is false', () => {
    const { result: setRef } = renderHook(() => createFocusOnMount(() => false, 100));

    const mockElement = { focus: vi.fn() } as unknown as HTMLDivElement;
    setRef(mockElement);

    vi.advanceTimersByTime(200);

    expect(mockElement.focus).not.toHaveBeenCalled();
  });
});

describe('createScreenReaderAnnouncement', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    // Clean up any live regions left in DOM
    for (const el of document.querySelectorAll('[aria-live]')) {
      el.remove();
    }
  });

  it('creates a live region when message is set', () => {
    const [message, setMessage] = createSignal<string | null>(null);

    renderHook(() => createScreenReaderAnnouncement(message));

    setMessage('Test announcement');

    const liveRegion = document.querySelector('[aria-live]');
    expect(liveRegion).toBeTruthy();
    expect(liveRegion?.textContent).toBe('Test announcement');
  });

  it('does not create live region for null message', () => {
    renderHook(() => createScreenReaderAnnouncement(() => null));

    const liveRegion = document.querySelector('[aria-live]');
    expect(liveRegion).toBeNull();
  });

  it('clears message after timeout', () => {
    renderHook(() => createScreenReaderAnnouncement(() => 'Hello'));

    const liveRegion = document.querySelector('[aria-live]');
    expect(liveRegion?.textContent).toBe('Hello');

    vi.advanceTimersByTime(1000);

    expect(liveRegion?.textContent).toBe('');
  });

  it('cleans up live region on cleanup', () => {
    const { cleanup } = renderHook(() => createScreenReaderAnnouncement(() => 'Test'));

    expect(document.querySelector('[aria-live]')).toBeTruthy();

    cleanup();

    expect(document.querySelector('[aria-live]')).toBeNull();
  });

  it('uses correct priority attribute', () => {
    renderHook(() =>
      createScreenReaderAnnouncement(
        () => 'Urgent',
        () => 'assertive',
      ),
    );

    const liveRegion = document.querySelector('[aria-live]');
    expect(liveRegion?.getAttribute('aria-live')).toBe('assertive');
  });
});

describe('createFocusTrap', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('returns a ref callback', () => {
    const { result } = renderHook(() => createFocusTrap(() => false));

    expect(typeof result).toBe('function');
  });

  it('auto-focuses first focusable element when active', () => {
    const { result: setRef } = renderHook(() => createFocusTrap(() => true));

    const container = document.createElement('div');
    const button1 = document.createElement('button');
    const button2 = document.createElement('button');
    button1.textContent = 'First';
    button2.textContent = 'Second';
    container.appendChild(button1);
    container.appendChild(button2);
    document.body.appendChild(container);

    const focusSpy = vi.spyOn(button1, 'focus');

    setRef(container);

    vi.advanceTimersByTime(50);

    expect(focusSpy).toHaveBeenCalled();

    container.remove();
  });

  it('wraps focus from last to first on Tab', () => {
    const { result: setRef } = renderHook(() => createFocusTrap(() => true));

    const container = document.createElement('div');
    const button1 = document.createElement('button');
    const button2 = document.createElement('button');
    container.appendChild(button1);
    container.appendChild(button2);
    document.body.appendChild(container);

    setRef(container);
    vi.advanceTimersByTime(50);

    // Focus last element
    button2.focus();

    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
    container.dispatchEvent(event);

    expect(preventDefaultSpy).toHaveBeenCalled();

    container.remove();
  });

  it('restores focus when deactivated', () => {
    const [isActive, setIsActive] = createSignal(false);
    const { result: setRef } = renderHook(() => createFocusTrap(isActive));

    const outsideButton = document.createElement('button');
    outsideButton.textContent = 'Outside';
    document.body.appendChild(outsideButton);
    outsideButton.focus();

    const container = document.createElement('div');
    const innerButton = document.createElement('button');
    container.appendChild(innerButton);
    document.body.appendChild(container);

    setRef(container);

    setIsActive(true);
    vi.advanceTimersByTime(50);

    const restoreSpy = vi.spyOn(outsideButton, 'focus');
    setIsActive(false);
    vi.advanceTimersByTime(50);

    expect(restoreSpy).toHaveBeenCalled();

    container.remove();
    outsideButton.remove();
  });
});
