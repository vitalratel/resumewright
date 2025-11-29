/**
 * History Validation Functions
 *
 * Runtime validation functions using Valibot schemas.
 */

import type { HistoryEntry } from '@/shared/types/models';
import { HistoryEntrySchema } from '../schemas/history';
import { parse, safeParse } from '../valibot';

/**
 * Validate HistoryEntry
 */
export function validateHistoryEntry(data: unknown): data is HistoryEntry {
  return safeParse(HistoryEntrySchema, data).success;
}

/**
 * Parse HistoryEntry with detailed error
 */
export function parseHistoryEntry(data: unknown): HistoryEntry {
  return parse(HistoryEntrySchema, data);
}
