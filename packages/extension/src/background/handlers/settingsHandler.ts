/**
 * Settings Message Handler
 *
 * Handles user settings persistence and retrieval operations:
 * - GET_SETTINGS: Load current settings from chrome.storage.local
 * - UPDATE_SETTINGS: Merge and save updated settings
 *
 * Settings are stored in chrome.storage.local with automatic sync across
 * extension contexts (background, popup, content scripts).
 *
 * @module SettingsHandler
 */

import type browser from 'webextension-polyfill';
import type {
  GetSettingsMessage,
  GetSettingsPayload,
  UpdateSettingsMessage,
  UpdateSettingsPayload,
} from '../../shared/types/messages';
import type { MessageHandler } from './types';
import { getLogger } from '@/shared/infrastructure/logging';
import { settingsStore } from '@/shared/infrastructure/settings/SettingsStore';
import { MessageType } from '../../shared/types/messages';

/**
 * Handles settings-related messages for persistence and retrieval
 *
 * Responsibilities:
 * - Load user settings from chrome.storage.local
 * - Merge partial updates with existing settings (preserves unmodified fields)
 * - Validate settings schema before saving (delegated to settingsStore)
 * - Provide error recovery with user-friendly messages
 *
 * Settings Schema:
 * - defaultConfig: ConversionConfig (page size, margins, fonts, etc.)
 * - theme: 'light' | 'dark' | 'system'
 * - onboardingCompleted: boolean
 *
 * Merge Strategy: Shallow merge with spread operator. Nested objects
 * (like defaultConfig.margin) are replaced entirely, not deep-merged.
 *
 * @example
 * ```ts
 * const handler = new SettingsHandler();
 * // Get current settings
 * const result = await handler.handle(getSettingsMessage, sender);
 * console.log(result.settings.defaultConfig.pageSize); // 'Letter'
 *
 * // Update specific setting
 * const updateResult = await handler.handle({
 *   type: MessageType.UPDATE_SETTINGS,
 *   payload: { settings: { theme: 'dark' } }
 * }, sender);
 * ```
 */
export class SettingsHandler implements MessageHandler<MessageType.GET_SETTINGS | MessageType.UPDATE_SETTINGS> {
  readonly type = [MessageType.GET_SETTINGS, MessageType.UPDATE_SETTINGS] as const;

  /**
   * Routes incoming messages to appropriate handlers
   *
   * @param message - Settings get or update message
   * @param _sender - Message sender information (unused but required by MessageHandler interface)
   * @returns Promise resolving to handler-specific response
   */
  async handle(
    message: GetSettingsMessage | UpdateSettingsMessage,
    _sender: browser.Runtime.MessageSender
  ): Promise<unknown> {
    switch (message.type) {
      case MessageType.GET_SETTINGS:
        return this.handleGetSettings(message.payload);

      case MessageType.UPDATE_SETTINGS:
        return this.handleUpdateSettings(message.payload);
    }
  }

  /**
   * Loads current user settings from storage
   *
   * Delegates to settingsStore which handles:
   * - chrome.storage.local reads
   * - Schema migrations (if settings version outdated)
   * - Default value fallbacks (if storage empty)
   *
   * @param _payload - Empty payload (no parameters needed for GET)
   * @returns Promise resolving to { success: true, settings } or error
   * @throws Never - All errors caught and returned as { success: false, error }
   */
  private async handleGetSettings(_payload: GetSettingsPayload): Promise<unknown> {
    try {
      const settings = await settingsStore.loadSettings();
      return {
        success: true,
        settings,
      };
    }
    catch (error: unknown) {
      getLogger().error('SettingsHandler', 'Failed to load settings', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load settings',
      };
    }
  }

  /**
   * Updates user settings with partial merge strategy
   *
   * Merge Behavior:
   * - Top-level fields: Shallow merge with spread operator
   * - Nested objects: Complete replacement (not deep merge)
   * - Arrays: Complete replacement (not concatenation)
   *
   * Example:
   * ```ts
   * // Current: { defaultConfig: { pageSize: 'Letter', margin: { top: 1 } } }
   * // Update:  { defaultConfig: { margin: { top: 2 } } }
   * // Result:  { defaultConfig: { margin: { top: 2 } } } // pageSize lost!
   * ```
   *
   * For nested updates, caller must spread existing nested objects.
   *
   * Validation: settingsStore.saveSettings() validates schema before writing.
   *
   * @param payload - Partial settings object to merge
   * @returns Promise resolving to { success: true } or { success: false, error }
   * @throws Never - All errors caught and returned as { success: false, error }
   */
  private async handleUpdateSettings(payload: UpdateSettingsPayload): Promise<{ success: boolean; error?: string }> {
    try {
      // Load current settings, merge with updates, and save
      const currentSettings = await settingsStore.loadSettings();
      const updatedSettings = { ...currentSettings, ...payload.settings };
      await settingsStore.saveSettings(updatedSettings);
      return { success: true };
    }
    catch (error: unknown) {
      getLogger().error('SettingsHandler', 'Failed to update settings', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update settings',
      };
    }
  }
}
