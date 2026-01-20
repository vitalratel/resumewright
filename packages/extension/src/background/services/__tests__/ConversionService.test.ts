// ABOUTME: Tests for ConversionService business logic functions.
// ABOUTME: Mocks only true external boundaries (WASM, browser storage).

import type { CVMetadata as WasmCVMetadata } from '@pkg/wasm_bridge';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_USER_SETTINGS } from '../../../shared/domain/settings/defaults';
import type { ConversionRequestPayload } from '../../../shared/types/messages';
import type { ConversionConfig } from '../../../shared/types/models';
import {
  convert,
  convertToPdf,
  extractCVMetadata,
  generateConversionFilename,
  loadConversionConfig,
} from '../ConversionService';

/**
 * Creates a complete mock of the WASM CVMetadata class.
 * The WASM class has readonly properties and a private constructor,
 * so we create a plain object with all required properties.
 */
function createMockCVMetadata(
  overrides: Partial<{
    name: string | undefined;
    title: string | undefined;
    email: string | undefined;
    phone: string | undefined;
    website: string | undefined;
    location: string | undefined;
    layout_type: number;
    component_count: number;
    estimated_pages: number;
    font_complexity: number;
    has_contact_info: boolean;
    has_clear_sections: boolean;
  }> = {},
): WasmCVMetadata {
  return {
    name: undefined,
    title: undefined,
    email: undefined,
    phone: undefined,
    website: undefined,
    location: undefined,
    layout_type: 0, // LayoutType.SingleColumn
    component_count: 1,
    estimated_pages: 1,
    font_complexity: 0, // FontComplexity.Simple
    has_contact_info: false,
    has_clear_sections: false,
    free: vi.fn(),
    [Symbol.dispose]: vi.fn(),
    ...overrides,
  } as WasmCVMetadata;
}

// Mock WASM bridge - true external boundary
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

// Type definitions for browser mock
interface MockBrowser {
  storage: {
    sync: {
      get: ReturnType<typeof vi.fn>;
      set: ReturnType<typeof vi.fn>;
    };
    local: {
      get: ReturnType<typeof vi.fn>;
      set: ReturnType<typeof vi.fn>;
    };
    onChanged: {
      addListener: ReturnType<typeof vi.fn>;
      removeListener: ReturnType<typeof vi.fn>;
    };
  };
}

// Use vi.hoisted to create typed mock functions available at mock time
const { mockBrowserInstance } = vi.hoisted(() => {
  const instance: MockBrowser = {
    storage: {
      sync: {
        get: vi.fn().mockResolvedValue({}),
        set: vi.fn().mockResolvedValue(undefined),
      },
      local: {
        get: vi.fn().mockResolvedValue({}),
        set: vi.fn().mockResolvedValue(undefined),
      },
      onChanged: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
      },
    },
  };
  return { mockBrowserInstance: instance };
});

// Mock browser storage - true external boundary
vi.mock('wxt/browser', () => ({
  browser: mockBrowserInstance,
}));

// Mock PDF converter - it uses WASM internally
vi.mock('../../../shared/application/pdf/converter', () => ({
  convertTsxToPdfWithFonts: vi.fn(),
}));

