/**
 * Message Handler Types
 * Modular message handling architecture with type-safe mapped types
 */

import type browser from 'webextension-polyfill';
import type {
  ConversionRequestMessage,
  GetSettingsMessage,
  GetWasmStatusMessage,
  MessageType,
  PopupOpenedMessage,
  RetryWasmInitMessage,
  UpdateSettingsMessage,
  ValidateTsxMessage,
} from '../../shared/types/messages';

/**
 * Central message map linking MessageType enum values to their message interfaces
 * This provides compile-time type safety for the entire message handling system
 */
export interface MessageMap {
  [MessageType.CONVERSION_REQUEST]: ConversionRequestMessage;
  [MessageType.POPUP_OPENED]: PopupOpenedMessage;
  [MessageType.GET_SETTINGS]: GetSettingsMessage;
  [MessageType.UPDATE_SETTINGS]: UpdateSettingsMessage;
  [MessageType.GET_WASM_STATUS]: GetWasmStatusMessage;
  [MessageType.RETRY_WASM_INIT]: RetryWasmInitMessage;
  [MessageType.VALIDATE_TSX]: ValidateTsxMessage;
}

/**
 * Base message handler interface with type-safe message narrowing
 * 
 * Uses mapped types to ensure compile-time type safety:
 * - Generic parameter T is constrained to keys of MessageMap
 * - Message parameter is automatically narrowed to MessageMap[T]
 * - TypeScript enforces exhaustive checking in switch statements
 * 
 * @example
 * ```ts
 * class MyHandler implements MessageHandler<MessageType.CONVERSION_REQUEST> {
 *   readonly type = MessageType.CONVERSION_REQUEST;
 *   async handle(message, sender) {
 *     // message is automatically typed as ConversionRequestMessage
 *     message.payload; // typed as ConversionRequestPayload
 *   }
 * }
 * ```
 */
export interface MessageHandler<T extends keyof MessageMap = keyof MessageMap> {
  /**
   * The message type(s) this handler supports
   */
  readonly type: T | readonly T[];

  /**
   * Handle the incoming message
   *
   * @param message - The incoming message (automatically narrowed via MessageMap)
   * @param sender - The message sender information
   * @returns Response to send back to the sender
   */
  handle: (
    message: MessageMap[T],
    sender: browser.Runtime.MessageSender,
  ) => Promise<unknown>;
}

/**
 * Handler registry maps message types to their handlers
 */
export type HandlerRegistry = Map<MessageType, MessageHandler>;

/**
 * Response type for message handlers
 */
export interface MessageResponse {
  success: boolean;
  error?: string;
  [key: string]: unknown;
}
