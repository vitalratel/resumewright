// ABOUTME: Messaging functions for popup-to-background communication.
// ABOUTME: Handles TSX validation, conversion requests, and message subscriptions.

import { getLogger } from '@/shared/infrastructure/logging/instance';
import { onMessage, sendMessage } from '@/shared/messaging';
import type {
  ConversionCompletePayload,
  ConversionErrorPayload,
  ConversionProgressPayload,
} from '../../shared/types/messages';

/**
 * Validate TSX syntax using WASM parser
 */
export async function validateTsx(tsxContent: string): Promise<boolean> {
  try {
    const response = await sendMessage('validateTsx', { tsx: tsxContent });
    return response.valid;
  } catch (error) {
    getLogger().error('extensionAPI', 'TSX validation failed', error);
    return false;
  }
}

/**
 * Request PDF conversion from background service worker
 */
export async function requestConversion(
  tsxContent: string,
  fileName: string,
): Promise<{ success: boolean; error?: string }> {
  const logger = getLogger();

  // Check if service worker is alive
  logger.info('extensionAPI', 'Checking service worker status...');
  try {
    await sendMessage('ping', {});
    logger.info('extensionAPI', 'Service worker is alive');
  } catch (pingError) {
    logger.error('extensionAPI', 'Service worker ping failed', pingError);
    logger.error('extensionAPI', 'This usually means the background script is not running');
  }

  logger.info('extensionAPI', 'About to send startConversion message', {
    contentLength: tsxContent.length,
    fileName,
  });

  try {
    const response = await sendMessage('startConversion', {
      tsx: tsxContent,
      fileName,
    });
    logger.info('extensionAPI', 'Received response from background', response);
    return response;
  } catch (error) {
    logger.error('extensionAPI', 'sendMessage failed', error);
    logger.error('extensionAPI', 'Error details', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

/**
 * Subscribe to conversion progress updates
 */
export function onProgress(callback: (progress: ConversionProgressPayload) => void): () => void {
  return onMessage('conversionProgress', ({ data }) => {
    callback(data);
  });
}

/**
 * Subscribe to conversion success
 */
export function onSuccess(callback: (result: ConversionCompletePayload) => void): () => void {
  return onMessage('conversionComplete', ({ data }) => {
    callback(data);
  });
}

/**
 * Subscribe to conversion errors
 */
export function onError(callback: (error: ConversionErrorPayload) => void): () => void {
  return onMessage('conversionError', ({ data }) => {
    callback(data);
  });
}
