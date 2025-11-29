/**
 * Custom Fonts Message Handler
 *
 * Handles:
 * - LIST_CUSTOM_FONTS: Retrieve all uploaded custom fonts
 * - GET_CUSTOM_FONT_STATS: Get storage usage statistics
 *
 * Delegates to customFontManager for business logic
 *
 * @module CustomFontsHandler
 */

import type {
  GetCustomFontStatsMessage,
  GetCustomFontStatsResponse,
  ListCustomFontsMessage,
  ListCustomFontsResponse,
  RemoveCustomFontMessage,
  RemoveCustomFontResponse,
  UploadCustomFontMessage,
  UploadCustomFontResponse,
} from '../../shared/types/messages';
import type { MessageHandler } from './types';
import { getLogger } from '@/shared/infrastructure/logging';
import { MessageType } from '../../shared/types/messages';
import { getCustomFontStats, listCustomFonts, removeCustomFont } from '../core/fonts/customFontManager';

/**
 * CustomFontsHandler
 *
 * Provides access to custom font data and statistics for the popup UI
 */
export class CustomFontsHandler implements MessageHandler<
  MessageType.LIST_CUSTOM_FONTS | MessageType.GET_CUSTOM_FONT_STATS | MessageType.UPLOAD_CUSTOM_FONT | MessageType.REMOVE_CUSTOM_FONT
> {
  type = [
    MessageType.LIST_CUSTOM_FONTS,
    MessageType.GET_CUSTOM_FONT_STATS,
    MessageType.UPLOAD_CUSTOM_FONT,
    MessageType.REMOVE_CUSTOM_FONT,
  ] as const;

  async handle(
    message: ListCustomFontsMessage | GetCustomFontStatsMessage | UploadCustomFontMessage | RemoveCustomFontMessage,
  ): Promise<ListCustomFontsResponse | GetCustomFontStatsResponse | UploadCustomFontResponse | RemoveCustomFontResponse> {
    const logger = getLogger();

    try {
      if (message.type === 'LIST_CUSTOM_FONTS') {
        logger.debug('CustomFontsHandler', 'Listing custom fonts');
        const fonts = await listCustomFonts();
        return {
          fonts: fonts.map(font => ({
            id: font.id,
            family: font.family,
            weight: font.weight,
            style: font.style,
            format: font.format,
            size: font.fileSize,
            uploadedAt: font.uploadedAt,
          })),
        };
      }
      else if (message.type === 'GET_CUSTOM_FONT_STATS') {
        logger.debug('CustomFontsHandler', 'Getting custom font stats');
        const stats = await getCustomFontStats();
        return stats;
      }
      else if (message.type === 'UPLOAD_CUSTOM_FONT') {
        logger.debug('CustomFontsHandler', `Uploading custom font: ${message.payload.metadata.family}`);
        
        // Convert byte array back to File object
        const fileBytes = new Uint8Array(message.payload.fileBytes);
        const file = new File([fileBytes], message.payload.fileName, {
          type: message.payload.fileName.endsWith('.woff2') ? 'font/woff2' :
                message.payload.fileName.endsWith('.woff') ? 'font/woff' :
                message.payload.fileName.endsWith('.otf') ? 'font/otf' :
                'font/ttf',
        });
        
        // Use existing uploadCustomFont function (already imported indirectly)
        const { uploadCustomFont } = await import('../core/fonts/customFontManager');
        const uploadedFont = await uploadCustomFont(file, message.payload.metadata);
        
        return {
          font: {
            id: uploadedFont.id,
            family: uploadedFont.family,
            weight: uploadedFont.weight,
            style: uploadedFont.style,
            format: uploadedFont.format,
            size: uploadedFont.fileSize,
            uploadedAt: uploadedFont.uploadedAt,
          },
        };
      }
      else if (message.type === 'REMOVE_CUSTOM_FONT') {
        logger.debug('CustomFontsHandler', `Removing custom font: ${message.payload.fontId}`);
        await removeCustomFont(message.payload.fontId);
        return { success: true };
      }
      else {
        // TypeScript exhaustiveness check
        const _exhaustive: never = message;
        throw new Error(`Unhandled message type: ${(_exhaustive as { type: string }).type}`);
      }
    }
    catch (error) {
      logger.error('CustomFontsHandler', `Failed to handle ${message.type}`, error);
      throw error;
    }
  }
}
