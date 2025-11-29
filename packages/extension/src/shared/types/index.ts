/**
 * Shared Type Definitions - Type-Only Barrel Export
 *
 * This file ONLY re-exports TypeScript types and enums.
 * For runtime functions (validation, migrations, etc.), import directly from source modules:
 *
 * @example Types from barrel (recommended)
 * ```ts
 * import type { CVDocument, ConversionJob } from '@/shared/types';
 * import { MessageType, ErrorCode } from '@/shared/types';
 * ```
 *
 * @example Functions from source modules (recommended)
 * ```ts
 * import { createConversionError } from '@/shared/errors';
 * import { validateCVDocument } from '@/shared/validation';
 * import { migrateUserSettings } from '@/shared/settings';
 * import { getLogger } from '@/shared/infrastructure/logging';
 * ```
 *
 * ## Type Organization
 *
 * - **models.ts**: Core data models (CVDocument, ConversionJob, HistoryEntry)
 * - **messages.ts**: Message passing types (MessageType, Message<T>)
 * - **settings.ts**: User settings and configuration (UserSettings, ConversionConfig)
 * - **errors/**: Error handling types (ConversionError, ErrorCode)
 */

// ============================================================================
// Core Data Models
// ============================================================================

export type {
  DetectedFont,
  FontStyle,
  FontWeight,
  GoogleFontFamily,
} from '../domain/fonts';

export { GOOGLE_FONTS } from '../domain/fonts';

// ============================================================================
// Message Types
// ============================================================================

// Removed deprecated exports - import from source:
// import { DEFAULT_USER_SETTINGS, CURRENT_SETTINGS_VERSION, migrateUserSettings } from '@/shared/domain/settings/migrations';

// ============================================================================
// Settings Types
// ============================================================================

// Removed deprecated exports - import from source:
// Schemas & parsers: import from '@/shared/domain/validation'
// Validation cache: import from '@/shared/domain/validation/cache'

// ============================================================================
// Error Types
// ============================================================================

// Re-export type-only exports from error module
export type {
  CodeContext,
  CreateErrorOptions,
  ErrorDetails,
  PrioritizedSuggestion,
} from '../errors';

// ============================================================================
// Font Types
// ============================================================================

// Removed deprecated error function exports - import from source:
// import { createConversionError, ... } from '@/shared/errors';

// ============================================================================
// Logging Types
// ============================================================================

export { LogLevel } from '../infrastructure/logging';
export type { LoggerConfig } from '../infrastructure/logging';

// Removed deprecated storage function exports - import from source:
// import { loadSettings, saveSettings } from '@/shared/infrastructure/settings/storage';

// Removed deprecated type guard exports - import from source:
// import { isConversionComplete, ... } from '@/shared/utils/typeGuards';

// ============================================================================
// Error Type Constants
// ============================================================================

export { ERROR_MESSAGES, ERROR_RECOVERABLE, ERROR_SUGGESTIONS, ErrorCode } from './errors/';

export { MessageType } from './messages';

export type {
  ConversionCompleteMessage,
  ConversionCompletePayload,
  ConversionErrorMessage,
  ConversionErrorPayload,
  ConversionProgressMessage,
  ConversionProgressPayload,
  ConversionRequestMessage,
  ConversionRequestPayload,
  ConversionStartPayload,
  GetSettingsMessage,
  GetSettingsPayload,
  Message,
  UpdateSettingsMessage,
  UpdateSettingsPayload,
} from './messages';

export type {
  ConversionConfig,
  ConversionError,
  ConversionJob,
  ConversionProgress,
  ConversionResult,
  ConversionStatus,
  CVDocument,
  CVMetadata,
  HistoryEntry,
  PDFMetadata,
} from './models';

export { DEFAULT_CONVERSION_CONFIG } from './models';

export type { UserSettings, ValidationError, ValidationResult } from './settings';
