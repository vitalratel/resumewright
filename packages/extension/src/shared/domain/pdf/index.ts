/**
 * PDF Service - Barrel Export
 *
 * Re-exports all PDF service functions.
 * This maintains backward compatibility with existing imports.
 */

// PDF conversion (main API)
export { type ConversionDependencies, convertTsxToPdfWithFonts } from '../../application/pdf/converter';

// Download
export { downloadPDF } from '../../infrastructure/pdf/downloader';

// Font detection
export { clearFontCache, detectFonts } from '../../infrastructure/pdf/fonts';

// WASM initialization and instance management
export { createConverterInstance, initWASM, isWASMInitialized } from '../../infrastructure/wasm';

// Config conversion
export { convertConfigToRust, convertPointsToInches } from './config';

// Constants
export {
  CONVERSION_STAGES,
  CONVERSION_TIMEOUTS,
  type ConversionStage,
  DEFAULT_PDF_CONFIG,
  FILE_SIZE_LIMITS,
  FONT_LIMITS,
  PAGE_SIZES,
  type PageSize,
  PDF_CONSTRAINTS,
  PDF_STANDARDS,
  type PdfStandard,
  PERFORMANCE_TARGETS,
  RETRY_CONFIG,
  STAGE_PROGRESS_RANGES,
  WEB_SAFE_FONTS,
  type WebSafeFont,
} from './constants';

// Error parsing
export { mapStageToConversionStatus, parseWasmError } from './errors';

// WASM types
export type {
  FontCollection,
  TsxToPdfConverter,
  WasmFontData,
  WasmPdfConfig,
} from './types';

// TSX validation (unified module)
export {
  getFileExtension,
  type TsxValidationResult,
  validateFileExtension,
  validateTsxFile,
  validateTsxSyntax,
} from './validation';

// Legacy alias for backward compatibility
export { validateTsxSyntax as validateTsx } from './validation';

// WASM validation
export {
  parseFontRequirements,
  validatePdfBytes,
  validateProgressParams,
  validateWasmPdfConfig,
} from './wasmSchemas';
