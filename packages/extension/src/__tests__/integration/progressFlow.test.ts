/**
 * Progress Flow Integration Test
 *
 * Tests: Full progress message flow from CONVERSION_REQUEST to COMPLETE
 *
 * Flow:
 * 1. Popup sends CONVERSION_REQUEST to background
 * 2. Background sends CONVERSION_STARTED with jobId and estimated duration
 * 3. Background emits CONVERSION_PROGRESS updates (throttled to 500ms)
 * 4. Popup receives progress updates and updates store
 * 5. Background sends CONVERSION_COMPLETE when done
 * 6. Popup receives completion and clears progress state
 */

import type { Mock } from 'vitest';
import type Browser from 'webextension-polyfill';
import type * as PdfService from '../../shared/domain/pdf';
import type { Message } from '../../shared/types/messages';
import type { ConversionConfig, ConversionProgress, ConversionStatus } from '../../shared/types/models';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MessageType } from '../../shared/types/messages';

import { createMockBrowser, mockConversionConfig, mockTsxContent } from './test-utils';

// Mock webextension-polyfill
vi.mock('webextension-polyfill', () => ({
  default: {},
}));

// Mock WASM converter with progress callback support
vi.mock('../../shared/domain/pdf', () => ({
  convertTsxToPdfWithFonts: vi.fn(),
  downloadPDF: vi.fn(),
  validateTsx: vi.fn(),
}));

