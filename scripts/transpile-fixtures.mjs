#!/usr/bin/env node

/**
 * Transpile TSX Test Fixtures to JavaScript
 * 
 * Converts TSX test fixtures from packages/rust-core/test-fixtures/single-page/*.tsx
 * to executable JavaScript files in packages/rust-core/test-fixtures/transpiled/*.js
 * 
 * Story: 2.2.6 - Automated Visual Regression Implementation
 * Tool: SWC (@swc/core) - chosen for performance (9ms for 4 fixtures)
 */

import { transformFile } from '@swc/core';
import { readdir, mkdir, writeFile, stat } from 'fs/promises';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const FIXTURES_INPUT_DIR = join(__dirname, '..', 'packages', 'rust-core', 'test-fixtures', 'single-page');
const FIXTURES_OUTPUT_DIR = join(__dirname, '..', 'packages', 'rust-core', 'test-fixtures', 'transpiled');

const SWC_CONFIG = {
  jsc: {
    parser: { 
      syntax: 'typescript', 
      tsx: true 
    },
    transform: {
      react: {
        runtime: 'classic',              // Use React.createElement (required for UMD React)
        pragma: 'React.createElement',    // JSX pragma
        pragmaFrag: 'React.Fragment',     // JSX fragment pragma
      }
    },
    target: 'es2020',                     // Modern browsers
  },
  module: { type: 'es6' },               // ESM output (required for Playwright)
};

/**
 * Check if transpiled files are stale (TSX newer than JS)
 */
async function checkForStaleFixtures(tsxFiles) {
  const staleFiles = [];
  
  for (const tsxFile of tsxFiles) {
    const tsxPath = join(FIXTURES_INPUT_DIR, tsxFile);
    const jsFile = tsxFile.replace('.tsx', '.js');
    const jsPath = join(FIXTURES_OUTPUT_DIR, jsFile);
    
    try {
      const tsxStat = await stat(tsxPath);
      const jsStat = await stat(jsPath);
      
      if (tsxStat.mtimeMs > jsStat.mtimeMs) {
        staleFiles.push(tsxFile);
      }
    } catch (error) {
      // JS file doesn't exist yet, will be created
      continue;
    }
  }
  
  if (staleFiles.length > 0) {
    console.log(`⚠️  Stale fixtures detected (TSX modified): ${staleFiles.join(', ')}`);
  }
  
  return staleFiles;
}

/**
 * Main transpilation function
 */
async function transpileFixtures() {
  const startTime = performance.now();
  
  console.log('🔄 Transpiling TSX test fixtures...\n');
  
  try {
    // Create output directory if it doesn't exist
    await mkdir(FIXTURES_OUTPUT_DIR, { recursive: true });
    
    // Read all TSX files from input directory
    const allFiles = await readdir(FIXTURES_INPUT_DIR);
    const tsxFiles = allFiles.filter(file => file.endsWith('.tsx'));
    
    if (tsxFiles.length === 0) {
      console.error('❌ No TSX fixtures found in:', FIXTURES_INPUT_DIR);
      process.exit(1);
    }
    
    console.log(`📁 Found ${tsxFiles.length} TSX fixtures in: ${FIXTURES_INPUT_DIR}\n`);
    
    // Check for stale fixtures
    await checkForStaleFixtures(tsxFiles);
    
    // Transpile each fixture
    let successCount = 0;
    let errorCount = 0;
    
    for (const tsxFile of tsxFiles) {
      const inputPath = join(FIXTURES_INPUT_DIR, tsxFile);
      const outputFile = tsxFile.replace('.tsx', '.js');
      const outputPath = join(FIXTURES_OUTPUT_DIR, outputFile);
      
      try {
        // Transpile using SWC
        const result = await transformFile(inputPath, SWC_CONFIG);
        
        // Write transpiled output
        await writeFile(outputPath, result.code, 'utf-8');
        
        console.log(`  ✅ ${tsxFile} → ${outputFile}`);
        successCount++;
      } catch (error) {
        console.error(`  ❌ Failed to transpile ${tsxFile}:`, error.message);
        errorCount++;
      }
    }
    
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);
    
    console.log(`\n✨ Transpilation complete!`);
    console.log(`   Success: ${successCount}/${tsxFiles.length} files`);
    console.log(`   Time: ${duration}ms`);
    console.log(`   Output: ${FIXTURES_OUTPUT_DIR}\n`);
    
    // Exit with error if any transpilation failed
    if (errorCount > 0) {
      process.exit(1);
    }
    
    // Warn if transpilation took longer than expected
    if (duration > 50) {
      console.log(`⚠️  Transpilation took ${duration}ms (expected <50ms). Consider optimization.`);
    }
    
  } catch (error) {
    console.error('\n❌ Transpilation failed:', error.message);
    
    // Check if SWC native binary is missing
    if (error.message.includes('Could not find') || error.message.includes('binary')) {
      console.error('\n💡 SWC native binary not found. Try:');
      console.error('   1. Run: pnpm install');
      console.error('   2. Check platform support: Linux x64, macOS arm64/x64, Windows x64');
    }
    
    process.exit(1);
  }
}

// Run transpilation
transpileFixtures();
