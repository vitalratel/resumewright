/**
 * Message Handler Tests
 *
 * Comprehensive tests for background message handler.
 * Coverage: Message validation, handler registry, error handling
 * Target: >85% coverage
 */

import type { Runtime } from 'webextension-polyfill';
import type { AnyMessage } from '../../shared/types/messages';
import { fakeBrowser } from '@webext-core/fake-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { parseMessage } from '@/shared/domain/validation/validators/messages';
import { MessageType } from '../../shared/types/messages';
import * as messageHandlers from '../handlers';
import { setupMessageHandler } from '../messageHandler';

// webextension-polyfill is mocked globally with fakeBrowser

// Mock dependencies
vi.mock('@/shared/domain/validation/validators/messages');
// Use real logging implementation

// Mock LifecycleManager
const mockLifecycleManager = {
  saveJobCheckpoint: vi.fn(),
  clearJobCheckpoint: vi.fn(),
  getActiveJobIds: vi.fn(() => []),
  hasJob: vi.fn(() => false),
  initialize: vi.fn(),
};

vi.mock('../handlers', () => ({
  createHandlerRegistry: vi.fn((_lifecycleManager, _conversionService, _progressTracker) => new Map()),
  getHandler: vi.fn((_registry, type) => {
    if (type === MessageType.CONVERSION_REQUEST) {
      return {
        handle: vi.fn().mockResolvedValue({ success: true, data: 'conversion-started' }),
      };
    }
    if (type === MessageType.GET_SETTINGS) {
      return {
        handle: vi.fn().mockResolvedValue({ success: true, settings: {} }),
      };
    }
    return undefined;
  }),
}));

