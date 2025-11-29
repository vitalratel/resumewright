/**
 * WASM Instance Management Tests
 *
 * Tests for createConverterInstance factory function
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

interface MockTsxToPdfConverter {
  detect_fonts: ReturnType<typeof vi.fn>;
  convert_tsx_to_pdf: ReturnType<typeof vi.fn>;
}

// Mock WASM bridge module
vi.mock('@pkg/wasm_bridge', () => ({
  TsxToPdfConverter: vi.fn(function TsxToPdfConverter(this: MockTsxToPdfConverter) {
    this.detect_fonts = vi.fn();
    this.convert_tsx_to_pdf = vi.fn();
  }),
}));

// Mock WASM loader
vi.mock('../loader', () => ({
  isWASMInitialized: vi.fn(),
}));

describe('WASM Instance Management', () => {
  let mockIsWASMInitialized: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    // Clear module cache to reset state
    vi.resetModules();

    // Import mocked loader
    const loader = await import('../loader');
    mockIsWASMInitialized = vi.mocked(loader.isWASMInitialized);

    // Default: WASM is initialized
    mockIsWASMInitialized.mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createConverterInstance', () => {
    it('should create new converter instance when WASM initialized', async () => {
      const { createConverterInstance } = await import('../instance');

      const converter = createConverterInstance();

      expect(converter).toBeDefined();
      expect(typeof converter).toBe('object');
    });

    it('should create different instances on each call (factory pattern)', async () => {
      const { createConverterInstance } = await import('../instance');

      const converter1 = createConverterInstance();
      const converter2 = createConverterInstance();
      const converter3 = createConverterInstance();

      // Each should be a different object (not same reference)
      expect(converter1).not.toBe(converter2);
      expect(converter2).not.toBe(converter3);
      expect(converter1).not.toBe(converter3);
    });

    it('should throw error when WASM not initialized', async () => {
      mockIsWASMInitialized.mockReturnValue(false);
      const { createConverterInstance } = await import('../instance');

      expect(() => createConverterInstance()).toThrow(
        'WASM not initialized. Call initWASM() first.',
      );
    });

    it('should check WASM initialization before creating instance', async () => {
      const { createConverterInstance } = await import('../instance');

      createConverterInstance();

      expect(mockIsWASMInitialized).toHaveBeenCalled();
    });

    it('should create new instance on each call', async () => {
      const { createConverterInstance } = await import('../instance');
      const wasmBridge = await import('@pkg/wasm_bridge');
      const mockConstructor = vi.mocked(wasmBridge.TsxToPdfConverter);

      // Clear any previous constructor calls
      mockConstructor.mockClear();

      createConverterInstance();
      createConverterInstance();
      createConverterInstance();

      expect(mockConstructor).toHaveBeenCalledTimes(3);
    });

    it('should provide instance isolation for concurrent conversions', async () => {
      const { createConverterInstance } = await import('../instance');

      const converter1 = createConverterInstance();
      const converter2 = createConverterInstance();

      // Simulate modifying one instance
      (converter1 as unknown as Record<string, unknown>).customProperty = 'test1';

      // The other instance should not have this property
      expect((converter2 as unknown as Record<string, unknown>).customProperty).toBeUndefined();
    });

    it('should handle rapid successive calls without errors', async () => {
      const { createConverterInstance } = await import('../instance');

      // Simulate rapid converter creation
      const converters = Array.from({ length: 10 }, () => createConverterInstance());

      expect(converters).toHaveLength(10);
      converters.forEach((converter) => {
        expect(converter).toBeDefined();
      });
    });

    it('should return correctly typed TsxToPdfConverter', async () => {
      const { createConverterInstance } = await import('../instance');

      const converter = createConverterInstance();

      // Check that it has expected methods (mocked)
      expect(converter).toHaveProperty('detect_fonts');
      expect(converter).toHaveProperty('convert_tsx_to_pdf');
    });
  });

  describe('Error Handling', () => {
    it('should provide clear error message for uninitialized WASM', async () => {
      mockIsWASMInitialized.mockReturnValue(false);
      const { createConverterInstance } = await import('../instance');

      try {
        createConverterInstance();
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('WASM not initialized');
        expect((error as Error).message).toContain('initWASM()');
      }
    });

    it('should handle WASM initialization check failing', async () => {
      mockIsWASMInitialized.mockImplementation(() => {
        throw new Error('Loader check failed');
      });
      const { createConverterInstance } = await import('../instance');

      expect(() => createConverterInstance()).toThrow('Loader check failed');
    });
  });
});
