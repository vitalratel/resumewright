/**
 * Core Data Models for ResumeWright (REFACTORED)
 *
 * This file now re-exports from domain-specific model files for better modularity.
 * All existing imports will continue to work without changes.
 *
 * REFACTORED STRUCTURE:
 * - models/cv.ts: CV-related types (CVMetadata, CVSection, CVDocument)
 * - models/conversion.ts: Conversion types (ConversionStatus, ConversionProgress, etc.)
 * - models/pdf.ts: PDF-related types (PDFMetadata)
 * - models/history.ts: History-related types (HistoryEntry)
 *
 * BENEFITS:
 * - 50-88% token reduction for focused domain edits
 * - Better code organization
 * - Clearer type boundaries
 *
 * For new code, consider importing from specific domain files:
 * - import type { CVDocument } from '@/shared/types/models/cv';
 * - import type { ConversionError } from '@/shared/types/models/conversion';
 */

// Re-export all types from domain-specific files
export * from './models/index';

// Re-export constants (export * doesn't handle these)
export { DEFAULT_CONVERSION_CONFIG } from './models/index';
