// ABOUTME: Tests for shared validation utilities.
// ABOUTME: Covers formatValidationIssues helper.

import { describe, expect, it } from 'vitest';
import { formatValidationIssues } from '../utils';

describe('formatValidationIssues', () => {
  it('should format issue with path using dot separator', () => {
    const issues = [
      {
        message: 'Expected string',
        path: [{ key: 'margin' }, { key: 'top' }],
      },
    ];

    const result = formatValidationIssues(issues);

    expect(result).toBe('margin.top: Expected string');
  });

  it('should use root for issues without path', () => {
    const issues = [
      {
        message: 'Expected string',
        path: undefined,
      },
    ];

    const result = formatValidationIssues(issues);

    expect(result).toBe('root: Expected string');
  });

  it('should use root for issues with null path', () => {
    const issues = [
      {
        message: 'Expected string',
        path: null,
      },
    ];

    const result = formatValidationIssues(issues);

    expect(result).toBe('root: Expected string');
  });

  it('should use root for empty path array', () => {
    const issues = [
      {
        message: 'Expected string',
        path: [],
      },
    ];

    const result = formatValidationIssues(issues);

    expect(result).toBe('root: Expected string');
  });

  it('should join multiple issues with comma separator', () => {
    const issues = [
      {
        message: 'First error',
        path: [{ key: 'field1' }],
      },
      {
        message: 'Second error',
        path: [{ key: 'field2' }],
      },
    ];

    const result = formatValidationIssues(issues);

    expect(result).toBe('field1: First error, field2: Second error');
  });

  it('should handle deeply nested paths', () => {
    const issues = [
      {
        message: 'Expected number',
        path: [{ key: 'config' }, { key: 'margin' }, { key: 'top' }],
      },
    ];

    const result = formatValidationIssues(issues);

    expect(result).toBe('config.margin.top: Expected number');
  });
});
