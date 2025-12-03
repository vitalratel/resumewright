// ABOUTME: Tests for TSX file and syntax validation.
// ABOUTME: Verifies file checks, WASM status polling, and syntax validation.

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ILogger } from '../../infrastructure/logging/logger';
import type { TsxToPdfConverter } from './types';
import { validateTsxFile, validateTsxSyntax } from './validation';

const mockLogger: ILogger = {
  setLevel: vi.fn(),
  getLevel: vi.fn(() => 0),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Mock messaging using vi.hoisted for proper hoisting
const mocks = vi.hoisted(() => ({
  sendMessage: vi.fn(),
}));

vi.mock('@/shared/messaging', () => ({
  sendMessage: mocks.sendMessage,
  onMessage: vi.fn(),
}));

vi.mock('../../infrastructure/wasm', () => ({
  getConverter: vi.fn(() => ({
    detect_fonts: vi.fn(() => '[]'),
  })),
}));

vi.mock('./wasmSchemas', () => ({
  parseFontRequirements: vi.fn(() => []),
}));

/** Create a mock TsxToPdfConverter with optional overrides */
function createMockConverter(overrides?: Partial<TsxToPdfConverter>): TsxToPdfConverter {
  return {
    detect_fonts: vi.fn(() => '[]'),
    convert_tsx_to_pdf: vi.fn(() => []),
    free: vi.fn(),
    ...overrides,
  };
}

describe('validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.sendMessage.mockReset();
  });

  describe('validateTsxFile', () => {
    const validContent = 'export default function CV() { return <div>CV</div>; }';

    it('should reject non-tsx files', async () => {
      const result = await validateTsxFile('content', 1000, 'file.txt', mockLogger);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('.tsx or .ts');
    });

    it('should accept .ts files', async () => {
      mocks.sendMessage
        .mockResolvedValueOnce({ initialized: true })
        .mockResolvedValueOnce({ valid: true });

      const result = await validateTsxFile(validContent, 1000, 'file.ts', mockLogger);
      expect(result.valid).toBe(true);
    });

    it('should reject files that are too small', async () => {
      const result = await validateTsxFile('x', 1, 'file.tsx', mockLogger);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too small');
    });

    it('should reject files at exactly MIN_VALID - 1 bytes', async () => {
      // MIN_VALID is 50 bytes, so 49 should be rejected
      const result = await validateTsxFile('x'.repeat(49), 49, 'file.tsx', mockLogger);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too small');
    });

    it('should accept files at exactly MIN_VALID bytes', async () => {
      mocks.sendMessage
        .mockResolvedValueOnce({ initialized: true })
        .mockResolvedValueOnce({ valid: true });

      // MIN_VALID is 50 bytes
      const result = await validateTsxFile(validContent, 50, 'file.tsx', mockLogger);
      expect(result.valid).toBe(true);
    });

    it('should warn on large files', async () => {
      mocks.sendMessage
        .mockResolvedValueOnce({ initialized: true })
        .mockResolvedValueOnce({ valid: true });

      // SIZE_LIMITS.LARGE_WARNING = 500KB = 500_000 bytes
      const largeContent = `export default function CV() { return <div>CV</div>; }${'x'.repeat(500050)}`;
      const result = await validateTsxFile(largeContent, 500100, 'file.tsx', mockLogger);

      expect(result.valid).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings?.[0]).toContain('Large file');
      expect(result.warnings?.[0]).toContain('488KB'); // 500100 / 1024 ≈ 488
    });

    it('should not warn at exactly LARGE_WARNING bytes', async () => {
      mocks.sendMessage
        .mockResolvedValueOnce({ initialized: true })
        .mockResolvedValueOnce({ valid: true });

      // SIZE_LIMITS.LARGE_WARNING = 500_000 bytes - at boundary, no warning
      const result = await validateTsxFile(validContent, 500000, 'file.tsx', mockLogger);

      expect(result.valid).toBe(true);
      expect(result.warnings).toBeUndefined();
    });

    it('should warn at LARGE_WARNING + 1 bytes', async () => {
      mocks.sendMessage
        .mockResolvedValueOnce({ initialized: true })
        .mockResolvedValueOnce({ valid: true });

      // SIZE_LIMITS.LARGE_WARNING = 500_000 bytes - just over triggers warning
      const result = await validateTsxFile(validContent, 500001, 'file.tsx', mockLogger);

      expect(result.valid).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings?.[0]).toContain('Large file');
    });

    it('should reject files without JSX', async () => {
      const result = await validateTsxFile('const x = 5;', 100, 'file.tsx', mockLogger);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('JSX markup');
    });

    it('should reject files with only < but no >', async () => {
      const result = await validateTsxFile('const x = 5 < 10;', 100, 'file.tsx', mockLogger);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('JSX markup');
    });

    it('should reject files with only > but no <', async () => {
      const result = await validateTsxFile('const x = 10 > 5;', 100, 'file.tsx', mockLogger);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('JSX markup');
    });

    it('should reject files without return statement', async () => {
      const result = await validateTsxFile('<div>test</div>', 100, 'file.tsx', mockLogger);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('return statement');
    });

    it('should wait for WASM initialization', async () => {
      mocks.sendMessage
        .mockResolvedValueOnce({ initialized: false })
        .mockResolvedValueOnce({ initialized: true })
        .mockResolvedValueOnce({ valid: true });

      const result = await validateTsxFile(validContent, 1000, 'file.tsx', mockLogger);
      expect(result.valid).toBe(true);
    });

    it('should handle WASM initialization errors', async () => {
      mocks.sendMessage.mockResolvedValueOnce({ initialized: false, error: 'WASM failed' });

      const result = await validateTsxFile(validContent, 1000, 'file.tsx', mockLogger);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('initialization failed');
    });

    it('should succeed when WASM has no error', async () => {
      // Contrast test: initialized false WITHOUT error should retry, not fail
      mocks.sendMessage
        .mockResolvedValueOnce({ initialized: false }) // No error field
        .mockResolvedValueOnce({ initialized: true })
        .mockResolvedValueOnce({ valid: true });

      const result = await validateTsxFile(validContent, 1000, 'file.tsx', mockLogger);
      expect(result.valid).toBe(true);
    });

    it('should return timeout error when WASM never initializes', async () => {
      vi.useFakeTimers();

      // Always return not initialized, no error - should eventually timeout
      mocks.sendMessage.mockResolvedValue({ initialized: false });

      const resultPromise = validateTsxFile(validContent, 1000, 'file.tsx', mockLogger);

      // Advance time to exactly the timeout boundary (15000ms)
      // The condition is >= so at exactly 15000ms it should timeout
      await vi.advanceTimersByTimeAsync(15000);

      const result = await resultPromise;

      expect(result.valid).toBe(false);
      // Must contain the specific timeout message, not undefined
      expect(result.error).toContain('still initializing');
      expect(result.error).toBeDefined();

      vi.useRealTimers();
    });

    it('should validate syntax via background worker', async () => {
      mocks.sendMessage
        .mockResolvedValueOnce({ initialized: true })
        .mockResolvedValueOnce({ valid: true });

      const result = await validateTsxFile(validContent, 1000, 'file.tsx', mockLogger);

      expect(result.valid).toBe(true);
      expect(mocks.sendMessage).toHaveBeenCalledWith('getWasmStatus', {});
      expect(mocks.sendMessage).toHaveBeenCalledWith('validateTsx', { tsx: validContent });
    });

    it('should handle invalid syntax', async () => {
      mocks.sendMessage
        .mockResolvedValueOnce({ initialized: true })
        .mockResolvedValueOnce({ valid: false });

      const result = await validateTsxFile(validContent, 1000, 'file.tsx', mockLogger);
      expect(result.valid).toBe(false);
    });

    describe('error messages for invalid syntax', () => {
      it('should mention missing export when no export statement', async () => {
        mocks.sendMessage
          .mockResolvedValueOnce({ initialized: true })
          .mockResolvedValueOnce({ valid: false });

        // Content with JSX and return but no export
        const noExport = 'function CV() { return <div>CV</div>; }';
        const result = await validateTsxFile(noExport, 1000, 'file.tsx', mockLogger);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('Missing export');
      });

      it('should mention missing function when export but no function', async () => {
        mocks.sendMessage
          .mockResolvedValueOnce({ initialized: true })
          .mockResolvedValueOnce({ valid: false });

        // Content with export and return but no function or arrow
        const noFunction = 'export const CV = "test"; return <div>CV</div>;';
        const result = await validateTsxFile(noFunction, 1000, 'file.tsx', mockLogger);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('No component function');
      });

      it('should accept arrow function components', async () => {
        mocks.sendMessage
          .mockResolvedValueOnce({ initialized: true })
          .mockResolvedValueOnce({ valid: false });

        // Arrow function component - should not trigger "No component function" error
        const arrowComponent = 'export const CV = () => { return <div>CV</div>; }';
        const result = await validateTsxFile(arrowComponent, 1000, 'file.tsx', mockLogger);

        expect(result.valid).toBe(false);
        // Should NOT contain "No component function" since it has =>
        expect(result.error).not.toContain('No component function');
      });

      it('should mention React imports when has imports but no React', async () => {
        mocks.sendMessage
          .mockResolvedValueOnce({ initialized: true })
          .mockResolvedValueOnce({ valid: false });

        // Content with export, function, return but import without React
        const noReact =
          "import { useState } from 'hooks'; export function CV() { return <div>CV</div>; }";
        const result = await validateTsxFile(noReact, 1000, 'file.tsx', mockLogger);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('React imports');
      });

      it('should show generic message for other syntax errors', async () => {
        mocks.sendMessage
          .mockResolvedValueOnce({ initialized: true })
          .mockResolvedValueOnce({ valid: false });

        // Content that passes all heuristics but still fails WASM validation
        const result = await validateTsxFile(validContent, 1000, 'file.tsx', mockLogger);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('exported the TSX file correctly');
      });

      it('should always include base error message', async () => {
        mocks.sendMessage
          .mockResolvedValueOnce({ initialized: true })
          .mockResolvedValueOnce({ valid: false });

        // Any content that fails WASM validation should include the base message
        const noExport = 'function CV() { return <div>CV</div>; }';
        const result = await validateTsxFile(noExport, 1000, 'file.tsx', mockLogger);

        expect(result.valid).toBe(false);
        expect(result.error).toContain("doesn't appear to be a valid CV file");
      });
    });
  });

  describe('validateTsxSyntax', () => {
    it('should validate correct TSX', async () => {
      const mockConverter = createMockConverter();

      const result = await validateTsxSyntax('valid tsx', mockLogger, mockConverter);
      expect(result).toBe(true);
    });

    it('should reject empty string', async () => {
      const mockConverter = createMockConverter();

      const result = await validateTsxSyntax('', mockLogger, mockConverter);
      expect(result).toBe(false);
    });

    it('should reject whitespace-only string', async () => {
      const mockConverter = createMockConverter();

      const result = await validateTsxSyntax('   \n\t  ', mockLogger, mockConverter);
      expect(result).toBe(false);
    });

    it('should handle WASM errors', async () => {
      const mockConverter = createMockConverter({
        detect_fonts: vi.fn(() => {
          throw new Error('Parse error');
        }),
      });

      const result = await validateTsxSyntax('invalid', mockLogger, mockConverter);
      expect(result).toBe(false);
    });

    it('should handle font parsing errors', async () => {
      const { parseFontRequirements } = await import('./wasmSchemas');
      vi.mocked(parseFontRequirements).mockImplementation(() => {
        throw new Error('Parse error');
      });

      const mockConverter = createMockConverter();

      const result = await validateTsxSyntax('tsx', mockLogger, mockConverter);
      expect(result).toBe(false);
    });
  });
});
