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

/**
 * Google Fonts payloads
 */

/** Request to fetch a Google Font */
export interface FetchGoogleFontPayload {
  /** Font family name (e.g., "Roboto") */
  family: string;

  /** Font weight (default: 400) */
  weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

  /** Font style (default: "normal") */
  style?: 'normal' | 'italic';
}

/** Successful font fetch response */
export interface GoogleFontFetchedPayload {
  /** Font family name */
  family: string;

  /** Font weight */
  weight: number;

  /** Font style */
  style: 'normal' | 'italic';

  /** Font bytes as Uint8Array */
  fontBytes: Uint8Array;

  /** Size in bytes */
  size: number;

  /** Whether font was served from cache */
  cached: boolean;
}

/** Font fetch error response */
export interface GoogleFontErrorPayload {
  /** Font family name */
  family: string;

  /** Error type */
  errorType: 'NETWORK_TIMEOUT' | 'NETWORK_ERROR' | 'PARSE_ERROR' | 'NOT_FOUND';

  /** Error message */
  message: string;
}

/**
 * WASM status payloads
 */

/** WASM status response */
export interface WasmStatusPayload {
  /** Whether WASM is initialized and ready */
  initialized: boolean;
  /** Error message if initialization failed */
  error?: string;
  /** Timestamp of when WASM was initialized (if successful) */
  initTime?: number;
}
