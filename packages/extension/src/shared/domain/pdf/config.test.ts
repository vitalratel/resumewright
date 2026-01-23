/**
 * PDF Config Tests
 * Tests for configuration conversion and validation
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { err, ok } from '@/shared/errors/result';
import type { ILogger } from '../../infrastructure/logging/logger';
import type { ConversionConfig } from '../../types/models';
import { convertConfigToRust } from './config';
import type { WasmPdfConfig } from './types';

import { validateWasmPdfConfig } from './wasmSchemas';

const mockLogger: ILogger = {
  setLevel: vi.fn(),
  getLevel: vi.fn(() => 0),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Mock logger
vi.mock('../../infrastructure/logging/instance', () => ({
  getLogger: vi.fn(),
}));

// Mock validateWasmPdfConfig
vi.mock('./wasmSchemas', () => ({
  validateWasmPdfConfig: vi.fn(),
}));

describe('PDF Config', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Setup default mock implementation for validateWasmPdfConfig
    const { validateWasmPdfConfig } = await import('./wasmSchemas');
    vi.mocked(validateWasmPdfConfig).mockImplementation((config: unknown) =>
      ok(config as WasmPdfConfig),
    );

    // Setup default mock implementation for getLogger
    const { getLogger } = await import('../../infrastructure/logging/instance');
    vi.mocked(getLogger).mockReturnValue({
      debug: vi.fn(),
      error: vi.fn(),
    } as never);
  });

  describe('convertConfigToRust', () => {
    const validConfig: ConversionConfig = {
      pageSize: 'Letter',
      margin: {
        top: 0.5,
        right: 0.5,
        bottom: 0.5,
        left: 0.5,
      },
      fontSize: 12,
      fontFamily: 'Arial',
      filename: 'resume.pdf',
      compress: true,
      atsOptimization: true,
      includeMetadata: true,
    };

    it('should convert valid config to WASM format', () => {
      const result = convertConfigToRust(validConfig, mockLogger);

      expect(result).toBeDefined();
      expect(result.page_size).toBe('Letter');
      expect(result.margin.top).toBe(36); // 0.5 inches = 36 points
      expect(result.margin.right).toBe(36);
      expect(result.margin.bottom).toBe(36);
      expect(result.margin.left).toBe(36);
      expect(result.title).toBe('resume.pdf');
      expect(result.subject).toBe('Curriculum Vitae');
    });

    it('should use default filename when not provided', () => {
      const configWithoutFilename = { ...validConfig, filename: '' };
      const result = convertConfigToRust(configWithoutFilename, mockLogger);

      expect(result.title).toBeDefined();
      expect(result.title).not.toBe('');
    });

    it('should convert A4 page size', () => {
      const a4Config = { ...validConfig, pageSize: 'A4' as const };
      const result = convertConfigToRust(a4Config, mockLogger);

      expect(result.page_size).toBe('A4');
    });

    it('should convert different margin values', () => {
      const customMarginConfig = {
        ...validConfig,
        margin: { top: 1, right: 0.75, bottom: 1, left: 0.75 },
      };
      const result = convertConfigToRust(customMarginConfig, mockLogger);

      expect(result.margin.top).toBe(72); // 1 inch
      expect(result.margin.right).toBe(54); // 0.75 inches
      expect(result.margin.bottom).toBe(72);
      expect(result.margin.left).toBe(54);
    });

    it('should handle config validation failure', () => {
      // Test error handler when validation fails
      vi.mocked(validateWasmPdfConfig).mockImplementationOnce(() =>
        err({ type: 'schema_mismatch', message: 'Invalid page size' }),
      );

      expect(() => convertConfigToRust(validConfig, mockLogger)).toThrow('Invalid page size');
    });

    it('should log error when validation fails', async () => {
      // Verify error logging
      const { getLogger } = await import('../../infrastructure/logging/instance');
      const localMockLogger: ILogger = {
        setLevel: vi.fn(),
        getLevel: vi.fn(() => 0),
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      };
      vi.mocked(getLogger).mockReturnValue(localMockLogger as never);

      const validationError = {
        type: 'schema_mismatch' as const,
        message: 'Config validation error',
      };
      vi.mocked(validateWasmPdfConfig).mockImplementationOnce(() => err(validationError));

      try {
        convertConfigToRust(validConfig, localMockLogger);
      } catch {
        // Expected to throw
      }

      expect(localMockLogger.error).toHaveBeenCalledWith(
        'PdfConfig',
        'Config validation failed',
        validationError,
      );
    });

    it('should handle validation error with schema_mismatch type', () => {
      // Test different error types
      vi.mocked(validateWasmPdfConfig).mockImplementationOnce(() =>
        err({ type: 'schema_mismatch', message: 'Invalid type' }),
      );

      expect(() => convertConfigToRust(validConfig, mockLogger)).toThrow('Invalid type');
    });

    it('should set PDF/A-1b standard for ATS compatibility', () => {
      const result = convertConfigToRust(validConfig, mockLogger);

      expect(result.standard).toBe('PDFA1b');
    });

    it('should set null values for optional metadata fields', () => {
      const result = convertConfigToRust(validConfig, mockLogger);

      expect(result.author).toBeNull();
      expect(result.keywords).toBeNull();
    });
  });
});
