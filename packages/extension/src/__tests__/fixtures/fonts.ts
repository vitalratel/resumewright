/**
 * Font Fixtures for Test Suite
 *
 * Provides fixtures for custom fonts, font binaries with correct magic numbers,
 * and font-related test data.
 *
 * Usage:
 * ```typescript
 * import { createMockFont, createMockFontBytes, FONT_MAGIC_NUMBERS } from '@/__tests__/fixtures/fonts';
 *
 * const font = createMockFont(); // Basic Roboto font
 * const ttfBytes = createMockFontBytes('TTF'); // Valid TTF binary
 * const customFont = createMockFont({ family: 'Custom', weight: 700 }); // Overrides
 * ```
 */

import type { CustomFont, FontWeight } from '@/shared/domain/fonts/models/Font';

/**
 * Font file magic numbers (file format signatures)
 * These are the first 4 bytes of valid font files
 */
export const FONT_MAGIC_NUMBERS = {
  /** TrueType font: 0x00 0x01 0x00 0x00 */
  TTF: new Uint8Array([0x00, 0x01, 0x00, 0x00]),

  /** TrueType Mac font: 0x74 0x72 0x75 0x65 ('true') */
  TTF_MAC: new Uint8Array([0x74, 0x72, 0x75, 0x65]),

  /** OpenType font: 0x4F 0x54 0x54 0x4F ('OTTO') */
  OTF: new Uint8Array([0x4F, 0x54, 0x54, 0x4F]),

  /** WOFF font: 0x77 0x4F 0x46 0x46 ('wOFF') */
  WOFF: new Uint8Array([0x77, 0x4F, 0x46, 0x46]),

  /** WOFF2 font: 0x77 0x4F 0x46 0x32 ('wOF2') */
  WOFF2: new Uint8Array([0x77, 0x4F, 0x46, 0x32]),
} as const;

/**
 * Create mock font bytes with correct magic number for format
 *
 * @param format - Font format (TTF, TTF_MAC, OTF, WOFF, WOFF2)
 * @param size - Total size of byte array (default: 104 bytes)
 * @returns Uint8Array with correct magic number and padding
 *
 * @example
 * const ttfBytes = createMockFontBytes('TTF');
 * const largeFont = createMockFontBytes('WOFF2', 500);
 */
export function createMockFontBytes(format: keyof typeof FONT_MAGIC_NUMBERS, size = 104): Uint8Array {
  const bytes = new Uint8Array(size);
  bytes.set(FONT_MAGIC_NUMBERS[format]);
  // Fill rest with zeros (padding)
  return bytes;
}

/**
 * Create invalid font bytes (for testing validation failures)
 *
 * @param size - Size of byte array (default: 104 bytes)
 * @returns Uint8Array with invalid magic number
 *
 * @example
 * const invalidBytes = createInvalidFontBytes();
 */
export function createInvalidFontBytes(size = 104): Uint8Array {
  const bytes = new Uint8Array(size);
  // Invalid magic number (not matching any font format)
  bytes.set([0xFF, 0xFF, 0xFF, 0xFF]);
  return bytes;
}

/**
 * Create a mock CustomFont object
 *
 * @param overrides - Partial CustomFont to override defaults
 * @returns CustomFont with Roboto defaults
 *
 * @example
 * const font = createMockFont();
 * const boldFont = createMockFont({ weight: 700 });
 * const italicFont = createMockFont({ style: 'italic' });
 */
export function createMockFont(overrides?: Partial<CustomFont>): CustomFont {
  return {
    id: 'font-1',
    family: 'Roboto',
    weight: 400 as FontWeight,
    style: 'normal',
    format: 'ttf',
    bytes: createMockFontBytes('TTF'),
    uploadedAt: Date.now(),
    fileSize: 150000,
    ...overrides,
  };
}

/**
 * Create a mock font with specific format and correct bytes
 *
 * @param format - Font format
 * @param overrides - Additional overrides
 * @returns CustomFont with correct format and magic number
 *
 * @example
 * const woff2Font = createMockFontWithFormat('woff2');
 */
export function createMockFontWithFormat(format: 'ttf' | 'woff' | 'woff2', overrides?: Partial<CustomFont>): CustomFont {
  const formatMap: Record<string, keyof typeof FONT_MAGIC_NUMBERS> = {
    ttf: 'TTF',
    woff: 'WOFF',
    woff2: 'WOFF2',
  };

  return createMockFont({
    format,
    bytes: createMockFontBytes(formatMap[format]),
    ...overrides,
  });
}

/**
 * Pre-built mock fonts for common test scenarios
 */
