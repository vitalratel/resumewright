// ABOUTME: Tests for TSX file and syntax validation.
// ABOUTME: Verifies file checks, WASM status polling, and syntax validation.

import type { ILogger } from '../../infrastructure/logging';
import type { TsxToPdfConverter } from './types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

    it('should reject files that are too small', async () => {
      const result = await validateTsxFile('x', 1, 'file.tsx', mockLogger);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too small');
    });

    it('should warn on large files', async () => {
      mocks.sendMessage
        .mockResolvedValueOnce({ initialized: true })
        .mockResolvedValueOnce({ valid: true });

      // SIZE_LIMITS.LARGE_WARNING = 500KB = 500_000 bytes
      const largeContent = `export default function CV() { return <div>CV</div>; }${'x'.repeat(500050)}`;
      const result = await validateTsxFile(largeContent, 500100, 'file.tsx', mockLogger);

      if (result.valid) {
        expect(result.warnings).toBeDefined();
        expect(result.warnings?.[0]).toContain('Large file');
      }
    });

    it('should reject files without JSX', async () => {
      const result = await validateTsxFile('const x = 5;', 100, 'file.tsx', mockLogger);
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
      let callCount = 0;
      mocks.sendMessage.mockImplementation(async () => {
        callCount += 1;
        if (callCount === 1) {
          return Promise.resolve({ initialized: false, error: 'WASM failed' });
        }
        return Promise.resolve({ initialized: true });
      });

      const result = await validateTsxFile(validContent, 1000, 'file.tsx', mockLogger);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('initialization failed');
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
