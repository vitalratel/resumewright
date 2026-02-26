// ABOUTME: Tests for TSX file and syntax validation.
// ABOUTME: Verifies file checks, WASM status polling, and syntax validation.

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ILogger } from '../../infrastructure/logging/logger';
import type { TsxToPdfConverter } from './types';
import { validateTsxSyntax } from './validation';

const mockLogger: ILogger = {
  setLevel: vi.fn(),
  getLevel: vi.fn(() => 0),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

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
  });

  describe('validateTsxSyntax', () => {
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
      const mockConverter = createMockConverter({
        detect_fonts: vi.fn(() => '{invalid json}'),
      });

      const result = await validateTsxSyntax('tsx', mockLogger, mockConverter);
      expect(result).toBe(false);
    });
  });
});
