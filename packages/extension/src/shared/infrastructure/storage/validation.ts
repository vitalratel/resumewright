/**
 * Storage Utilities with Validation
 *
 * Type-safe storage operations using Valibot validation
 */

import type { BaseIssue, BaseSchema, InferOutput } from 'valibot';
import { getLogger } from '@/shared/infrastructure/logging/instance';
import { validateWithSchema } from './helpers';

/**
 * Validation result type
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Get data from storage with Valibot validation
 *
 * @param key - Storage key
 * @param schema - Valibot schema for validation
 * @returns Validated data or null if not found/invalid
 */
export async function getValidatedStorage<
  TSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
>(key: string, schema: TSchema): Promise<InferOutput<TSchema> | null> {
  try {
    const result = await browser.storage.local.get(key);
    const value: unknown = result[key];

    if (value === undefined || value === null) {
      return null;
    }

    // Validate with shared helper
    const validationResult = validateWithSchema(schema, value, getLogger(), 'Storage');

    if (!validationResult.success || validationResult.data === undefined) {
      // Remove invalid data
      await browser.storage.local.remove(key);
      return null;
    }

    return validationResult.data;
  } catch (error) {
    getLogger().error('Storage', `Failed to get "${key}"`, error);
    return null;
  }
}

/**
 * Set data in storage with Valibot validation
 *
 * @param key - Storage key
 * @param value - Value to store
 * @param schema - Valibot schema for validation
 * @returns True if successful, false otherwise
 */
export async function setValidatedStorage<
  TSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
>(key: string, value: unknown, schema: TSchema): Promise<boolean> {
  try {
    // Validate with shared helper before storing
    const validationResult = validateWithSchema(schema, value, getLogger(), 'Storage');

    if (!validationResult.success) {
      return false;
    }

    await browser.storage.local.set({ [key]: validationResult.data });
    return true;
  } catch (error) {
    getLogger().error('Storage', `Failed to set "${key}"`, error);
    return false;
  }
}

/**
 * Get multiple keys from storage with validation
 *
 * @param schemas - Map of key to schema
 * @returns Map of key to validated data (missing/invalid keys excluded)
 */
export async function getMultipleValidatedStorage<
  T extends Record<string, BaseSchema<unknown, unknown, BaseIssue<unknown>>>,
>(schemas: T): Promise<{ [K in keyof T]?: InferOutput<T[K]> }> {
  try {
    const keys = Object.keys(schemas);
    const result = await browser.storage.local.get(keys);

    const validated: { [K in keyof T]?: InferOutput<T[K]> } = {};

    /**
     * Recursive function to validate keys sequentially
     * Avoids await-in-loop ESLint warning
     */
    async function validateKey(index: number): Promise<void> {
      if (index >= keys.length) {
        return;
      }

      const key = keys[index];
      const value: unknown = result[key];

      if (value === undefined || value === null) {
        return validateKey(index + 1);
      }

      const schema = schemas[key];
      const validationResult = validateWithSchema(schema, value, getLogger(), 'Storage');

      if (validationResult.success) {
        validated[key as keyof T] = validationResult.data as InferOutput<T[keyof T]>;
      } else {
        // Remove invalid data
        await browser.storage.local.remove(key);
      }

      return validateKey(index + 1);
    }

    await validateKey(0);

    return validated;
  } catch (error) {
    getLogger().error('Storage', 'Failed to get multiple keys', error);
    return {};
  }
}

/**
 * Remove data from storage
 *
 * @param keys - Key or array of keys to remove
 */
export async function removeFromStorage(keys: string | string[]): Promise<void> {
  try {
    await browser.storage.local.remove(keys);
  } catch (error) {
    getLogger().error('Storage', 'Failed to remove keys', error);
  }
}
