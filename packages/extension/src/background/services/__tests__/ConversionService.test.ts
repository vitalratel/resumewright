/**
 * Tests for ConversionService
 *
 * Tests business logic for PDF conversion:
 * - CV metadata extraction from TSX
 * - Configuration loading with fallbacks
 * - Filename generation from metadata
 * - Complete conversion workflow orchestration
 */

import type { ConversionRequestPayload } from '../../../shared/types/messages';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_USER_SETTINGS } from '@/shared/domain/settings/migrations';
import { ConversionService } from '../ConversionService';

// Mock dependencies
vi.mock('@pkg/wasm_bridge', () => ({
  extract_cv_metadata: vi.fn(),
  LayoutType: {
    SingleColumn: 0,
    TwoColumn: 1,
    Academic: 2,
    Portfolio: 3,
    Custom: 4,
  },
  FontComplexity: {
    Simple: 0,
    Moderate: 1,
    Complex: 2,
  },
}));

vi.mock('@/shared/infrastructure/settings/SettingsStore', () => ({
  settingsStore: {
    loadSettings: vi.fn(),
  },
}));

vi.mock('../../../shared/application/pdf/converter', () => ({
  convertTsxToPdfWithFonts: vi.fn(),
}));

vi.mock('../../../shared/utils/filenameSanitization', () => ({
  generateFilename: vi.fn(),
}));

