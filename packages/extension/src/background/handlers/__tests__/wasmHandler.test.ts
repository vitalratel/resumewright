/**
 * WasmHandler Tests
 * Coverage for WASM status, retry, and TSX validation
 */

import type { Runtime } from 'webextension-polyfill';
import type { GetWasmStatusMessage, RetryWasmInitMessage, ValidateTsxMessage } from '../../../shared/types/messages';
import { fakeBrowser } from '@webext-core/fake-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MessageType } from '../../../shared/types/messages';
import { WasmHandler } from '../wasmHandler';

// webextension-polyfill is mocked globally with fakeBrowser

vi.mock('../../wasmInit', () => ({
  retryWasmInit: vi.fn(),
}));

vi.mock('../../../shared/domain/pdf/validation', () => ({
  validateTsxSyntax: vi.fn(),
}));

vi.mock('../../../shared/infrastructure/wasm', () => ({
  getConverter: vi.fn(() => ({
    detect_fonts: vi.fn(() => '[]'),
    convert_tsx_to_pdf: vi.fn(),
    free: vi.fn(),
  })),
}));

describe('WasmHandler', () => {
  let handler: WasmHandler;
  let mockStorageGet: ReturnType<typeof vi.fn>;
  let mockRetryWasmInit: ReturnType<typeof vi.fn>;
  let mockValidateTsx: ReturnType<typeof vi.fn>;
  let mockGetConverter: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();

    const { retryWasmInit } = await import('../../wasmInit');
    const { validateTsxSyntax } = await import('../../../shared/domain/pdf/validation');

    vi.spyOn(fakeBrowser.storage.local, 'get').mockResolvedValue({});
    vi.spyOn(fakeBrowser.storage.local, 'remove').mockResolvedValue(undefined);
    mockStorageGet = vi.mocked(fakeBrowser.storage.local.get);
    mockRetryWasmInit = vi.mocked(retryWasmInit);
    mockValidateTsx = vi.mocked(validateTsxSyntax);

    // Create mock converter getter
    mockGetConverter = vi.fn(() => ({
      detect_fonts: vi.fn(() => '[]'),
      convert_tsx_to_pdf: vi.fn(),
      free: vi.fn(),
    }));

    handler = new WasmHandler(mockGetConverter as any);
  });

  describe('handle', () => {
    it('should route GET_WASM_STATUS to handleGetWasmStatus', async () => {
      mockStorageGet.mockResolvedValue({ wasmStatus: 'success', wasmInitTime: 100 });

      const message: GetWasmStatusMessage = {
        type: MessageType.GET_WASM_STATUS,
        payload: {},
      };

      // Type assertion: test is checking handler behavior with specific message
      const result = await handler.handle(message as any, {} as Runtime.MessageSender);

      expect(result).toMatchObject({ initialized: true });
    });

    it('should route RETRY_WASM_INIT to handleRetryWasmInit', async () => {
      mockRetryWasmInit.mockResolvedValue(undefined);

      const message: RetryWasmInitMessage = {
        type: MessageType.RETRY_WASM_INIT,
        payload: {},
      };

      // Type assertion: test is checking handler behavior with specific message
      const result = await handler.handle(message as any, {} as Runtime.MessageSender);

      expect(result).toMatchObject({ success: true });
    });

    it('should route VALIDATE_TSX to handleValidateTsx', async () => {
      mockValidateTsx.mockResolvedValue(true);

      const message: ValidateTsxMessage = {
        type: MessageType.VALIDATE_TSX,
        payload: { tsx: 'export default function CV() { return <div>Test</div>; }' },
      };

      // Type assertion: test is checking handler behavior with specific message
      const result = await handler.handle(message as any, {} as Runtime.MessageSender);

      expect(result).toEqual({ valid: true });
    });
  });

  describe('handleGetWasmStatus', () => {
    it('should return initialized when status is success', async () => {
      mockStorageGet.mockResolvedValue({
        wasmStatus: 'success',
        wasmInitTime: 150,
      });

      const message: GetWasmStatusMessage = {
        type: MessageType.GET_WASM_STATUS,
        payload: {},
      };

      // Type assertion: test is checking handler behavior with specific message
      const result = await handler.handle(message as any, {} as Runtime.MessageSender);

      expect(result).toEqual({
        initialized: true,
        initTime: 150,
      });
    });

    it('should return not initialized when status is initializing', async () => {
      mockStorageGet.mockResolvedValue({ wasmStatus: 'initializing' });

      const message: GetWasmStatusMessage = {
        type: MessageType.GET_WASM_STATUS,
        payload: {},
      };

      // Type assertion: test is checking handler behavior with specific message
      const result = await handler.handle(message as any, {} as Runtime.MessageSender);

      expect(result).toEqual({ initialized: false });
    });

    it('should return error when status is failed', async () => {
      mockStorageGet.mockResolvedValue({
        wasmStatus: 'failed',
        wasmInitError: 'WASM not supported',
      });

      const message: GetWasmStatusMessage = {
        type: MessageType.GET_WASM_STATUS,
        payload: {},
      };

      // Type assertion: test is checking handler behavior with specific message
      const result = await handler.handle(message as any, {} as Runtime.MessageSender);

      expect(result).toMatchObject({
        initialized: false,
        error: 'WASM not supported',
      });
    });

    it('should handle storage read errors (P1)', async () => {
      mockStorageGet.mockRejectedValue(new Error('Storage unavailable'));

      const message: GetWasmStatusMessage = {
        type: MessageType.GET_WASM_STATUS,
        payload: {},
      };

      // Type assertion: test is checking handler behavior with specific message
      const result = await handler.handle(message as any, {} as Runtime.MessageSender);

      expect(result).toMatchObject({
        initialized: false,
        error: expect.stringContaining('Storage unavailable'),
      });
    });

    it('should handle invalid status value (P1)', async () => {
      mockStorageGet.mockResolvedValue({ wasmStatus: 'invalid' });

      const message: GetWasmStatusMessage = {
        type: MessageType.GET_WASM_STATUS,
        payload: {},
      };

      // Type assertion: test is checking handler behavior with specific message
      const result = await handler.handle(message as any, {} as Runtime.MessageSender);

      expect(result).toMatchObject({
        initialized: false,
        error: expect.any(String),
      });
    });
  });

  describe('handleRetryWasmInit', () => {
    it('should successfully retry WASM initialization', async () => {
      mockRetryWasmInit.mockResolvedValue(undefined);

      const message: RetryWasmInitMessage = {
        type: MessageType.RETRY_WASM_INIT,
        payload: {},
      };

      // Type assertion: test is checking handler behavior with specific message
      const result = await handler.handle(message as any, {} as Runtime.MessageSender);

      expect(result).toEqual({
        type: MessageType.WASM_INIT_SUCCESS,
        success: true,
      });
      expect(fakeBrowser.storage.local.remove).toHaveBeenCalledWith('wasmInitError');
    });

    it('should handle retry failure (P1)', async () => {
      mockRetryWasmInit.mockRejectedValue(new Error('Retry failed'));

      const message: RetryWasmInitMessage = {
        type: MessageType.RETRY_WASM_INIT,
        payload: {},
      };

      // Type assertion: test is checking handler behavior with specific message
      const result = await handler.handle(message as any, {} as Runtime.MessageSender);

      expect(result).toEqual({
        type: MessageType.WASM_INIT_ERROR,
        success: false,
        error: 'Retry failed',
      });
    });

    it('should handle non-Error exceptions (P1)', async () => {
      mockRetryWasmInit.mockRejectedValue('String error');

      const message: RetryWasmInitMessage = {
        type: MessageType.RETRY_WASM_INIT,
        payload: {},
      };

      // Type assertion: test is checking handler behavior with specific message
      const result = await handler.handle(message as any, {} as Runtime.MessageSender);

      expect(result).toMatchObject({
        success: false,
        error: 'Unknown error',
      });
    });
  });

  describe('handleValidateTsx', () => {
    it('should validate valid TSX', async () => {
      mockValidateTsx.mockResolvedValue(true);

      const tsxContent = 'export default function CV() { return <div>Test</div>; }';
      const message: ValidateTsxMessage = {
        type: MessageType.VALIDATE_TSX,
        payload: { tsx: tsxContent },
      };

      // Type assertion: test is checking handler behavior with specific message
      const result = await handler.handle(message as any, {} as Runtime.MessageSender);

      expect(result).toEqual({ valid: true });
      expect(mockValidateTsx).toHaveBeenCalledWith(tsxContent, expect.anything(), expect.anything());
    });

    it('should return invalid for malformed TSX', async () => {
      mockValidateTsx.mockResolvedValue(false);

      const message: ValidateTsxMessage = {
        type: MessageType.VALIDATE_TSX,
        payload: { tsx: 'export default function CV() { return <div>Test</div>; }' },
      };

      // Type assertion: test is checking handler behavior with specific message
      const result = await handler.handle(message as any, {} as Runtime.MessageSender);

      expect(result).toEqual({ valid: false });
    });
  });
});
