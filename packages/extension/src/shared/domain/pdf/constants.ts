/**
 * PDF Service Constants
 *
 * Shared constants for PDF conversion, validation, and configuration.
 * Extracted for better maintainability and single source of truth.
 */

/**
 * File size limits for TSX validation
 */
export const FILE_SIZE_LIMITS = {
  /** Minimum valid file size (50 bytes) */
  MIN_VALID: 50,
  /** Large file warning threshold (500KB) - non-blocking */
  LARGE_WARNING: 500_000,
  /** Maximum TSX input size (1MB) - hard limit */
  MAX_INPUT: 1024 * 1024,
} as const;

/**
 * Conversion timeouts (milliseconds)
 */
export const CONVERSION_TIMEOUTS = {
  /** Default conversion timeout (30 seconds) */
  DEFAULT: 30_000,
  /** Font fetch timeout (10 seconds) */
  FONT_FETCH: 10_000,
  /** WASM initialization timeout (15 seconds) */
  WASM_INIT: 15_000,
} as const;

/**
 * Performance targets (milliseconds)
 */
export const PERFORMANCE_TARGETS = {
  /** Single-page conversion on high-end devices */
  SINGLE_PAGE_FAST: 5_000,
  /** Single-page conversion on low-end devices */
  SINGLE_PAGE_SLOW: 8_000,
  /** Multi-page conversion on high-end devices */
  MULTI_PAGE_FAST: 10_000,
  /** Multi-page conversion on low-end devices */
  MULTI_PAGE_SLOW: 15_000,
} as const;

/**
 * PDF output constraints
 */
export const PDF_CONSTRAINTS = {
  /** Maximum PDF file size (500KB) */
  MAX_SIZE_KB: 500,
  /** Expected single-page size range (KB) */
  SINGLE_PAGE_SIZE: { min: 40, max: 350 },
  /** Expected multi-page size range (KB) */
  MULTI_PAGE_SIZE: { min: 100, max: 500 },
} as const;

/**
 * Progress reporting stages
 *
 * These match the stages reported by WASM during conversion.
 */
export const CONVERSION_STAGES = [
  'detecting-fonts',
  'fetching-fonts',
  'parsing',
  'rendering',
  'layout',
  'generating-pdf',
] as const;

export type ConversionStage = typeof CONVERSION_STAGES[number];

/**
 * Progress percentage ranges for each stage
 *
 * Used to map WASM progress (0-100) to overall progress.
 */
export const STAGE_PROGRESS_RANGES = {
  'detecting-fonts': { start: 0, end: 5 },
  'fetching-fonts': { start: 5, end: 10 },
  'parsing': { start: 10, end: 15 },
  'rendering': { start: 15, end: 40 },
  'layout': { start: 40, end: 70 },
  'generating-pdf': { start: 70, end: 100 },
} as const satisfies Record<ConversionStage, { start: number; end: number }>;

/**
 * PDF standards supported
 */
export const PDF_STANDARDS = {
  /** PDF 1.7 (ISO 32000-1:2008) */
  PDF17: 'PDF17',
  /** PDF/A-1b (ISO 19005-1:2005) - ATS-optimized */
  PDFA1B: 'PDFA1b',
} as const;

export type PdfStandard = typeof PDF_STANDARDS[keyof typeof PDF_STANDARDS];

/**
 * Page sizes supported
 */
export const PAGE_SIZES = {
  /** Letter: 8.5" × 11" (US standard) */
  LETTER: 'Letter',
  /** A4: 210mm × 297mm (International standard) */
  A4: 'A4',
  /** Legal: 8.5" × 14" (US legal documents) */
  LEGAL: 'Legal',
} as const;

export type PageSize = typeof PAGE_SIZES[keyof typeof PAGE_SIZES];

/**
 * Default PDF configuration values
 */
export const DEFAULT_PDF_CONFIG = {
  pageSize: PAGE_SIZES.LETTER,
  margin: {
    top: 0.5, // inches
    right: 0.5,
    bottom: 0.5,
    left: 0.5,
  },
  standard: PDF_STANDARDS.PDFA1B,
  filename: 'Resume',
  creator: 'ResumeWright Browser Extension',
} as const;

/**
 * Font file size limits
 */
export const FONT_LIMITS = {
  /** Maximum font file size (2MB) */
  MAX_FILE_SIZE: 2 * 1024 * 1024,
  /** Maximum number of custom fonts */
  MAX_FONT_COUNT: 10,
  /** Maximum total storage for fonts (20MB) */
  MAX_TOTAL_SIZE: 20 * 1024 * 1024,
} as const;

/**
 * Web-safe fonts (fallback when Google/custom fonts fail)
 */
export const WEB_SAFE_FONTS = [
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Times',
  'Courier New',
  'Courier',
  'Georgia',
  'Verdana',
] as const;

export type WebSafeFont = typeof WEB_SAFE_FONTS[number];

/**
 * Error retry configuration
 */
export const RETRY_CONFIG = {
  /** Maximum retry attempts for transient errors */
  MAX_ATTEMPTS: 3,
  /** Initial retry delay (ms) */
  INITIAL_DELAY: 1000,
  /** Retry delay multiplier for exponential backoff */
  BACKOFF_MULTIPLIER: 2,
  /** Maximum retry delay (ms) */
  MAX_DELAY: 10_000,
} as const;
