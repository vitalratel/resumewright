/**
 * CV-Related Type Definitions
 *
 * Contains types for CV documents, metadata, and sections.
 * Extracted from models.ts for better modularity.
 */

/**
 * CV Metadata extracted from TSX
 *
 * Contains structured information about the resume including personal details,
 * layout characteristics, and ATS optimization hints.
 */
export interface CVMetadata {
  /** Personal information (if extractable from TSX) */
  name?: string;
  title?: string;
  email?: string;
  phone?: string;
  location?: string;
  website?: string;

  /** Document layout characteristics */
  layoutType: 'single-column' | 'two-column' | 'academic' | 'portfolio' | 'custom';

  /** Document size estimates */
  estimatedPages: number;
  componentCount: number;

  /** ATS optimization hints */
  hasContactInfo: boolean;
  hasClearSections: boolean;
  fontComplexity: 'simple' | 'moderate' | 'complex';
}

/**
 * CV Document
 *
 * Represents a parsed CV/resume with metadata extracted from TSX.
 * This is the primary data structure passed between components.
 *
 * @example
 * ```ts
 * const cv: CVDocument = {
 *   id: 'cv-123',
 *   sourceType: 'claude',
 *   tsx: '<div>...</div>',
 *   metadata: { ... },
 *   parseTimestamp: Date.now()
 * };
 * ```
 */
export interface CVDocument {
  /** Unique identifier for this CV */
  id: string;

  /** Origin of the CV (claude.ai or manual paste) */
  sourceType: 'claude' | 'manual';

  /** Raw TSX source code */
  tsx: string;

  /** Extracted CV metadata */
  metadata: CVMetadata;

  /** Unix timestamp when CV was parsed */
  parseTimestamp: number;
}