// Silence logging in tests
vi.mock('@/shared/infrastructure/logging', () => ({
  getLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

// Use vi.hoisted to create mock for loadSettings
const { mockLoadSettings } = vi.hoisted(() => ({
  mockLoadSettings: vi.fn(),
}));

// Mock SettingsStore functions to allow controlling return values in specific tests
vi.mock('@/shared/infrastructure/settings/SettingsStore', async (importOriginal) => {
  const original =
    await importOriginal<typeof import('@/shared/infrastructure/settings/SettingsStore')>();
  return {
    ...original,
    loadSettings: mockLoadSettings,
  };
});

describe('ConversionService', () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    // Reset browser storage mock (uses hoisted mockBrowserInstance)
    mockBrowserInstance.storage.sync.get.mockResolvedValue({});
    mockBrowserInstance.storage.sync.set.mockResolvedValue(undefined);

    // Setup default loadSettings mock to return DEFAULT_USER_SETTINGS
    mockLoadSettings.mockResolvedValue(DEFAULT_USER_SETTINGS);

    // Setup default PDF converter mock
    const { convertTsxToPdfWithFonts } = await import('../../../shared/application/pdf/converter');
    vi.mocked(convertTsxToPdfWithFonts).mockResolvedValue(
      new Uint8Array([0x25, 0x50, 0x44, 0x46]), // PDF magic bytes
    );
  });

  describe('extractCVMetadata', () => {
    it('should reject missing TSX content', async () => {
      const payload: ConversionRequestPayload = {
        tsx: undefined as unknown as string,
      };

      await expect(extractCVMetadata(payload)).rejects.toThrow('No TSX content found');
    });

    it('should reject empty TSX content', async () => {
      const payload: ConversionRequestPayload = { tsx: '' };

      await expect(extractCVMetadata(payload)).rejects.toThrow('No TSX content found');
    });

    it('should reject whitespace-only TSX content', async () => {
      const payload: ConversionRequestPayload = { tsx: '   \n\t  ' };

      await expect(extractCVMetadata(payload)).rejects.toThrow('No TSX content found');
    });

    it('should extract metadata from WASM parser', async () => {
      const { extract_cv_metadata } = await import('@pkg/wasm_bridge');
      vi.mocked(extract_cv_metadata).mockReturnValue(
        createMockCVMetadata({
          name: 'John Doe',
          title: 'Software Engineer',
          layout_type: 0, // SingleColumn
          estimated_pages: 1,
          component_count: 5,
          has_contact_info: true,
          has_clear_sections: true,
          font_complexity: 0, // Simple
        }),
      );

      const payload: ConversionRequestPayload = {
        tsx: 'export default function CV() { return <div>John Doe</div>; }',
      };

      const result = await extractCVMetadata(payload);

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

      const result = await extractCVMetadata(payload);

      expect(result.cvMetadata).toEqual({ name: 'Jane Smith' });
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

      const result = await extractCVMetadata(payload);

      expect(result.cvMetadata).toEqual({ name: 'Bob Wilson' });
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

      const result = await extractCVMetadata(payload);

      expect(result.cvMetadata).toBeNull();
    });
  });

  describe('loadConversionConfig', () => {
    it('should use payload config when provided', async () => {
      const customConfig = {
        pageSize: 'A4' as const,
        margin: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
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

      const config = await loadConversionConfig(payload);

      expect(config).toEqual(customConfig);
    });

    it('should fall back to settings default config when payload config missing', async () => {
      // When no payload config, loadConversionConfig uses loadSettings()
      // which returns DEFAULT_USER_SETTINGS when storage is empty
      const payload: ConversionRequestPayload = { tsx: 'test' };

      const config = await loadConversionConfig(payload);

      // DEFAULT_USER_SETTINGS.defaultConfig has Letter/11pt/Helvetica
      expect(config.pageSize).toBe('Letter');
      expect(config.fontSize).toBe(11);
      expect(config.fontFamily).toBe('Helvetica');
    });

    it('should use hardcoded defaults when config is completely invalid', async () => {
      // Test the fallback path when settings.defaultConfig is missing/invalid
      // This simulates corrupt storage or failed migration - defaultConfig should never be null
      // but we need to handle it gracefully
      mockLoadSettings.mockResolvedValueOnce({
        theme: 'auto',
        autoDetectCV: true,
        showConvertButtons: true,
        telemetryEnabled: false,
        retentionDays: 30,
        settingsVersion: 1,
        lastUpdated: Date.now(),
        // Simulate corrupt/invalid storage data - null is not a valid ConversionConfig
        defaultConfig: null as unknown as ConversionConfig,
      });

      const payload: ConversionRequestPayload = { tsx: 'test' };

      const config = await loadConversionConfig(payload);

      // Falls back to DEFAULT_CONVERSION_CONFIG from defaults.ts
      expect(config.pageSize).toBe('Letter');
      expect(config.fontSize).toBe(11);
      expect(config.fontFamily).toBe('Helvetica');
    });
  });

  describe('generateConversionFilename', () => {
    // These tests use the REAL generateFilename function - no mocking

    it('should generate filename from metadata name', () => {
      const filename = generateConversionFilename({
        name: 'John Doe',
        title: 'Engineer',
      });

      // Real function adds date suffix
      expect(filename).toMatch(/^John_Doe_Resume_\d{4}-\d{2}-\d{2}\.pdf$/);
    });

    it('should handle null metadata', () => {
      const filename = generateConversionFilename(null);

      expect(filename).toMatch(/^Resume_\d{4}-\d{2}-\d{2}\.pdf$/);
    });

    it('should handle metadata without name', () => {
      const filename = generateConversionFilename({ title: 'Engineer' });

      expect(filename).toMatch(/^Resume_\d{4}-\d{2}-\d{2}\.pdf$/);
    });

    it('should sanitize special characters in name', () => {
      const filename = generateConversionFilename({
        name: "José O'Brien",
        title: 'Developer',
      });

      // Real sanitization: accents removed, apostrophe removed
      expect(filename).toMatch(/^Jose_OBrien_Resume_\d{4}-\d{2}-\d{2}\.pdf$/);
    });
  });

  describe('convertToPdf', () => {
    it('should convert TSX to PDF', async () => {
      const { convertTsxToPdfWithFonts } = await import(
        '../../../shared/application/pdf/converter'
      );
      const mockPdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 1, 2, 3]);
      vi.mocked(convertTsxToPdfWithFonts).mockResolvedValue(mockPdfBytes);

      const config = {
        pageSize: 'Letter' as const,
        margin: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
        fontSize: 12,
        fontFamily: 'Arial',
        compress: false,
      };

      const pdfBytes = await convertToPdf('tsx content', config);

      expect(convertTsxToPdfWithFonts).toHaveBeenCalledWith(
        'tsx content',
        config,
        undefined, // No progress callback passed
        expect.any(Function), // Font fetch callback is always created
      );
      expect(pdfBytes).toEqual(mockPdfBytes);
    });

    it('should pass progress callback to converter when provided', async () => {
      const { convertTsxToPdfWithFonts } = await import(
        '../../../shared/application/pdf/converter'
      );

      const config = {
        pageSize: 'Letter' as const,
        margin: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
        fontSize: 12,
        fontFamily: 'Arial',
        compress: false,
      };
      const onProgress = vi.fn();

      await convertToPdf('tsx content', config, onProgress);

      // Verify converter was called with a progress callback
      const [, , progressArg] = vi.mocked(convertTsxToPdfWithFonts).mock.calls[0];
      expect(progressArg).toBeDefined();
      expect(typeof progressArg).toBe('function');
    });
  });

  describe('convert (full workflow)', () => {
    it('should orchestrate complete conversion workflow', async () => {
      // Setup WASM mock for metadata extraction
      const { extract_cv_metadata } = await import('@pkg/wasm_bridge');
      vi.mocked(extract_cv_metadata).mockReturnValue(
        createMockCVMetadata({
          name: 'Alice Johnson',
          title: 'Senior Developer',
          layout_type: 1, // TwoColumn
          estimated_pages: 2,
          component_count: 8,
          has_contact_info: true,
          has_clear_sections: true,
          font_complexity: 1, // Moderate
        }),
      );

      // Setup converter mock
      const { convertTsxToPdfWithFonts } = await import(
        '../../../shared/application/pdf/converter'
      );
      const mockPdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 10, 20, 30]);
      vi.mocked(convertTsxToPdfWithFonts).mockResolvedValue(mockPdfBytes);

      const payload: ConversionRequestPayload = {
        tsx: 'export default function CV() { return <div>Alice Johnson</div>; }',
      };

      const result = await convert(payload);

      expect(result.pdfBytes).toEqual(mockPdfBytes);
      // Real generateFilename produces actual filename
      expect(result.filename).toMatch(/^Alice_Johnson_Resume_\d{4}-\d{2}-\d{2}\.pdf$/);
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('should continue conversion even if metadata extraction fails', async () => {
      // WASM fails to extract metadata
      const { extract_cv_metadata } = await import('@pkg/wasm_bridge');
      vi.mocked(extract_cv_metadata).mockImplementation(() => {
        throw new Error('WASM parsing failed');
      });

      // But conversion should still work
      const { convertTsxToPdfWithFonts } = await import(
        '../../../shared/application/pdf/converter'
      );
      const mockPdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
      vi.mocked(convertTsxToPdfWithFonts).mockResolvedValue(mockPdfBytes);

      const payload: ConversionRequestPayload = {
        tsx: 'export default function CV() { return <div>Test</div>; }',
      };

      const result = await convert(payload);

      expect(result.pdfBytes).toEqual(mockPdfBytes);
      // Falls back to default filename
      expect(result.filename).toMatch(/^Resume_\d{4}-\d{2}-\d{2}\.pdf$/);
    });
  });
});
