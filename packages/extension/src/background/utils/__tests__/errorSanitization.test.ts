/**
 * Tests for Error Sanitization Utility
 * Sanitize error messages
 */

import { describe, expect, it } from 'vitest';
import {
  sanitizeErrorForLogging,
  sanitizeErrorMessage,
  sanitizeTechnicalDetails,
} from '../errorSanitization';

describe('sanitizeErrorMessage', () => {
  describe('File Path Sanitization', () => {
    it('removes Unix absolute file paths', () => {
      const message = 'Failed at /Users/dev/resumewright/file.tsx:123';
      expect(sanitizeErrorMessage(message)).toBe('Failed at [file]:123');
    });

    it('removes Windows absolute file paths', () => {
      const message = 'Failed at C:\\Users\\dev\\resumewright\\file.tsx:123';
      expect(sanitizeErrorMessage(message)).toBe('Failed at [file]:123');
    });

    it('removes multiple file paths in same message', () => {
      const message = 'Error in /path/to/file1.ts and /path/to/file2.rs';
      expect(sanitizeErrorMessage(message)).toBe('Error in [file] and [file]');
    });

    it('handles .tsx, .ts, .jsx, .js, .rs, .wasm extensions', () => {
      expect(sanitizeErrorMessage('Error: /path/file.tsx')).toBe('Error: [file]');
      expect(sanitizeErrorMessage('Error: /path/file.ts')).toBe('Error: [file]');
      expect(sanitizeErrorMessage('Error: /path/file.jsx')).toBe('Error: [file]');
      expect(sanitizeErrorMessage('Error: /path/file.js')).toBe('Error: [file]');
      expect(sanitizeErrorMessage('Error: /path/file.rs')).toBe('Error: [file]');
      expect(sanitizeErrorMessage('Error: /path/file.wasm')).toBe('Error: [file]');
    });

    it('removes file:// URIs', () => {
      const message = 'Failed to load file:///Users/dev/file.wasm';
      expect(sanitizeErrorMessage(message)).toBe('Failed to load [file-uri]');
    });
  });

  describe('Extension ID Sanitization', () => {
    it('removes Chrome extension IDs', () => {
      const message = 'Error at chrome-extension://abcdefghijklmnopqrstuvwxyz123456/background.js';
      expect(sanitizeErrorMessage(message)).toBe('Error at [extension]/background.js');
    });

    it('removes Firefox extension UUIDs', () => {
      const message = 'Error at moz-extension://12345678-1234-1234-1234-123456789abc/popup.html';
      expect(sanitizeErrorMessage(message)).toBe('Error at [extension]/popup.html');
    });

    it('handles case-insensitive extension IDs', () => {
      const message = 'Error: CHROME-EXTENSION://ABCDEFGHIJKLMNOPQRSTUVWXYZ123456';
      expect(sanitizeErrorMessage(message)).toBe('Error: [extension]');
    });
  });

  describe('Friendly Message Replacements', () => {
    it('replaces WASM initialization errors', () => {
      const message = 'WASM module not initialized';
      expect(sanitizeErrorMessage(message)).toContain('PDF generator is still loading');
    });

    it('replaces WebAssembly instantiation errors', () => {
      const message = 'WebAssembly instantiation failed';
      expect(sanitizeErrorMessage(message)).toContain('PDF generator is still loading');
    });

    it('replaces invalid WASM module errors', () => {
      const message = 'Invalid WASM module detected';
      expect(sanitizeErrorMessage(message)).toContain('failed to initialize');
    });

    it('replaces memory errors', () => {
      const message = 'Out of memory at line 42';
      expect(sanitizeErrorMessage(message)).toContain('CV is too large');
    });

    it('replaces parse errors', () => {
      const message = 'Parse error: unexpected token';
      expect(sanitizeErrorMessage(message)).toContain('error reading your CV file');
    });

    it('replaces network errors', () => {
      const message = 'Network error: Failed to fetch';
      expect(sanitizeErrorMessage(message)).toContain('check your internet connection');
    });

    it('replaces font errors', () => {
      const message = 'Font not found: Arial';
      expect(sanitizeErrorMessage(message)).toContain('font could not be loaded');
    });

    it('is case-insensitive for pattern matching', () => {
      expect(sanitizeErrorMessage('OUT OF MEMORY')).toContain('CV is too large');
      expect(sanitizeErrorMessage('syntax error')).toContain('error reading your CV file');
    });
  });

  describe('Preserves Safe Content', () => {
    it('preserves user-friendly error messages unchanged', () => {
      const message = 'Invalid page size selected';
      expect(sanitizeErrorMessage(message)).toBe('Invalid page size selected');
    });

    it('preserves line numbers and column positions', () => {
      const message = 'Error at [file]:123:45';
      expect(sanitizeErrorMessage(message)).toBe('Error at [file]:123:45');
    });

    it('preserves relative file references', () => {
      const message = 'Error in background.js line 42';
      expect(sanitizeErrorMessage(message)).toBe('Error in background.js line 42');
    });
  });
});

