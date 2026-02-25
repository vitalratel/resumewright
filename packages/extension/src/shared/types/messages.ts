// ABOUTME: Message payload types for extension communication.
// ABOUTME: Used by @webext-core/messaging ProtocolMap in @/shared/messaging.

import type { ConversionConfig, ConversionError, ConversionProgress } from './models';

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
