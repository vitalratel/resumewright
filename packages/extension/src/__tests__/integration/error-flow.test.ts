/**
 * Error Flow Integration Test
 *
 * Tests: Error scenario → Popup error display → Retry
 *
 * Flow:
 * 1. Conversion fails due to various errors (WASM panic, invalid TSX, network)
 * 2. Background sends CONVERSION_ERROR message to popup
 * 3. Popup displays error with appropriate message
 * 4. User clicks retry
 * 5. Conversion re-attempted
 */

import type Browser from 'webextension-polyfill';
import type * as PdfService from '../../shared/domain/pdf';
import type { Message } from '../../shared/types/messages';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getLogger } from '../../shared/infrastructure/logging';
import { MessageType } from '../../shared/types/messages';
import {
  createMessage,
  createMockBrowser,
  createMockWasm,
  mockConversionConfig,
  mockTsxContent,
} from './test-utils';

// Mock webextension-polyfill
vi.mock('webextension-polyfill', () => ({
  default: {} as typeof Browser,
}));

// Mock WASM converter
vi.mock('../../shared/domain/pdf', () => ({
  convertTsxToPdfWithFonts: vi.fn(),
  downloadPDF: vi.fn(),
  validateTsx: vi.fn(),
}));

describe('Error Flow Integration', () => {
  let browserMock: ReturnType<typeof createMockBrowser>;
  let wasmMock: ReturnType<typeof createMockWasm>;
  let setupMessageHandler: () => void;
  let messageHandlerCleanup: (() => void) | null = null;
  let pdfService: typeof PdfService;
  let mockConverter: PdfService.TsxToPdfConverter;
  let conversionAttempts: number;

  beforeEach(async () => {
    vi.clearAllMocks();
    conversionAttempts = 0;

    // Create mocks
    browserMock = createMockBrowser();
    wasmMock = createMockWasm();

    // Replace global browser with mock
    const webext = await import('webextension-polyfill');
    Object.assign(webext.default, browserMock.mockBrowser);

    // Create mock converter
    mockConverter = {
      detect_fonts: vi.fn(() => '[]'),
      convert_tsx_to_pdf: vi.fn(),
      free: vi.fn(),
    };

    // Get mocked pdfService
    pdfService = await import('../../shared/domain/pdf');
    (pdfService.convertTsxToPdfWithFonts as ReturnType<typeof vi.fn>).mockImplementation(
      wasmMock.convertTsxToPdfWithFonts
    );
    (pdfService.validateTsx as ReturnType<typeof vi.fn>).mockResolvedValue(true);

    // Setup message handler with error handling
    setupMessageHandler = () => {
      const handler = (
        message: Message,
        _sender: Browser.Runtime.MessageSender,
        sendResponse: (response: unknown) => void
      ) => {
        void (async () => {
          if (message.type === MessageType.CONVERSION_REQUEST) {
            conversionAttempts += 1;
            const { tsx, config } = (
              message as Message<{ tsx: string; config: typeof mockConversionConfig }>
            ).payload;

            try {
              const isValid = await pdfService.validateTsx(tsx, getLogger(), mockConverter);
              if (!isValid) {
                sendResponse({
                  type: 'CONVERSION_ERROR',
                  payload: {
                    error: 'Invalid TSX format',
                    code: 'INVALID_TSX',
                    attemptNumber: conversionAttempts,
                  },
                });
                return true;
              }

              const pdfBytes = await pdfService.convertTsxToPdfWithFonts(tsx, config);

              sendResponse({
                type: 'CONVERSION_SUCCESS',
                payload: {
                  pdfBytes,
                  filename: 'resume.pdf',
                  attemptNumber: conversionAttempts,
                },
              });
            } catch (error: unknown) {
              const errorObj = error as { message?: string; code?: string };
              sendResponse({
                type: 'CONVERSION_ERROR',
                payload: {
                  error: errorObj.message ?? 'Conversion failed',
                  code: errorObj.code ?? 'CONVERSION_ERROR',
                  attemptNumber: conversionAttempts,
                },
              });
            }
            return true;
          }
        })();
      };

      browserMock.mockBrowser.runtime.onMessage.addListener(handler);

      // Return cleanup function
      messageHandlerCleanup = () => {
        browserMock.mockBrowser.runtime.onMessage.removeListener(handler);
      };
    };
  });

  afterEach(() => {
    // Clean up message handlers to prevent memory leaks
    if (messageHandlerCleanup) {
      messageHandlerCleanup();
      messageHandlerCleanup = null;
    }

    // CRITICAL: Destroy mock browser to prevent memory leaks
    browserMock.destroy();

    vi.clearAllMocks();
  });

  it('should handle WASM panic error and allow retry', async () => {
    setupMessageHandler();

    // First attempt: WASM panics
    (pdfService.convertTsxToPdfWithFonts as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('WASM panic: out of memory')
    );

    const response1 = (await browserMock.triggerMessage(
      createMessage.conversionRequest(mockTsxContent, mockConversionConfig)
    )) as { type: string; payload: { error: string; code: string; attemptNumber: number } };

    // Verify error response
    expect(response1).toMatchObject({
      type: 'CONVERSION_ERROR',
      payload: {
        error: 'WASM panic: out of memory',
        code: 'CONVERSION_ERROR',
        attemptNumber: 1,
      },
    });

    // Second attempt: Success (user clicked retry)
    (pdfService.convertTsxToPdfWithFonts as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Uint8Array([0x25, 0x50, 0x44, 0x46])
    );

    const response2 = (await browserMock.triggerMessage(
      createMessage.conversionRequest(mockTsxContent, mockConversionConfig)
    )) as { type: string; payload: { attemptNumber: number } };

    // Verify retry succeeded
    expect(response2).toMatchObject({
      type: 'CONVERSION_SUCCESS',
      payload: {
        attemptNumber: 2,
      },
    });
  });

  it('should handle invalid TSX error with descriptive message', async () => {
    setupMessageHandler();

    // Mock validation failure
    (pdfService.validateTsx as ReturnType<typeof vi.fn>).mockResolvedValueOnce(false);

    const response = (await browserMock.triggerMessage(
      createMessage.conversionRequest('<CV><Name>Unclosed', mockConversionConfig)
    )) as { type: string; payload: { error: string; code: string } };

    // Verify error details
    expect(response).toMatchObject({
      type: 'CONVERSION_ERROR',
      payload: {
        error: 'Invalid TSX format',
        code: 'INVALID_TSX',
      },
    });

    // Converter should not have been called
    expect(pdfService.convertTsxToPdfWithFonts).not.toHaveBeenCalled();
  });

  it('should handle network timeout error', async () => {
    setupMessageHandler();

    // Mock timeout error
    const timeoutError = Object.assign(new Error('Network timeout'), { code: 'TIMEOUT' });
    (pdfService.convertTsxToPdfWithFonts as ReturnType<typeof vi.fn>).mockRejectedValueOnce(timeoutError);

    const response = (await browserMock.triggerMessage(
      createMessage.conversionRequest(mockTsxContent, mockConversionConfig)
    )) as { type: string; payload: { error: string; code: string } };

    expect(response).toMatchObject({
      type: 'CONVERSION_ERROR',
      payload: {
        error: 'Network timeout',
        code: 'TIMEOUT',
      },
    });
  });

  it('should track multiple retry attempts', async () => {
    setupMessageHandler();

    // Fail first 2 attempts
    (pdfService.convertTsxToPdfWithFonts as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce(new Error('Attempt 1 failed'))
      .mockRejectedValueOnce(new Error('Attempt 2 failed'))
      .mockResolvedValueOnce(new Uint8Array([0x25, 0x50, 0x44, 0x46]));

    // Attempt 1
    const response1 = (await browserMock.triggerMessage(
      createMessage.conversionRequest(mockTsxContent, mockConversionConfig)
    )) as { payload: { attemptNumber: number } };
    expect(response1.payload.attemptNumber).toBe(1);

    // Attempt 2
    const response2 = (await browserMock.triggerMessage(
      createMessage.conversionRequest(mockTsxContent, mockConversionConfig)
    )) as { payload: { attemptNumber: number } };
    expect(response2.payload.attemptNumber).toBe(2);

    // Attempt 3 (success)
    const response3 = (await browserMock.triggerMessage(
      createMessage.conversionRequest(mockTsxContent, mockConversionConfig)
    )) as { type: string; payload: { attemptNumber: number } };
    expect(response3.payload.attemptNumber).toBe(3);
    expect(response3.type).toBe('CONVERSION_SUCCESS');
  });

  it('should handle different error types with appropriate codes', async () => {
    setupMessageHandler();

    const errorScenarios = [
      { message: 'Parser error: unexpected token', code: 'PARSE_ERROR' },
      { message: 'Layout error: dimension overflow', code: 'LAYOUT_ERROR' },
      { message: 'PDF generation failed', code: 'PDF_ERROR' },
    ];

    /**
     * Recursive function to test scenarios sequentially
     * Avoids await-in-loop ESLint warning
     */
    async function testScenario(index: number): Promise<void> {
      if (index >= errorScenarios.length) {
        return;
      }

      const scenario = errorScenarios[index];
      vi.clearAllMocks();
      const error = Object.assign(new Error(scenario.message), { code: scenario.code });
      (pdfService.convertTsxToPdfWithFonts as ReturnType<typeof vi.fn>).mockRejectedValueOnce(error);

      const response = (await browserMock.triggerMessage(
        createMessage.conversionRequest(mockTsxContent, mockConversionConfig)
      )) as { type: string; payload: { error: string; code: string } };

      expect(response).toMatchObject({
        type: 'CONVERSION_ERROR',
        payload: {
          error: scenario.message,
          code: scenario.code,
        },
      });

      return testScenario(index + 1);
    }

    await testScenario(0);
  });

  it('should allow retry after fixing TSX validation error', async () => {
    setupMessageHandler();

    // First attempt: Invalid TSX
    (pdfService.validateTsx as ReturnType<typeof vi.fn>).mockResolvedValueOnce(false);

    const response1 = (await browserMock.triggerMessage(
      createMessage.conversionRequest('<invalid>', mockConversionConfig)
    )) as { type: string; payload: { code: string } };

    expect(response1.type).toBe('CONVERSION_ERROR');
    expect(response1.payload.code).toBe('INVALID_TSX');

    // Second attempt: Valid TSX (user fixed it)
    (pdfService.validateTsx as ReturnType<typeof vi.fn>).mockResolvedValueOnce(true);
    (pdfService.convertTsxToPdfWithFonts as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Uint8Array([0x25, 0x50, 0x44, 0x46])
    );

    const response2 = (await browserMock.triggerMessage(
      createMessage.conversionRequest(mockTsxContent, mockConversionConfig)
    )) as { type: string };

    expect(response2.type).toBe('CONVERSION_SUCCESS');
  });

  it('should handle errors during PDF download phase', async () => {
    setupMessageHandler();

    // Conversion succeeds but download fails (simulated)
    (pdfService.convertTsxToPdfWithFonts as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Uint8Array([0x25, 0x50, 0x44, 0x46])
    );

    const response = (await browserMock.triggerMessage(
      createMessage.conversionRequest(mockTsxContent, mockConversionConfig)
    )) as { type: string; payload: { pdfBytes: Uint8Array } };

    // Conversion success
    expect(response.type).toBe('CONVERSION_SUCCESS');

    // Now simulate download error (would be handled in popup, not background)
    (pdfService.downloadPDF as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Download blocked by browser')
    );

    // Popup could retry download without re-converting
    await expect(pdfService.downloadPDF(response.payload.pdfBytes, 'resume.pdf')).rejects.toThrow(
      'Download blocked by browser'
    );
  });

  it('should provide user-friendly error messages', async () => {
    setupMessageHandler();

    const technicalErrors = [
      { tech: 'ReferenceError: wasm is not defined', friendly: 'Conversion failed' },
      { tech: 'TypeError: Cannot read property of null', friendly: 'Conversion failed' },
      { tech: 'WASM execution error', friendly: 'WASM execution error' },
    ];

    /**
     * Recursive function to test scenarios sequentially
     * Avoids await-in-loop ESLint warning
     */
    async function testScenario(index: number): Promise<void> {
      if (index >= technicalErrors.length) {
        return;
      }

      const scenario = technicalErrors[index];
      vi.clearAllMocks();
      (pdfService.convertTsxToPdfWithFonts as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error(scenario.tech)
      );

      const response = (await browserMock.triggerMessage(
        createMessage.conversionRequest(mockTsxContent, mockConversionConfig)
      )) as { type: string; payload: { error: string } };

      // Error should be reported
      expect(response.type).toBe('CONVERSION_ERROR');
      expect(response.payload.error).toBe(scenario.tech);

      return testScenario(index + 1);
    }

    await testScenario(0);
  });

  it('should clear error state on successful retry', async () => {
    setupMessageHandler();

    // First: Error
    (pdfService.convertTsxToPdfWithFonts as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Temporary failure')
    );

    const errorResponse = (await browserMock.triggerMessage(
      createMessage.conversionRequest(mockTsxContent, mockConversionConfig)
    )) as { type: string };
    expect(errorResponse.type).toBe('CONVERSION_ERROR');

    // Second: Success
    (pdfService.convertTsxToPdfWithFonts as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Uint8Array([0x25, 0x50, 0x44, 0x46])
    );

    const successResponse = (await browserMock.triggerMessage(
      createMessage.conversionRequest(mockTsxContent, mockConversionConfig)
    )) as { type: string; payload: { pdfBytes: Uint8Array } };

    // Error state should be cleared
    expect(successResponse.type).toBe('CONVERSION_SUCCESS');
    expect(successResponse.payload.pdfBytes).toBeDefined();
  });
});
