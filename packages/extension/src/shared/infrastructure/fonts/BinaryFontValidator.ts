/**
 * Font Validation and Decompression Service
 * Font file validation and WOFF/WOFF2 decompression
 *
 * Validates font files and converts WOFF/WOFF2 to TrueType format.
 */

import type { CustomFontFormat, FontValidationResult, FontWeight } from '@/shared/domain/fonts/models/Font';
import { CUSTOM_FONT_LIMITS, CustomFontError, CustomFontErrorType } from '@/shared/domain/fonts/models/Font';
import { getLogger } from '@/shared/infrastructure/logging';

/**
 * Font format magic bytes
 */
const MAGIC_BYTES = {
  TTF: [0x00, 0x01, 0x00, 0x00], // TrueType 1.0
  TTF_MAC: [0x74, 0x72, 0x75, 0x65], // 'true' (macOS TrueType)
  OTF: [0x4F, 0x54, 0x54, 0x4F], // 'OTTO' (OpenType with CFF)
  WOFF: [0x77, 0x4F, 0x46, 0x46], // 'wOFF'
  WOFF2: [0x77, 0x4F, 0x46, 0x32], // 'wOF2'
} as const;

/**
 * Detects font format from magic bytes
 */
function detectFontFormat(bytes: Uint8Array): CustomFontFormat | null {
  if (bytes.length < 4)
    return null;

  const header = Array.from(bytes.slice(0, 4));

  // Check for WOFF2
  if (header.every((b, i) => b === MAGIC_BYTES.WOFF2[i])) {
    return 'woff2';
  }

  // Check for WOFF
  if (header.every((b, i) => b === MAGIC_BYTES.WOFF[i])) {
    return 'woff';
  }

  // Check for TTF/OTF
  if (
    header.every((b, i) => b === MAGIC_BYTES.TTF[i])
    || header.every((b, i) => b === MAGIC_BYTES.TTF_MAC[i])
    || header.every((b, i) => b === MAGIC_BYTES.OTF[i])
  ) {
    return 'ttf';
  }

  return null;
}

/**
 * Extracts font metadata from TrueType bytes
 *
 * This is a simplified version - for full metadata extraction,
 * we would need to parse the 'name' table.
 *
 * For MVP: We'll ask the user to provide metadata during upload.
 */
/**
 * Extract font metadata from TTF/OTF name table
 *
 * Parses the OpenType 'name' table to extract font family, weight, and style.
 * Supports both platform ID 1 (Mac) and 3 (Windows) with proper encoding.
 *
 * Name IDs:
 * - 1: Font Family name
 * - 2: Font Subfamily name (Regular, Bold, Italic, etc.)
 * - 4: Full font name
 * - 6: PostScript name
 *
 * Platform IDs:
 * - 1: Macintosh (encoding: MacRoman)
 * - 3: Windows (encoding: UTF-16 BE)
 *
 * @see https://learn.microsoft.com/en-us/typography/opentype/spec/name
 */
function extractFontMetadata(bytes: Uint8Array): {
  family: string;
  weight: number;
  style: 'normal' | 'italic';
} {
  try {
    // Find the 'name' table in the font file
    const nameTableOffset = findNameTable(bytes);
    if (nameTableOffset === null) {
      return fallbackMetadata();
    }

    // Parse name records from the name table
    const nameRecords = parseNameTable(bytes, nameTableOffset);

    // Extract font family (name ID 1 or 4)
    const family = nameRecords.get(1) ?? nameRecords.get(4) ?? 'Unknown Font';

    // Extract subfamily (name ID 2) to determine weight and style
    const subfamily = nameRecords.get(2) ?? 'Regular';

    // Parse weight and style from subfamily string
    const { weight, style } = parseSubfamily(subfamily);

    return { family, weight, style };
  }
  catch (error) {
    // Graceful fallback if name table parsing fails
    getLogger().warn('FontValidator', 'Failed to extract font metadata from name table', error);
    return fallbackMetadata();
  }
}

/**
 * Find the offset of the 'name' table in the font file
 */
function findNameTable(bytes: Uint8Array): number | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  // Skip version (4 bytes) and read numTables (2 bytes)
  const numTables = view.getUint16(4);

  // Table directory starts at offset 12
  // Each entry is 16 bytes: tag(4) + checksum(4) + offset(4) + length(4)
  for (let i = 0; i < numTables; i++) {
    const entryOffset = 12 + (i * 16);

    // Read table tag (4 ASCII characters)
    const tag = String.fromCharCode(
      bytes[entryOffset],
      bytes[entryOffset + 1],
      bytes[entryOffset + 2],
      bytes[entryOffset + 3],
    );

    if (tag === 'name') {
      // Return the offset to the name table
      return view.getUint32(entryOffset + 8);
    }
  }

  return null;
}