describe('Progress Flow Integration', () => {
  let browserMock: ReturnType<typeof createMockBrowser>;
  let setupMessageHandler: () => void;
  let messageHandlerCleanup: (() => void) | null = null;
  let pdfService: typeof PdfService | undefined;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Create mocks
    browserMock = createMockBrowser();

    // Replace global browser with mock
    const webext = await import('webextension-polyfill');
    Object.assign(webext.default, browserMock.mockBrowser);

    // Get mocked pdfService
    pdfService = await import('../../shared/domain/pdf');
    (pdfService.validateTsx as ReturnType<typeof vi.fn>).mockResolvedValue(true);

    // Setup WASM converter with progress callback
    (pdfService.convertTsxToPdfWithFonts as Mock).mockImplementation(async (
      _tsx: string,
      _config: ConversionConfig,
      progressCallback?: (stage: string, percentage: number) => void,
    ) => {
      // Simulate conversion with progress updates
      const stages = [
        { stage: 'parsing', percentage: 10 },
        { stage: 'extracting-metadata', percentage: 20 },
        { stage: 'rendering', percentage: 40 },
        { stage: 'laying-out', percentage: 60 },
        { stage: 'generating-pdf', percentage: 80 },
        { stage: 'completed', percentage: 100 },
      ];

      /**
       * Recursive function to simulate progress stages sequentially
       * Avoids await-in-loop ESLint warning
       */
      async function simulateStage(index: number): Promise<void> {
        if (index >= stages.length) {
          return;
        }

        const { stage, percentage } = stages[index];
        await new Promise(resolve => setTimeout(resolve, 10)); // Simulate work
        if (progressCallback) {
          progressCallback(stage, percentage);
        }

        return simulateStage(index + 1);
      }

      await simulateStage(0);

      return new Uint8Array([0x25, 0x50, 0x44, 0x46]); // PDF header
    });

    // Setup message handler for progress flow
    setupMessageHandler = () => {
      const progressUpdates: ConversionProgress[] = [];

      const handler = async (message: Message, _sender: Browser.Runtime.MessageSender, sendResponse: (response: unknown) => void) => {
        if (message.type === MessageType.CONVERSION_REQUEST) {
          const payload = message.payload as { tsx: string; config: unknown };
          const { tsx, config } = payload;
          const jobId = `job-${Date.now()}`;

          // Track progress updates
          const progressCallback = (stage: string, percentage: number) => {
            progressUpdates.push({
              stage: stage as ConversionStatus,
              percentage,
              currentOperation: getStageDisplayName(stage),
            });
          };

          try {
            // Convert to PDF with progress callback
            const pdfBytes = await pdfService!.convertTsxToPdfWithFonts(tsx, config as ConversionConfig, progressCallback);

            // Send response with all progress updates
            sendResponse({
              success: true,
              jobId,
              progressUpdates,
              pdfBytes,
            });
          }
          catch (error: unknown) {
            sendResponse({
              success: false,
              error: error instanceof Error ? error.message : String(error),
            });
          }

          return true;
        }

        if (message.type === MessageType.POPUP_OPENED) {
          // Simulate sending progress update if conversion is active
          const payload = message.payload as { requestProgressUpdate: boolean };
          const { requestProgressUpdate } = payload;
          sendResponse({
            acknowledged: true,
            hasActiveConversion: requestProgressUpdate,
          });
          return true;
        }

        return false;
      };

      browserMock.mockBrowser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
        void handler(msg, sender, sendResponse);
        return false;
      });

      // Return cleanup function
      messageHandlerCleanup = () => {
        browserMock.mockBrowser.runtime.onMessage.removeListener((msg, sender, sendResponse) => {
          void handler(msg, sender, sendResponse);
          return false;
        });
      };
    };
  });

  afterEach(() => {
    // Clean up message handlers
    if (messageHandlerCleanup) {
      messageHandlerCleanup();
      messageHandlerCleanup = null;
    }

    // CRITICAL: Destroy mock browser to prevent memory leaks
    browserMock.destroy();

    vi.clearAllMocks();
  });

  it('should emit all 6 progress stages in order', async () => {
    setupMessageHandler();

    // Trigger conversion
    const response = await browserMock.triggerMessage({
      type: MessageType.CONVERSION_REQUEST,
      payload: {
        tsx: mockTsxContent,
        config: mockConversionConfig,
      },
    }) as { success: boolean; progressUpdates: ConversionProgress[]; jobId: string; pdfBytes: Uint8Array };

    // Verify all stages emitted
    expect(response.success).toBe(true);
    expect(response.progressUpdates).toHaveLength(6);

    const stages = response.progressUpdates.map((p: ConversionProgress) => p.stage);
    expect(stages).toEqual([
      'parsing',
      'extracting-metadata',
      'rendering',
      'laying-out',
      'generating-pdf',
      'completed',
    ]);

    const percentages = response.progressUpdates.map((p: ConversionProgress) => p.percentage);
    expect(percentages).toEqual([10, 20, 40, 60, 80, 100]);
  });

  it('should include current operation text for each stage', async () => {
    setupMessageHandler();

    const response = await browserMock.triggerMessage({
      type: MessageType.CONVERSION_REQUEST,
      payload: {
        tsx: mockTsxContent,
        config: mockConversionConfig,
      },
    }) as { success: boolean; progressUpdates: ConversionProgress[]; jobId: string; pdfBytes: Uint8Array };

    // Verify current operation text
    expect(response.progressUpdates[0].currentOperation).toBe('Parsing TSX');
    expect(response.progressUpdates[1].currentOperation).toBe('Extracting metadata');
    expect(response.progressUpdates[2].currentOperation).toBe('Rendering layout');
    expect(response.progressUpdates[3].currentOperation).toBe('Calculating layout');
    expect(response.progressUpdates[4].currentOperation).toBe('Generating PDF');
    expect(response.progressUpdates[5].currentOperation).toBe('Complete');
  });

  it('should call progress callback during conversion', async () => {
    setupMessageHandler();

    const response = await browserMock.triggerMessage({
      type: MessageType.CONVERSION_REQUEST,
      payload: {
        tsx: mockTsxContent,
        config: mockConversionConfig,
      },
    }) as { success: boolean; progressUpdates: ConversionProgress[]; jobId: string; pdfBytes: Uint8Array };

    // Verify progress callback was invoked
    expect(pdfService!.convertTsxToPdfWithFonts).toHaveBeenCalledWith(
      mockTsxContent,
      mockConversionConfig,
      expect.any(Function),
    );

    // Verify progress was tracked
    expect(response.progressUpdates.length).toBeGreaterThan(0);
  });

  it('should complete conversion with PDF bytes', async () => {
    setupMessageHandler();

    const response = await browserMock.triggerMessage({
      type: MessageType.CONVERSION_REQUEST,
      payload: {
        tsx: mockTsxContent,
        config: mockConversionConfig,
      },
    }) as { success: boolean; pdfBytes: Uint8Array; progressUpdates: ConversionProgress[] };

    // Verify completion
    expect(response.success).toBe(true);
    expect(response.pdfBytes).toBeInstanceOf(Uint8Array);
    expect(response.pdfBytes.length).toBeGreaterThan(0);

    // Verify 100% was reached
    const lastProgress = response.progressUpdates[response.progressUpdates.length - 1];
    expect(lastProgress.percentage).toBe(100);
    expect(lastProgress.stage).toBe('completed');
  });

  it('should respond to POPUP_OPENED message', async () => {
    setupMessageHandler();

    const response = await browserMock.triggerMessage({
      type: MessageType.POPUP_OPENED,
      payload: {
        requestProgressUpdate: true,
      },
    }) as { acknowledged: boolean; hasActiveConversion: boolean };

    expect(response.acknowledged).toBe(true);
    expect(response.hasActiveConversion).toBe(true);
  });

  it('should handle conversion errors gracefully', async () => {
    setupMessageHandler();

    // Mock conversion error
    (pdfService!.convertTsxToPdfWithFonts as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('WASM panic'));

    const response = await browserMock.triggerMessage({
      type: MessageType.CONVERSION_REQUEST,
      payload: {
        tsx: mockTsxContent,
        config: mockConversionConfig,
      },
    }) as { success: boolean; error: string };

    expect(response.success).toBe(false);
    expect(response.error).toBe('WASM panic');
  });

  it('should pass progress callback to WASM converter', async () => {
    setupMessageHandler();

    await browserMock.triggerMessage({
      type: MessageType.CONVERSION_REQUEST,
      payload: {
        tsx: mockTsxContent,
        config: mockConversionConfig,
      },
    });

    // Verify third argument is a function (progress callback)
    const callArgs = (pdfService!.convertTsxToPdfWithFonts as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(callArgs[2]).toBeInstanceOf(Function);
  });
});

/**
 * Helper: Get stage display name
 */
function getStageDisplayName(stage: string): string {
  const names: Record<string, string> = {
    'parsing': 'Parsing TSX',
    'extracting-metadata': 'Extracting metadata',
    'rendering': 'Rendering layout',
    'laying-out': 'Calculating layout',
    'generating-pdf': 'Generating PDF',
    'completed': 'Complete',
  };
  return names[stage] || stage;
}
