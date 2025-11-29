/**
 * Settings Validation Functions
 *
 * Runtime validation functions using Valibot schemas.
 */

import type { UserSettings } from '@/shared/types/settings';
import { UserSettingsSchema } from '../schemas/settings';
import { parse, safeParse } from '../valibot';

/**
 * Validate UserSettings
 */
export function validateUserSettings(data: unknown): data is UserSettings {
  return safeParse(UserSettingsSchema, data).success;
}

/**
 * Parse UserSettings with detailed error
 */
export function parseUserSettings(data: unknown): UserSettings {
  return parse(UserSettingsSchema, data);
}
