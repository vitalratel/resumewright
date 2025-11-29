/**
 * Extension API Service
 *
 * Wraps chrome.runtime message passing for popup use cases.
 * Handles TSX validation, conversion requests, and progress/success/error subscriptions.
 */

import type {
  ConversionCompletePayload,
  ConversionErrorPayload,
  ConversionProgressPayload,
  ConversionRequestPayload,
  ConversionStartPayload,
  Message,
} from '../../shared/types/messages';
import browser from 'webextension-polyfill';
import { getLogger } from '@/shared/infrastructure/logging';
import { MessageType } from '../../shared/types/messages';
import { isMessageType } from '../../shared/utils/typeGuards';

class ExtensionAPI {
  /**
   * Validate TSX syntax using WASM parser
   */
  async validateTsx(tsxContent: string): Promise<boolean> {
    try {
      const message: Message<{ tsx: string }> = {
        type: MessageType.VALIDATE_TSX,
        payload: { tsx: tsxContent },
      };

      const response = await browser.runtime.sendMessage(message);
      return (response as { valid: boolean }).valid;
    }
    catch (error) {
      getLogger().error('ExtensionAPI', 'TSX validation failed', error);
      return false;
    }
  }

  /**
   * Start PDF conversion with TSX content
   */
  async startConversion(
    tsxContent: string,
    fileName: string,
  ): Promise<ConversionStartPayload> {
    // Check if service worker is alive
    getLogger().info('ExtensionAPI', 'Checking service worker status...');
    try {
      // Try to ping the service worker first
      await browser.runtime.sendMessage({ type: 'PING' });
      getLogger().info('ExtensionAPI', 'Service worker is alive');
    }
    catch (pingError) {
      getLogger().error('ExtensionAPI', 'Service worker ping failed', pingError);
      getLogger().error('ExtensionAPI', 'This usually means the background script is not running');
    }

    const message: Message<ConversionRequestPayload> = {
      type: MessageType.CONVERSION_REQUEST,
      payload: {
        tsx: tsxContent,
        fileName,
      },
    };

    getLogger().info('ExtensionAPI', 'About to send message to background', {
      type: message.type,
      contentLength: tsxContent.length,
      fileName,
    });

    try {
      const response = await browser.runtime.sendMessage(message);
      getLogger().info('ExtensionAPI', 'Received response from background', response);
      return response as ConversionStartPayload;
    }
    catch (error) {
      getLogger().error('ExtensionAPI', 'sendMessage failed', error);
      getLogger().error('ExtensionAPI', 'Error details', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  /**
   * Subscribe to conversion progress updates
   * Uses message listener for broadcast messages
   */
  onProgress(callback: (progress: ConversionProgressPayload) => void): () => void {
    const listener = (message: unknown) => {
      if (isMessageType(message, MessageType.CONVERSION_PROGRESS) && (message.payload !== null && message.payload !== undefined)) {
        callback(message.payload as ConversionProgressPayload);
      }
    };

    browser.runtime.onMessage.addListener(listener);

    // Return unsubscribe function
    return () => {
      browser.runtime.onMessage.removeListener(listener);
    };
  }

  /**
   * Subscribe to conversion success
   */
  onSuccess(callback: (result: ConversionCompletePayload) => void): () => void {
    const listener = (message: unknown) => {
      if (isMessageType(message, MessageType.CONVERSION_COMPLETE) && (message.payload !== null && message.payload !== undefined)) {
        callback(message.payload as ConversionCompletePayload);
      }
    };

    browser.runtime.onMessage.addListener(listener);

    return () => {
      browser.runtime.onMessage.removeListener(listener);
    };
  }

  /**
   * Subscribe to conversion errors
   */
  onError(callback: (error: ConversionErrorPayload) => void): () => void {
    const listener = (message: unknown) => {
      if (isMessageType(message, MessageType.CONVERSION_ERROR) && (message.payload !== null && message.payload !== undefined)) {
        callback(message.payload as ConversionErrorPayload);
      }
    };

    browser.runtime.onMessage.addListener(listener);

    return () => {
      browser.runtime.onMessage.removeListener(listener);
    };
  }
}

export const extensionAPI = new ExtensionAPI();
