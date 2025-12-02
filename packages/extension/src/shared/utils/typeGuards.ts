// ABOUTME: Type guard functions for runtime type checking.
// ABOUTME: Provides type-safe narrowing for discriminated unions.

import type { FontData } from '../domain/fonts/types';
import type {
  ConversionConfig,
  ConversionError,
} from '../types/models';

/**
 * Type guard for Uint8Array.
 */
export function isUint8Array(value: unknown): value is Uint8Array {
  return value instanceof Uint8Array;
}

/**
 * Type guard for Error objects.
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

/**
 * Type guard for ConversionError.
 */
export function isConversionErrorObject(value: unknown): value is ConversionError {
  return (
    typeof value === 'object'
    && value !== null
    && 'code' in value
    && 'message' in value
    && typeof (value as { code: unknown }).code === 'string'
    && typeof (value as { message: unknown }).message === 'string'
  );
}

/**
 * Type guard for non-null values.
 */
export function isNotNull<T>(value: T | null): value is T {
  return value !== null;
}

/**
 * Type guard for non-undefined values.
 */
export function isNotUndefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

/**
 * Type guard for defined values (not null or undefined).
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Type guard for FontData.
 */
export function isFontData(value: unknown): value is FontData {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.family === 'string'
    && (typeof obj.weight === 'number' || typeof obj.weight === 'string')
    && (obj.style === 'normal' || obj.style === 'italic')
    && obj.bytes instanceof Uint8Array
    && (obj.format === 'truetype' || obj.format === 'opentype' || obj.format === 'woff' || obj.format === 'woff2')
  );
}

/**
 * Type guard for ConversionConfig.
 */
export function isConversionConfig(value: unknown): value is ConversionConfig {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  // Check required fields
  if (
    (obj.pageSize !== 'Letter' && obj.pageSize !== 'A4' && obj.pageSize !== 'Legal')
    || typeof obj.fontSize !== 'number'
    || typeof obj.fontFamily !== 'string'
    || typeof obj.compress !== 'boolean'
  ) {
    return false;
  }

  // Check margin object
  if (
    typeof obj.margin !== 'object'
    || obj.margin === null
    || typeof (obj.margin as Record<string, unknown>).top !== 'number'
    || typeof (obj.margin as Record<string, unknown>).right !== 'number'
    || typeof (obj.margin as Record<string, unknown>).bottom !== 'number'
    || typeof (obj.margin as Record<string, unknown>).left !== 'number'
  ) {
    return false;
  }

  // Check optional fields if present
  if (obj.filename !== undefined && typeof obj.filename !== 'string') {
    return false;
  }
  if (obj.atsOptimization !== undefined && typeof obj.atsOptimization !== 'boolean') {
    return false;
  }
  if (obj.includeMetadata !== undefined && typeof obj.includeMetadata !== 'boolean') {
    return false;
  }

  return true;
}
