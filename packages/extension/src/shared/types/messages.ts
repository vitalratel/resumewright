/**
 * Message Types for Extension Communication
 *
 * Implements Inter-Component Communication Protocol.
 * Defines message types for popup-background communication, conversion workflow,
 * settings management, Google Fonts fetching, and WASM status.
 */

import type { ConversionConfig, ConversionError, ConversionProgress } from './models';
import type { UserSettings } from './settings';

/**
 * Message Type Enum
 *
 * Regular enum (not const) to support runtime validation with Zod.
 */
export enum MessageType {
  // Popup messages
  POPUP_OPENED = 'POPUP_OPENED', // Popup → Service Worker: Popup opened

  // File import and validation
  VALIDATE_TSX = 'VALIDATE_TSX', // Popup → Service Worker: Validate TSX syntax

  // Conversion messages
  CONVERSION_REQUEST = 'CONVERSION_REQUEST', // Popup → Service Worker: Start conversion
  CONVERSION_STARTED = 'CONVERSION_STARTED', // Service Worker → Popup: Conversion started
  CONVERSION_PROGRESS = 'CONVERSION_PROGRESS', // Service Worker → Popup: Progress update (broadcast)
  CONVERSION_COMPLETE = 'CONVERSION_COMPLETE', // Service Worker → Popup: Conversion finished
  CONVERSION_ERROR = 'CONVERSION_ERROR', // Service Worker → Popup: Conversion failed
  CONVERSION_CANCEL = 'CONVERSION_CANCEL', // Popup → Service Worker: Cancel conversion

  // Settings messages
  GET_SETTINGS = 'GET_SETTINGS', // Popup → Service Worker: Get settings
  UPDATE_SETTINGS = 'UPDATE_SETTINGS', // Popup → Service Worker: Update settings

  // Google Fonts fetching
  FETCH_GOOGLE_FONT = 'FETCH_GOOGLE_FONT', // WASM → Service Worker: Fetch Google Font
  GOOGLE_FONT_FETCHED = 'GOOGLE_FONT_FETCHED', // Service Worker → WASM: Font bytes ready
  GOOGLE_FONT_ERROR = 'GOOGLE_FONT_ERROR', // Service Worker → WASM: Font fetch failed

  // WASM initialization
  GET_WASM_STATUS = 'GET_WASM_STATUS', // Popup → Service Worker: Get WASM initialization status
  RETRY_WASM_INIT = 'RETRY_WASM_INIT', // Popup → Service Worker: Retry WASM initialization
  WASM_INIT_SUCCESS = 'WASM_INIT_SUCCESS', // Service Worker → Popup: WASM init succeeded
  WASM_INIT_ERROR = 'WASM_INIT_ERROR', // Service Worker → Popup: WASM init failed
}

/**
 * Conversion Messages
 */

export interface ConversionRequestPayload {
  /** TSX content to convert (from file import) */
  tsx?: string;

  /** Original filename (for metadata extraction) */
  fileName?: string;

  /** Conversion configuration */
  config?: ConversionConfig;
}

export interface ConversionStartPayload {
  jobId: string;
  estimatedDuration: number; // ms
}

/** POPUP_OPENED payload */
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
 * Settings Messages
 */

export interface GetSettingsPayload {
  // Empty for now, could include fields like 'keys' in future
}

export interface UpdateSettingsPayload {
  settings: Partial<UserSettings>;
}

/**
 * Generic Message Structure
 *
 * Type-safe message passing with generic payload type.
 *
 * @example
 * ```ts
 * const msg: Message<TsxDetectedPayload> = {
 *   type: MessageType.TSX_DETECTED,
 *   payload: { tsx: '...', tsxHash: '...', metadata: {...}, url: '...', detectedAt: Date.now() }
 * };
 * ```
 */
export interface Message<T = unknown> {
  type: MessageType;
  payload: T;
}

/**
 * Specific message types with discriminated unions
 */
export interface ConversionRequestMessage { type: MessageType.CONVERSION_REQUEST; payload: ConversionRequestPayload }
export interface ConversionStartedMessage { type: MessageType.CONVERSION_STARTED; payload: ConversionStartPayload }
export interface PopupOpenedMessage { type: MessageType.POPUP_OPENED; payload: PopupOpenedPayload }
export interface ConversionProgressMessage { type: MessageType.CONVERSION_PROGRESS; payload: ConversionProgressPayload }
export interface ConversionCompleteMessage { type: MessageType.CONVERSION_COMPLETE; payload: ConversionCompletePayload }
export interface ConversionErrorMessage { type: MessageType.CONVERSION_ERROR; payload: ConversionErrorPayload }
export interface GetSettingsMessage { type: MessageType.GET_SETTINGS; payload: GetSettingsPayload }
export interface UpdateSettingsMessage { type: MessageType.UPDATE_SETTINGS; payload: UpdateSettingsPayload }

/**
 * Google Fonts Message Payloads
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

export interface FetchGoogleFontMessage { type: MessageType.FETCH_GOOGLE_FONT; payload: FetchGoogleFontPayload }
export interface GoogleFontFetchedMessage { type: MessageType.GOOGLE_FONT_FETCHED; payload: GoogleFontFetchedPayload }
export interface GoogleFontErrorMessage { type: MessageType.GOOGLE_FONT_ERROR; payload: GoogleFontErrorPayload }

/**
 * WASM Status Message Payloads
 */

/** Request WASM initialization status */
export interface GetWasmStatusPayload {
  // Empty payload - just requests status
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

export interface GetWasmStatusMessage { type: MessageType.GET_WASM_STATUS; payload: GetWasmStatusPayload }
export interface WasmStatusMessage { type: MessageType.WASM_INIT_SUCCESS; payload: WasmStatusPayload }
export interface RetryWasmInitMessage { type: MessageType.RETRY_WASM_INIT; payload: Record<string, never> }
export interface ValidateTsxMessage { type: MessageType.VALIDATE_TSX; payload: { tsx: string } }

/**
 * All possible messages - discriminated union for type-safe message handling
 */
export type AnyMessage =
  | ConversionRequestMessage
  | ConversionStartedMessage
  | PopupOpenedMessage
  | ConversionProgressMessage
  | ConversionCompleteMessage
  | ConversionErrorMessage
  | GetSettingsMessage
  | UpdateSettingsMessage
  | FetchGoogleFontMessage
  | GoogleFontFetchedMessage
  | GoogleFontErrorMessage
  | GetWasmStatusMessage
  | WasmStatusMessage
  | RetryWasmInitMessage
  | ValidateTsxMessage;
