/**
 * Settings Flow Integration Test
 *
 * Tests: Settings change → Storage → Next conversion uses new settings
 *
 * Flow:
 * 1. User changes settings in popup (page size, margins)
 * 2. Popup sends UPDATE_SETTINGS message to background
 * 3. Background persists settings to chrome.storage.local
 * 4. Next conversion request uses updated settings
 * 5. Popup can retrieve current settings
 */

import type Browser from 'webextension-polyfill';
import type { mockConversionConfig } from './test-utils';
import type * as PdfService from '@/shared/domain/pdf';
import type { Message } from '@/shared/types/messages';
import type { ConversionConfig } from '@/shared/types/models';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getLogger } from '@/shared/infrastructure/logging';
import { MessageType } from '@/shared/types/messages';
import { createMessage, createMockBrowser, createMockWasm, mockTsxContent } from './test-utils';

// Mock webextension-polyfill
vi.mock('webextension-polyfill', () => ({
  default: {} as typeof Browser,
}));

// Mock WASM converter
vi.mock('@/shared/domain/pdf', () => ({
  convertTsxToPdfWithFonts: vi.fn(),
  downloadPDF: vi.fn(),
  validateTsx: vi.fn().mockResolvedValue(true),
}));

describe('Settings Flow Integration', () => {
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
    pdfService = await import('@/shared/domain/pdf');
    (pdfService.convertTsxToPdfWithFonts as ReturnType<typeof vi.fn>).mockImplementation(
      wasmMock.convertTsxToPdfWithFonts
    );

    // Initialize default settings in storage
    await browserMock.mockBrowser.storage.local.set({
      settings: {
        defaultConfig: {
          pageSize: 'letter',
          margin: { top: 72, right: 72, bottom: 72, left: 72 },
        },
      },
    });

    // Setup message handler for settings and conversion flow
    setupMessageHandler = () => {
      const handler = (
        message: Message<unknown>,
        _sender: Browser.Runtime.MessageSender,
        sendResponse: (response: unknown) => void
      ) => {
        void (async () => {
          if (message.type === MessageType.UPDATE_SETTINGS) {
            const payload = message.payload as { settings: unknown };
            const { settings } = payload;

            // Persist to storage
            await browserMock.mockBrowser.storage.local.set({ settings });

            sendResponse({ success: true });
            return true;
          }

          if (message.type === MessageType.GET_SETTINGS) {
            // Retrieve from storage
            const result = (await browserMock.mockBrowser.storage.local.get('settings')) as {
              settings?: unknown;
            };

            sendResponse({
              settings:
                result.settings !== null && result.settings !== undefined
                  ? result.settings
                  : {
                      defaultConfig: {
                        pageSize: 'letter',
                        margin: { top: 72, right: 72, bottom: 72, left: 72 },
                      },
                    },
            });
            return true;
          }

          if (message.type === MessageType.CONVERSION_REQUEST) {
            const payload = message.payload as { tsx: string; config?: ConversionConfig | null };
            const { tsx, config } = payload;

            let finalConfig = config;

            // If no config provided, use settings from storage
            if (!config) {
              const result = (await browserMock.mockBrowser.storage.local.get('settings')) as {
                settings?: { defaultConfig?: Partial<ConversionConfig> };
              };
              const defaultConfigFromSettings = result.settings?.defaultConfig;
              finalConfig = {
                pageSize:
                  defaultConfigFromSettings?.pageSize !== null &&
                  defaultConfigFromSettings?.pageSize !== undefined
                    ? defaultConfigFromSettings.pageSize
                    : 'Letter',
                margin: defaultConfigFromSettings?.margin ?? {
                  top: 72,
                  right: 72,
                  bottom: 72,
                  left: 72,
                },
                fontSize: defaultConfigFromSettings?.fontSize ?? 12,
                fontFamily:
                  defaultConfigFromSettings?.fontFamily !== null &&
                  defaultConfigFromSettings?.fontFamily !== undefined &&
                  defaultConfigFromSettings?.fontFamily !== ''
                    ? defaultConfigFromSettings.fontFamily
                    : 'Arial',
                compress: defaultConfigFromSettings?.compress ?? false,
              };
            }

            try {
              await pdfService.validateTsx(tsx, getLogger(), mockConverter);
              const pdfBytes = await pdfService.convertTsxToPdfWithFonts(tsx, finalConfig!); // finalConfig is always defined here

              sendResponse({
                type: 'CONVERSION_SUCCESS',
                payload: {
                  pdfBytes,
                  filename: 'resume.pdf',
                  config: finalConfig,
                },
              });
            } catch (error: unknown) {
              sendResponse({
                type: 'CONVERSION_ERROR',
                payload: {
                  error: (error as Error).message,
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

  it('should persist settings changes to storage', async () => {
    setupMessageHandler();

    const newSettings = {
      defaultConfig: {
        pageSize: 'a4' as const,
        margin: { top: 50, right: 50, bottom: 50, left: 50 },
      },
    };

    // User updates settings
    const updateMessage = createMessage.updateSettings(newSettings);
    const response = await browserMock.triggerMessage(updateMessage);

    // Verify update acknowledged
    expect(response).toEqual({ success: true });

    // Verify settings were persisted to storage
    const storedData = (await browserMock.mockBrowser.storage.local.get('settings')) as {
      settings: unknown;
    };
    expect(storedData.settings).toEqual(newSettings);
  });

  it('should use updated settings in next conversion', async () => {
    setupMessageHandler();

    // Step 1: Change settings to A4 with smaller margins
    const newSettings = {
      defaultConfig: {
        pageSize: 'a4' as const,
        margin: { top: 36, right: 36, bottom: 36, left: 36 },
      },
    };

    await browserMock.triggerMessage(createMessage.updateSettings(newSettings));

    // Step 2: Perform conversion WITHOUT explicit config (should use settings)
    const conversionResponse = (await browserMock.triggerMessage({
      type: MessageType.CONVERSION_REQUEST,
      payload: { tsx: mockTsxContent, config: null },
    })) as { type: string; payload: { config: ConversionConfig } };

    // Step 3: Verify conversion succeeded with expected config
    expect(conversionResponse.type).toBe('CONVERSION_SUCCESS');
    expect(conversionResponse.payload.config).toMatchObject({
      pageSize: 'a4',
      margin: { top: 36, right: 36, bottom: 36, left: 36 },
    });

    // Verify converter was called with settings (flexible on optional parameters)
    expect(pdfService.convertTsxToPdfWithFonts).toHaveBeenCalledWith(
      mockTsxContent,
      expect.objectContaining({
        pageSize: 'a4',
        margin: { top: 36, right: 36, bottom: 36, left: 36 },
      })
    );
  });

  it('should allow explicit config to override settings', async () => {
    setupMessageHandler();

    // Set default settings to letter
    await browserMock.triggerMessage(
      createMessage.updateSettings({
        defaultConfig: {
          pageSize: 'letter',
          margin: { top: 72, right: 72, bottom: 72, left: 72 },
        },
      })
    );

    // Conversion with explicit A4 config (one-time override)
    const explicitConfig: ConversionConfig = {
      pageSize: 'A4',
      margin: { top: 50, right: 50, bottom: 50, left: 50 },
      fontSize: 12,
      fontFamily: 'Arial',
      compress: false,
    };

    const conversionResponse = (await browserMock.triggerMessage(
      createMessage.conversionRequest(mockTsxContent, explicitConfig as typeof mockConversionConfig)
    )) as { payload: { config: ConversionConfig } };

    // Should use explicit config, not settings
    expect(pdfService.convertTsxToPdfWithFonts).toHaveBeenCalledWith(
      mockTsxContent,
      expect.objectContaining({
        pageSize: 'A4',
        margin: { top: 50, right: 50, bottom: 50, left: 50 },
        fontSize: 12,
        fontFamily: 'Arial',
        compress: false,
      })
    );
    expect(conversionResponse.payload.config.pageSize).toBe('A4');
  });

  it('should retrieve current settings for popup display', async () => {
    setupMessageHandler();

    // Set custom settings
    const customSettings = {
      defaultConfig: {
        pageSize: 'a4' as const,
        margin: { top: 25, right: 25, bottom: 25, left: 25 },
      },
      theme: 'dark',
      autoDownload: true,
    };

    await browserMock.triggerMessage(createMessage.updateSettings(customSettings));

    // Popup retrieves settings
    const getResponse = (await browserMock.triggerMessage({
      type: MessageType.GET_SETTINGS,
      payload: {},
    })) as { settings: unknown };

    // Should receive current settings
    expect(getResponse.settings).toEqual(customSettings);
  });

  it('should handle partial settings updates', async () => {
    setupMessageHandler();

    // Initial settings
    await browserMock.triggerMessage(
      createMessage.updateSettings({
        defaultConfig: {
          pageSize: 'letter',
          margin: { top: 72, right: 72, bottom: 72, left: 72 },
        },
        theme: 'light',
      })
    );

    // Update only theme
    await browserMock.triggerMessage(
      createMessage.updateSettings({
        theme: 'dark',
      })
    );

    // Retrieve settings
    const response = (await browserMock.triggerMessage({
      type: MessageType.GET_SETTINGS,
      payload: {},
    })) as { settings: { theme: string } };

    // Theme should be updated
    expect(response.settings.theme).toBe('dark');
  });

  it('should persist settings across multiple conversions', async () => {
    setupMessageHandler();

    // Set A4 settings
    const a4Settings = {
      defaultConfig: {
        pageSize: 'a4' as const,
        margin: { top: 36, right: 36, bottom: 36, left: 36 },
      },
    };

    await browserMock.triggerMessage(createMessage.updateSettings(a4Settings));

    // Perform 3 conversions
    await browserMock.triggerMessage({
      type: MessageType.CONVERSION_REQUEST,
      payload: { tsx: '<CV><Name>User 1</Name></CV>', config: null },
    });

    await browserMock.triggerMessage({
      type: MessageType.CONVERSION_REQUEST,
      payload: { tsx: '<CV><Name>User 2</Name></CV>', config: null },
    });

    await browserMock.triggerMessage({
      type: MessageType.CONVERSION_REQUEST,
      payload: { tsx: '<CV><Name>User 3</Name></CV>', config: null },
    });

    // Verify all 3 conversions used the same A4 settings
    expect(pdfService.convertTsxToPdfWithFonts).toHaveBeenCalledTimes(3);

    const expectedConfig = expect.objectContaining({
      pageSize: 'a4',
      margin: { top: 36, right: 36, bottom: 36, left: 36 },
    });

    expect(pdfService.convertTsxToPdfWithFonts).toHaveBeenNthCalledWith(
      1,
      expect.any(String),
      expectedConfig
    );
    expect(pdfService.convertTsxToPdfWithFonts).toHaveBeenNthCalledWith(
      2,
      expect.any(String),
      expectedConfig
    );
    expect(pdfService.convertTsxToPdfWithFonts).toHaveBeenNthCalledWith(
      3,
      expect.any(String),
      expectedConfig
    );
  });

  it('should use default settings if none configured', async () => {
    setupMessageHandler();

    // Clear storage
    browserMock.clearStorage();

    // Conversion without settings
    await browserMock.triggerMessage({
      type: MessageType.CONVERSION_REQUEST,
      payload: { tsx: mockTsxContent, config: null },
    });

    // Should use fallback defaults (Letter, 1-inch margins)
    expect(pdfService.convertTsxToPdfWithFonts).toHaveBeenCalledWith(
      mockTsxContent,
      expect.objectContaining({
        pageSize: 'Letter',
        margin: { top: 72, right: 72, bottom: 72, left: 72 },
      })
    );
  });

  it('should handle invalid settings gracefully', async () => {
    setupMessageHandler();

    // Attempt to set invalid settings
    const invalidSettings = {
      defaultConfig: {
        pageSize: 'invalid-size',
        margin: 'not-an-object',
      },
    };

    const response = await browserMock.triggerMessage(
      createMessage.updateSettings(invalidSettings)
    );

    // Update should still succeed (validation happens at conversion time)
    expect(response).toEqual({ success: true });

    // Settings should be stored as-is
    const storedData = (await browserMock.mockBrowser.storage.local.get('settings')) as {
      settings?: unknown;
    };
    expect(storedData.settings).toEqual(invalidSettings);
  });
});
