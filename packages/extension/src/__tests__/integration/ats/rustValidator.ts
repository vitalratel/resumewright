/**
 * Rust-based ATS Validator (Generation-Time Validation)
 * 
 * Uses the WASM bridge to perform ATS validation during PDF generation.
 * This approach tracks what content is placed rather than extracting text
 * after generation, providing more accurate and privacy-first validation.
 */

import type { Buffer } from 'node:buffer';
import type {
  ATSParser,
  ExpectedCVData,
  ParsedCV,
} from './types';

/**
 * Rust ATS Validator Implementation
 * 
 * This validator uses the WASM bridge's validate_ats_compatibility function
 * to perform generation-time ATS validation.
 */
export class RustATSValidator implements ATSParser {
  private converter: any; // TsxToPdfConverter from WASM

  constructor() {
    // Converter will be initialized when parse() is called
    this.converter = null;
  }

  getName(): string {
    return 'Rust (Generation-Time)';
  }

  async parse(_pdfBuffer: Buffer, _expectedData: ExpectedCVData): Promise<ParsedCV> {
    // For generation-time validation, we need the TSX source, not the PDF buffer
    // The test will need to provide this differently
    throw new Error(
      'RustATSValidator requires TSX source for generation-time validation. ' +
      'Use validateFromTSX() instead of parse().'
    );
  }

  /**
   * Validate ATS compatibility from TSX source (generation-time)
   * 
   * @param tsxSource - TSX source code
   * @param expectedData - Expected CV data for accuracy calculation
   * @returns Parsed CV data with extraction accuracy
   */
  async validateFromTSX(tsxSource: string, expectedData: ExpectedCVData): Promise<ParsedCV> {
    // Initialize WASM if needed
    if (this.converter == null) {
      const wasmModule = await import('@pkg/wasm_bridge');

      // Initialize WASM module in Node.js environment
      const fs = await import('node:fs');
      const { paths } = await import('../paths');
      const wasmPath = paths.wasmModule();
      const wasmBytes = fs.readFileSync(wasmPath);
      await wasmModule.default(wasmBytes);
      
      this.converter = new wasmModule.TsxToPdfConverter();
    }

    // Default PDF config (must match Rust PDFConfig structure)
    const config = {
      page_size: 'Letter', // PageSize enum variant
      margin: {
        top: 36,
        right: 36,
        bottom: 36,
        left: 36,
      },
      standard: 'PDF17', // PDFStandard enum variant (PDF17 or PDFA1b)
      title: 'Test Resume',
      author: null,
      subject: 'Curriculum Vitae',
      keywords: null,
      creator: 'ResumeWright Test Suite',
    };

    // Call WASM validation function
    const report = await this.converter.validate_ats_compatibility(tsxSource, config);

    // Convert ATSValidationReport to ParsedCV format
    const parsed: ParsedCV = {
      name: report.fields_placed.name === true ? expectedData.name : undefined,
      email: report.fields_placed.email === true ? expectedData.email : undefined,
      phone: report.fields_placed.phone === true ? expectedData.phone : undefined,
      location: expectedData.location,
      experience: report.fields_placed.experience_count > 0
        ? expectedData.experience.slice(0, report.fields_placed.experience_count)
        : [],
      education: report.fields_placed.education_count > 0
        ? expectedData.education.slice(0, report.fields_placed.education_count)
        : [],
      skills: report.fields_placed.skills_count > 0 ? expectedData.skills : [],
      extractionAccuracy: report.score, // Score is already 0.0-1.0
      rawData: report,
    };

    return parsed;
  }
}

/**
 * Helper to create TSX source from template fixture
 * 
 * Converts a template fixture file path to TSX source code
 */
export async function readTSXFromFixture(fixturePath: string): Promise<string> {
  const fs = await import('node:fs/promises');
  return fs.readFile(fixturePath, 'utf-8');
}
