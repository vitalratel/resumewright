// ABOUTME: Valibot schemas for conversion-related types.
// ABOUTME: Provides validation for status, progress, config, and error types.

import {
  array,
  boolean,
  check,
  integer,
  maxLength,
  maxValue,
  minLength,
  minValue,
  number,
  object,
  optional,
  parse,
  picklist,
  pipe,
  safeParse,
  string,
} from 'valibot';
import type {
  ConversionConfig,
  ConversionError,
  ConversionProgress,
  ConversionStatus,
} from '@/shared/types/models';

/**
 * ConversionStatus Schema
 */
const ConversionStatusSchema = picklist([
  'queued',
  'parsing',
  'extracting-metadata',
  'rendering',
  'laying-out',
  'optimizing',
  'generating-pdf',
  'completed',
  'failed',
  'cancelled',
]);

/**
 * ConversionProgress Schema
 */
const ConversionProgressSchema = pipe(
  object({
    stage: ConversionStatusSchema,
    percentage: pipe(
      number('Progress percentage must be a number'),
      minValue(0, 'Progress percentage must be between 0 and 100'),
      maxValue(100, 'Progress percentage must be between 0 and 100'),
    ),
    currentOperation: pipe(
      string('Current operation must be a string'),
      minLength(1, 'Current operation description cannot be empty'),
    ),
    estimatedTimeRemaining: optional(
      pipe(
        number('Estimated time remaining must be a number (milliseconds)'),
        integer('Estimated time remaining must be an integer (milliseconds)'),
        minValue(1, 'Estimated time remaining must be positive'),
      ),
    ),
    pagesProcessed: optional(
      pipe(
        number('Pages processed must be a number'),
        integer('Pages processed must be an integer'),
        minValue(0, 'Pages processed cannot be negative'),
      ),
    ),
    totalPages: optional(
      pipe(
        number('Total pages must be a number'),
        integer('Total pages must be an integer'),
        minValue(1, 'Total pages must be positive'),
      ),
    ),
  }),
  check((data) => {
    // If pagesProcessed is provided, totalPages must also be provided
    if (data.pagesProcessed !== undefined && data.totalPages === undefined) {
      return false;
    }
    // pagesProcessed cannot exceed totalPages
    if (
      data.pagesProcessed !== undefined &&
      data.totalPages !== undefined &&
      data.pagesProcessed > data.totalPages
    ) {
      return false;
    }
    return true;
  }, 'Invalid page count: pagesProcessed must be <= totalPages, and both must be provided together'),
);

/**
 * ConversionConfig Schema
 */
export const ConversionConfigSchema = object({
  pageSize: picklist(['Letter', 'A4', 'Legal']),
  margin: object({
    top: pipe(
      number('Top margin must be a number'),
      minValue(0, 'Top margin cannot be negative'),
      maxValue(2, 'Top margin must be between 0 and 2 inches'),
    ),
    right: pipe(
      number('Right margin must be a number'),
      minValue(0, 'Right margin cannot be negative'),
      maxValue(2, 'Right margin must be between 0 and 2 inches'),
    ),
    bottom: pipe(
      number('Bottom margin must be a number'),
      minValue(0, 'Bottom margin cannot be negative'),
      maxValue(2, 'Bottom margin must be between 0 and 2 inches'),
    ),
    left: pipe(
      number('Left margin must be a number'),
      minValue(0, 'Left margin cannot be negative'),
      maxValue(2, 'Left margin must be between 0 and 2 inches'),
    ),
  }),
  fontSize: pipe(
    number('Font size must be a number'),
    minValue(6, 'Font size must be between 6 and 72 points'),
    maxValue(72, 'Font size must be between 6 and 72 points'),
  ),
  fontFamily: pipe(
    string('Font family must be a string'),
    minLength(1, 'Font family cannot be empty'),
    maxLength(100, 'Font family name too long (max 100 characters)'),
  ),
  filename: optional(
    pipe(
      string('Filename must be a string'),
      maxLength(255, 'Filename too long (max 255 characters)'),
    ),
  ),
  compress: boolean('Compress must be a boolean'),
  atsOptimization: optional(boolean('ATS optimization must be a boolean')),
  includeMetadata: optional(boolean('Include metadata must be a boolean')),
});

/**
 * ConversionError Schema
 */
const ConversionErrorSchema = object({
  stage: ConversionStatusSchema,
  code: pipe(
    string('Error code must be a string'),
    minLength(1, 'Error code cannot be empty'),
    maxLength(100, 'Error code too long (max 100 characters)'),
  ),
  message: pipe(
    string('Error message must be a string'),
    minLength(1, 'Error message cannot be empty'),
    maxLength(500, 'Error message too long (max 500 characters)'),
  ),
  technicalDetails: optional(
    pipe(
      string('Technical details must be a string'),
      maxLength(2000, 'Technical details too long (max 2000 characters)'),
    ),
  ),
  recoverable: boolean('Recoverable must be a boolean'),
  suggestions: array(
    pipe(
      string('Suggestion must be a string'),
      minLength(1, 'Suggestion cannot be empty'),
      maxLength(200, 'Suggestion too long (max 200 characters)'),
    ),
  ),
});

/**
 * Validation Functions
 */

export function validateConversionStatus(data: unknown): data is ConversionStatus {
  return safeParse(ConversionStatusSchema, data).success;
}

export function validateConversionProgress(data: unknown): data is ConversionProgress {
  return safeParse(ConversionProgressSchema, data).success;
}

export function validateConversionConfig(data: unknown): data is ConversionConfig {
  return safeParse(ConversionConfigSchema, data).success;
}

export function validateConversionError(data: unknown): data is ConversionError {
  return safeParse(ConversionErrorSchema, data).success;
}

/**
 * Parse Functions
 */

export function parseConversionConfig(data: unknown): ConversionConfig {
  return parse(ConversionConfigSchema, data);
}
