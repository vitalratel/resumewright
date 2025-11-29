/**
 * Validation Schemas
 *
 * Pure Zod schema definitions for all data types.
 * Schemas are separated from validators for better tree-shaking.
 */

// Conversion Schemas
export {
  ConversionConfigSchema,
  ConversionErrorSchema,
  ConversionJobSchema,
  ConversionProgressSchema,
  ConversionStatusSchema,
  parseConversionConfig,
  PDFMetadataSchema,
  validateConversionConfig,
  validateConversionError,
  validateConversionJob,
  validateConversionProgress,
  validateConversionStatus,
  validatePDFMetadata,
} from './conversion';

// CV Schemas
export {
  CVDocumentSchema,
  CVMetadataSchema,
  parseCVDocument,
  validateCVDocument,
  validateCVMetadata,
} from './cv';

// History Schemas
export { HistoryEntrySchema, parseHistoryEntry, validateHistoryEntry } from './history';

// Message Schemas
export { MessageSchema, parseMessage, validateMessage } from './messages';

// Settings Schemas
export { parseUserSettings, UserSettingsSchema, validateUserSettings } from './settings';
