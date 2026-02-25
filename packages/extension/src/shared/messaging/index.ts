// ABOUTME: Type-safe extension messaging using @webext-core/messaging.
// ABOUTME: Defines the protocol map for all popup ↔ background communication.

import { defineExtensionMessaging } from '@webext-core/messaging';
import type {
  ConversionCompletePayload,
  ConversionErrorPayload,
  ConversionProgressPayload,
  ConversionRequestPayload,
} from '../types/messages';

/**
 * Protocol map defining all message types with their request and response types.
 *
 * Format: messageName: (requestData) => responseData
 */
interface ProtocolMap {
  // TSX validation
  validateTsx: (data: { tsx: string }) => { valid: boolean };

  // Conversion (request/response)
  startConversion: (data: ConversionRequestPayload) => { success: boolean; error?: string };

  // Conversion broadcasts (background → UI, no response expected)
  conversionProgress: (data: ConversionProgressPayload) => void;
  conversionComplete: (data: ConversionCompletePayload) => void;
  conversionError: (data: ConversionErrorPayload) => void;
}

// Destructuring is the documented API pattern for @webext-core/messaging.
// The returned functions are standalone and don't use `this`.
export const { sendMessage, onMessage } = defineExtensionMessaging<ProtocolMap>();

// Re-export types for convenience
export type { ProtocolMap };
