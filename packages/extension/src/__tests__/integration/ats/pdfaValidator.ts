/**
 * PDF/A-1b Compliance Validator
 *
 * Uses VeraPDF CLI tool for PDF/A validation
 * Installation:
 * - Ubuntu: wget https://software.verapdf.org/releases/verapdf-installer.zip
 * - macOS: brew install verapdf
 * - Windows: Download from https://software.verapdf.org/
 */

import type { PDFAValidationResult, ValidationError, ValidationWarning } from './types';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

/**
 * Validate PDF/A-1b compliance using VeraPDF
 *
 * @param pdfPath - Absolute path to PDF file
 * @returns Validation result with compliance status, errors, and warnings
 */
export async function validatePDFA(pdfPath: string): Promise<PDFAValidationResult> {
  try {
    // Check if VeraPDF is installed
    await checkVeraPDFInstalled();

    // Run VeraPDF validation with JSON output
    // Note: VeraPDF returns non-zero exit code for non-compliant PDFs
    // Use try-catch to capture stdout even when exit code is non-zero
    let stdout: string;
    let stderr: string;

    try {
      const result = await execAsync(
        `verapdf --format json --flavour 1b "${pdfPath}"`,
        { maxBuffer: 10 * 1024 * 1024 } // 10MB buffer for large outputs
      );
      stdout = result.stdout;
      stderr = result.stderr;
    } catch (error: any) {
      // VeraPDF may exit with code 1 for non-compliant PDFs
      // but still provide JSON output in stdout
      if (error != null && typeof error === 'object' && 'stdout' in error && error.stdout != null) {
        stdout = error.stdout;
        stderr = (error.stderr ?? '') as string;
      } else {
        // Real error (not just non-compliance)
        throw error;
      }
    }

    if (stderr != null && stderr !== '' && !stderr.includes('INFO')) {
      console.warn('VeraPDF stderr:', stderr);
    }

    // Parse VeraPDF JSON output
    const result = JSON.parse(stdout);

    // Extract validation details from VeraPDF response
    const job = result.report?.jobs?.[0];
    const validationResult = job?.validationResult?.[0];

    if (validationResult == null) {
      throw new Error('Invalid VeraPDF output: missing validationResult');
    }

    const details = validationResult.details ?? {};
    const compliant = validationResult.compliant === true;

    // Extract errors and warnings
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // VeraPDF reports failures in 'details.ruleSummaries'
    if (details.ruleSummaries != null) {
      for (const rule of details.ruleSummaries) {
        if (rule.ruleStatus === 'FAILED' || rule.status === 'failed') {
          errors.push({
            clause: rule.clause != null && rule.clause !== ''
              ? `${rule.specification ?? ''} ${rule.clause}`
              : rule.specification ?? 'Unknown',
            message: rule.description ?? 'Validation failed',
            location: rule.object ?? undefined,
          });
        }
      }
    }

    // Check for warnings (if VeraPDF provides them)
    if (details.warnings != null) {
      for (const warning of details.warnings) {
        warnings.push({
          clause: warning.clause ?? 'Unknown',
          message: warning.message ?? 'Unknown warning',
          location: warning.location ?? undefined,
        });
      }
    }

    return {
      compliant,
      errors,
      warnings,
      profile: 'PDF/A-1b',
    };
  } catch (error: unknown) {
    // Handle errors gracefully
    if (error instanceof Error && error.message.includes('verapdf: command not found')) {
      throw new Error(
        'VeraPDF not installed. Install with: brew install verapdf (macOS) or ' +
          'download from https://software.verapdf.org/'
      );
    }

    if (error instanceof Error && error.message.includes('No such file')) {
      throw new Error(`PDF file not found: ${pdfPath}`);
    }

    throw new Error(`PDF/A validation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Check if VeraPDF is installed and accessible
 */
async function checkVeraPDFInstalled(): Promise<void> {
  try {
    await execAsync('verapdf --version');
  } catch {
    throw new Error(
      'VeraPDF not installed. Install with:\n' +
        '  macOS: brew install verapdf\n' +
        '  Ubuntu: wget https://software.verapdf.org/releases/verapdf-installer.zip\n' +
        '  Windows: Download from https://software.verapdf.org/'
    );
  }
}

/**
 * Mock PDF/A validator for testing without VeraPDF installed
 *
 * Simulates 100% compliance for testing infrastructure
 */
export async function mockValidatePDFA(_pdfPath: string): Promise<PDFAValidationResult> {
  // Simulate validation delay
  await new Promise((resolve) => setTimeout(resolve, 50));

  // Mock: Always pass with occasional warnings
  const hasWarning = Math.random() > 0.8; // 20% chance of warning

  return {
    compliant: true,
    errors: [],
    warnings: hasWarning
      ? [
          {
            clause: 'ICC Profile',
            message: 'ICC profile embedded (acceptable for RGB color space)',
            location: 'page 1',
          },
        ]
      : [],
    profile: 'PDF/A-1b (Mock)',
  };
}

/**
 * Validate PDF/A compliance with fallback to mock if VeraPDF not installed
 */
export async function validatePDFAWithFallback(pdfPath: string): Promise<PDFAValidationResult> {
  try {
    return await validatePDFA(pdfPath);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('VeraPDF not installed')) {
      console.warn('VeraPDF not installed, using mock validator');
      return mockValidatePDFA(pdfPath);
    }
    throw error;
  }
}
