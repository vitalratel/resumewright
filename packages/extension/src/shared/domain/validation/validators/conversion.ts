/**
 * Conversion Validation Functions
 *
 * Runtime validation functions using Valibot schemas.
 */

import type {
  ConversionConfig,
  ConversionError,
  ConversionJob,
  ConversionProgress,
  ConversionStatus,
  PDFMetadata,
} from '@/shared/types/models';
import {
  ConversionConfigSchema,
  ConversionErrorSchema,
  ConversionJobSchema,
  ConversionProgressSchema,
  ConversionStatusSchema,
  PDFMetadataSchema,
} from '../schemas/conversion';
import { parse, safeParse } from '../valibot';

/**
 * Validate ConversionStatus
 */
export function validateConversionStatus(data: unknown): data is ConversionStatus {
  return safeParse(ConversionStatusSchema, data).success;
}

/**
 * Validate ConversionProgress
 */
export function validateConversionProgress(data: unknown): data is ConversionProgress {
  return safeParse(ConversionProgressSchema, data).success;
}

/**
 * Validate ConversionConfig
 */
export function validateConversionConfig(data: unknown): data is ConversionConfig {
  return safeParse(ConversionConfigSchema, data).success;
}

/**
 * Validate ConversionError
 */
export function validateConversionError(data: unknown): data is ConversionError {
  return safeParse(ConversionErrorSchema, data).success;
}

/**
 * Validate PDFMetadata
 */
export function validatePDFMetadata(data: unknown): data is PDFMetadata {
  return safeParse(PDFMetadataSchema, data).success;
}

/**
 * Validate ConversionJob
 */
export function validateConversionJob(data: unknown): data is ConversionJob {
  return safeParse(ConversionJobSchema, data).success;
}

/**
 * Parse ConversionConfig with detailed error
 */
export function parseConversionConfig(data: unknown): ConversionConfig {
  return parse(ConversionConfigSchema, data);
}
