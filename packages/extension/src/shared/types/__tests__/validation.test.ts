/**
 * Validation Tests
 *
 * Tests for Valibot schemas and validation functions.
 */

import type { ConversionConfig, CVDocument, CVMetadata } from '../models';
import {
  ConversionProgressSchema,
  CVMetadataSchema,
  HistoryEntrySchema,
  MessageSchema,
  parseConversionConfig,
  parseCVDocument,
  parseUserSettings,
} from '../../domain/validation';
import { safeParse } from '../../domain/validation/valibot';
import { DEFAULT_CONVERSION_CONFIG } from '../models/conversion';

// Validation wrapper functions that return booleans
const validateConversionConfig = (data: unknown): boolean => {
  try {
    parseConversionConfig(data);
    return true;
  } catch {
    return false;
  }
};

const validateCVDocument = (data: unknown): boolean => {
  try {
    parseCVDocument(data);
    return true;
  } catch {
    return false;
  }
};

const validateConversionProgress = (data: unknown): boolean => safeParse(ConversionProgressSchema, data).success;
const validateConversionStatus = (data: unknown): boolean => {
  const validStatuses = ['queued', 'parsing', 'extracting-metadata', 'rendering', 'laying-out', 'optimizing', 'generating-pdf', 'completed', 'failed', 'cancelled'];
  return typeof data === 'string' && validStatuses.includes(data);
};
const validateCVMetadata = (data: unknown): boolean => safeParse(CVMetadataSchema, data).success;
const validateHistoryEntry = (data: unknown): boolean => safeParse(HistoryEntrySchema, data).success;
const validateMessage = (data: unknown): boolean => safeParse(MessageSchema, data).success;
const validateUserSettings = (data: unknown): boolean => {
  try {
    parseUserSettings(data);
    return true;
  } catch {
    return false;
  }
};

describe('CVMetadata Validation', () => {
  it('validates correct CVMetadata', () => {
    const validMetadata: CVMetadata = {
      name: 'John Doe',
      title: 'Software Engineer',
      email: 'john@example.com',
      layoutType: 'single-column',
      estimatedPages: 1,
      componentCount: 10,
      hasContactInfo: true,
      hasClearSections: true,
      fontComplexity: 'simple',
    };
    expect(validateCVMetadata(validMetadata)).toBe(true);
  });

  it('rejects CVMetadata with invalid email', () => {
    const invalidMetadata = {
      email: 'not-an-email',
      layoutType: 'single-column',
      estimatedPages: 1,
      componentCount: 10,
      hasContactInfo: true,
      hasClearSections: true,
      fontComplexity: 'simple',
    };
    expect(validateCVMetadata(invalidMetadata)).toBe(false);
  });

  it('rejects CVMetadata with invalid layoutType', () => {
    const invalidMetadata = {
      layoutType: 'invalid-layout',
      estimatedPages: 1,
      componentCount: 10,
      hasContactInfo: true,
      hasClearSections: true,
      fontComplexity: 'simple',
    };
    expect(validateCVMetadata(invalidMetadata)).toBe(false);
  });

  it('rejects CVMetadata with negative estimatedPages', () => {
    const invalidMetadata = {
      layoutType: 'single-column',
      estimatedPages: -1,
      componentCount: 10,
      hasContactInfo: true,
      hasClearSections: true,
      fontComplexity: 'simple',
    };
    expect(validateCVMetadata(invalidMetadata)).toBe(false);
  });
});

