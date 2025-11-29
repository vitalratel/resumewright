/**
 * Tests for ConversionHandler
 *
 * Focus on P1 issues:
 * - Input validation
 * - Extension/WASM boundary error handling
 * - Error handling paths
 */

import type {
  ConversionRequestMessage,
  ConversionRequestPayload,
  PopupOpenedMessage,
} from '../../../shared/types/messages';
import { fakeBrowser } from '@webext-core/fake-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_USER_SETTINGS } from '@/shared/domain/settings/migrations';
import { MessageType } from '../../../shared/types/messages';
import { ConversionService } from '../../services/ConversionService';
import { ProgressTracker } from '../../services/ProgressTracker';
import { ConversionHandler } from '../conversionHandler';

// webextension-polyfill is mocked globally with fakeBrowser

vi.mock('../../wasmInit', () => ({
  getWasmStatus: vi.fn(),
}));

vi.mock('../../../shared/application/pdf/converter', () => ({
  convertTsxToPdfWithFonts: vi.fn(),
}));

vi.mock('@pkg/wasm_bridge', () => ({
  extract_cv_metadata: vi.fn(),
  LayoutType: {
    SingleColumn: 0,
    TwoColumn: 1,
    Academic: 2,
    Portfolio: 3,
    Custom: 4,
  },
  FontComplexity: {
    Simple: 0,
    Moderate: 1,
    Complex: 2,
  },
}));

vi.mock('@/shared/infrastructure/settings/SettingsStore', () => ({
  settingsStore: {
    loadSettings: vi.fn(),
  },
}));

// Mock LifecycleManager
const mockLifecycleManager = {
  saveJobCheckpoint: vi.fn(),
  clearJobCheckpoint: vi.fn(),
  getActiveJobIds: vi.fn(() => []),
  hasJob: vi.fn(() => false),
  initialize: vi.fn(),
};

