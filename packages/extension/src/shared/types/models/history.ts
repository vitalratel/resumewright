/**
 * History-Related Type Definitions
 *
 * Contains types for conversion history tracking.
 * Extracted from models.ts for better modularity.
 */

import type { ConversionConfig } from './conversion';
import type { PDFMetadata } from './pdf';

/**
 * History Entry
 *
 * Persisted conversion history entry stored in IndexedDB.
 * Tracks past conversions for user reference and re-export.
 *
 * @example
 * ```ts
 * const entry: HistoryEntry = {
 *   id: 'hist-123',
 *   cvDocumentId: 'cv-123',
 *   timestamp: Date.now(),
 *   filename: 'John_Doe_Resume.pdf',
 *   success: true,
 *   config: defaultConfig,
 *   metadata: { ... },
 *   tsxPreview: '<div>John Doe...',
 *   tsxHash: 'abc123...'
 * };
 * ```
 */
export interface HistoryEntry {
  /** Unique history entry ID */
  id: string;

  /** Reference to CVDocument */
  cvDocumentId: string;

  /** Conversion timestamp */
  timestamp: number;

  /** Generated filename */
  filename: string;

  /** Whether conversion succeeded */
  success: boolean;

  /** Conversion configuration used */
  config: ConversionConfig;

  /** PDF metadata (null if conversion failed) */
  metadata: PDFMetadata | null;

  /** First 200 characters of TSX for preview */
  tsxPreview: string;

  /** SHA-256 hash of TSX for duplicate detection */
  tsxHash: string;

  /** Cached PDF bytes (optional, for quick re-export) */
  cachedPdf?: Uint8Array;
}
