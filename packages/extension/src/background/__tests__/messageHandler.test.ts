// ABOUTME: Tests for background message handler setup.
// ABOUTME: Verifies handler registration and error handling paths.

import type { LifecycleManager } from '../lifecycleManager';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Track registered handlers for testing
const registeredHandlers = new Map<string, (args: { data: unknown }) => unknown>();

// Mock @webext-core/messaging - we need to capture registered handlers
vi.mock('@/shared/messaging', () => ({
  sendMessage: vi.fn(),
  onMessage: vi.fn((type: string, handler: (args: { data: unknown }) => unknown) => {
    registeredHandlers.set(type, handler);
  }),
}));

// Mock browser storage - true external boundary
vi.mock('wxt/browser', () => ({
  browser: {
    storage: {
      sync: {
        get: vi.fn().mockResolvedValue({}),
        set: vi.fn().mockResolvedValue(undefined),
      },
      local: {
        get: vi.fn().mockResolvedValue({}),
        set: vi.fn().mockResolvedValue(undefined),
      },
      onChanged: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
      },
    },
  },
}));

// Mock WASM - true external boundary
vi.mock('@pkg/wasm_bridge', () => ({
  extract_cv_metadata: vi.fn(),
}));

vi.mock('@/shared/infrastructure/wasm', () => ({
  createConverterInstance: vi.fn(() => ({
    validateTsx: vi.fn().mockResolvedValue(true),
    convert: vi.fn().mockResolvedValue(new Uint8Array()),
    free: vi.fn(),
  })),
  isWASMInitialized: vi.fn().mockReturnValue(true),
}));

vi.mock('../wasmInit', () => ({
  getWasmStatus: vi.fn().mockResolvedValue({ status: 'success' }),
  retryWasmInit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../shared/domain/pdf/validation', () => ({
  validateTsxSyntax: vi.fn().mockResolvedValue(true),
}));

// Mock PDF converter - uses WASM internally
vi.mock('../../shared/application/pdf/converter', () => ({
  convertTsxToPdfWithFonts: vi.fn().mockResolvedValue(new Uint8Array([0x25, 0x50, 0x44, 0x46])),
}));

// Silence logging
vi.mock('@/shared/infrastructure/logging', () => ({
  getLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

// Mock storage for settings
vi.mock('@/shared/infrastructure/storage', () => ({
  localExtStorage: {
    getItem: vi.fn().mockResolvedValue('success'),
    setItem: vi.fn().mockResolvedValue(undefined),
    removeItem: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock LifecycleManager
const mockLifecycleManager: LifecycleManager = {
  saveJobCheckpoint: vi.fn(),
  clearJobCheckpoint: vi.fn(),
  getActiveJobIds: vi.fn(() => []),
  hasJob: vi.fn(() => false),
  initialize: vi.fn(),
} as unknown as LifecycleManager;

describe('messageHandler', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    registeredHandlers.clear();

    // Import and setup after mocks
    const { setupMessageHandler } = await import('../messageHandler');
    setupMessageHandler(mockLifecycleManager);
  });

  describe('handler registration', () => {
    it('should register all expected message handlers', async () => {
      const expectedHandlers = [
        'getWasmStatus',
        'retryWasmInit',
        'validateTsx',
        'startConversion',
        'getSettings',
        'updateSettings',
        'popupOpened',
        'ping',
      ];

      for (const handler of expectedHandlers) {
        expect(registeredHandlers.has(handler)).toBe(true);
      }
      expect(registeredHandlers.size).toBe(8);
    });
  });

  describe('ping handler', () => {
    it('should respond with pong', () => {
      const pingHandler = registeredHandlers.get('ping');
      expect(pingHandler).toBeDefined();

      const result = pingHandler!({ data: {} });
      expect(result).toEqual({ pong: true });
    });
  });

  describe('getSettings handler', () => {
    it('should return settings successfully', async () => {
      const handler = registeredHandlers.get('getSettings');
      expect(handler).toBeDefined();

      const result = await handler!({ data: {} });

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('settings');
    });

    it('should handle settings load failure', async () => {
      // Force settingsStore to throw
      const { settingsStore } = await import(
        '@/shared/infrastructure/settings/SettingsStore'
      );
      vi.spyOn(settingsStore, 'loadSettings').mockRejectedValueOnce(
        new Error('Storage unavailable')
      );

      const handler = registeredHandlers.get('getSettings');
      const result = await handler!({ data: {} });

      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error');
    });
  });

  describe('popupOpened handler', () => {
    it('should return success', async () => {
      const handler = registeredHandlers.get('popupOpened');
      expect(handler).toBeDefined();

      const result = await handler!({ data: { requestProgressUpdate: false } });
      expect(result).toEqual({ success: true });
    });
  });

  describe('validateTsx handler', () => {
    it('should validate tsx content', async () => {
      const handler = registeredHandlers.get('validateTsx');
      expect(handler).toBeDefined();

      const result = await handler!({ data: { tsx: '<div>Test</div>' } });
      expect(result).toEqual({ valid: true });
    });
  });

  describe('getWasmStatus handler', () => {
    it('should return WASM status from storage', async () => {
      const handler = registeredHandlers.get('getWasmStatus');
      expect(handler).toBeDefined();

      const result = await handler!({ data: {} });

      // With mocked storage returning 'success'
      expect(result).toHaveProperty('initialized', true);
    });
  });
});