export const MOCK_FONTS = {
  /** Roboto Regular (400) */
  roboto: createMockFont({
    id: 'font-roboto-400',
    family: 'Roboto',
    weight: 400,
    style: 'normal',
    format: 'ttf',
  }),

  /** Roboto Bold (700) */
  robotoBold: createMockFont({
    id: 'font-roboto-700',
    family: 'Roboto',
    weight: 700,
    style: 'normal',
    format: 'ttf',
  }),

  /** Roboto Italic */
  robotoItalic: createMockFont({
    id: 'font-roboto-italic',
    family: 'Roboto',
    weight: 400,
    style: 'italic',
    format: 'ttf',
  }),

  /** Open Sans Regular */
  openSans: createMockFont({
    id: 'font-opensans-400',
    family: 'Open Sans',
    weight: 400,
    style: 'normal',
    format: 'woff2',
    bytes: createMockFontBytes('WOFF2'),
  }),

  /** Open Sans Bold */
  openSansBold: createMockFont({
    id: 'font-opensans-700',
    family: 'Open Sans',
    weight: 700,
    style: 'normal',
    format: 'woff2',
    bytes: createMockFontBytes('WOFF2'),
  }),

  /** Lato Regular (WOFF format) */
  lato: createMockFont({
    id: 'font-lato-400',
    family: 'Lato',
    weight: 400,
    style: 'normal',
    format: 'woff',
    bytes: createMockFontBytes('WOFF'),
  }),
};

/**
 * Create an array of mock fonts (for list testing)
 *
 * @param count - Number of fonts to create
 * @returns Array of CustomFont objects
 *
 * @example
 * const fonts = createMockFontList(3);
 */
export function createMockFontList(count: number): CustomFont[] {
  const fonts: CustomFont[] = [];
  const families = ['Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Inter'];
  const weights = [400, 700];
  const styles: Array<'normal' | 'italic'> = ['normal', 'italic'];

  for (let i = 0; i < count; i++) {
    const family = families[i % families.length];
    const weight = weights[i % weights.length];
    const style = styles[i % styles.length];

    fonts.push(
      createMockFont({
        id: `font-${i + 1}`,
        family: `${family} ${i > families.length ? i : ''}`.trim(),
        weight: weight as FontWeight,
        style,
      }),
    );
  }

  return fonts;
}

/**
 * Create a mock font File object (for upload testing)
 *
 * @param filename - File name
 * @param format - Font format
 * @param overrides - Additional CustomFont overrides
 * @returns File object with font data
 *
 * @example
 * const file = createMockFontFile('roboto.ttf', 'ttf');
 */
export function createMockFontFile(filename: string, format: 'ttf' | 'woff' | 'woff2' = 'ttf', overrides?: Partial<CustomFont>): File {
  const formatMap: Record<string, keyof typeof FONT_MAGIC_NUMBERS> = {
    ttf: 'TTF',
    woff: 'WOFF',
    woff2: 'WOFF2',
  };

  const mimeTypes = {
    ttf: 'font/ttf',
    woff: 'font/woff',
    woff2: 'font/woff2',
  };

  const bytes = overrides?.bytes || createMockFontBytes(formatMap[format]);

  return new File([bytes] as BlobPart[], filename, { type: mimeTypes[format] });
}

/**
 * Create an invalid font File object (for validation testing)
 *
 * @param filename - File name
 * @returns File object with invalid font data
 *
 * @example
 * const invalidFile = createInvalidFontFile('bad.ttf');
 */
export function createInvalidFontFile(filename: string): File {
  const bytes = createInvalidFontBytes();
  return new File([bytes] as BlobPart[], filename, { type: 'font/ttf' });
}

/**
 * Create a font File with specific size (for size limit testing)
 *
 * @param filename - File name
 * @param sizeInBytes - File size in bytes
 * @param format - Font format
 * @returns File object with specified size
 *
 * @example
 * const largeFile = createFontFileWithSize('large.ttf', 5000000); // 5MB
 */
export function createFontFileWithSize(filename: string, sizeInBytes: number, format: 'ttf' | 'woff' | 'woff2' = 'ttf'): File {
  const formatMap: Record<string, keyof typeof FONT_MAGIC_NUMBERS> = {
    ttf: 'TTF',
    woff: 'WOFF',
    woff2: 'WOFF2',
  };

  const bytes = createMockFontBytes(formatMap[format], sizeInBytes);

  const mimeTypes = {
    ttf: 'font/ttf',
    woff: 'font/woff',
    woff2: 'font/woff2',
  };

  return new File([bytes] as BlobPart[], filename, { type: mimeTypes[format] });
}

/**
 * Mock font stats (for font manager testing)
 *
 * @example
 * mockGetCustomFontStats.mockResolvedValue(mockFontStats);
 */
export const mockFontStats = {
  count: 0,
  totalSize: 0,
};

/**
 * Create mock font stats with values
 *
 * @param count - Number of fonts
 * @param totalSize - Total size in bytes
 * @returns Font stats object
 *
 * @example
 * const stats = createMockFontStats(2, 350000);
 */
export function createMockFontStats(count: number, totalSize: number) {
  return {
    count,
    totalSize,
  };
}

/**
 * Empty font list (for testing empty states)
 */
export const EMPTY_FONT_LIST: CustomFont[] = [];

/**
 * Font upload size limits (from validation rules)
 */
export const FONT_SIZE_LIMITS = {
  /** Maximum font file size: 2MB */
  MAX_FONT_SIZE: 2 * 1024 * 1024,

  /** Maximum total storage: 10MB */
  MAX_TOTAL_SIZE: 10 * 1024 * 1024,

  /** Maximum number of custom fonts */
  MAX_FONT_COUNT: 20,
};
