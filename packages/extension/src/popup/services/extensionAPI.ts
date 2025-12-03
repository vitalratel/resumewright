// ABOUTME: Wraps messaging for popup use cases.
// ABOUTME: Handles TSX validation, conversion requests, and message subscriptions.

import { getLogger } from '@/shared/infrastructure/logging/instance';
import { onMessage, sendMessage } from '@/shared/messaging';
import type {
  ConversionCompletePayload,
  ConversionErrorPayload,
  ConversionProgressPayload,
} from '../../shared/types/messages';

class ExtensionAPI {
  /**
   * Validate TSX syntax using WASM parser
   */
  async validateTsx(tsxContent: string): Promise<boolean> {
    try {
      const response = await sendMessage('validateTsx', { tsx: tsxContent });
      return response.valid;
    } catch (error) {
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
  ): Promise<{ success: boolean; error?: string }> {
    // Check if service worker is alive
    getLogger().info('ExtensionAPI', 'Checking service worker status...');
    try {
      await sendMessage('ping', {});
      getLogger().info('ExtensionAPI', 'Service worker is alive');
    } catch (pingError) {
      getLogger().error('ExtensionAPI', 'Service worker ping failed', pingError);
      getLogger().error('ExtensionAPI', 'This usually means the background script is not running');
    }

    getLogger().info('ExtensionAPI', 'About to send startConversion message', {
      contentLength: tsxContent.length,
      fileName,
    });

    try {
      const response = await sendMessage('startConversion', {
        tsx: tsxContent,
        fileName,
      });
      getLogger().info('ExtensionAPI', 'Received response from background', response);
      return response;
    } catch (error) {
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
   */
  onProgress(callback: (progress: ConversionProgressPayload) => void): () => void {
    return onMessage('conversionProgress', ({ data }) => {
      callback(data);
    });
  }

  /**
   * Subscribe to conversion success
   */
  onSuccess(callback: (result: ConversionCompletePayload) => void): () => void {
    return onMessage('conversionComplete', ({ data }) => {
      callback(data);
    });
  }

  /**
   * Subscribe to conversion errors
   */
  onError(callback: (error: ConversionErrorPayload) => void): () => void {
    return onMessage('conversionError', ({ data }) => {
      callback(data);
    });
  }
}

export const extensionAPI = new ExtensionAPI();
