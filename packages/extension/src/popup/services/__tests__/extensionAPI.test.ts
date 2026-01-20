// ABOUTME: Tests for extensionAPI messaging functions.
// ABOUTME: Verifies TSX validation, conversion requests, and message subscriptions.

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { onError, onProgress, onSuccess, requestConversion, validateTsx } from '../extensionAPI';

// Mock messaging using vi.hoisted for proper hoisting
const mocks = vi.hoisted(() => ({
  sendMessage: vi.fn(),
  onMessage: vi.fn(),
}));

vi.mock('@/shared/messaging', () => ({
  sendMessage: mocks.sendMessage,
  onMessage: mocks.onMessage,
}));

// Mock logger
vi.mock('@/shared/infrastructure/logging', () => ({
  getLogger: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

describe('extensionAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.sendMessage.mockReset();
    mocks.onMessage.mockReset();
  });

  describe('validateTsx', () => {
    it('should validate valid TSX', async () => {
      mocks.sendMessage.mockResolvedValue({ valid: true });

      const result = await validateTsx('export default function CV() { return <div>Test</div>; }');

      expect(result).toBe(true);
      expect(mocks.sendMessage).toHaveBeenCalledWith('validateTsx', {
        tsx: 'export default function CV() { return <div>Test</div>; }',
      });
    });

    it('should return false for invalid TSX', async () => {
      mocks.sendMessage.mockResolvedValue({ valid: false });

      const result = await validateTsx('invalid tsx');

      expect(result).toBe(false);
    });

    it('should handle validation errors', async () => {
      mocks.sendMessage.mockRejectedValue(new Error('Service worker not responding'));

      const result = await validateTsx('export default function CV() { return <div>Test</div>; }');

      expect(result).toBe(false);
    });

    it('should handle empty TSX content', async () => {
      mocks.sendMessage.mockResolvedValue({ valid: false });

      const result = await validateTsx('');

      expect(result).toBe(false);
    });
  });

  describe('requestConversion', () => {
    it('should start conversion with valid input', async () => {
      mocks.sendMessage
        .mockResolvedValueOnce({ pong: true }) // ping
        .mockResolvedValueOnce({ success: true }); // startConversion

      const result = await requestConversion(
        'export default function CV() { return <div>Test</div>; }',
        'test.tsx',
      );

      expect(result).toEqual({ success: true });
    });

    it('should handle service worker ping failure', async () => {
      mocks.sendMessage
        .mockRejectedValueOnce(new Error('No receiver')) // ping fails
        .mockResolvedValueOnce({ success: true }); // But conversion succeeds

      const result = await requestConversion(
        'export default function CV() { return <div>Test</div>; }',
        'test.tsx',
      );

      expect(result).toEqual({ success: true });
    });

    it('should handle conversion request failure', async () => {
      mocks.sendMessage
        .mockResolvedValueOnce({ pong: true }) // ping succeeds
        .mockRejectedValueOnce(new Error('Conversion failed')); // startConversion fails

      await expect(
        requestConversion('export default function CV() { return <div>Test</div>; }', 'test.tsx'),
      ).rejects.toThrow('Conversion failed');
    });

    it('should send correct message format', async () => {
      mocks.sendMessage
        .mockResolvedValueOnce({ pong: true })
        .mockResolvedValueOnce({ success: true });

      await requestConversion('content', 'file.tsx');

      expect(mocks.sendMessage).toHaveBeenNthCalledWith(1, 'ping', {});
      expect(mocks.sendMessage).toHaveBeenNthCalledWith(2, 'startConversion', {
        tsx: 'content',
        fileName: 'file.tsx',
      });
    });

    it('should handle non-Error exceptions in error logging', async () => {
      mocks.sendMessage
        .mockResolvedValueOnce({ pong: true }) // ping succeeds
        .mockRejectedValueOnce('String error message'); // Non-Error exception

      await expect(requestConversion('content', 'file.tsx')).rejects.toBe('String error message');

      expect(mocks.sendMessage).toHaveBeenCalledTimes(2);
    });
  });

  describe('onProgress', () => {
    it('should subscribe to progress updates', () => {
      const unsubscribeFn = vi.fn();
      mocks.onMessage.mockReturnValue(unsubscribeFn);
      const callback = vi.fn();

      const unsubscribe = onProgress(callback);

      expect(mocks.onMessage).toHaveBeenCalledWith('conversionProgress', expect.any(Function));
      expect(unsubscribe).toBe(unsubscribeFn);
    });

    it('should call callback with progress payload', () => {
      let handler: ((args: { data: unknown }) => void) | null = null;
      mocks.onMessage.mockImplementation((type: string, fn: typeof handler) => {
        if (type === 'conversionProgress') {
          handler = fn;
        }
        return vi.fn();
      });

      const callback = vi.fn();
      onProgress(callback);

      // Simulate message from background
      handler!({
        data: { jobId: 'test', progress: { stage: 'parsing', percentage: 50 } },
      });

      expect(callback).toHaveBeenCalledWith({
        jobId: 'test',
        progress: { stage: 'parsing', percentage: 50 },
      });
    });
  });

  describe('onSuccess', () => {
    it('should subscribe to success events', () => {
      const unsubscribeFn = vi.fn();
      mocks.onMessage.mockReturnValue(unsubscribeFn);
      const callback = vi.fn();

      const unsubscribe = onSuccess(callback);

      expect(mocks.onMessage).toHaveBeenCalledWith('conversionComplete', expect.any(Function));
      expect(unsubscribe).toBe(unsubscribeFn);
    });

    it('should call callback with success payload', () => {
      let handler: ((args: { data: unknown }) => void) | null = null;
      mocks.onMessage.mockImplementation((type: string, fn: typeof handler) => {
        if (type === 'conversionComplete') {
          handler = fn;
        }
        return vi.fn();
      });

      const callback = vi.fn();
      onSuccess(callback);

      handler!({
        data: { jobId: 'test', filename: 'test.pdf', fileSize: 1024, duration: 5000 },
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
      const unsubscribeFn = vi.fn();
      mocks.onMessage.mockReturnValue(unsubscribeFn);
      const callback = vi.fn();

      const unsubscribe = onError(callback);

      expect(mocks.onMessage).toHaveBeenCalledWith('conversionError', expect.any(Function));
      expect(unsubscribe).toBe(unsubscribeFn);
    });

    it('should call callback with error payload', () => {
      let handler: ((args: { data: unknown }) => void) | null = null;
      mocks.onMessage.mockImplementation((type: string, fn: typeof handler) => {
        if (type === 'conversionError') {
          handler = fn;
        }
        return vi.fn();
      });

      const callback = vi.fn();
      onError(callback);

      handler!({
        data: {
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
