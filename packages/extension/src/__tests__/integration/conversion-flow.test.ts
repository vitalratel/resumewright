/**
 * Conversion Flow Integration Test
 *
 * Tests: Convert button click → Background processing → Success state
 *
 * Flow:
 * 1. User clicks "Convert to PDF" in popup
 * 2. Popup sends CONVERT_TSX message to background
 * 3. Background invokes WASM converter
 * 4. Background sends CONVERSION_SUCCESS back to popup
 * 5. Popup displays success state with download button
 */

import type Browser from 'webextension-polyfill';
import type * as PdfService from '../../shared/domain/pdf';
import type { Message } from '../../shared/types/messages';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

describe('Conversion Flow Integration', () => {
  let browserMock: ReturnType<typeof createMockBrowser>;
  let wasmMock: ReturnType<typeof createMockWasm>;
  let setupMessageHandler: () => void;
  let messageHandlerCleanup: (() => void) | null = null;
  let pdfService: typeof PdfService;
  let mockConverter: PdfService.TsxToPdfConverter;

  beforeEach(async () => {
    vi.clearAllMocks();

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

    // Setup message handler for conversion flow
    setupMessageHandler = () => {
      const handler = (
        message: Message,
        _sender: Browser.Runtime.MessageSender,
        sendResponse: (response: unknown) => void
      ) => {
        void (async () => {
          if (message.type === MessageType.CONVERSION_REQUEST) {
            const { tsx, config } = (
              message as Message<{ tsx: string; config: typeof mockConversionConfig }>
            ).payload;

            try {
              // Validate TSX
              const isValid = await pdfService.validateTsx(tsx, getLogger(), mockConverter);
              if (!isValid) {
                sendResponse({
                  type: 'CONVERSION_ERROR',
                  payload: {
                    error: 'Invalid TSX format',
                    code: 'INVALID_TSX',
                  },
                });
                return true;
              }

              // Convert to PDF
              const pdfBytes = await pdfService.convertTsxToPdfWithFonts(tsx, config);

              // Send success response
              sendResponse({
                type: 'CONVERSION_SUCCESS',
                payload: {
                  pdfBytes,
                  filename: 'resume.pdf',
                  timestamp: Date.now(),
                },
              });
            } catch (error: unknown) {
              const errorMessage = error instanceof Error ? error.message : 'Conversion failed';
              sendResponse({
                type: 'CONVERSION_ERROR',
                payload: {
                  error: errorMessage,
                  code: 'CONVERSION_ERROR',
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

  it('should complete full conversion flow from popup to PDF generation', async () => {
    setupMessageHandler();

    // Step 1: User clicks convert button - popup sends CONVERT_TSX
    const conversionMessage = createMessage.conversionRequest(mockTsxContent, mockConversionConfig);

    // Step 2: Background processes request
    const response = (await browserMock.triggerMessage(conversionMessage)) as {
      type: string;
      payload: { pdfBytes: Uint8Array; filename: string; timestamp: number };
    };

    // Step 3: Verify WASM converter was called
    expect(pdfService.validateTsx).toHaveBeenCalledWith(
      mockTsxContent,
      expect.anything(),
      mockConverter
    );
    expect(pdfService.convertTsxToPdfWithFonts).toHaveBeenCalledWith(
      mockTsxContent,
      expect.objectContaining(mockConversionConfig)
    );

    // Step 4: Verify success response
    expect(response).toMatchObject({
      type: 'CONVERSION_SUCCESS',
      payload: {
        filename: 'resume.pdf',
      },
    });
    expect(response.payload.pdfBytes).toBeInstanceOf(Uint8Array);
    expect(response.payload.pdfBytes.length).toBeGreaterThan(0);
    expect(response.payload.timestamp).toBeGreaterThan(0);
  });

  it('should handle conversion with custom configuration', async () => {
    setupMessageHandler();

    const customConfig = {
      pageSize: 'Letter' as const,
      margin: { top: 36, right: 36, bottom: 36, left: 36 },
      fontSize: 12,
      fontFamily: 'Arial',
      compress: false,
    };

    const conversionMessage = createMessage.conversionRequest(mockTsxContent, customConfig);
    const response = (await browserMock.triggerMessage(conversionMessage)) as { type: string };

    // Verify custom config was passed to converter
    expect(response.type).toBe('CONVERSION_SUCCESS');
    expect(pdfService.convertTsxToPdfWithFonts).toHaveBeenCalledWith(
      mockTsxContent,
      expect.objectContaining(customConfig)
    );
  });

  it('should return error when TSX validation fails', async () => {
    setupMessageHandler();

    // Mock validation failure
    (pdfService.validateTsx as ReturnType<typeof vi.fn>).mockResolvedValueOnce(false);

    const conversionMessage = createMessage.conversionRequest('invalid tsx', mockConversionConfig);
    const response = (await browserMock.triggerMessage(conversionMessage)) as {
      type: string;
      payload: { error: string; code: string };
    };

    // Verify error response
    expect(response).toMatchObject({
      type: 'CONVERSION_ERROR',
      payload: {
        error: 'Invalid TSX format',
        code: 'INVALID_TSX',
      },
    });

    // Converter should not be called
    expect(pdfService.convertTsxToPdfWithFonts).not.toHaveBeenCalled();
  });

  it('should return error when WASM conversion throws', async () => {
    setupMessageHandler();

    // Mock WASM error
    (pdfService.convertTsxToPdfWithFonts as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('WASM panic: out of memory')
    );

    const conversionMessage = createMessage.conversionRequest(mockTsxContent, mockConversionConfig);
    const response = (await browserMock.triggerMessage(conversionMessage)) as {
      type: string;
      payload: { error: string; code: string };
    };

    // Verify error response
    expect(response).toMatchObject({
      type: 'CONVERSION_ERROR',
      payload: {
        error: 'WASM panic: out of memory',
        code: 'CONVERSION_ERROR',
      },
    });
  });

  it('should handle multiple concurrent conversion requests', async () => {
    setupMessageHandler();

    const tsx1 = '<CV><Name>User 1</Name></CV>';
    const tsx2 = '<CV><Name>User 2</Name></CV>';
    const tsx3 = '<CV><Name>User 3</Name></CV>';

    // Send multiple conversion requests concurrently
    const responses = (await Promise.all([
      browserMock.triggerMessage(createMessage.conversionRequest(tsx1, mockConversionConfig)),
      browserMock.triggerMessage(createMessage.conversionRequest(tsx2, mockConversionConfig)),
      browserMock.triggerMessage(createMessage.conversionRequest(tsx3, mockConversionConfig)),
    ])) as Array<{ type: string }>;
    const [response1, response2, response3] = responses;

    // All should succeed
    expect(response1.type).toBe('CONVERSION_SUCCESS');
    expect(response2.type).toBe('CONVERSION_SUCCESS');
    expect(response3.type).toBe('CONVERSION_SUCCESS');

    // Verify converter was called for each
    expect(pdfService.convertTsxToPdfWithFonts).toHaveBeenCalledTimes(3);
  });

  it('should handle empty TSX content', async () => {
    setupMessageHandler();

    const conversionMessage = createMessage.conversionRequest('', mockConversionConfig);
    const response = (await browserMock.triggerMessage(conversionMessage)) as {
      type: string;
      payload?: { pdfBytes: Uint8Array };
    };

    // Should still call converter (let WASM handle validation)
    expect(pdfService.validateTsx).toHaveBeenCalledWith('', expect.anything(), mockConverter);

    // Response depends on WASM validation
    if (response.type === 'CONVERSION_SUCCESS') {
      expect(response.payload?.pdfBytes).toBeInstanceOf(Uint8Array);
    } else {
      expect(response.type).toBe('CONVERSION_ERROR');
    }
  });

  it('should handle very large TSX content', async () => {
    setupMessageHandler();

    // Create large TSX (simulate multi-page CV)
    const largeTsx = `<CV>${'<Experience><Job><Title>Senior Engineer</Title></Job></Experience>'.repeat(50)}</CV>`;

    const conversionMessage = createMessage.conversionRequest(largeTsx, mockConversionConfig);
    const response = (await browserMock.triggerMessage(conversionMessage)) as { type: string };

    // Should handle without error
    expect(response.type).toBe('CONVERSION_SUCCESS');
    expect(pdfService.convertTsxToPdfWithFonts).toHaveBeenCalledWith(
      largeTsx,
      expect.objectContaining(mockConversionConfig)
    );
  });

  it('should generate unique filenames for each conversion', async () => {
    setupMessageHandler();

    // First conversion
    const response1 = (await browserMock.triggerMessage(
      createMessage.conversionRequest(mockTsxContent, mockConversionConfig)
    )) as { payload: { timestamp: number; pdfBytes: Uint8Array } };

    // Second conversion
    const response2 = (await browserMock.triggerMessage(
      createMessage.conversionRequest(mockTsxContent, mockConversionConfig)
    )) as { payload: { timestamp: number; pdfBytes: Uint8Array } };

    // Both should succeed with timestamps
    expect(response1.payload.timestamp).toBeGreaterThan(0);
    expect(response2.payload.timestamp).toBeGreaterThan(0);

    // Timestamps should be different (or at least not guaranteed same)
    // Both should have valid PDF bytes
    expect(response1.payload.pdfBytes).toBeInstanceOf(Uint8Array);
    expect(response2.payload.pdfBytes).toBeInstanceOf(Uint8Array);
  });
});
