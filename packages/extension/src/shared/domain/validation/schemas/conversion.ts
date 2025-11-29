/**
 * Conversion Validation Schemas
 *
 * Valibot schemas and validation functions for conversion-related types.
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
  array,
  boolean,
  check,
  date,
  instance,
  integer,
  literal,
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
  union,
} from '../valibot';
import { CVDocumentSchema } from './cv';

/**
 * ConversionStatus Schema
 */
export const ConversionStatusSchema = picklist([
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
 * Added descriptive validation error messages
 */
export const ConversionProgressSchema = pipe(
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
    estimatedTimeRemaining: optional(pipe(
      number('Estimated time remaining must be a number (milliseconds)'),
      integer('Estimated time remaining must be an integer (milliseconds)'),
      minValue(1, 'Estimated time remaining must be positive'),
    )),
    pagesProcessed: optional(pipe(
      number('Pages processed must be a number'),
      integer('Pages processed must be an integer'),
      minValue(0, 'Pages processed cannot be negative'),
    )),
    totalPages: optional(pipe(
      number('Total pages must be a number'),
      integer('Total pages must be an integer'),
      minValue(1, 'Total pages must be positive'),
    )),
  }),
  check((data) => {
    // If pagesProcessed is provided, totalPages must also be provided
    if (data.pagesProcessed !== undefined && data.totalPages === undefined) {
      return false;
    }
    // pagesProcessed cannot exceed totalPages
    if (
      data.pagesProcessed !== undefined
      && data.totalPages !== undefined
      && data.pagesProcessed > data.totalPages
    ) {
      return false;
    }
    return true;
  }, 'Invalid page count: pagesProcessed must be <= totalPages, and both must be provided together'),
);

/**
 * ConversionConfig Schema
 * Added descriptive validation error messages
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
  filename: optional(pipe(
    string('Filename must be a string'),
    maxLength(255, 'Filename too long (max 255 characters)'),
  )),
  compress: boolean('Compress must be a boolean'),
  atsOptimization: optional(boolean('ATS optimization must be a boolean')),
  includeMetadata: optional(boolean('Include metadata must be a boolean')),
});

/**
 * ConversionError Schema
 * Added descriptive validation error messages
 */
export const ConversionErrorSchema = object({
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
  technicalDetails: optional(pipe(
    string('Technical details must be a string'),
    maxLength(2000, 'Technical details too long (max 2000 characters)'),
  )),
  recoverable: boolean('Recoverable must be a boolean'),
  suggestions: array(pipe(
    string('Suggestion must be a string'),
    minLength(1, 'Suggestion cannot be empty'),
    maxLength(200, 'Suggestion too long (max 200 characters)'),
  )),
});

/**
 * PDFMetadata Schema
 * Added descriptive validation error messages
 */
export const PDFMetadataSchema = pipe(
  object({
    title: pipe(
      string('PDF title must be a string'),
      minLength(1, 'PDF title cannot be empty'),
      maxLength(500, 'PDF title too long (max 500 characters)'),
    ),
    author: optional(pipe(
      string('PDF author must be a string'),
      maxLength(200, 'PDF author name too long (max 200 characters)'),
    )),
    subject: optional(pipe(
      string('PDF subject must be a string'),
      maxLength(500, 'PDF subject too long (max 500 characters)'),
    )),
    keywords: optional(array(pipe(
      string('Keyword must be a string'),
      minLength(1, 'Keyword cannot be empty'),
      maxLength(100, 'Keyword too long (max 100 characters)'),
    ))),
    creator: pipe(
      string('PDF creator must be a string'),
      minLength(1, 'PDF creator cannot be empty'),
      maxLength(100, 'PDF creator name too long (max 100 characters)'),
    ),
    producer: pipe(
      string('PDF producer must be a string'),
      minLength(1, 'PDF producer cannot be empty'),
      maxLength(100, 'PDF producer name too long (max 100 characters)'),
    ),
    creationDate: date('Creation date must be a date'),
    modificationDate: optional(date('Modification date must be a date')),
    pageCount: pipe(
      number('PDF page count must be a number'),
      integer('PDF page count must be an integer'),
      minValue(1, 'PDF page count must be positive'),
      maxValue(1000, 'PDF page count too high (max 1000 pages)'),
    ),
    fileSize: pipe(
      number('PDF file size must be a number'),
      integer('PDF file size must be an integer (bytes)'),
      minValue(0, 'PDF file size cannot be negative'),
    ),
  }),
  check((data) => {
    // modificationDate must be after creationDate if provided
    if (data.modificationDate && data.modificationDate < data.creationDate) {
      return false;
    }
    return true;
  }, 'Invalid dates: PDF modification date must be after creation date'),
);

/**
 * ConversionJob Schema
 */
export const ConversionJobSchema = pipe(
  object({
    id: pipe(
      string('Job ID must be a string'),
      minLength(1, 'Job ID cannot be empty'),
      maxLength(100, 'Job ID too long (max 100 characters)'),
    ),
    cvDocument: CVDocumentSchema,
    status: ConversionStatusSchema,
    progress: ConversionProgressSchema,
    config: ConversionConfigSchema,
    result: optional(union([
      object({
        success: literal(true),
        pdfBytes: instance(Uint8Array, 'PDF bytes must be a Uint8Array'),
        metadata: PDFMetadataSchema,
      }),
      object({
        success: literal(false),
        error: ConversionErrorSchema,
      }),
    ])),
    startTime: pipe(
      number('Start time must be a number'),
      integer('Start time must be an integer'),
      minValue(1, 'Start time must be positive'),
    ),
    endTime: optional(pipe(
      number('End time must be a number'),
      integer('End time must be an integer'),
      minValue(1, 'End time must be positive'),
    )),
  }),
  check((data) => {
    // endTime must be after startTime if provided
    if (data.endTime !== undefined && data.endTime < data.startTime) {
      return false;
    }
    return true;
  }, 'endTime must be after startTime'),
);

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

export function validatePDFMetadata(data: unknown): data is PDFMetadata {
  return safeParse(PDFMetadataSchema, data).success;
}

export function validateConversionJob(data: unknown): data is ConversionJob {
  return safeParse(ConversionJobSchema, data).success;
}

/**
 * Parse Functions
 */

export function parseConversionConfig(data: unknown): ConversionConfig {
  return parse(ConversionConfigSchema, data);
}
