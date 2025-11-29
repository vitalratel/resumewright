/**
 * ATS Parser Interface and Types
 * 
 * Defines the contract for ATS parser implementations and the expected
 * data structures for parsed CV information.
 */

import type { Buffer } from 'node:buffer';

/**
 * Work experience entry extracted from CV
 */
export interface ExperienceEntry {
  title?: string;
  company?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

/**
 * Education entry extracted from CV
 */
export interface EducationEntry {
  degree?: string;
  institution?: string;
  graduationDate?: string;
  field?: string;
}

/**
 * Parsed CV data structure
 */
export interface ParsedCV {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  experience?: ExperienceEntry[];
  education?: EducationEntry[];
  skills?: string[];
  /** Extraction accuracy score (0.0 to 1.0) */
  extractionAccuracy: number;
  /** Raw parser response for debugging */
  rawData?: any;
}

/**
 * Expected CV data for validation
 */
export interface ExpectedCVData {
  name: string;
  email: string;
  phone?: string;
  location?: string;
  experience: Array<{
    title: string;
    company: string;
    startDate?: string;
    endDate?: string;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    graduationDate?: string;
  }>;
  skills: string[];
}

/**
 * ATS Parser interface
 * 
 * All ATS parser implementations must conform to this interface
 */
export interface ATSParser {
  /**
   * Parse a PDF buffer and extract CV information
   * 
   * @param pdfBuffer - PDF file as Buffer
   * @param expectedData - Expected data for accuracy calculation
   * @returns Parsed CV data with extraction accuracy
   */
  parse: (pdfBuffer: Buffer, expectedData: ExpectedCVData) => Promise<ParsedCV>;
  
  /**
   * Get the name of the ATS parser
   */
  getName: () => string;
}

/**
 * PDF/A validation result
 */
export interface PDFAValidationResult {
  compliant: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  profile?: string; // e.g., "PDF/A-1b"
}

export interface ValidationError {
  clause: string;
  message: string;
  location?: string;
}

export interface ValidationWarning {
  clause: string;
  message: string;
  location?: string;
}

/**
 * ATS compatibility test result
 */
export interface ATSTestResult {
  templateName: string;
  parserName: string;
  extractionAccuracy: number;
  pdfaCompliant: boolean;
  fieldAccuracy: {
    name: boolean;
    email: boolean;
    phone: boolean;
    experience: number; // percentage
    education: number; // percentage
    skills: number; // percentage
  };
  errors: string[];
  warnings: string[];
}

/**
 * ATS compatibility report
 */
export interface ATSCompatibilityReport {
  generatedAt: string;
  summary: {
    totalTemplates: number;
    overallAccuracy: number;
    pdfaCompliance: number; // percentage
    passed: boolean;
  };
  byParser: Map<string, {
    averageAccuracy: number;
    templateResults: ATSTestResult[];
  }>;
  byTemplate: Map<string, {
    averageAccuracy: number;
    parserResults: ATSTestResult[];
  }>;
  recommendations: string[];
}