describe('sanitizeTechnicalDetails', () => {
  it('returns undefined for undefined input', () => {
    expect(sanitizeTechnicalDetails(undefined)).toBeUndefined();
  });

  it('keeps relative paths while removing absolute paths', () => {
    const details = 'Error at /home/user/projects/resumewright/packages/extension/src/popup/App.tsx:42';
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
    expect(sanitizeTechnicalDetails('C:\\Users\\charlie\\project')).toBe('C:\\Users\\[user]\\project');
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

describe('sanitizeErrorForLogging', () => {
  it('preserves error name and message', () => {
    const error = new Error('Test error message');
    error.name = 'CustomError';
    const sanitized = sanitizeErrorForLogging(error);

    expect(sanitized.message).toBe('Test error message');
    expect(sanitized.name).toBe('CustomError');
  });

  it('sanitizes stack trace', () => {
    const error = new Error('Test');
    error.stack = 'Error: Test\n    at /home/user/resumewright/packages/extension/src/file.ts:10';
    const sanitized = sanitizeErrorForLogging(error);

    expect(sanitized.stack).toContain('packages/extension/src/file.ts:10');
    expect(sanitized.stack).not.toContain('/home/user');
  });

  it('handles errors without stack traces', () => {
    const error = new Error('Test');
    error.stack = undefined;
    const sanitized = sanitizeErrorForLogging(error);

    expect(sanitized.message).toBe('Test');
    expect(sanitized.stack).toBeUndefined();
  });
});

describe('Integration Scenarios', () => {
  it('sanitizes real WASM loading error', () => {
    const message = 'Failed to load /Users/dev/resumewright/pkg/wasm_bridge_bg.wasm: WASM module not initialized';
    const sanitized = sanitizeErrorMessage(message);

    expect(sanitized).toContain('PDF generator is still loading');
    expect(sanitized).not.toContain('/Users/dev');
    expect(sanitized).not.toContain('wasm_bridge_bg.wasm');
  });

  it('sanitizes real parse error with file path', () => {
    const message = 'Parse error at /home/dev/resumewright/packages/extension/src/content/parser.ts:142';
    const sanitized = sanitizeErrorMessage(message);

    expect(sanitized).toContain('error reading your CV file');
    expect(sanitized).not.toContain('/home/dev');
  });

  it('sanitizes extension error with ID', () => {
    const message = 'Failed at chrome-extension://abcdefghijklmnopqrstuvwxyz123456/background.js: Out of memory';
    const sanitized = sanitizeErrorMessage(message);

    expect(sanitized).toContain('CV is too large');
    expect(sanitized).not.toContain('chrome-extension://');
    expect(sanitized).not.toContain('abcdefghijklmnopqrstuvwxyz123456');
  });
});
