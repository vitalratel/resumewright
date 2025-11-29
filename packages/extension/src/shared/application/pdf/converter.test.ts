/**
 * PDF Converter Tests
 *
 * Tests for the refactored PDF conversion module covering:
 * - Full TSX-to-PDF conversion pipeline (integration)
 * - Automatic font detection and fetching (step-based)
 * - Error handling at each step
 * - Input validation
 * - Progress callback behavior (detecting, fetching, parsing)
 * - PDF output validation
 * - Resource cleanup (WASM instances)
 * - Dependency injection
 *
 * Focus: Behavior testing over implementation details
 * Coverage target: >85%
 */

import type { FontWeight } from '../../domain/fonts/models/Font';
import type { WasmPdfConfig } from '../../domain/pdf/types';
import type { ConversionConfig } from '../../types/models';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { convertTsxToPdfWithFonts } from './converter';

// Mock dependencies
vi.mock('../../infrastructure/wasm', () => ({
  createConverterInstance: vi.fn(),
}));

vi.mock('../../domain/pdf/config', () => ({
  convertConfigToRust: vi.fn(),
}));

vi.mock('../../infrastructure/pdf/fonts', () => ({
  detectFonts: vi.fn(),
}));

vi.mock('../../domain/pdf/errors', () => ({
  parseWasmError: vi.fn(),
}));

vi.mock('../../domain/pdf/wasmSchemas', () => ({
  validatePdfBytes: vi.fn(),
  validateProgressParams: vi.fn(),
}));

// Mock FontFetchOrchestrator and GoogleFontsRepository
const mockFetchFontsFromRequirements = vi.fn();

vi.mock('../fonts/FontFetchOrchestrator', () => ({
  FontFetchOrchestrator: class MockFontFetchOrchestrator {
    fetchFontsFromRequirements = mockFetchFontsFromRequirements;
  },
}));

vi.mock('../../infrastructure/fonts/GoogleFontsRepository', () => ({
  GoogleFontsRepository: class MockGoogleFontsRepository {},
}));

vi.mock('../../infrastructure/fonts/CustomFontStoreAdapter', () => ({
  CustomFontStoreAdapter: class MockCustomFontStoreAdapter {},
}));

vi.mock('../../infrastructure/logging', () => ({
  getLogger: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    setLevel: vi.fn(),
    getLevel: vi.fn(),
  })),
}));

interface MockFontCollection {
  add: ReturnType<typeof vi.fn>;
}

interface MockFontData {
  family: string;
  weight: number;
  italic: boolean;
  bytes: Uint8Array;
}

vi.mock('@pkg/wasm_bridge', () => ({
  FontCollection: vi.fn(function FontCollection(this: MockFontCollection) {
    this.add = vi.fn();
  }),
  FontData: vi.fn(function FontData(
    this: MockFontData,
    family: string,
    weight: number,
    italic: boolean,
    bytes: Uint8Array
  ) {
    this.family = family;
    this.weight = weight;
    this.italic = italic;
    this.bytes = bytes;
  }),
}));

