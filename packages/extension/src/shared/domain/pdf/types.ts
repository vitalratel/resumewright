/**
 * WASM Type Definitions
 *
 * Explicit TypeScript interfaces for WASM bridge module.
 * These types eliminate implicit `any` and provide compile-time safety.
 */

/**
 * WASM-compatible PDF configuration
 * Matches Rust PdfConfig struct in wasm-bridge/src/lib.rs
 */
export interface WasmPdfConfig {
  /** Page size: Letter (8.5" x 11"), A4 (210mm x 297mm), or Legal (8.5" x 14") */
  page_size: 'Letter' | 'A4' | 'Legal';

  /** Page margins in points (72 points = 1 inch) */
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };

  /** PDF standard: PDF 1.7 or PDF/A-1b (ATS-optimized) */
  standard: 'PDF17' | 'PDFA1b';

  /** Document title (PDF metadata) */
  title: string;

  /** Document author (optional) */
  author: string | null;

  /** Document subject (PDF metadata) */
  subject: string;

  /** Document keywords (optional, comma-separated) */
  keywords: string | null;

  /** PDF creator tool name */
  creator: string;
}

/**
 * TsxToPdfConverter WASM class
 * Main conversion interface for TSX → PDF
 */
export interface TsxToPdfConverter {
  /**
   * Detect font requirements from TSX source
   *
   * Parses TSX and extracts font-family declarations.
   * Returns JSON string containing FontRequirement array.
   *
   * @param tsx - TSX source code
   * @returns JSON string of FontRequirement[] (must be parsed)
   * @throws Error if TSX parsing fails
   *
   * @example
   * ```typescript
   * const fontsJson = converter.detect_fonts(tsxCode);
   * const fonts = JSON.parse(fontsJson) as FontRequirement[];
   * ```
   */
  detect_fonts: (tsx: string) => string;

  /**
   * Convert TSX to PDF with optional font embedding
   *
   * Full conversion pipeline:
   * 1. Parse TSX → React component tree
   * 2. Render → Layout tree
   * 3. Calculate layout (box model, text wrapping)
   * 4. Generate PDF with embedded fonts
   *
   * @param tsx - TSX source code
   * @param config - PDF configuration (WasmPdfConfig)
   * @param fonts - FontCollection or null (no custom fonts)
   * @param progressCallback - Optional progress callback (stage, percentage 0-100)
   * @returns Array-like of PDF bytes (use `new Uint8Array(bytes)`)
   * @throws Error if conversion fails
   *
   * @example
   * ```typescript
   * const pdfBytes = converter.convert_tsx_to_pdf(
   *   tsx,
   *   config,
   *   fontCollection,
   *   (stage, pct) => console.log(`${stage}: ${pct}%`)
   * );
   * const pdf = new Uint8Array(pdfBytes);
   * ```
   */
  convert_tsx_to_pdf: (
    tsx: string,
    config: WasmPdfConfig,
    fonts: unknown,
    progressCallback?: (stage: string, percentage: number) => void,
  ) => ArrayLike<number>;

  /**
   * Free WASM memory
   * MUST be called after conversion to prevent memory leaks
   */
  free: () => void;
}

/**
 * FontCollection WASM class
 * Container for custom font data passed to converter
 */
export interface FontCollection {
  /**
   * Add font to collection
   *
   * @param font - Font data (actual WASM type)
   * @throws Error if font data is invalid
   */
  add: (font: unknown) => void;

  /**
   * Free WASM memory
   * MUST be called after conversion
   */
  free: () => void;
}

/**
 * WasmFontData WASM class
 * Represents a single font file for embedding
 *
 * Note: This is a loose interface for documentation.
 * The actual WASM type is used at runtime.
 */
export interface WasmFontData {
  /**
   * Font family name (e.g., "Roboto", "Open Sans")
   */
  readonly family: string;

  /**
   * Font weight (100-900)
   */
  readonly weight: number;

  /**
   * Whether font is italic
   */
  readonly isItalic: boolean;

  /**
   * Raw font file bytes
   */
  readonly bytes: Uint8Array;

  /**
   * Free WASM memory
   */
  free: () => void;
}

/**
 * WASM module initialization function
 *
 * @param input - Optional WASM binary source (file path, URL, or bytes)
 * @returns Promise that resolves when WASM is initialized
 * @throws Error if initialization fails
 *
 * @example
 * ```typescript
 * // Browser environment
 * await init();
 *
 * // Node.js environment
 * const wasmBytes = fs.readFileSync('wasm_bridge_bg.wasm');
 * await init(wasmBytes);
 * ```
 */
export type WasmInitFunction = (input?: string | URL | Request | BufferSource) => Promise<void>;

