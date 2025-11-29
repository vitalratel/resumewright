/**
 * Consolidated WASM Bridge Mock
 *
 * Provides mock implementations for WASM converter used across tests.
 * Handles PDF conversion, TSX validation, and font detection.
 *
 * Usage:
 * ```typescript
 * import { mockWasmConverter } from '@/__tests__/mocks/wasm';
 *
 * vi.mock('@/shared/infrastructure/wasm', () => ({
 *   getConverter: () => mockWasmConverter()
 * }));
 * ```
 */

import type { FontRequirement, FontWeight } from '@/shared/domain/fonts/models/Font';
import type { ConversionConfig } from '@/shared/types/models';
import { vi } from 'vitest';

/**
 * Configuration for WASM mock behavior
 */
export interface MockWasmConfig {
  /** Whether init should succeed (default: true) */
  initSuccess?: boolean;
  /** Whether conversion should succeed (default: true) */
  conversionSuccess?: boolean;
  /** Whether validation should succeed (default: true) */
  validationSuccess?: boolean;
  /** Fonts to return from detectFonts (default: Arial) */
  detectedFonts?: FontRequirement[];
  /** Delay in ms for async operations (default: 0) */
  delay?: number;
  /** Custom error message */
  errorMessage?: string;
}

/**
 * Create a mock PDF bytes (valid PDF header)
 */
function createMockPdfBytes(size: number = 1024): Uint8Array {
  const bytes = new Uint8Array(size);
  // PDF magic number: %PDF-1.4
  bytes[0] = 0x25; // %
  bytes[1] = 0x50; // P
  bytes[2] = 0x44; // D
  bytes[3] = 0x46; // F
  bytes[4] = 0x2D; // -
  bytes[5] = 0x31; // 1
  bytes[6] = 0x2E; // .
  bytes[7] = 0x34; // 4
  // Rest is zeros (valid for test purposes)
  return bytes;
}

/**
 * Default font requirements for tests
 */
const DEFAULT_FONT_REQUIREMENTS: FontRequirement[] = [
  {
    family: 'Arial',
    weight: 400 as FontWeight,
    style: 'normal',
    source: 'websafe',
  },
];

/**
 * Creates a mock WASM converter with configurable behavior
 *
 * @param config - Configuration for mock behavior
 * @returns Mock converter object matching WASM interface
 *
 * @example
 * ```typescript
 * // Success case
 * const converter = mockWasmConverter();
 *
 * // Failure case
 * const failingConverter = mockWasmConverter({
 *   conversionSuccess: false,
 *   errorMessage: 'Memory limit exceeded'
 * });
 *
 * // Custom fonts
 * const converter = mockWasmConverter({
 *   detectedFonts: [
 *     { family: 'Roboto', weight: 400, style: 'normal', source: 'google' }
 *   ]
 * });
 * ```
 */
export function mockWasmConverter(config: MockWasmConfig = {}) {
  const {
    initSuccess = true,
    conversionSuccess = true,
    validationSuccess = true,
    detectedFonts = DEFAULT_FONT_REQUIREMENTS,
    delay = 0,
    errorMessage = 'WASM operation failed',
  } = config;

  const mockInit = vi.fn(async () => {
    if (delay > 0)
      await new Promise(resolve => setTimeout(resolve, delay));
    if (!initSuccess) {
      throw new Error(errorMessage);
    }
  });

  const mockConvert = vi.fn(async (_tsx: string, _configJson: string) => {
    if (delay > 0)
      await new Promise(resolve => setTimeout(resolve, delay));
    if (!conversionSuccess) {
      throw new Error(errorMessage);
    }
    return createMockPdfBytes();
  });

  const mockValidate = vi.fn(async (_tsx: string) => {
    if (delay > 0)
      await new Promise(resolve => setTimeout(resolve, delay));
    if (!validationSuccess) {
      throw new Error(errorMessage);
    }
    return true;
  });

  /**
   * CRITICAL FIX: detect_fonts MUST return JSON string, not object
   * This fixes the "[object Object] is not valid JSON" error
   */
  const mockDetectFonts = vi.fn((_tsx: string) => {
    // WASM function returns JSON string, NOT object
    return JSON.stringify(detectedFonts);
  });

  return {
    init: mockInit,
    convert_tsx_to_pdf: mockConvert,
    validate_tsx: mockValidate,
    detect_fonts: mockDetectFonts, // Returns JSON string
  };
}

/**
 * Creates a mock for the getConverter function
 *
 * @example
 * ```typescript
 * vi.mock('@/shared/infrastructure/wasm', () => ({
 *   getConverter: mockGetConverter()
 * }));
 * ```
 */
export function mockGetConverter(config?: MockWasmConfig) {
  return vi.fn(() => mockWasmConverter(config));
}

/**
 * Creates a mock for initWASM function
 *
 * @example
 * ```typescript
 * vi.mock('@/shared/domain/pdf', () => ({
 *   initWASM: mockInitWASM()
 * }));
 * ```
 */
export function mockInitWASM(shouldSucceed = true) {
  return vi.fn(async () => {
    if (!shouldSucceed) {
      throw new Error('Failed to initialize WASM');
    }
  });
}

/**
 * Creates full PDF service mock (for integration tests)
 *
 * @example
 * ```typescript
 * vi.mock('@/shared/domain/pdf', () => mockPdfService());
 * ```
 */
export function mockPdfService(config: MockWasmConfig = {}) {
  const converter = mockWasmConverter(config);

  return {
    initWASM: mockInitWASM(config.initSuccess !== false),
    convertTsxToPdfWithFonts: vi.fn(async (tsx: string, pdfConfig: ConversionConfig) => {
      const configJson = JSON.stringify(pdfConfig);
      return converter.convert_tsx_to_pdf(tsx, configJson);
    }),
    detectFonts: vi.fn(async (tsx: string): Promise<FontRequirement[]> => {
      // This properly parses the JSON string returned by WASM
      const fontsJson = converter.detect_fonts(tsx);
      return JSON.parse(fontsJson) as FontRequirement[];
    }),
    validateTsx: vi.fn(async (tsx: string) => {
      return converter.validate_tsx(tsx);
    }),
    generateSimplePDF: vi.fn(async (_tsx: string) => {
      return createMockPdfBytes();
    }),
    isWASMInitialized: vi.fn(() => true),
    getConverter: vi.fn(() => converter),
  };
}

/**
 * Helper: Create Roboto font requirement
 */
export function createRobotoFontRequirement(
  weight: FontWeight = 400,
  style: 'normal' | 'italic' = 'normal',
): FontRequirement {
  return {
    family: 'Roboto',
    weight,
    style,
    source: 'google',
  };
}

/**
 * Helper: Create custom font requirement
 */
export function createCustomFontRequirement(
  family: string,
  weight: FontWeight = 400,
  style: 'normal' | 'italic' = 'normal',
  source: 'websafe' | 'google' | 'custom' = 'custom',
): FontRequirement {
  return { family, weight, style, source };
}
