/**
 * PDF-Related Type Definitions
 *
 * Contains types for PDF metadata.
 * Extracted from models.ts for better modularity.
 */

/**
 * PDF Metadata
 *
 * Metadata embedded in generated PDF files.
 * Follows PDF/A and PDF/X standards for document properties.
 */
export interface PDFMetadata {
  /** Document title */
  title: string;

  /** Document author (optional) */
  author?: string;

  /** Document subject/description (optional) */
  subject?: string;

  /** Keywords for document indexing (optional) */
  keywords?: string[];

  /** PDF creator application (e.g., "ResumeWright v1.0") */
  creator: string;

  /** PDF producer library (e.g., "printpdf 0.7") */
  producer: string;

  /** Document creation date */
  creationDate: Date;

  /** Last modification date (optional) */
  modificationDate?: Date;

  /** Number of pages in PDF */
  pageCount: number;

  /** File size in bytes */
  fileSize: number;
}
