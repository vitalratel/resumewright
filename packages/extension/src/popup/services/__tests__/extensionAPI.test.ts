/**
 * Tests for ExtensionAPI
 *
 * Focus on P1 issues:
 * - Extension boundary error handling
 * - Message passing validation
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import browser from 'webextension-polyfill';
import { MessageType } from '../../../shared/types/messages';
import { extensionAPI } from '../extensionAPI';

// Mock browser API
vi.mock('webextension-polyfill', () => ({
  default: {
    runtime: {
      sendMessage: vi.fn(),
      onMessage: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
      },
    },
  },
}));

// Mock logger
vi.mock('../../../shared/logging', () => ({
  getLogger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
  })),
}));

describe('ExtensionAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateTsx', () => {
    it('should validate valid TSX', async () => {
      vi.mocked(browser.runtime.sendMessage).mockResolvedValue({ valid: true });

      const result = await extensionAPI.validateTsx('export default function CV() { return <div>Test</div>; }');

      expect(result).toBe(true);
      expect(browser.runtime.sendMessage).toHaveBeenCalledWith({
        type: MessageType.VALIDATE_TSX,
        payload: { tsx: 'export default function CV() { return <div>Test</div>; }' },
      });
    });

    it('should return false for invalid TSX', async () => {
      vi.mocked(browser.runtime.sendMessage).mockResolvedValue({ valid: false });

      const result = await extensionAPI.validateTsx('invalid tsx');

      expect(result).toBe(false);
    });

    it('should handle validation errors', async () => {
      vi.mocked(browser.runtime.sendMessage).mockRejectedValue(new Error('Service worker not responding'));

      const result = await extensionAPI.validateTsx('export default function CV() { return <div>Test</div>; }');

      expect(result).toBe(false);
    });

    it('should handle empty TSX content', async () => {
      vi.mocked(browser.runtime.sendMessage).mockResolvedValue({ valid: false });

      const result = await extensionAPI.validateTsx('');

      expect(result).toBe(false);
    });
  });

  describe('startConversion', () => {
    it('should start conversion with valid input', async () => {
      vi.mocked(browser.runtime.sendMessage)
        .mockResolvedValueOnce(undefined) // PING
        .mockResolvedValueOnce({ jobId: 'test-job', estimatedDuration: 5000 }); // CONVERSION_REQUEST

      const result = await extensionAPI.startConversion(
        'export default function CV() { return <div>Test</div>; }',
        'test.tsx',
      );

      expect(result).toEqual({ jobId: 'test-job', estimatedDuration: 5000 });
    });

    it('should handle service worker ping failure', async () => {
      vi.mocked(browser.runtime.sendMessage)
        .mockRejectedValueOnce(new Error('No receiver')) // PING fails
        .mockResolvedValueOnce({ jobId: 'test-job', estimatedDuration: 5000 }); // But conversion succeeds

      const result = await extensionAPI.startConversion(
        'export default function CV() { return <div>Test</div>; }',
        'test.tsx',
      );

      expect(result).toEqual({ jobId: 'test-job', estimatedDuration: 5000 });
    });

    it('should handle conversion request failure', async () => {
      vi.mocked(browser.runtime.sendMessage)
        .mockResolvedValueOnce(undefined) // PING succeeds
        .mockRejectedValueOnce(new Error('Conversion failed')); // CONVERSION_REQUEST fails

      await expect(
        extensionAPI.startConversion('export default function CV() { return <div>Test</div>; }', 'test.tsx'),
      ).rejects.toThrow('Conversion failed');
    });

    it('should send correct message format', async () => {
      vi.mocked(browser.runtime.sendMessage)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ jobId: 'test-job', estimatedDuration: 5000 });

      await extensionAPI.startConversion('content', 'file.tsx');

      expect(browser.runtime.sendMessage).toHaveBeenNthCalledWith(2, {
        type: MessageType.CONVERSION_REQUEST,
        payload: {
          tsx: 'content',
          fileName: 'file.tsx',
        },
      });
    });

    it('should handle non-Error exceptions in error logging', async () => {
      vi.mocked(browser.runtime.sendMessage)
        .mockResolvedValueOnce(undefined) // PING succeeds
        .mockRejectedValueOnce('String error message'); // Non-Error exception

      await expect(
        extensionAPI.startConversion('content', 'file.tsx'),
      ).rejects.toBe('String error message');

      // Verify error was logged (String(error) conversion for non-Error)
      expect(browser.runtime.sendMessage).toHaveBeenCalledTimes(2);
    });
  });

  describe('onProgress', () => {
    it('should subscribe to progress updates', () => {
      const callback = vi.fn();

      const unsubscribe = extensionAPI.onProgress(callback);

      expect(browser.runtime.onMessage.addListener).toHaveBeenCalled();
      expect(typeof unsubscribe).toBe('function');
    });

    it('should unsubscribe from progress updates', () => {
      const callback = vi.fn();

      const unsubscribe = extensionAPI.onProgress(callback);
      unsubscribe();

      expect(browser.runtime.onMessage.removeListener).toHaveBeenCalled();
    });

    it('should call callback with progress payload', () => {
      const callback = vi.fn();
      let listener: ((message: unknown) => void) | null = null;

      vi.mocked(browser.runtime.onMessage.addListener).mockImplementation((fn) => {
        listener = fn as typeof listener;
      });

      extensionAPI.onProgress(callback);

      listener!({
        type: MessageType.CONVERSION_PROGRESS,
        payload: { jobId: 'test', progress: { stage: 'parsing', percentage: 50 } },
      });

      expect(callback).toHaveBeenCalledWith({
        jobId: 'test',
        progress: { stage: 'parsing', percentage: 50 },
      });
    });

    it('should ignore non-progress messages', () => {
      const callback = vi.fn();
      let listener: ((message: unknown) => void) | null = null;

      vi.mocked(browser.runtime.onMessage.addListener).mockImplementation((fn) => {
        listener = fn as typeof listener;
      });

      extensionAPI.onProgress(callback);

      listener!({ type: MessageType.CONVERSION_COMPLETE, payload: {} });

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('onSuccess', () => {
    it('should subscribe to success events', () => {
      const callback = vi.fn();

      const unsubscribe = extensionAPI.onSuccess(callback);

      expect(browser.runtime.onMessage.addListener).toHaveBeenCalled();
      expect(typeof unsubscribe).toBe('function');
    });

    it('should call callback with success payload', () => {
      const callback = vi.fn();
      let listener: ((message: unknown) => void) | null = null;

      vi.mocked(browser.runtime.onMessage.addListener).mockImplementation((fn) => {
        listener = fn as typeof listener;
      });

      extensionAPI.onSuccess(callback);

      listener!({
        type: MessageType.CONVERSION_COMPLETE,
        payload: { jobId: 'test', filename: 'test.pdf', fileSize: 1024, duration: 5000 },
      });

      expect(callback).toHaveBeenCalledWith({
        jobId: 'test',
        filename: 'test.pdf',
        fileSize: 1024,
        duration: 5000,
      });
    });
  });

  describe('onError', () => {
    it('should subscribe to error events', () => {
      const callback = vi.fn();

      const unsubscribe = extensionAPI.onError(callback);

      expect(browser.runtime.onMessage.addListener).toHaveBeenCalled();
      expect(typeof unsubscribe).toBe('function');
    });

    it('should call callback with error payload', () => {
      const callback = vi.fn();
      let listener: ((message: unknown) => void) | null = null;

      vi.mocked(browser.runtime.onMessage.addListener).mockImplementation((fn) => {
        listener = fn as typeof listener;
      });

      extensionAPI.onError(callback);

      listener!({
        type: MessageType.CONVERSION_ERROR,
        payload: {
          jobId: 'test',
          error: {
            code: 'PARSE_ERROR',
            message: 'Invalid TSX',
            category: 'syntax',
          },
        },
      });

      expect(callback).toHaveBeenCalledWith({
        jobId: 'test',
        error: {
          code: 'PARSE_ERROR',
          message: 'Invalid TSX',
          category: 'syntax',
        },
      });
    });
  });
});