/**
 * Parse the name table and extract name records
 *
 * Returns a Map of name ID to string value, prioritizing Windows platform
 */
function parseNameTable(bytes: Uint8Array, tableOffset: number): Map<number, string> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const records = new Map<number, string>();

  // Read name table header
  const format = view.getUint16(tableOffset);
  const count = view.getUint16(tableOffset + 2);
  const stringOffset = view.getUint16(tableOffset + 4);

  // Only support format 0 (format 1 has additional language tag records)
  if (format > 1) {
    return records;
  }

  // Parse name records (12 bytes each)
  const nameRecordOffset = tableOffset + 6;

  for (let i = 0; i < count; i++) {
    const recordOffset = nameRecordOffset + (i * 12);

    const platformID = view.getUint16(recordOffset);
    const encodingID = view.getUint16(recordOffset + 2);
    const languageID = view.getUint16(recordOffset + 4);
    const nameID = view.getUint16(recordOffset + 6);
    const length = view.getUint16(recordOffset + 8);
    const offset = view.getUint16(recordOffset + 10);

    // Only parse relevant name IDs: 1 (family), 2 (subfamily), 4 (full name)
    if (![1, 2, 4].includes(nameID)) {
      continue;
    }

    // Prioritize Windows platform (3) over Mac (1)
    // Skip if we already have this name ID from Windows platform
    if (records.has(nameID) && platformID === 1) {
      continue;
    }

    // Only parse English language records
    // Mac: languageID 0 = English
    // Windows: languageID 0x0409 = English (US)
    const isEnglish = (platformID === 1 && languageID === 0)
      || (platformID === 3 && languageID === 0x0409);
    if (!isEnglish) {
      continue;
    }

    // Extract the string
    const stringStart = tableOffset + stringOffset + offset;
    const stringBytes = bytes.slice(stringStart, stringStart + length);

    let nameValue: string;

    if (platformID === 3 && encodingID === 1) {
      // Windows Unicode (UTF-16 BE)
      nameValue = decodeUTF16BE(stringBytes);
    }
    else if (platformID === 1 && encodingID === 0) {
      // Mac Roman encoding (ASCII-compatible for English)
      nameValue = decodeMacRoman(stringBytes);
    }
    else {
      // Unsupported encoding, skip
      continue;
    }

    records.set(nameID, nameValue);
  }

  return records;
}

/**
 * Decode UTF-16 BE (Big Endian) string
 */
function decodeUTF16BE(bytes: Uint8Array): string {
  const chars: number[] = [];
  for (let i = 0; i < bytes.length; i += 2) {
    const charCode = (bytes[i] << 8) | bytes[i + 1];
    chars.push(charCode);
  }
  return String.fromCharCode(...chars);
}

/**
 * Decode Mac Roman string (ASCII-compatible for English text)
 */
function decodeMacRoman(bytes: Uint8Array): string {
  // For English text, Mac Roman is identical to ASCII
  // For extended characters (128-255), we'd need a full Mac Roman table
  // Since we only parse English names, ASCII decoding is sufficient
  return String.fromCharCode(...Array.from(bytes));
}

/**
 * Parse weight and style from subfamily string
 *
 * Common subfamily values:
 * - Regular, Normal, Book → 400, normal
 * - Italic, Oblique → 400, italic
 * - Bold → 700, normal
 * - Bold Italic → 700, italic
 * - Light → 300, normal
 * - Thin → 100, normal
 * - Medium → 500, normal
 * - SemiBold → 600, normal
 * - ExtraBold → 800, normal
 * - Black, Heavy → 900, normal
 */
function parseSubfamily(subfamily: string): { weight: number; style: 'normal' | 'italic' } {
  const lower = subfamily.toLowerCase();

  // Determine style
  const style: 'normal' | 'italic'
    = lower.includes('italic') || lower.includes('oblique') ? 'italic' : 'normal';

  // Determine weight
  let weight = 400; // Default to regular

  if (lower.includes('thin'))
    weight = 100;
  else if (lower.includes('extralight') || lower.includes('ultra light'))
    weight = 200;
  else if (lower.includes('light'))
    weight = 300;
  else if (lower.includes('medium'))
    weight = 500;
  else if (lower.includes('semibold') || lower.includes('demibold'))
    weight = 600;
  else if (lower.includes('extrabold') || lower.includes('ultra bold'))
    weight = 800;
  else if (lower.includes('black') || lower.includes('heavy'))
    weight = 900;
  else if (lower.includes('bold'))
    weight = 700;
  // Regular, Normal, Book stay at 400

  return { weight, style };
}

/**
 * Fallback metadata when name table parsing fails
 */
function fallbackMetadata(): { family: string; weight: number; style: 'normal' | 'italic' } {
  return {
    family: 'Unknown Font',
    weight: 400,
    style: 'normal',
  };
}

