#!/usr/bin/env node
/**
 * WASM Type Validation Script
 *
 * Validates that wasm-bindgen generated TypeScript types exist and match expected structure.
 * Catches breaking changes when Rust WASM bridge is updated.
 *
 * Usage: pnpm validate:wasm-types
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
};

/**
 * Expected exports from wasm-bindgen (critical functions/types)
 * This list represents the API contract between Rust and TypeScript.
 * Based on actual wasm-bindgen output from wasm-bridge crate.
 */
const EXPECTED_EXPORTS = [
  // Core initialization (wasm-bindgen generated)
  {
    name: 'default',
    type: 'function',
    description: 'WASM module initialization function (__wbg_init)',
  },
  { name: 'initSync', type: 'function', description: 'Synchronous WASM initialization' },
  { name: 'init', type: 'function', description: 'Initialize WASM (no-op after first call)' },

  // Core classes (main API)
  { name: 'TsxToPdfConverter', type: 'class', description: 'Main TSX to PDF converter' },
  { name: 'CVMetadata', type: 'class', description: 'CV metadata extraction' },
  { name: 'FontCollection', type: 'class', description: 'Font collection management' },
  { name: 'FontData', type: 'class', description: 'Font data wrapper' },

  // Font utilities
  { name: 'decompress_woff_font', type: 'function', description: 'Decompress WOFF to TrueType' },
  { name: 'decompress_woff2_font', type: 'function', description: 'Decompress WOFF2 to TrueType' },
  { name: 'detect_font_format', type: 'function', description: 'Detect font format from bytes' },

  // Metadata extraction
  { name: 'extract_cv_metadata', type: 'function', description: 'Extract CV metadata from TSX' },

  // Type definitions
  { name: 'ATSWeights', type: 'interface', description: 'ATS scoring weights' },
  { name: 'ATSValidationReport', type: 'interface', description: 'ATS validation report' },
  { name: 'FieldsPlaced', type: 'interface', description: 'Fields placement data' },
];

/**
 * Parse wasm-bindgen generated .d.ts file
 */
function parseWasmTypes(content) {
  const exports = new Set();
  const lines = content.split('\n');

  for (const line of lines) {
    // Match: export function foo(...): ...;
    const funcMatch = line.match(/export\s+function\s+(\w+)\s*\(/);
    if (funcMatch) {
      exports.add(funcMatch[1]);
      continue;
    }

    // Match: export default function init(...): ...;
    const defaultMatch = line.match(/export\s+default\s+function\s+(\w+)\s*\(/);
    if (defaultMatch) {
      exports.add('default');
      continue;
    }

    // Match: export interface Foo { ... }
    const interfaceMatch = line.match(/export\s+interface\s+(\w+)/);
    if (interfaceMatch) {
      exports.add(interfaceMatch[1]);
      continue;
    }

    // Match: export class Foo { ... }
    const classMatch = line.match(/export\s+class\s+(\w+)/);
    if (classMatch) {
      exports.add(classMatch[1]);
      continue;
    }

    // Match: export type Foo = ...
    const typeMatch = line.match(/export\s+type\s+(\w+)/);
    if (typeMatch) {
      exports.add(typeMatch[1]);
      continue;
    }
  }

  return exports;
}

/**
 * Validate WASM types
 */
function validateWasmTypes() {
  console.log('🔍 Validating WASM TypeScript types...\n');

  // 1. Check if wasm-bindgen generated file exists
  const wasmTypesPath = path.resolve(
    __dirname,
    '../../../packages/rust-core/wasm-bridge/pkg/wasm_bridge.d.ts'
  );

  if (!fs.existsSync(wasmTypesPath)) {
    console.error(`${colors.red}❌ WASM type file not found: ${wasmTypesPath}${colors.reset}`);
    console.error(`\n💡 Run: pnpm build:wasm\n`);
    process.exit(1);
  }

  console.log(`${colors.green}✓${colors.reset} WASM type file exists: pkg/wasm_bridge.d.ts`);

  // 2. Read and parse wasm-bindgen types
  const wasmContent = fs.readFileSync(wasmTypesPath, 'utf-8');
  const actualExports = parseWasmTypes(wasmContent);

  console.log(
    `${colors.green}✓${colors.reset} Parsed ${actualExports.size} exports from wasm-bindgen\n`
  );

  // 3. Validate expected exports exist
  const missingExports = [];
  const foundExports = [];

  for (const expected of EXPECTED_EXPORTS) {
    if (actualExports.has(expected.name)) {
      foundExports.push(expected);
      console.log(
        `${colors.green}✓${colors.reset} ${expected.name.padEnd(30)} ${colors.yellow}${expected.description}${colors.reset}`
      );
    } else {
      missingExports.push(expected);
      console.log(
        `${colors.red}✗${colors.reset} ${expected.name.padEnd(30)} ${colors.yellow}${expected.description}${colors.reset}`
      );
    }
  }

  // 4. Report results
  console.log(`\n${'='.repeat(60)}`);

  if (missingExports.length > 0) {
    console.error(`\n${colors.red}❌ VALIDATION FAILED${colors.reset}`);
    console.error(`\nMissing exports (${missingExports.length}/${EXPECTED_EXPORTS.length}):`);
    missingExports.forEach((exp) => {
      console.error(`  - ${exp.name}: ${exp.description}`);
    });
    console.error(
      `\n💡 These exports are expected by TypeScript but not found in Rust WASM bridge.`
    );
    console.error(
      `   Update packages/rust-core/wasm-bridge/src/lib.rs or this validation script.\n`
    );
    process.exit(1);
  }

  console.log(`\n${colors.green}✅ VALIDATION PASSED${colors.reset}`);
  console.log(`\nAll ${EXPECTED_EXPORTS.length} expected exports found in WASM bridge.`);
  console.log(`TypeScript types are in sync with Rust exports.\n`);
}

// Run validation
try {
  validateWasmTypes();
} catch (error) {
  console.error(`\n${colors.red}❌ Validation error:${colors.reset}`, error.message);
  process.exit(1);
}
