// ABOUTME: Valibot schemas for conversion-related types.
// ABOUTME: Provides validation for status, progress, config, and error types.

import {
  boolean,
  maxLength,
  maxValue,
  minLength,
  minValue,
  number,
  object,
  optional,
  picklist,
  pipe,
  string,
} from 'valibot';

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
