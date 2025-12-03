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
 * PDF standards supported
 */
export const PDF_STANDARDS = {
  /** PDF 1.7 (ISO 32000-1:2008) */
  PDF17: 'PDF17',
  /** PDF/A-1b (ISO 19005-1:2005) - ATS-optimized */
  PDFA1B: 'PDFA1b',
} as const;

/**
 * Page sizes supported
 */
const PAGE_SIZES = {
  /** Letter: 8.5" × 11" (US standard) */
  LETTER: 'Letter',
  /** A4: 210mm × 297mm (International standard) */
  A4: 'A4',
  /** Legal: 8.5" × 14" (US legal documents) */
  LEGAL: 'Legal',
} as const;

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
