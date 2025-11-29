/**
 * Migration Registry
 *
 * Centralized registry of all migrations with sequencing logic.
 */

import type { ILogger } from '@/shared/domain/logging/ILogger';
import type { UserSettings } from '@/shared/types';
import { migrateV0toV1 } from './v0-to-v1';

/**
 * Apply migrations sequentially based on current version
 */
export function applyMigrations(data: unknown, fromVersion: number, logger: ILogger): UserSettings {
  let migrated = data;

  if (fromVersion < 1) {
    logger.info('SettingsMigrationRegistry', '[Migration] Applying v0 → v1 migration');
    migrated = migrateV0toV1(migrated);
  }

  // Future migrations would go here:
  // if (fromVersion < 2) {
  //   logger.info('SettingsMigrationRegistry', '[Migration] Applying v1 → v2 migration');
  //   migrated = migrateV1toV2(migrated);
  // }

  return migrated as UserSettings;
}