describe('PDF Converter', () => {
  let mockCreateConverterInstance: ReturnType<typeof vi.fn>;
  let mockConvertConfigToRust: ReturnType<typeof vi.fn>;
  let mockDetectFonts: ReturnType<typeof vi.fn>;
  let mockParseWasmError: ReturnType<typeof vi.fn>;
  let mockValidatePdfBytes: ReturnType<typeof vi.fn>;
  let mockValidateProgressParams: ReturnType<typeof vi.fn>;
  let mockConverter: {
    convert_tsx_to_pdf: ReturnType<typeof vi.fn>;
    free: ReturnType<typeof vi.fn>;
  };

  const validConfig: ConversionConfig = {
    pageSize: 'Letter',
    margin: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
    fontSize: 12,
    fontFamily: 'Arial',
    compress: true,
  };

  const validTsx = 'export default function Resume() { return <div>Resume</div>; }';

  beforeEach(async () => {
    vi.clearAllMocks();

    // Import mocked modules
    const wasm = await import('../../infrastructure/wasm');
    const config = await import('../../domain/pdf/config');
    const fonts = await import('../../infrastructure/pdf/fonts');
    const errors = await import('../../domain/pdf/errors');
    const wasmSchemas = await import('../../domain/pdf/wasmSchemas');

    mockCreateConverterInstance = vi.mocked(wasm.createConverterInstance);
    mockConvertConfigToRust = vi.mocked(config.convertConfigToRust);
    mockDetectFonts = vi.mocked(fonts.detectFonts);
    mockParseWasmError = vi.mocked(errors.parseWasmError);
    mockValidatePdfBytes = vi.mocked(wasmSchemas.validatePdfBytes);
    mockValidateProgressParams = vi.mocked(wasmSchemas.validateProgressParams);

    // Default mock setup
    mockConverter = {
      convert_tsx_to_pdf: vi.fn(),
      free: vi.fn(),
    };

    mockCreateConverterInstance.mockReturnValue(mockConverter);
    mockConvertConfigToRust.mockReturnValue({ page_size: 'Letter' } as WasmPdfConfig);

    // Create valid PDF bytes with magic header
    const validPdf = new Uint8Array(100);
    validPdf[0] = 0x25; // %
    validPdf[1] = 0x50; // P
    validPdf[2] = 0x44; // D
    validPdf[3] = 0x46; // F

    mockConverter.convert_tsx_to_pdf.mockReturnValue(validPdf);
    mockValidatePdfBytes.mockReturnValue(validPdf);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('convertTsxToPdfWithFonts (public API)', () => {
    beforeEach(() => {
      // Reset and setup default mock behavior
      mockFetchFontsFromRequirements.mockReset();
      mockDetectFonts.mockResolvedValue([
        { family: 'Roboto', weight: 400 as FontWeight, style: 'normal', source: 'google' },
      ]);
      mockFetchFontsFromRequirements.mockResolvedValue([
        {
          family: 'Roboto',
          weight: 400 as FontWeight,
          style: 'normal',
          bytes: new Uint8Array([1, 2, 3]),
        },
      ]);
    });

    it('should complete full conversion pipeline successfully', async () => {
      const result = await convertTsxToPdfWithFonts(validTsx, validConfig);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBeGreaterThan(0);
      // Verify all steps were called in order
      expect(mockDetectFonts).toHaveBeenCalledWith(validTsx);
      expect(mockFetchFontsFromRequirements).toHaveBeenCalled();
      expect(mockConverter.convert_tsx_to_pdf).toHaveBeenCalled();
    });

    it('should fetch fonts from requirements', async () => {
      await convertTsxToPdfWithFonts(validTsx, validConfig);

      expect(mockFetchFontsFromRequirements).toHaveBeenCalledWith(
        [{ family: 'Roboto', weight: 400 as FontWeight, style: 'normal', source: 'google' }],
        undefined
      );
    });

    it('should call font fetch callback if provided', async () => {
      const onFontFetch = vi.fn();

      await convertTsxToPdfWithFonts(validTsx, validConfig, undefined, onFontFetch);

      expect(mockFetchFontsFromRequirements).toHaveBeenCalledWith(expect.any(Array), onFontFetch);
    });

    it('should create FontCollection and add fonts', async () => {
      const wasmBridge = await import('@pkg/wasm_bridge');
      const mockFontCollection = vi.mocked(wasmBridge.FontCollection);

      await convertTsxToPdfWithFonts(validTsx, validConfig);

      expect(mockFontCollection).toHaveBeenCalled();
      const collectionInstance = mockFontCollection.mock.results[0]?.value;
      expect(collectionInstance.add).toHaveBeenCalled();
    });

    it('should throw error for empty TSX input', async () => {
      await expect(convertTsxToPdfWithFonts('', validConfig)).rejects.toThrow('TSX input is empty');
    });

    it('should throw error for whitespace-only TSX', async () => {
      await expect(convertTsxToPdfWithFonts('   ', validConfig)).rejects.toThrow(
        'TSX input is empty'
      );
    });

    it('should cleanup converter instance after conversion', async () => {
      await convertTsxToPdfWithFonts(validTsx, validConfig);

      expect(mockConverter.free).toHaveBeenCalled();
    });

    it('should cleanup instance even if error occurs during conversion', async () => {
      // Setup converter to throw after being created
      const mockConverterForError = {
        convert_tsx_to_pdf: vi.fn(() => {
          throw new Error('Conversion failed');
        }),
        free: vi.fn(),
      };
      mockCreateConverterInstance.mockReturnValueOnce(mockConverterForError);
      mockParseWasmError.mockReturnValue({ message: 'Conversion failed' });

      await expect(convertTsxToPdfWithFonts(validTsx, validConfig)).rejects.toThrow();

      expect(mockConverterForError.free).toHaveBeenCalled();
    });

    it('should validate progress callback parameters from WASM', async () => {
      const onProgress = vi.fn();

      await convertTsxToPdfWithFonts(validTsx, validConfig, onProgress);

      // Get the progress callback wrapper
      const progressCallback = mockConverter.convert_tsx_to_pdf.mock.calls[0][3];

      // Simulate WASM calling progress callback
      progressCallback('parsing', 50);

      expect(mockValidateProgressParams).toHaveBeenCalledWith('parsing', 50);
    });

    it('should map WASM progress to overall progress (15-100)', async () => {
      const onProgress = vi.fn();

      await convertTsxToPdfWithFonts(validTsx, validConfig, onProgress);

      const progressCallback = mockConverter.convert_tsx_to_pdf.mock.calls[0][3];

      // WASM reports 0% → should map to 15%
      progressCallback('parsing', 0);
      expect(onProgress).toHaveBeenCalledWith('parsing', 15);

      // WASM reports 100% → should map to 100%
      onProgress.mockClear();
      progressCallback('completed', 100);
      expect(onProgress).toHaveBeenCalledWith('completed', 100);
    });

    it('should report progress through all conversion stages', async () => {
      const onProgress = vi.fn();

      await convertTsxToPdfWithFonts(validTsx, validConfig, onProgress);

      // Verify progress stages are reported in order
      expect(onProgress).toHaveBeenCalledWith('detecting-fonts', 5);
      expect(onProgress).toHaveBeenCalledWith('fetching-fonts', 10);
      expect(onProgress).toHaveBeenCalledWith('parsing', 15);
      // WASM progress callback should also be registered
      const progressCallback = mockConverter.convert_tsx_to_pdf.mock.calls[0][3];
      expect(progressCallback).toBeDefined();
    });

    it('should validate PDF bytes from WASM', async () => {
      const mockPdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
      mockConverter.convert_tsx_to_pdf.mockReturnValue(mockPdfBytes);

      await convertTsxToPdfWithFonts(validTsx, validConfig);

      expect(mockValidatePdfBytes).toHaveBeenCalledWith(mockPdfBytes);
    });

    it('should handle font detection errors', async () => {
      mockDetectFonts.mockRejectedValue(new Error('Font detection failed'));
      mockParseWasmError.mockReturnValue({ message: 'Font detection failed' });

      await expect(convertTsxToPdfWithFonts(validTsx, validConfig)).rejects.toThrow(
        'Font detection failed'
      );
    });

    it('should handle font fetching errors', async () => {
      mockFetchFontsFromRequirements.mockRejectedValue(new Error('Font fetch failed'));
      mockParseWasmError.mockReturnValue({ message: 'Font fetch failed' });

      await expect(convertTsxToPdfWithFonts(validTsx, validConfig)).rejects.toThrow(
        'Font fetch failed'
      );
    });

    it('should handle WASM conversion errors', async () => {
      const mockConverterForError = {
        convert_tsx_to_pdf: vi.fn(() => {
          throw new Error('WASM conversion failed');
        }),
        free: vi.fn(),
      };
      mockCreateConverterInstance.mockReturnValueOnce(mockConverterForError);
      mockParseWasmError.mockReturnValue({ message: 'WASM conversion failed' });

      await expect(convertTsxToPdfWithFonts(validTsx, validConfig)).rejects.toThrow(
        'WASM conversion failed'
      );
    });

    it('should work with no progress callback', async () => {
      const result = await convertTsxToPdfWithFonts(validTsx, validConfig);

      expect(result).toBeInstanceOf(Uint8Array);
    });

    it('should handle multiple fonts', async () => {
      mockDetectFonts.mockResolvedValue([
        { family: 'Roboto', weight: 400 as FontWeight, style: 'normal', source: 'google' },
        { family: 'Inter', weight: 700 as FontWeight, style: 'italic', source: 'google' },
        { family: 'Lato', weight: 300 as FontWeight, style: 'normal', source: 'google' },
      ]);
      mockFetchFontsFromRequirements.mockResolvedValue([
        {
          family: 'Roboto',
          weight: 400 as FontWeight,
          style: 'normal',
          bytes: new Uint8Array([1, 2, 3]),
        },
        {
          family: 'Inter',
          weight: 700 as FontWeight,
          style: 'italic',
          bytes: new Uint8Array([4, 5, 6]),
        },
        {
          family: 'Lato',
          weight: 300 as FontWeight,
          style: 'normal',
          bytes: new Uint8Array([7, 8, 9]),
        },
      ]);

      await convertTsxToPdfWithFonts(validTsx, validConfig);

      const wasmBridge = await import('@pkg/wasm_bridge');
      const mockFontCollection = vi.mocked(wasmBridge.FontCollection);
      const collectionInstance = mockFontCollection.mock.results[0]?.value;

      expect(collectionInstance.add).toHaveBeenCalledTimes(3);
    });

    it('should handle italic font style correctly', async () => {
      mockDetectFonts.mockResolvedValue([
        { family: 'Roboto', weight: 400 as FontWeight, style: 'italic', source: 'google' },
      ]);
      mockFetchFontsFromRequirements.mockResolvedValue([
        {
          family: 'Roboto',
          weight: 400 as FontWeight,
          style: 'italic',
          bytes: new Uint8Array([1, 2, 3]),
        },
      ]);

      const wasmBridge = await import('@pkg/wasm_bridge');
      const mockFontData = vi.mocked(wasmBridge.FontData);

      await convertTsxToPdfWithFonts(validTsx, validConfig);

      expect(mockFontData).toHaveBeenCalledWith('Roboto', 400, true, expect.any(Uint8Array));
    });

    it('should handle normal font style correctly', async () => {
      mockDetectFonts.mockResolvedValue([
        { family: 'Roboto', weight: 400 as FontWeight, style: 'normal', source: 'google' },
      ]);
      mockFetchFontsFromRequirements.mockResolvedValue([
        {
          family: 'Roboto',
          weight: 400 as FontWeight,
          style: 'normal',
          bytes: new Uint8Array([1, 2, 3]),
        },
      ]);

      const wasmBridge = await import('@pkg/wasm_bridge');
      const mockFontData = vi.mocked(wasmBridge.FontData);

      await convertTsxToPdfWithFonts(validTsx, validConfig);

      expect(mockFontData).toHaveBeenCalledWith('Roboto', 400, false, expect.any(Uint8Array));
    });
  });

  describe('Error Handling', () => {
    it('should handle errors at detection step', async () => {
      mockDetectFonts.mockRejectedValue(new Error('Font detection failed'));
      mockParseWasmError.mockReturnValue({ message: 'Font detection failed' });

      await expect(convertTsxToPdfWithFonts(validTsx, validConfig)).rejects.toThrow(
        'Font detection failed'
      );

      // Should not proceed to fetching if detection fails
      expect(mockFetchFontsFromRequirements).not.toHaveBeenCalled();
    });

    it('should handle errors at fetching step', async () => {
      mockFetchFontsFromRequirements.mockRejectedValue(new Error('Font fetch failed'));
      mockParseWasmError.mockReturnValue({ message: 'Font fetch failed' });

      await expect(convertTsxToPdfWithFonts(validTsx, validConfig)).rejects.toThrow(
        'Font fetch failed'
      );

      // Should detect fonts but fail before conversion
      expect(mockDetectFonts).toHaveBeenCalled();
      expect(mockConverter.convert_tsx_to_pdf).not.toHaveBeenCalled();
    });

    it('should handle errors at conversion step', async () => {
      // Setup font detection and fetching to succeed
      mockDetectFonts.mockResolvedValue([
        { family: 'Roboto', weight: 400 as FontWeight, style: 'normal', source: 'google' },
      ]);
      mockFetchFontsFromRequirements.mockResolvedValue([
        {
          family: 'Roboto',
          weight: 400 as FontWeight,
          style: 'normal',
          bytes: new Uint8Array([1, 2, 3]),
        },
      ]);

      const wasmError = { code: 'LAYOUT_ERROR', message: 'Layout calculation failed' };
      const mockConverterForError = {
        convert_tsx_to_pdf: vi.fn(() => {
          throw wasmError;
        }),
        free: vi.fn(),
      };
      mockCreateConverterInstance.mockReturnValueOnce(mockConverterForError);
      mockParseWasmError.mockReturnValue({
        message: 'Layout calculation failed',
        code: 'LAYOUT_ERROR',
      });

      await expect(convertTsxToPdfWithFonts(validTsx, validConfig)).rejects.toThrow(
        'Layout calculation failed'
      );

      // Should complete all steps up to conversion
      expect(mockDetectFonts).toHaveBeenCalled();
      expect(mockFetchFontsFromRequirements).toHaveBeenCalled();
      expect(mockParseWasmError).toHaveBeenCalledWith(wasmError);
    });
  });

  describe('Dependency Injection', () => {
    beforeEach(() => {
      // Setup font mocks for DI tests
      mockDetectFonts.mockResolvedValue([
        { family: 'Roboto', weight: 400 as FontWeight, style: 'normal', source: 'google' },
      ]);
      mockFetchFontsFromRequirements.mockResolvedValue([
        {
          family: 'Roboto',
          weight: 400 as FontWeight,
          style: 'normal',
          bytes: new Uint8Array([1, 2, 3]),
        },
      ]);
    });

    it('should accept custom logger via dependencies', async () => {
      const mockLogger = {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        setLevel: vi.fn(),
        getLevel: vi.fn(),
      };

      await convertTsxToPdfWithFonts(validTsx, validConfig, undefined, undefined, {
        logger: mockLogger,
      });

      // Verify custom logger was used
      expect(mockLogger.debug).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('should use default dependencies when none provided', async () => {
      const result = await convertTsxToPdfWithFonts(validTsx, validConfig);

      // Should work with defaults
      expect(result).toBeInstanceOf(Uint8Array);
    });
  });
});
