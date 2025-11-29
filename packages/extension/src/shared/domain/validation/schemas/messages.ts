/**
 * Message Validation Schemas
 *
 * Valibot schemas and validation functions for extension messages.
 * Replaced v.any() with discriminated union validation
 */

import type { Message } from '@/shared/types/messages';
import { MessageType } from '@/shared/types/messages';
import { any, boolean, instance, literal, number, object, optional, picklist, record, safeParse, string, union } from '../valibot';
import { ConversionConfigSchema, ConversionErrorSchema, ConversionProgressSchema } from './conversion';

/**
 * Individual Payload Schemas
 */

// Conversion Request Payload
export const ConversionRequestPayloadSchema = object({
  tsx: optional(string()),
  fileName: optional(string()),
  config: optional(ConversionConfigSchema),
});

// Conversion Start/Started Payload
export const ConversionStartPayloadSchema = object({
  jobId: string(),
  estimatedDuration: number(),
});

// Popup Opened Payload
export const PopupOpenedPayloadSchema = object({
  requestProgressUpdate: boolean(),
});

// Conversion Progress Payload
export const ConversionProgressPayloadSchema = object({
  jobId: string(),
  progress: ConversionProgressSchema,
});

// Conversion Complete Payload
export const ConversionCompletePayloadSchema = object({
  jobId: string(),
  filename: optional(string()),
  fileSize: number(),
  duration: number(),
  pdfBytes: instance(Uint8Array),
});

// Conversion Error Payload
export const ConversionErrorPayloadSchema = object({
  jobId: string(),
  error: ConversionErrorSchema,
});

// Get Settings Payload (empty object)
export const GetSettingsPayloadSchema = object({});

// Update Settings Payload
export const UpdateSettingsPayloadSchema = object({
  settings: record(string(), any()), // Partial<UserSettings>
});

// Google Font Payloads
export const FetchGoogleFontPayloadSchema = object({
  family: string(),
  weight: optional(picklist([100, 200, 300, 400, 500, 600, 700, 800, 900])),
  style: optional(picklist(['normal', 'italic'])),
});

export const GoogleFontFetchedPayloadSchema = object({
  family: string(),
  weight: number(),
  style: picklist(['normal', 'italic']),
  fontBytes: instance(Uint8Array),
  size: number(),
  cached: boolean(),
});

export const GoogleFontErrorPayloadSchema = object({
  family: string(),
  errorType: picklist(['NETWORK_TIMEOUT', 'NETWORK_ERROR', 'PARSE_ERROR', 'NOT_FOUND']),
  message: string(),
});

// Empty Payload for messages without data
export const EmptyPayloadSchema = object({});

/**
 * Discriminated Union Message Schema
 * Type-safe validation based on message type
 */
export const MessageSchema = union([
  object({
    type: literal(MessageType.POPUP_OPENED),
    payload: PopupOpenedPayloadSchema,
  }),
  object({
    type: literal(MessageType.VALIDATE_TSX),
    payload: object({ tsx: string() }),
  }),
  object({
    type: literal(MessageType.CONVERSION_REQUEST),
    payload: ConversionRequestPayloadSchema,
  }),
  object({
    type: literal(MessageType.CONVERSION_STARTED),
    payload: ConversionStartPayloadSchema,
  }),
  object({
    type: literal(MessageType.CONVERSION_PROGRESS),
    payload: ConversionProgressPayloadSchema,
  }),
  object({
    type: literal(MessageType.CONVERSION_COMPLETE),
    payload: ConversionCompletePayloadSchema,
  }),
  object({
    type: literal(MessageType.CONVERSION_ERROR),
    payload: ConversionErrorPayloadSchema,
  }),
  object({
    type: literal(MessageType.CONVERSION_CANCEL),
    payload: object({ jobId: string() }),
  }),
  object({
    type: literal(MessageType.GET_SETTINGS),
    payload: GetSettingsPayloadSchema,
  }),
  object({
    type: literal(MessageType.UPDATE_SETTINGS),
    payload: UpdateSettingsPayloadSchema,
  }),
  object({
    type: literal(MessageType.FETCH_GOOGLE_FONT),
    payload: FetchGoogleFontPayloadSchema,
  }),
  object({
    type: literal(MessageType.GOOGLE_FONT_FETCHED),
    payload: GoogleFontFetchedPayloadSchema,
  }),
  object({
    type: literal(MessageType.GOOGLE_FONT_ERROR),
    payload: GoogleFontErrorPayloadSchema,
  }),
  object({
    type: literal(MessageType.GET_WASM_STATUS),
    payload: EmptyPayloadSchema,
  }),
  object({
    type: literal(MessageType.RETRY_WASM_INIT),
    payload: EmptyPayloadSchema,
  }),
  object({
    type: literal(MessageType.WASM_INIT_SUCCESS),
    payload: EmptyPayloadSchema,
  }),
  object({
    type: literal(MessageType.WASM_INIT_ERROR),
    payload: object({ error: string() }),
  }),
]);

/**
 * Validation Functions
 */

export function validateMessage(data: unknown): data is Message<unknown> {
  return safeParse(MessageSchema, data).success;
}

/**
 * Parse and validate message with detailed error
 * Runtime validation for messages
 */
export function parseMessage(data: unknown): { success: true; data: Message<unknown> } | { success: false; error: string } {
  const result = safeParse(MessageSchema, data);

  if (result.success) {
    return { success: true, data: result.output as Message<unknown> };
  }

  return {
    success: false,
    error: result.issues.map(e => `${e.path?.map(p => String(p.key)).join('.') ?? 'root'}:${e.message}`).join(', '),
  };
}
