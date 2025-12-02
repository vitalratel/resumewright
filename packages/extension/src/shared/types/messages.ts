// ABOUTME: Message payload types for extension communication.
// ABOUTME: Used by @webext-core/messaging ProtocolMap in @/shared/messaging.

import type { ConversionConfig, ConversionError, ConversionProgress } from './models';
import type { UserSettings } from './settings';

/**
 * Conversion payloads
 */

export interface ConversionRequestPayload {
  /** TSX content to convert (from file import) */
  tsx?: string;

  /** Original filename (for metadata extraction) */
  fileName?: string;

  /** Conversion configuration */
  config?: ConversionConfig;
}

export interface PopupOpenedPayload {
  /** Whether to request progress update for active conversion */
  requestProgressUpdate: boolean;
}

export interface ConversionProgressPayload {
  jobId: string;
  progress: ConversionProgress;
}

export interface ConversionCompletePayload {
  jobId: string;
  filename?: string; // Optional - may be undefined if generation fails
  fileSize: number;
  duration: number; // ms
  pdfBytes: Uint8Array; // PDF bytes for download in popup (service workers can't use btoa/blob URLs)
}

export interface ConversionErrorPayload {
  jobId: string;
  error: ConversionError;
}

/**
 * Settings payloads
 */

export interface UpdateSettingsPayload {
  settings: Partial<UserSettings>;
}

/** WASM status response */
export interface WasmStatusPayload {
  /** Whether WASM is initialized and ready */
  initialized: boolean;
  /** Error message if initialization failed */
  error?: string;
  /** Timestamp of when WASM was initialized (if successful) */
  initTime?: number;
}
