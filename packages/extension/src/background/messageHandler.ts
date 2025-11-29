/**
 * Message Handler
 *
 * Central message routing for background script using modular handler architecture.
 */

import type { LifecycleManager } from './core/lifecycle/lifecycleManager';
import type { MessageMap } from './handlers/types';
import browser from 'webextension-polyfill';
import { parseMessage } from '@/shared/domain/validation/validators/messages';
import { getLogger } from '@/shared/infrastructure/logging';
import { MessageType } from '../shared/types/messages';
import { createHandlerRegistry, getHandler } from './handlers';
import { ConversionService } from './services/ConversionService';
import { ProgressTracker } from './services/ProgressTracker';

// Maximum message size to prevent performance issues
// Chrome extension message size limit to avoid runtime.sendMessage errors
const MAX_MESSAGE_SIZE = 2 * 1024 * 1024; // 2MB

/**
 * Setup message listener for extension communication
 * Uses modular handler registry for clean separation of concerns
 */
export function setupMessageHandler(lifecycleManager: LifecycleManager): void {
  // Instantiate services for dependency injection
  const conversionService = new ConversionService();
  const progressTracker = new ProgressTracker();

  // Create handler registry with injected dependencies (Proper DI)
  const handlerRegistry = createHandlerRegistry(
    lifecycleManager,
    conversionService,
    progressTracker
  );

  browser.runtime.onMessage.addListener(
    async (message: unknown, sender: browser.Runtime.MessageSender) => {
      const senderId = sender.tab?.id ?? 'popup';

      // Validate message structure with Valibot
      const validationResult = parseMessage(message);
      if (!validationResult.success) {
        getLogger().error(
          'MessageHandler',
          `Invalid message from ${senderId}`,
          validationResult.error
        );
        return {
          success: false,
          error: `Invalid message format: ${validationResult.error}`,
        };
      }

      const msg = validationResult.data;
      getLogger().debug('MessageHandler', `Received message: ${msg.type} from ${senderId}`);

      // Validate message size for conversion requests
      if (msg.type === MessageType.CONVERSION_REQUEST) {
        const payload = msg.payload;
        if (
          payload !== null &&
          payload !== undefined &&
          payload.tsx !== null &&
          payload.tsx !== undefined &&
          payload.tsx !== ''
        ) {
          const tsxSize = new TextEncoder().encode(payload.tsx).length;
          if (tsxSize > MAX_MESSAGE_SIZE) {
            const sizeMB = (tsxSize / (1024 * 1024)).toFixed(2);
            getLogger().warn('Background', `TSX content too large: ${sizeMB}MB (max: 2MB)`);
            return {
              success: false,
              error: `TSX content is too large (${sizeMB}MB). Maximum size is 2MB. Please reduce the content or split into multiple files.`,
            };
          }
        }
      }

      try {
        // Use handler registry for modular message handling
        // Type assertion: runtime lookup guarantees type compatibility
        const handler = getHandler(handlerRegistry, msg.type as keyof MessageMap);

        if (handler) {
          // Type assertion: handler was retrieved by msg.type, so it accepts this message
          // Runtime safety: getHandler ensures type compatibility
          return await handler.handle(
            msg as unknown as Parameters<typeof handler.handle>[0],
            sender
          );
        } else {
          getLogger().warn('Background', `No handler for message type: ${msg.type}`);
          return { success: false, error: 'Unknown message type' };
        }
      } catch (error) {
        getLogger().error('MessageHandler', `Error handling message ${msg.type}`, error);
        return { success: false, error: String(error) };
      }
    }
  );

  getLogger().info('Background', 'Message handler initialized');
}