describe('CVDocument Validation', () => {
  it('validates correct CVDocument', () => {
    const validCV: CVDocument = {
      id: 'cv-123',
      sourceType: 'claude',
      tsx: '<div>Test CV</div>',
      metadata: {
        layoutType: 'single-column',
        estimatedPages: 1,
        componentCount: 5,
        hasContactInfo: true,
        hasClearSections: true,
        fontComplexity: 'simple',
      },

      parseTimestamp: Date.now(),
    };
    expect(validateCVDocument(validCV)).toBe(true);
  });

  it('rejects CVDocument with missing required fields', () => {
    const invalidCV = {
      id: 'cv-123',
      sourceType: 'claude',
      // Missing tsx field
    };
    expect(validateCVDocument(invalidCV)).toBe(false);
  });

  it('rejects CVDocument with invalid sourceType', () => {
    const invalidCV = {
      id: 'cv-123',
      sourceType: 'invalid-source',
      tsx: '<div>Test</div>',
      metadata: {
        layoutType: 'single-column',
        estimatedPages: 1,
        componentCount: 5,
        hasContactInfo: true,
        hasClearSections: true,
        fontComplexity: 'simple',
      },

      parseTimestamp: Date.now(),
    };
    expect(validateCVDocument(invalidCV)).toBe(false);
  });

  it('rejects CVDocument with empty tsx', () => {
    const invalidCV = {
      id: 'cv-123',
      sourceType: 'claude',
      tsx: '',
      metadata: {
        layoutType: 'single-column',
        estimatedPages: 1,
        componentCount: 5,
        hasContactInfo: true,
        hasClearSections: true,
        fontComplexity: 'simple',
      },

      parseTimestamp: Date.now(),
    };
    expect(validateCVDocument(invalidCV)).toBe(false);
  });
});

describe('ConversionStatus Validation', () => {
  it('validates all valid ConversionStatus values', () => {
    const validStatuses = [
      'queued',
      'parsing',
      'extracting-metadata',
      'rendering',
      'laying-out',
      'optimizing',
      'generating-pdf',
      'completed',
      'failed',
      'cancelled',
    ];
    validStatuses.forEach((status) => {
      expect(validateConversionStatus(status)).toBe(true);
    });
  });

  it('rejects invalid ConversionStatus', () => {
    expect(validateConversionStatus('invalid-status')).toBe(false);
  });
});

describe('ConversionProgress Validation', () => {
  it('validates correct ConversionProgress', () => {
    const validProgress = {
      stage: 'parsing',
      percentage: 50,
      currentOperation: 'Parsing TSX...',
      estimatedTimeRemaining: 5000,
      pagesProcessed: 1,
      totalPages: 2,
    };
    expect(validateConversionProgress(validProgress)).toBe(true);
  });

  it('rejects ConversionProgress with percentage > 100', () => {
    const invalidProgress = {
      stage: 'parsing',
      percentage: 150,
      currentOperation: 'Parsing TSX...',
    };
    expect(validateConversionProgress(invalidProgress)).toBe(false);
  });

  it('rejects ConversionProgress with negative percentage', () => {
    const invalidProgress = {
      stage: 'parsing',
      percentage: -10,
      currentOperation: 'Parsing TSX...',
    };
    expect(validateConversionProgress(invalidProgress)).toBe(false);
  });
});

describe('ConversionConfig Validation', () => {
  it('validates correct ConversionConfig', () => {
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
      compress: false,
      atsOptimization: false,
      includeMetadata: true,
    };
    expect(validateConversionConfig(validConfig)).toBe(true);
  });

  it('validates DEFAULT_CONVERSION_CONFIG', () => {
    expect(validateConversionConfig(DEFAULT_CONVERSION_CONFIG)).toBe(true);
  });

  it('rejects ConversionConfig with invalid pageSize', () => {
    const invalidConfig = {
      pageSize: 'B5',
      margin: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
      fontSize: 12,
      fontFamily: 'Arial',
      compress: false,
    };
    expect(validateConversionConfig(invalidConfig)).toBe(false);
  });

  it('rejects ConversionConfig with negative margins', () => {
    const invalidConfig = {
      pageSize: 'Letter',
      margin: { top: -0.5, right: 0.5, bottom: 0.5, left: 0.5 },
      fontSize: 12,
      fontFamily: 'Arial',
      compress: false,
    };
    expect(validateConversionConfig(invalidConfig)).toBe(false);
  });

  it('rejects ConversionConfig with zero fontSize', () => {
    const invalidConfig = {
      pageSize: 'Letter',
      margin: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
      fontSize: 0,
      fontFamily: 'Arial',
      compress: false,
    };
    expect(validateConversionConfig(invalidConfig)).toBe(false);
  });
});

