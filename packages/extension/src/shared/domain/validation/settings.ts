// ABOUTME: Valibot schema for UserSettings type.
// ABOUTME: Provides validation and parsing for user preferences.

import type { UserSettings } from '@/shared/types/settings';
import { boolean, integer, maxValue, minValue, number, parse, picklist, pipe, safeParse, strictObject } from 'valibot';
import { ConversionConfigSchema } from './conversion';

/**
 * UserSettings Schema
 * Using strictObject to reject unknown keys.
 */
export const UserSettingsSchema = strictObject({
  theme: picklist(['light', 'dark', 'auto']),
  defaultConfig: ConversionConfigSchema,
  autoDetectCV: boolean('Auto-detect CV must be a boolean'),
  showConvertButtons: boolean('Show convert buttons must be a boolean'),
  telemetryEnabled: boolean('Telemetry enabled must be a boolean'),
  retentionDays: pipe(
    number('Retention days must be a number'),
    integer('Retention days must be an integer'),
    minValue(1, 'Retention days must be between 1 and 365'),
    maxValue(365, 'Retention days must be between 1 and 365'),
  ),
  settingsVersion: pipe(
    number('Settings version must be a number'),
    integer('Settings version must be an integer'),
    minValue(1, 'Settings version must be positive'),
  ),
  lastUpdated: pipe(
    number('Last updated must be a number'),
    integer('Last updated must be an integer'),
    minValue(1, 'Last updated must be positive'),
  ),
});

/**
 * Validation Functions
 */

export function validateUserSettings(data: unknown): data is UserSettings {
  return safeParse(UserSettingsSchema, data).success;
}

/**
 * Parse Functions
 */

export function parseUserSettings(data: unknown): UserSettings {
  return parse(UserSettingsSchema, data);
}