describe('messageHandler', () => {
  let messageListener: ((message: unknown, sender: Runtime.MessageSender) => Promise<unknown>) | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
    messageListener = null;

    // Create spy for fakeBrowser.runtime.onMessage.addListener
    vi.spyOn(fakeBrowser.runtime.onMessage, 'addListener').mockImplementation((listener) => {
      messageListener = listener as typeof messageListener;
    });

    // Reset getHandler to default mock implementation
    vi.mocked(messageHandlers.getHandler).mockImplementation((_registry, type) => {
      if (type === MessageType.CONVERSION_REQUEST) {
        return {
          type: MessageType.CONVERSION_REQUEST,
          handle: vi.fn().mockResolvedValue({ success: true, data: 'conversion-started' }),
        };
      }
      if (type === MessageType.GET_SETTINGS) {
        return {
          type: MessageType.GET_SETTINGS,
          handle: vi.fn().mockResolvedValue({ success: true, settings: {} }),
        };
      }
      return undefined;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('setupMessageHandler', () => {
    it('should register message listener', () => {
      setupMessageHandler(mockLifecycleManager as any);

      expect(fakeBrowser.runtime.onMessage.addListener).toHaveBeenCalledOnce();
      expect(messageListener).toBeTruthy();
    });

    it('should create handler registry on setup', () => {
      setupMessageHandler(mockLifecycleManager as any);

      expect(vi.mocked(messageHandlers.createHandlerRegistry)).toHaveBeenCalledOnce();
    });
  });

  describe('message validation', () => {
    it('should validate incoming messages', async () => {
      const mockParseMessage = vi.mocked(parseMessage);
      mockParseMessage.mockReturnValue({
        success: true,
        data: { type: MessageType.CONVERSION_REQUEST, payload: {} },
      });

      setupMessageHandler(mockLifecycleManager as any);

      const sender: Runtime.MessageSender = { tab: { id: 123 } } as Runtime.MessageSender;
      await messageListener!({ type: MessageType.CONVERSION_REQUEST, payload: {} }, sender);

      expect(mockParseMessage).toHaveBeenCalledWith({ type: MessageType.CONVERSION_REQUEST, payload: {} });
    });

    it('should reject invalid messages', async () => {
      const mockParseMessage = vi.mocked(parseMessage);
      mockParseMessage.mockReturnValue({
        success: false,
        error: 'Invalid message format',
      });

      setupMessageHandler(mockLifecycleManager as any);

      const sender: Runtime.MessageSender = { tab: { id: 123 } } as Runtime.MessageSender;
      const result = await messageListener!({ invalid: 'message' }, sender);

      expect(result).toEqual({
        success: false,
        error: 'Invalid message format: Invalid message format',
      });
    });

    it('should handle messages from popup (no tab ID)', async () => {
      const mockParseMessage = vi.mocked(parseMessage);
      mockParseMessage.mockReturnValue({
        success: true,
        data: { type: MessageType.GET_SETTINGS, payload: {} },
      });

      setupMessageHandler(mockLifecycleManager as any);

      const sender: Runtime.MessageSender = {} as Runtime.MessageSender;
      const result = await messageListener!({ type: MessageType.GET_SETTINGS, payload: {} }, sender);

      expect(result).toEqual({
        success: true,
        settings: {},
      });
    });

    it('should handle messages from content script (with tab ID)', async () => {
      const mockParseMessage = vi.mocked(parseMessage);
      mockParseMessage.mockReturnValue({
        success: true,
        data: { type: MessageType.CONVERSION_REQUEST, payload: {} },
      });

      setupMessageHandler(mockLifecycleManager as any);

      const sender: Runtime.MessageSender = {
        tab: { id: 456 },
      } as Runtime.MessageSender;
      const result = await messageListener!({ type: MessageType.CONVERSION_REQUEST, payload: {} }, sender);

      expect(result).toEqual({
        success: true,
        data: 'conversion-started',
      });
    });
  });

  describe('message routing', () => {
    it('should route to appropriate handler', async () => {
      const mockParseMessage = vi.mocked(parseMessage);

      mockParseMessage.mockReturnValue({
        success: true,
        data: { type: MessageType.CONVERSION_REQUEST, payload: { tsx: '<div>Test</div>' } },
      });

      setupMessageHandler(mockLifecycleManager as any);

      const sender: Runtime.MessageSender = { tab: { id: 123 } } as Runtime.MessageSender;
      await messageListener!({ type: MessageType.CONVERSION_REQUEST, payload: { tsx: '<div>Test</div>' } }, sender);

      expect(vi.mocked(messageHandlers.getHandler)).toHaveBeenCalled();
    });

    it('should return error for unknown message type', async () => {
      const mockParseMessage = vi.mocked(parseMessage);

      // Mock getHandler to return undefined for unknown type
      vi.mocked(messageHandlers.getHandler).mockReturnValue(undefined);

      mockParseMessage.mockReturnValue({
        success: true,
        data: { type: 'UNKNOWN_TYPE' as MessageType, payload: {} } as AnyMessage,
      });

      setupMessageHandler(mockLifecycleManager as any);

      const sender: Runtime.MessageSender = { tab: { id: 123 } } as Runtime.MessageSender;
      const result = await messageListener!({ type: 'UNKNOWN_TYPE', payload: {} }, sender);

      expect(result).toEqual({
        success: false,
        error: 'Unknown message type',
      });
    });

    it('should handle multiple message types', async () => {
      const mockParseMessage = vi.mocked(parseMessage);

      setupMessageHandler(mockLifecycleManager as any);

      const sender: Runtime.MessageSender = { tab: { id: 123 } } as Runtime.MessageSender;

      // Test CONVERSION_REQUEST
      mockParseMessage.mockReturnValue({
        success: true,
        data: { type: MessageType.CONVERSION_REQUEST, payload: {} },
      });
      const result1 = await messageListener!({ type: MessageType.CONVERSION_REQUEST, payload: {} }, sender);
      expect(result1).toHaveProperty('success', true);

      // Test GET_SETTINGS
      mockParseMessage.mockReturnValue({
        success: true,
        data: { type: MessageType.GET_SETTINGS, payload: {} },
      });
      const result2 = await messageListener!({ type: MessageType.GET_SETTINGS, payload: {} }, sender);
      expect(result2).toHaveProperty('success', true);
    });
  });

  describe('error handling', () => {
    it('should catch handler errors and return error response', async () => {
      const mockParseMessage = vi.mocked(parseMessage);

      mockParseMessage.mockReturnValue({
        success: true,
        data: { type: MessageType.CONVERSION_REQUEST, payload: {} },
      });

      // Mock handler that throws error
      vi.mocked(messageHandlers.getHandler).mockReturnValue({
        type: MessageType.CONVERSION_REQUEST,
        handle: vi.fn().mockRejectedValue(new Error('Handler error')),
      });

      setupMessageHandler(mockLifecycleManager as any);

      const sender: Runtime.MessageSender = { tab: { id: 123 } } as Runtime.MessageSender;
      const result = await messageListener!({ type: MessageType.CONVERSION_REQUEST, payload: {} }, sender);

      expect(result).toEqual({
        success: false,
        error: 'Error: Handler error',
      });
    });

    it('should handle synchronous handler errors', async () => {
      const mockParseMessage = vi.mocked(parseMessage);

      mockParseMessage.mockReturnValue({
        success: true,
        data: { type: MessageType.CONVERSION_REQUEST, payload: {} },
      });

      // Mock handler that throws synchronously
      vi.mocked(messageHandlers.getHandler).mockReturnValue({
        type: MessageType.CONVERSION_REQUEST,
        handle: vi.fn().mockImplementation(() => {
          throw new Error('Sync handler error');
        }),
      });

      setupMessageHandler(mockLifecycleManager as any);

      const sender: Runtime.MessageSender = { tab: { id: 123 } } as Runtime.MessageSender;
      const result = await messageListener!({ type: MessageType.CONVERSION_REQUEST, payload: {} }, sender);

      expect(result).toEqual({
        success: false,
        error: 'Error: Sync handler error',
      });
    });

    it('should handle non-Error exceptions', async () => {
      const mockParseMessage = vi.mocked(parseMessage);

      mockParseMessage.mockReturnValue({
        success: true,
        data: { type: MessageType.CONVERSION_REQUEST, payload: {} },
      });

      // Mock handler that throws non-Error
      vi.mocked(messageHandlers.getHandler).mockReturnValue({
        type: MessageType.CONVERSION_REQUEST,
        handle: vi.fn().mockRejectedValue('String error'),
      });

      setupMessageHandler(mockLifecycleManager as any);

      const sender: Runtime.MessageSender = { tab: { id: 123 } } as Runtime.MessageSender;
      const result = await messageListener!({ type: MessageType.CONVERSION_REQUEST, payload: {} }, sender);

      expect(result).toEqual({
        success: false,
        error: 'String error',
      });
    });
  });

  describe('edge cases', () => {
    it('should handle null payload', async () => {
      const mockParseMessage = vi.mocked(parseMessage);

      mockParseMessage.mockReturnValue({
        success: true,
        data: { type: MessageType.CONVERSION_REQUEST, payload: null } as unknown as AnyMessage,
      });

      setupMessageHandler(mockLifecycleManager as any);

      const sender: Runtime.MessageSender = { tab: { id: 123 } } as Runtime.MessageSender;
      const result = await messageListener!({ type: MessageType.CONVERSION_REQUEST, payload: null }, sender);

      expect(result).toHaveProperty('success', true);
    });

    it('should handle undefined payload', async () => {
      const mockParseMessage = vi.mocked(parseMessage);

      mockParseMessage.mockReturnValue({
        success: true,
        data: { type: MessageType.GET_SETTINGS, payload: undefined } as unknown as AnyMessage,
      });

      setupMessageHandler(mockLifecycleManager as any);

      const sender: Runtime.MessageSender = { tab: { id: 123 } } as Runtime.MessageSender;
      const result = await messageListener!({ type: MessageType.GET_SETTINGS, payload: undefined }, sender);

      expect(result).toHaveProperty('success', true);
    });

    it('should handle sender with no tab info', async () => {
      const mockParseMessage = vi.mocked(parseMessage);

      mockParseMessage.mockReturnValue({
        success: true,
        data: { type: MessageType.GET_SETTINGS, payload: {} },
      });

      setupMessageHandler(mockLifecycleManager as any);

      const sender: Runtime.MessageSender = {} as Runtime.MessageSender;
      const result = await messageListener!({ type: MessageType.GET_SETTINGS, payload: {} }, sender);

      expect(result).toHaveProperty('success', true);
    });
  });
});
