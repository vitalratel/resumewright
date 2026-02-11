/**
 * ABOUTME: Tests for file reading utilities and drag-and-drop handling.
 * ABOUTME: Validates readAsText, readAsDataURL, and createDragAndDrop.
 */

import { renderHook } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDragAndDrop, readAsDataURL, readAsText } from '../file';

// Mock FileReader
class MockFileReader {
  onload: ((e: { target: { result: unknown } }) => void) | null = null;
  onerror: (() => void) | null = null;

  readAsText(_file: File) {
    // Simulate async read
    queueMicrotask(() => {
      this.onload?.({ target: { result: 'file content' } });
    });
  }

  readAsDataURL(_file: File) {
    queueMicrotask(() => {
      this.onload?.({ target: { result: 'data:text/plain;base64,abc' } });
    });
  }
}

describe('File reading utilities', () => {
  let originalFileReader: typeof FileReader;

  beforeEach(() => {
    originalFileReader = globalThis.FileReader;
    // @ts-expect-error - mock FileReader
    globalThis.FileReader = MockFileReader;
  });

  afterEach(() => {
    globalThis.FileReader = originalFileReader;
  });

  describe('readAsText', () => {
    it('reads file as text', async () => {
      const file = new File(['content'], 'test.tsx', { type: 'text/plain' });

      const result = await readAsText(file);

      expect(result).toBe('file content');
    });

    it('rejects when result is not a string', async () => {
      // @ts-expect-error - mock non-string result
      globalThis.FileReader = class {
        onload: ((e: { target: { result: unknown } }) => void) | null = null;
        onerror: (() => void) | null = null;
        readAsText() {
          queueMicrotask(() => {
            this.onload?.({ target: { result: null } });
          });
        }
      };

      const file = new File([''], 'test.tsx');

      await expect(readAsText(file)).rejects.toThrow('Failed to read file as text');
    });

    it('rejects on read error', async () => {
      // @ts-expect-error - mock error
      globalThis.FileReader = class {
        onload: ((e: unknown) => void) | null = null;
        onerror: (() => void) | null = null;
        readAsText() {
          queueMicrotask(() => {
            this.onerror?.();
          });
        }
      };

      const file = new File([''], 'test.tsx');

      await expect(readAsText(file)).rejects.toThrow('File read error');
    });
  });

  describe('readAsDataURL', () => {
    it('reads file as data URL', async () => {
      const file = new File(['content'], 'image.png', { type: 'image/png' });

      const result = await readAsDataURL(file);

      expect(result).toBe('data:text/plain;base64,abc');
    });

    it('rejects when result is not a string', async () => {
      // @ts-expect-error - mock non-string result
      globalThis.FileReader = class {
        onload: ((e: { target: { result: unknown } }) => void) | null = null;
        onerror: (() => void) | null = null;
        readAsDataURL() {
          queueMicrotask(() => {
            this.onload?.({ target: { result: null } });
          });
        }
      };

      const file = new File([''], 'image.png');

      await expect(readAsDataURL(file)).rejects.toThrow('Failed to read file as data URL');
    });

    it('rejects on read error', async () => {
      // @ts-expect-error - mock error
      globalThis.FileReader = class {
        onload: ((e: unknown) => void) | null = null;
        onerror: (() => void) | null = null;
        readAsDataURL() {
          queueMicrotask(() => {
            this.onerror?.();
          });
        }
      };

      const file = new File([''], 'image.png');

      await expect(readAsDataURL(file)).rejects.toThrow('File read error');
    });
  });
});

describe('createDragAndDrop', () => {
  function createDragEvent(type: string, files: File[] = []): DragEvent {
    const event = new Event(type, { bubbles: true, cancelable: true }) as DragEvent;
    Object.defineProperty(event, 'dataTransfer', {
      value: {
        files,
      },
    });
    Object.defineProperty(event, 'preventDefault', { value: vi.fn() });
    Object.defineProperty(event, 'stopPropagation', { value: vi.fn() });
    return event;
  }

  it('starts with isDragging false', () => {
    const onFileDrop = vi.fn();
    const { result } = renderHook(() => createDragAndDrop(onFileDrop));

    expect(result.isDragging()).toBe(false);
  });

  it('sets isDragging true on dragEnter', () => {
    const onFileDrop = vi.fn();
    const { result } = renderHook(() => createDragAndDrop(onFileDrop));

    const event = createDragEvent('dragenter');
    result.dragHandlers.onDragEnter(event);

    expect(result.isDragging()).toBe(true);
  });

  it('sets isDragging false on dragLeave', () => {
    const onFileDrop = vi.fn();
    const { result } = renderHook(() => createDragAndDrop(onFileDrop));

    result.dragHandlers.onDragEnter(createDragEvent('dragenter'));
    expect(result.isDragging()).toBe(true);

    result.dragHandlers.onDragLeave(createDragEvent('dragleave'));
    expect(result.isDragging()).toBe(false);
  });

  it('prevents default on dragOver', () => {
    const onFileDrop = vi.fn();
    const { result } = renderHook(() => createDragAndDrop(onFileDrop));

    const event = createDragEvent('dragover');
    result.dragHandlers.onDragOver(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(event.stopPropagation).toHaveBeenCalled();
  });

  it('calls onFileDrop with first file on drop', () => {
    const onFileDrop = vi.fn();
    const { result } = renderHook(() => createDragAndDrop(onFileDrop));

    const file = new File(['content'], 'test.tsx', { type: 'text/plain' });
    const event = createDragEvent('drop', [file]);
    result.dragHandlers.onDrop(event);

    expect(onFileDrop).toHaveBeenCalledWith(file);
    expect(result.isDragging()).toBe(false);
  });

  it('does not call onFileDrop when no files dropped', () => {
    const onFileDrop = vi.fn();
    const { result } = renderHook(() => createDragAndDrop(onFileDrop));

    const event = createDragEvent('drop', []);
    result.dragHandlers.onDrop(event);

    expect(onFileDrop).not.toHaveBeenCalled();
  });

  it('sets isDragging false on drop', () => {
    const onFileDrop = vi.fn();
    const { result } = renderHook(() => createDragAndDrop(onFileDrop));

    result.dragHandlers.onDragEnter(createDragEvent('dragenter'));
    expect(result.isDragging()).toBe(true);

    result.dragHandlers.onDrop(createDragEvent('drop'));
    expect(result.isDragging()).toBe(false);
  });
});
