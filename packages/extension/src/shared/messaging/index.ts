// ABOUTME: Type-safe extension messaging using @webext-core/messaging.
// ABOUTME: Defines the protocol map for all popup ↔ background communication.

import { defineExtensionMessaging } from '@webext-core/messaging';
import type {
  ConversionCompletePayload,
  ConversionErrorPayload,
  ConversionProgressPayload,
  ConversionRequestPayload,
  PopupOpenedPayload,
  UpdateSettingsPayload,
  WasmStatusPayload,
} from '../types/messages';
import type { UserSettings } from '../types/settings';

/**
 * Protocol map defining all message types with their request and response types.
 *
 * Format: messageName: (requestData) => responseData
 */
interface ProtocolMap {
  // WASM status
  getWasmStatus: (data: Record<string, never>) => WasmStatusPayload;
  retryWasmInit: (data: Record<string, never>) => WasmStatusPayload;

  // TSX validation
  validateTsx: (data: { tsx: string }) => { valid: boolean };

  // Conversion (request/response)
  startConversion: (data: ConversionRequestPayload) => { success: boolean; error?: string };

  // Conversion broadcasts (background → popup, no response expected)
  conversionProgress: (data: ConversionProgressPayload) => void;
  conversionComplete: (data: ConversionCompletePayload) => void;
  conversionError: (data: ConversionErrorPayload) => void;

  // Settings
  getSettings: (data: Record<string, never>) => {
    success: boolean;
    settings?: UserSettings;
    error?: string;
  };
  updateSettings: (data: UpdateSettingsPayload) => { success: boolean; error?: string };

  // Popup lifecycle
  popupOpened: (data: PopupOpenedPayload) => { success: boolean };

  // Ping for health check
  ping: (data: Record<string, never>) => { pong: true };
}

// Destructuring is the documented API pattern for @webext-core/messaging.
// The returned functions are standalone and don't use `this`.
export const { sendMessage, onMessage } = defineExtensionMessaging<ProtocolMap>();

// Re-export types for convenience
export type { ProtocolMap };
