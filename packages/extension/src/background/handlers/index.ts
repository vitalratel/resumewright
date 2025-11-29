/**
 * Message Handler Registry
 * Central registry for all message handlers
 */

import type { MessageType } from '../../shared/types/messages';
import type { LifecycleManager } from '../core/lifecycle/lifecycleManager';
import type { ConversionService } from '../services/ConversionService';
import type { ProgressTracker } from '../services/ProgressTracker';
import type { HandlerRegistry, MessageHandler, MessageMap } from './types';
import { getLogger } from '@/shared/infrastructure/logging';
import { ConversionHandler } from './conversionHandler';
import { CustomFontsHandler } from './customFontsHandler';
import { SettingsHandler } from './settingsHandler';
import { WasmHandler } from './wasmHandler';

/**
 * Create and configure the message handler registry
 */
export function createHandlerRegistry(
  lifecycleManager: LifecycleManager,
  conversionService: ConversionService,
  progressTracker: ProgressTracker
): HandlerRegistry {
  const registry: HandlerRegistry = new Map();

  // Register handlers with injected dependencies
  const conversionHandler = new ConversionHandler(
    lifecycleManager,
    conversionService,
    progressTracker
  );
  const settingsHandler = new SettingsHandler();
  const wasmHandler = new WasmHandler();
  const customFontsHandler = new CustomFontsHandler();

  // Helper to register a handler's message types
  // Accept any MessageHandler subtype, not just the union type
  const registerHandler = <T extends keyof MessageMap>(handler: MessageHandler<T>) => {
    const handlerTypes = handler.type;
    const typesToRegister = Array.isArray(handlerTypes) ? handlerTypes : [handlerTypes];

    for (const type of typesToRegister) {
      if (registry.has(type as MessageType)) {
        getLogger().warn('HandlerRegistry', `Duplicate handler for message type: ${type}`);
      }
      // Type assertion needed because handlers are stored in a generic Map
      // Runtime safety: handler only accepts messages of its declared types
      registry.set(type as MessageType, handler as unknown as MessageHandler);
    }
  };

  // Register all handlers
  registerHandler(conversionHandler);
  registerHandler(settingsHandler);
  registerHandler(wasmHandler);
  registerHandler(customFontsHandler);

  getLogger().info('HandlerRegistry', `Registered ${registry.size} message type handlers`);
  return registry;
}

/**
 * Get handler for a specific message type with full type safety
 *
 * Uses generic type parameter to preserve the relationship between
 * the message type and its corresponding handler.
 *
 * @example
 * ```ts
 * const handler = getHandler(registry, MessageType.CONVERSION_REQUEST);
 * // handler is typed as MessageHandler<MessageType.CONVERSION_REQUEST>
 * // and handle() receives ConversionRequestMessage
 * ```
 */
export function getHandler<T extends keyof MessageMap>(
  registry: HandlerRegistry,
  type: T
): MessageHandler<T> | undefined {
  return registry.get(type as MessageType) as MessageHandler<T> | undefined;
}

// Re-export handlers for testing
export { ConversionHandler } from './conversionHandler';
export { CustomFontsHandler } from './customFontsHandler';
export { SettingsHandler } from './settingsHandler';
export { WasmHandler } from './wasmHandler';