vi.mock('../../../shared/logging', () => ({
  getLogger: vi.fn(() => ({
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

describe('ConversionHandler', () => {
  let handler: ConversionHandler;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Instantiate services
    const conversionService = new ConversionService();
    const progressTracker = new ProgressTracker();

    handler = new ConversionHandler(
      mockLifecycleManager as any,
      conversionService,
      progressTracker
    );

    // Default mocks for successful case
    const { getWasmStatus } = await import('../../wasmInit');
    vi.mocked(getWasmStatus).mockResolvedValue({ status: 'success' });

    const { settingsStore } = await import('@/shared/infrastructure/settings/SettingsStore');
    vi.mocked(settingsStore.loadSettings).mockResolvedValue(DEFAULT_USER_SETTINGS);

    const { convertTsxToPdfWithFonts } = await import('../../../shared/application/pdf/converter');
    vi.mocked(convertTsxToPdfWithFonts).mockResolvedValue(new Uint8Array([37, 80, 68, 70])); // PDF header

    const { extract_cv_metadata } = await import('@pkg/wasm_bridge');
    const { LayoutType, FontComplexity } = await import('@pkg/wasm_bridge');
    vi.mocked(extract_cv_metadata).mockReturnValue({
      name: 'John Doe',
      title: 'Software Engineer',
      layout_type: LayoutType.SingleColumn,
      estimated_pages: 1,
      component_count: 5,
      has_contact_info: true,
      has_clear_sections: true,
      font_complexity: FontComplexity.Simple,
      free: vi.fn(),
    } as any);

    vi.spyOn(fakeBrowser.runtime, 'sendMessage').mockResolvedValue(undefined);
    vi.spyOn(fakeBrowser.storage.local, 'get').mockResolvedValue({});
    vi.spyOn(fakeBrowser.storage.local, 'set').mockResolvedValue(undefined);
  });

  describe('message routing', () => {
    it('should handle CONVERSION_REQUEST', async () => {
      const message: ConversionRequestMessage = {
        type: MessageType.CONVERSION_REQUEST,
        payload: {
          tsx: 'export default function CV() { return <div>Test</div>; }',
        },
      };

      // Type assertion: test is checking handler behavior with specific message
      const result = await handler.handle(message as any, {});

      expect(result).toEqual({ success: true });
    });

    it('should handle POPUP_OPENED', async () => {
      const message: PopupOpenedMessage = {
        type: MessageType.POPUP_OPENED,
        payload: { requestProgressUpdate: false },
      };

      // Type assertion: test is checking handler behavior with specific message
      const result = await handler.handle(message as any, {});

      expect(result).toEqual({ success: true });
    });
  });

  describe('WASM boundary error handling', () => {
    it('should handle WASM initializing state', async () => {
      const { getWasmStatus } = await import('../../wasmInit');
      vi.mocked(getWasmStatus).mockResolvedValue({
        status: 'initializing',
      });

      const payload: ConversionRequestPayload = {
        tsx: 'export default function CV() { return <div>Test</div>; }',
      };

      const result = await handler.handle({ type: MessageType.CONVERSION_REQUEST, payload }, {});

      expect(result).toEqual({
        success: false,
        error: expect.stringContaining('initializing'),
      });
    });

    it('should handle WASM failed state', async () => {
      const { getWasmStatus } = await import('../../wasmInit');
      vi.mocked(getWasmStatus).mockResolvedValue({
        status: 'failed',
        error: 'Module load failed',
      });

      const payload: ConversionRequestPayload = {
        tsx: 'export default function CV() { return <div>Test</div>; }',
      };

      const result = await handler.handle({ type: MessageType.CONVERSION_REQUEST, payload }, {});

      expect(result).toEqual({
        success: false,
        error: expect.stringContaining('failed to initialize'),
      });
    });

    it('should handle conversion errors', async () => {
      const { convertTsxToPdfWithFonts } = await import('../../../shared/application/pdf/converter');
      vi.mocked(convertTsxToPdfWithFonts).mockRejectedValue(new Error('Parsing failed'));

      const payload: ConversionRequestPayload = {
        tsx: 'export default function CV() { return <div>Test</div>; }',
      };

      const result = await handler.handle({ type: MessageType.CONVERSION_REQUEST, payload }, {});

      expect(result).toEqual({ success: false });
      expect(fakeBrowser.runtime.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: MessageType.CONVERSION_ERROR,
        })
      );
    });
  });

  describe('error handling', () => {
    it('should handle settings load errors', async () => {
      const { settingsStore } = await import('@/shared/infrastructure/settings/SettingsStore');
      vi.mocked(settingsStore.loadSettings).mockRejectedValue(new Error('Storage error'));

      const payload: ConversionRequestPayload = {
        tsx: 'export default function CV() { return <div>Test</div>; }',
      };

      const result = await handler.handle({ type: MessageType.CONVERSION_REQUEST, payload }, {});

      expect(result).toEqual({ success: false });
    });

    it('should handle message send errors', async () => {
      // First call succeeds (CONVERSION_STARTED), second call fails (CONVERSION_COMPLETE)
      vi.mocked(fakeBrowser.runtime.sendMessage)
        .mockResolvedValueOnce(undefined) // CONVERSION_STARTED
        .mockRejectedValueOnce(new Error('No receiver')); // CONVERSION_COMPLETE

      const payload: ConversionRequestPayload = {
        tsx: 'export default function CV() { return <div>Test</div>; }',
      };

      const result = await handler.handle({ type: MessageType.CONVERSION_REQUEST, payload }, {});

      expect(result).toEqual({ success: false });
    });
  });

  describe('popup opened handling', () => {
    it('should respond to popup opened without progress request', async () => {
      const payload = { requestProgressUpdate: false };

      const result = await handler.handle({ type: MessageType.POPUP_OPENED, payload }, {});

      expect(result).toEqual({ success: true });
    });

    it('should send progress updates when requested', async () => {
      const payload = { requestProgressUpdate: true };

      const result = await handler.handle({ type: MessageType.POPUP_OPENED, payload }, {});

      expect(result).toEqual({ success: true });
    });
  });
});
