/**
 * Storage Validation Helpers
 *
 * Shared validation utilities for both chrome.storage and localStorage
 */

import type { BaseIssue, BaseSchema } from 'valibot';
import type { ILogger } from '@/shared/infrastructure/logging';
import { safeParse } from 'valibot';

/**
 * Validation result with success flag
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
}

/**
 * Validate data with Valibot schema and log errors
 *
 * @param schema - Valibot schema
 * @param value - Value to validate
 * @param logger - Logger instance
 * @param context - Context string for error messages (e.g., 'Settings')
 * @returns Validation result with success flag and data
 */
export function validateWithSchema<
  TSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
>(
  schema: TSchema,
  value: unknown,
  logger: ILogger,
  context: string,
): ValidationResult<ReturnType<typeof safeParse<TSchema>>['output']> {
  const parseResult = safeParse(schema, value);

  if (!parseResult.success) {
    const errorMsg = parseResult.issues.map(e => e.message).join(', ');
    logger.error(context, 'Validation failed', errorMsg);
    return { success: false };
  }

  return { success: true, data: parseResult.output };
}

/**
 * Parse JSON safely with error handling
 *
 * @param raw - Raw JSON string
 * @param logger - Logger instance
 * @param context - Context string for error messages
 * @returns Parsed value or null if parsing fails
 */
export function safeJsonParse(
  raw: string,
  logger: ILogger,
  context: string,
): unknown | null {
  try {
    return JSON.parse(raw);
  }
  catch (error) {
    logger.error(context, 'Failed to parse JSON', error);
    return null;
  }
}