/**
 * Log font telemetry (anonymized, dev mode only)
 *
 * Helps track font format usage, decompression performance, and errors.
 * No font names or content are logged - only format and timing data.
 */
function logFontTelemetry(data: {
  format: CustomFontFormat;
  originalSize?: number;
  decompressedSize?: number;
  decompressionTimeMs?: number;
  success: boolean;
  error?: string;
}): void {
  // Only log in development mode
  if (!import.meta.env.DEV) {
    return;
  }

  const timestamp = new Date().toISOString();
  const logPrefix = '[FontTelemetry]';

  if (data.success) {
    const compressionRatio = (data.originalSize !== null && data.originalSize !== undefined && data.originalSize !== 0) && (data.decompressedSize !== null && data.decompressedSize !== undefined && data.decompressedSize !== 0)
      ? ((1 - data.originalSize / data.decompressedSize) * 100).toFixed(1)
      : 'N/A';

    getLogger().debug(
      'FontValidator',
      `${logPrefix} ${timestamp}`,
      {
        format: data.format.toUpperCase(),
        originalKB: (data.originalSize! / 1024).toFixed(1),
        decompressedKB: (data.decompressedSize! / 1024).toFixed(1),
        compressionRatio,
        timeMs: data.decompressionTimeMs,
      },
    );
  }
  else {
    getLogger().error(
      'FontValidator',
      `${logPrefix} ${timestamp}`,
      {
        format: data.format.toUpperCase(),
        error: data.error,
      },
    );
  }
}

/**
 *
 * WOFF structure:
 * - Header (44 bytes)
 * - Table directory
 * - Compressed tables (zlib)
 *
 * @see https://www.w3.org/TR/WOFF/
 */
async function decompressWOFF(woffBytes: Uint8Array): Promise<Uint8Array> {
  // Import WASM module (using dynamic import for lazy loading)
  const wasmModule = await import('@pkg/wasm_bridge');

  const startTime = performance.now();

  try {
    const ttfBytes = wasmModule.decompress_woff_font(woffBytes);
    const decompressionTimeMs = performance.now() - startTime;

    // Log timing telemetry
    logFontTelemetry({
      format: 'woff',
      originalSize: woffBytes.length,
      decompressedSize: ttfBytes.length,
      decompressionTimeMs,
      success: true,
    });

    return ttfBytes;
  }
  catch (error) {
    // Parse error code from WASM
    const errorMsg = String(error);

    if (errorMsg.includes('INVALID_WOFF_MAGIC')) {
      throw new CustomFontError(
        CustomFontErrorType.INVALID_FORMAT,
        'Invalid WOFF file: bad magic bytes',
      );
    }
    else if (errorMsg.includes('WOFF_DECOMPRESS_FAILED')) {
      throw new CustomFontError(
        CustomFontErrorType.DECOMPRESSION_FAILED,
        'WOFF decompression failed: file may be corrupted',
      );
    }
    else if (errorMsg.includes('FONT_TOO_LARGE_DECOMPRESSED')) {
      throw new CustomFontError(
        CustomFontErrorType.FILE_TOO_LARGE,
        'Font exceeds 2MB after decompression',
      );
    }
    else {
      throw new CustomFontError(
        CustomFontErrorType.DECOMPRESSION_FAILED,
        `WOFF decompression failed: ${errorMsg}`,
      );
    }
  }
}

/**
 * Decompresses WOFF2 font to TrueType using WASM
 *
 * WOFF2 uses Brotli compression and has a more complex structure.
 *
 * @see https://www.w3.org/TR/WOFF2/
 */
async function decompressWOFF2(woff2Bytes: Uint8Array): Promise<Uint8Array> {
  // Import WASM module (using dynamic import for lazy loading)
  const wasmModule = await import('@pkg/wasm_bridge');

  const startTime = performance.now();

  try {
    const ttfBytes = wasmModule.decompress_woff2_font(woff2Bytes);
    const decompressionTimeMs = performance.now() - startTime;

    // Log timing telemetry
    logFontTelemetry({
      format: 'woff2',
      originalSize: woff2Bytes.length,
      decompressedSize: ttfBytes.length,
      decompressionTimeMs,
      success: true,
    });

    return ttfBytes;
  }
  catch (error) {
    // Parse error code from WASM
    const errorMsg = String(error);

    if (errorMsg.includes('INVALID_WOFF2_MAGIC')) {
      throw new CustomFontError(
        CustomFontErrorType.INVALID_FORMAT,
        'Invalid WOFF2 file: bad magic bytes',
      );
    }
    else if (errorMsg.includes('WOFF2_DECOMPRESS_FAILED')) {
      throw new CustomFontError(
        CustomFontErrorType.DECOMPRESSION_FAILED,
        'WOFF2 decompression failed: file may be corrupted',
      );
    }
    else if (errorMsg.includes('FONT_TOO_LARGE_DECOMPRESSED')) {
      throw new CustomFontError(
        CustomFontErrorType.FILE_TOO_LARGE,
        'Font exceeds 2MB after decompression',
      );
    }
    else if (errorMsg.includes('UNSUPPORTED_FEATURE')) {
      throw new CustomFontError(
        CustomFontErrorType.INVALID_FORMAT,
        'WOFF2 font uses unsupported features (variable fonts not supported)',
      );
    }
    else {
      throw new CustomFontError(
        CustomFontErrorType.DECOMPRESSION_FAILED,
        `WOFF2 decompression failed: ${errorMsg}`,
      );
    }
  }
}