describe('UserSettings Validation', () => {
  it('validates correct UserSettings', () => {
    const validSettings = {
      theme: 'light' as const,
      defaultConfig: DEFAULT_CONVERSION_CONFIG,
      autoDetectCV: true,
      showConvertButtons: false,
      telemetryEnabled: false,
      retentionDays: 30,
      settingsVersion: 1,
      lastUpdated: Date.now(),
    };
    expect(validateUserSettings(validSettings)).toBe(true);
  });

  it('rejects UserSettings with invalid theme', () => {
    const invalidSettings = {
      theme: 'purple',
      defaultConfig: DEFAULT_CONVERSION_CONFIG,
      autoDetectCV: true,
      showConvertButtons: false,
      telemetryEnabled: false,
      retentionDays: 30,
      settingsVersion: 1,
      lastUpdated: Date.now(),
    };
    expect(validateUserSettings(invalidSettings)).toBe(false);
  });

  it('rejects UserSettings with negative retentionDays', () => {
    const invalidSettings = {
      theme: 'light',
      defaultConfig: DEFAULT_CONVERSION_CONFIG,
      autoDetectCV: true,
      showConvertButtons: false,
      telemetryEnabled: false,
      retentionDays: -10,
      settingsVersion: 1,
      lastUpdated: Date.now(),
    };
    expect(validateUserSettings(invalidSettings)).toBe(false);
  });
});

describe('Message Validation', () => {
  it('validates correct Message', () => {
    const validMessage = {
      type: 'CONVERSION_REQUEST',
      payload: { tsx: '<div>Test</div>' },
    };
    expect(validateMessage(validMessage)).toBe(true);
  });

  it('rejects Message with missing type', () => {
    const invalidMessage = {
      payload: { tsx: '<div>Test</div>' },
    };
    expect(validateMessage(invalidMessage)).toBe(false);
  });
});

describe('Parse Functions', () => {
  it('parseCVDocument returns typed result for valid data', () => {
    const validCV = {
      id: 'cv-123',
      sourceType: 'claude',
      tsx: '<div>Test</div>',
      metadata: {
        layoutType: 'single-column',
        estimatedPages: 1,
        componentCount: 5,
        hasContactInfo: true,
        hasClearSections: true,
        fontComplexity: 'simple',
      },
      parseTimestamp: Date.now(),
    };
    const result = parseCVDocument(validCV);
    expect(result.id).toBe('cv-123');
    expect(result.sourceType).toBe('claude');
  });

  it('parseCVDocument throws for invalid data', () => {
    const invalidCV = { id: 'cv-123' };
    expect(() => parseCVDocument(invalidCV)).toThrow();
  });

  it('parseConversionConfig returns typed result for valid data', () => {
    const result = parseConversionConfig(DEFAULT_CONVERSION_CONFIG);
    expect(result.pageSize).toBe('Letter');
  });

  it('parseConversionConfig throws for invalid data', () => {
    const invalidConfig = { pageSize: 'Invalid' };
    expect(() => parseConversionConfig(invalidConfig)).toThrow();
  });
});

describe('HistoryEntry Validation', () => {
  it('validates correct HistoryEntry', () => {
    const validEntry = {
      id: 'hist-123',
      cvDocumentId: 'cv-123',
      timestamp: Date.now(),
      filename: 'John_Doe_Resume.pdf',
      success: true,
      config: DEFAULT_CONVERSION_CONFIG,
      metadata: {
        title: 'John Doe Resume',
        creator: 'ResumeWright v1.0',
        producer: 'printpdf 0.7',
        creationDate: new Date(),
        pageCount: 1,
        fileSize: 50000,
      },
      tsxPreview: '<div>John Doe',
      tsxHash: 'abc123',
    };
    expect(validateHistoryEntry(validEntry)).toBe(true);
  });

  it('validates HistoryEntry with null metadata (failed conversion)', () => {
    const validEntry = {
      id: 'hist-123',
      cvDocumentId: 'cv-123',
      timestamp: Date.now(),
      filename: 'John_Doe_Resume.pdf',
      success: false,
      config: DEFAULT_CONVERSION_CONFIG,
      metadata: null,
      tsxPreview: '<div>John Doe',
      tsxHash: 'abc123',
    };
    expect(validateHistoryEntry(validEntry)).toBe(true);
  });

  it('rejects HistoryEntry with empty filename', () => {
    const invalidEntry = {
      id: 'hist-123',
      cvDocumentId: 'cv-123',
      timestamp: Date.now(),
      filename: '',
      success: true,
      config: DEFAULT_CONVERSION_CONFIG,
      metadata: null,
      tsxPreview: '<div>John Doe',
      tsxHash: 'abc123',
    };
    expect(validateHistoryEntry(invalidEntry)).toBe(false);
  });
});
