// ABOUTME: Tests for background message handler setup.
// ABOUTME: Verifies handler registration and error handling paths.

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

// Mock WASM - true external boundary
vi.mock('@pkg/wasm_bridge', () => ({
  extract_cv_metadata: vi.fn(),
}));

vi.mock('@/shared/infrastructure/wasm/instance', () => ({
  createConverterInstance: vi.fn(() => ({
    validateTsx: vi.fn().mockResolvedValue(true),
    convert: vi.fn().mockResolvedValue(new Uint8Array()),
    free: vi.fn(),
  })),
}));

vi.mock('@/shared/infrastructure/wasm/loader', () => ({
  isWASMInitialized: vi.fn().mockReturnValue(true),
}));

vi.mock('../wasmInit', () => ({
  getWasmStatus: vi.fn().mockResolvedValue({ status: 'success' }),
}));

vi.mock('../../shared/domain/pdf/validation', () => ({
  validateTsxSyntax: vi.fn().mockResolvedValue(true),
}));

// Mock PDF converter - uses WASM internally
vi.mock('../../shared/application/pdf/converter', () => ({
  convertTsxToPdfWithFonts: vi.fn().mockResolvedValue(new Uint8Array([0x25, 0x50, 0x44, 0x46])),
}));

// Silence logging
vi.mock('@/shared/infrastructure/logging/instance', () => ({
  getLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('messageHandler', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    registeredHandlers.clear();

    // Import and setup after mocks
    const { setupMessageHandler } = await import('../messageHandler');
    setupMessageHandler();
  });

  describe('handler registration', () => {
    it('should register all expected message handlers', async () => {
      const expectedHandlers = ['validateTsx', 'startConversion'];

      for (const handler of expectedHandlers) {
        expect(registeredHandlers.has(handler)).toBe(true);
      }
      expect(registeredHandlers.size).toBe(2);
    });
  });

  describe('validateTsx handler', () => {
    it('should validate tsx content', async () => {
      const handler = registeredHandlers.get('validateTsx');
      if (!handler) throw new Error('Handler not registered');

      const result = await handler({ data: { tsx: '<div>Test</div>' } });
      expect(result).toEqual({ valid: true });
    });
  });
});