/**
 * Validates a font file and converts to TrueType if needed
 *
 * @param file - Font file from user upload
 * @param providedMetadata - User-provided metadata
 * @param providedMetadata.family - Font family name (optional)
 * @param providedMetadata.weight - Font weight (optional)
 * @param providedMetadata.style - Font style (optional)
 * @returns Validation result with TrueType bytes and metadata
 */
export async function validateAndProcessFont(
  file: File,
  providedMetadata?: {
    family?: string;
    weight?: number;
    style?: 'normal' | 'italic';
  },
): Promise<FontValidationResult> {
  // Check file size
  if (file.size > CUSTOM_FONT_LIMITS.MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    const limitMB = (CUSTOM_FONT_LIMITS.MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);

    return {
      valid: false,
      error: `File size ${sizeMB}MB exceeds ${limitMB}MB limit`,
    };
  }

  // Read file bytes
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  // Check for files too small to have magic numbers
  if (bytes.length < 4) {
    return {
      valid: false,
      error: 'Font file too small to be valid (must be at least 4 bytes)',
    };
  }

  // Detect format
  const format = detectFontFormat(bytes);

  if (!format) {
    return {
      valid: false,
      error: 'Invalid font file format. Supported formats: .ttf, .woff, .woff2',
    };
  }

  // Convert to TrueType if needed
  let ttfBytes: Uint8Array;

  try {
    if (format === 'woff') {
      ttfBytes = await decompressWOFF(bytes);
    }
    else if (format === 'woff2') {
      ttfBytes = await decompressWOFF2(bytes);
    }
    else {
      ttfBytes = bytes; // Already TrueType
    }
  }
  catch (error) {
    if (error instanceof CustomFontError) {
      return {
        valid: false,
        error: error.message,
      };
    }

    return {
      valid: false,
      error: `Decompression failed: ${String(error)}`,
    };
  }

  // Extract or use provided metadata
  const extractedMetadata = extractFontMetadata(ttfBytes);

  const metadata = {
    family: providedMetadata?.family ?? extractedMetadata.family,
    weight: (providedMetadata?.weight ?? extractedMetadata.weight) as FontWeight,
    style: providedMetadata?.style || extractedMetadata.style,
    format,
    fileSize: ttfBytes.length,
  };

  // Validate TrueType structure (basic check)
  if (ttfBytes.length < 12) {
    return {
      valid: false,
      error: 'Font file too small to be valid',
    };
  }

  // Check TTF magic number
  const magic = (ttfBytes[0] << 24) | (ttfBytes[1] << 16) | (ttfBytes[2] << 8) | ttfBytes[3];
  const validMagic
    = magic === 0x00010000 // TrueType 1.0
      || magic === 0x74727565 // 'true' (macOS)
      || magic === 0x4F54544F; // 'OTTO' (OpenType with CFF)

  if (!validMagic) {
    return {
      valid: false,
      error: 'Invalid TrueType font structure',
    };
  }

  // Log telemetry for successful validation (anonymized, dev mode only)
  logFontTelemetry({
    format,
    originalSize: file.size,
    decompressedSize: ttfBytes.length,
    success: true,
  });

  return {
    valid: true,
    metadata,
  };
}

/**
 * Quick validation of font file before upload
 * Checks format and size without full processing
 */
export function quickValidateFont(file: File): {
  valid: boolean;
  error?: string;
} {
  // Check file extension
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (ext === null || ext === undefined || ext === '' || !['ttf', 'woff', 'woff2', 'otf'].includes(ext)) {
    return {
      valid: false,
      error: 'Invalid file extension. Supported: .ttf, .woff, .woff2',
    };
  }

  // Check file size
  if (file.size > CUSTOM_FONT_LIMITS.MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    const limitMB = (CUSTOM_FONT_LIMITS.MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);

    return {
      valid: false,
      error: `File size ${sizeMB}MB exceeds ${limitMB}MB limit`,
    };
  }

  return { valid: true };
}