vi.mock('../../../shared/logging', () => ({
  getLogger: vi.fn(() => ({
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

describe('ConversionService', () => {
  let service: ConversionService;

  beforeEach(async () => {
    vi.clearAllMocks();
    service = new ConversionService();

    // Default mocks
    const { settingsStore } = await import('@/shared/infrastructure/settings/SettingsStore');
    vi.mocked(settingsStore.loadSettings).mockResolvedValue(DEFAULT_USER_SETTINGS);

    const { convertTsxToPdfWithFonts } = await import('../../../shared/application/pdf/converter');
    vi.mocked(convertTsxToPdfWithFonts).mockResolvedValue(new Uint8Array([37, 80, 68, 70])); // PDF header

    const { generateFilename } = await import('../../../shared/utils/filenameSanitization');
    vi.mocked(generateFilename).mockReturnValue('John_Doe_Resume.pdf');
  });

  describe('extractCVMetadata', () => {
    it('should reject missing TSX content', async () => {
      const payload: ConversionRequestPayload = {
        tsx: undefined as unknown as string,
      };

      await expect(service.extractCVMetadata(payload)).rejects.toThrow('No TSX content found');
    });

    it('should reject empty TSX content', async () => {
      const payload: ConversionRequestPayload = {
        tsx: '',
      };

      await expect(service.extractCVMetadata(payload)).rejects.toThrow('No TSX content found');
    });

    it('should reject whitespace-only TSX content', async () => {
      const payload: ConversionRequestPayload = {
        tsx: '   \n\t  ',
      };

      await expect(service.extractCVMetadata(payload)).rejects.toThrow('No TSX content found');
    });

    it('should extract metadata from WASM parser', async () => {
      const { extract_cv_metadata } = await import('@pkg/wasm_bridge');
      const { LayoutType, FontComplexity } = await import('@pkg/wasm_bridge');

      vi.mocked(extract_cv_metadata).mockReturnValue({
        name: 'John Doe',
        title: 'Software Engineer',
        layout_type: LayoutType.SingleColumn,
        estimated_pages: 1,
        component_count: 5,
        has_contact_info: true,
        has_clear_sections: true,
        font_complexity: FontComplexity.Simple,
        free: vi.fn(),
      } as any);

      const payload: ConversionRequestPayload = {
        tsx: 'export default function CV() { return <div>John Doe</div>; }',
      };

      const result = await service.extractCVMetadata(payload);

      expect(result.tsxContent).toBe(payload.tsx);
      expect(result.cvMetadata).toEqual({
        name: 'John Doe',
        title: 'Software Engineer',
      });
    });

    it('should fall back to filename parsing when WASM extraction fails', async () => {
      const { extract_cv_metadata } = await import('@pkg/wasm_bridge');
      vi.mocked(extract_cv_metadata).mockImplementation(() => {
        throw new Error('WASM parsing failed');
      });

      const payload: ConversionRequestPayload = {
        tsx: 'export default function CV() { return <div>Test</div>; }',
        fileName: 'Jane_Smith_Resume.tsx',
      };

      const result = await service.extractCVMetadata(payload);

      expect(result.cvMetadata).toEqual({
        name: 'Jane Smith',
      });
    });

    it('should handle filename without Resume/CV suffix', async () => {
      const { extract_cv_metadata } = await import('@pkg/wasm_bridge');
      vi.mocked(extract_cv_metadata).mockImplementation(() => {
        throw new Error('WASM parsing failed');
      });

      const payload: ConversionRequestPayload = {
        tsx: 'export default function CV() { return <div>Test</div>; }',
        fileName: 'Bob_Wilson.tsx',
      };

      const result = await service.extractCVMetadata(payload);

      expect(result.cvMetadata).toEqual({
        name: 'Bob Wilson',
      });
    });

    it('should return null metadata when both WASM and filename parsing fail', async () => {
      const { extract_cv_metadata } = await import('@pkg/wasm_bridge');
      vi.mocked(extract_cv_metadata).mockImplementation(() => {
        throw new Error('WASM parsing failed');
      });

      const payload: ConversionRequestPayload = {
        tsx: 'export default function CV() { return <div>Test</div>; }',
        fileName: undefined,
      };

      const result = await service.extractCVMetadata(payload);

      expect(result.cvMetadata).toBeNull();
    });
  });

  describe('loadConversionConfig', () => {
    it('should use payload config when provided', async () => {
      const customConfig = {
        pageSize: 'A4' as const,
        margin: { top: 1, right: 1, bottom: 1, left: 1 },
        fontSize: 14,
        fontFamily: 'Times New Roman',
        compress: true,
        atsOptimization: true,
        includeMetadata: false,
      };

      const payload: ConversionRequestPayload = {
        tsx: 'test',
        config: customConfig,
      };

      const config = await service.loadConversionConfig(payload);

      expect(config).toEqual(customConfig);
    });

    it('should fall back to user settings when payload config missing', async () => {
      const payload: ConversionRequestPayload = {
        tsx: 'test',
      };

      const config = await service.loadConversionConfig(payload);

      expect(config).toEqual(DEFAULT_USER_SETTINGS.defaultConfig);
    });

    it('should use hardcoded defaults when config is invalid', async () => {
      const { settingsStore } = await import('@/shared/infrastructure/settings/SettingsStore');
      vi.mocked(settingsStore.loadSettings).mockResolvedValue({
        ...DEFAULT_USER_SETTINGS,
        defaultConfig: null as any,
      });

      const payload: ConversionRequestPayload = {
        tsx: 'test',
      };

      const config = await service.loadConversionConfig(payload);

      expect(config.pageSize).toBe('Letter');
      expect(config.fontSize).toBe(12);
    });

    it('should use hardcoded defaults when config missing pageSize', async () => {
      const { settingsStore } = await import('@/shared/infrastructure/settings/SettingsStore');
      vi.mocked(settingsStore.loadSettings).mockResolvedValue({
        ...DEFAULT_USER_SETTINGS,
        defaultConfig: { fontSize: 14 } as any,
      });

      const payload: ConversionRequestPayload = {
        tsx: 'test',
      };

      const config = await service.loadConversionConfig(payload);

      expect(config.pageSize).toBe('Letter');
    });
  });

  describe('generateFilename', () => {
    it('should generate filename from metadata name', async () => {
      const { generateFilename } = await import('../../../shared/utils/filenameSanitization');
      vi.mocked(generateFilename).mockReturnValue('John_Doe_Resume.pdf');

      const filename = service.generateFilename({ name: 'John Doe', title: 'Engineer' });

      expect(generateFilename).toHaveBeenCalledWith('John Doe');
      expect(filename).toBe('John_Doe_Resume.pdf');
    });

    it('should handle null metadata', async () => {
      const { generateFilename } = await import('../../../shared/utils/filenameSanitization');
      vi.mocked(generateFilename).mockReturnValue('Resume.pdf');

      const filename = service.generateFilename(null);

      expect(generateFilename).toHaveBeenCalledWith(undefined);
      expect(filename).toBe('Resume.pdf');
    });

    it('should handle metadata without name', async () => {
      const { generateFilename } = await import('../../../shared/utils/filenameSanitization');
      vi.mocked(generateFilename).mockReturnValue('Resume.pdf');

      const filename = service.generateFilename({ title: 'Engineer' });

      expect(generateFilename).toHaveBeenCalledWith(undefined);
      expect(filename).toBe('Resume.pdf');
    });

    it('should return undefined when filename generation fails', async () => {
      const { generateFilename } = await import('../../../shared/utils/filenameSanitization');
      vi.mocked(generateFilename).mockImplementation(() => {
        throw new Error('Filename generation failed');
      });

      const filename = service.generateFilename({ name: 'John Doe' });

      expect(filename).toBeUndefined();
    });
  });

  describe('convertToPdf', () => {
    it('should convert TSX to PDF with retry logic', async () => {
      const { convertTsxToPdfWithFonts } = await import('../../../shared/application/pdf/converter');
      const mockPdfBytes = new Uint8Array([37, 80, 68, 70, 1, 2, 3]);
      vi.mocked(convertTsxToPdfWithFonts).mockResolvedValue(mockPdfBytes);

      const config = DEFAULT_USER_SETTINGS.defaultConfig;
      const onProgress = vi.fn();
      const onRetry = vi.fn();

      const pdfBytes = await service.convertToPdf('tsx content', config, onProgress, onRetry);

      expect(convertTsxToPdfWithFonts).toHaveBeenCalledWith('tsx content', config, onProgress, expect.any(Function));
      expect(pdfBytes).toEqual(mockPdfBytes);
    });

    it('should pass progress callback to converter', async () => {
      const { convertTsxToPdfWithFonts } = await import('../../../shared/application/pdf/converter');

      const config = DEFAULT_USER_SETTINGS.defaultConfig;
      const onProgress = vi.fn();

      await service.convertToPdf('tsx content', config, onProgress);

      expect(convertTsxToPdfWithFonts).toHaveBeenCalledWith('tsx content', config, onProgress, expect.any(Function));
    });
  });

  describe('convert (full workflow)', () => {
    it('should orchestrate complete conversion workflow', async () => {
      const { extract_cv_metadata } = await import('@pkg/wasm_bridge');
      const { LayoutType, FontComplexity } = await import('@pkg/wasm_bridge');
      vi.mocked(extract_cv_metadata).mockReturnValue({
        name: 'Alice Johnson',
        title: 'Senior Developer',
        layout_type: LayoutType.TwoColumn,
        estimated_pages: 2,
        component_count: 8,
        has_contact_info: true,
        has_clear_sections: true,
        font_complexity: FontComplexity.Moderate,
        free: vi.fn(),
      } as any);

      const { generateFilename } = await import('../../../shared/utils/filenameSanitization');
      vi.mocked(generateFilename).mockReturnValue('Alice_Johnson_Resume.pdf');

      const { convertTsxToPdfWithFonts } = await import('../../../shared/application/pdf/converter');
      const mockPdfBytes = new Uint8Array([37, 80, 68, 70, 10, 20, 30]);
      vi.mocked(convertTsxToPdfWithFonts).mockResolvedValue(mockPdfBytes);

      const payload: ConversionRequestPayload = {
        tsx: 'export default function CV() { return <div>Alice Johnson</div>; }',
      };

      const result = await service.convert(payload);

      expect(result.pdfBytes).toEqual(mockPdfBytes);
      expect(result.filename).toBe('Alice_Johnson_Resume.pdf');
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('should continue conversion even if filename generation fails', async () => {
      const { extract_cv_metadata } = await import('@pkg/wasm_bridge');
      const { LayoutType, FontComplexity } = await import('@pkg/wasm_bridge');
      vi.mocked(extract_cv_metadata).mockReturnValue({
        name: 'Test User',
        title: 'Developer',
        layout_type: LayoutType.SingleColumn,
        estimated_pages: 1,
        component_count: 5,
        has_contact_info: true,
        has_clear_sections: true,
        font_complexity: FontComplexity.Simple,
        free: vi.fn(),
      } as any);

      const { generateFilename } = await import('../../../shared/utils/filenameSanitization');
      vi.mocked(generateFilename).mockImplementation(() => {
        throw new Error('Filename generation failed');
      });

      const { convertTsxToPdfWithFonts } = await import('../../../shared/application/pdf/converter');
      const mockPdfBytes = new Uint8Array([37, 80, 68, 70]);
      vi.mocked(convertTsxToPdfWithFonts).mockResolvedValue(mockPdfBytes);

      const payload: ConversionRequestPayload = {
        tsx: 'export default function CV() { return <div>Test</div>; }',
      };

      const result = await service.convert(payload);

      expect(result.pdfBytes).toEqual(mockPdfBytes);
      expect(result.filename).toBeUndefined();
    });
  });
});
