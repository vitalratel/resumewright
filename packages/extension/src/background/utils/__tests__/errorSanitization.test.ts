/**
 * Tests for Error Sanitization Utility
 * Sanitize error messages
 */

import { describe, expect, it } from 'vitest';
import { sanitizeTechnicalDetails } from '../errorSanitization';

describe('sanitizeTechnicalDetails', () => {
  it('returns undefined for undefined input', () => {
    expect(sanitizeTechnicalDetails(undefined)).toBeUndefined();
  });

  it('keeps relative paths while removing absolute paths', () => {
    const details =
      'Error at /home/user/projects/resumewright/packages/extension/src/popup/App.tsx:42';
    const sanitized = sanitizeTechnicalDetails(details);
    expect(sanitized).toBe('Error at packages/extension/src/popup/App.tsx:42');
    expect(sanitized).not.toContain('/home/user');
  });

  it('handles Windows paths', () => {
    const details = 'Error at C:\\Users\\dev\\resumewright\\packages\\extension\\src\\file.ts:10';
    const sanitized = sanitizeTechnicalDetails(details);
    expect(sanitized).toContain('packages\\extension\\src\\file.ts:10');
    expect(sanitized).not.toContain('C:\\Users\\dev');
  });

  it('removes user home directories', () => {
    expect(sanitizeTechnicalDetails('/home/alice/project')).toBe('/home/[user]/project');
    expect(sanitizeTechnicalDetails('/Users/bob/project')).toBe('/Users/[user]/project');
    expect(sanitizeTechnicalDetails('C:\\Users\\charlie\\project')).toBe(
      'C:\\Users\\[user]\\project',
    );
  });

  it('removes extension IDs from stack traces', () => {
    const details = 'at chrome-extension://abcdefghijklmnopqrstuvwxyz123456/background.js:15:3';
    const sanitized = sanitizeTechnicalDetails(details);
    expect(sanitized).toContain('[extension]');
    expect(sanitized).not.toContain('abcdefghijklmnopqrstuvwxyz123456');
  });

  it('handles multiple stack frames', () => {
    const details = `Error: Test
    at /home/dev/resumewright/packages/extension/src/file1.ts:10
    at /home/dev/resumewright/packages/extension/src/file2.ts:20`;
    const sanitized = sanitizeTechnicalDetails(details);
    expect(sanitized).toContain('packages/extension/src/file1.ts:10');
    expect(sanitized).toContain('packages/extension/src/file2.ts:20');
    expect(sanitized).not.toContain('/home/dev');
  });
});
