/**
 * Manual Testing Script for Error Handling
 * 
 * This script sets up the extension and provides interactive test scenarios.
 * Run with: pnpm --filter extension playwright test tests/manual/error-testing.spec.ts --headed
 * 
 * Instructions:
 * 1. The test will pause at each scenario
 * 2. Follow the on-screen instructions to trigger each error
 * 3. Validate the acceptance criteria manually
 * 4. Continue to next scenario when ready
 */

import { test } from '../fixtures';
import { fileURLToPath } from 'url';

test.describe('Manual Error Handling Testing', () => {
  test('Interactive Error Testing Suite', async ({ context, extensionId }) => {
    console.log('\n========================================');
    console.log('Error Handling Manual Testing');
    console.log('========================================\n');
    console.log(`Extension ID: ${extensionId}`);
    console.log(`Extension loaded from: ${fileURLToPath(new URL('../../../dist', import.meta.url))}\n`);

    // Open the extension popup
    const page = await context.newPage();
    const popupUrl = `chrome-extension://${extensionId}/converter.html`;
    await page.goto(popupUrl);
    
    console.log('✅ Extension popup opened');
    console.log(`URL: ${popupUrl}\n`);

    // Wait for popup to initialize
    await page.waitForTimeout(1000);

    console.log('========================================');
    console.log('TEST CATEGORY 1: TSX PARSE ERRORS');
    console.log('========================================\n');

    console.log('📋 SCENARIO 1.1: TSX_PARSE_ERROR (Invalid Syntax)');
    console.log('-------------------------------------------');
    console.log('Steps:');
    console.log('1. Create test file with invalid TSX:');
    console.log('   const CV = () => <div>Test');
    console.log('2. Import the file into the extension');
    console.log('3. Validate:');
    console.log('   ✓  Message shows "Failed to parse CV code"');
    console.log('   ✓  Plain language explanation');
    console.log('   ✓  Suggestions include "Try regenerating"');
    console.log('   ✓  Badge shows "SYNTAX"');
    console.log('   ✓  Shows line/column number');
    console.log('   ✓  "Try Again" button visible');
    console.log('   ✓  Console shows full error\n');
    
    await page.pause(); // Pause for manual testing

    console.log('\n📋 SCENARIO 1.2: TSX_VALIDATION_ERROR');
    console.log('-------------------------------------------');
    console.log('Steps:');
    console.log('1. Create test file with valid syntax but invalid CV structure:');
    console.log('   const CV = () => <div>Not a proper CV</div>');
    console.log('2. Import the file');
    console.log('3. Validate same criteria as 1.1\n');
    
    await page.pause();

    console.log('\n📋 SCENARIO 1.3: TSX_EXECUTION_ERROR');
    console.log('-------------------------------------------');
    console.log('Steps:');
    console.log('1. Create test file that throws runtime error:');
    console.log('   const CV = () => { throw new Error("Test"); return <div/>; }');
    console.log('2. Import the file');
    console.log('3. Validate same criteria as 1.1\n');
    
    await page.pause();

    console.log('\n========================================');
    console.log('TEST CATEGORY 2: SIZE/MEMORY ERRORS');
    console.log('========================================\n');

    console.log('📋 SCENARIO 2.1: MEMORY_LIMIT_EXCEEDED');
    console.log('-------------------------------------------');
    console.log('Steps:');
    console.log('1. Create a very large TSX file (>4MB)');
    console.log('2. Import the file');
    console.log('3. Validate:');
    console.log('   ✓  "CV is too large to process"');
    console.log('   ✓  Badge shows "SIZE"');
    console.log('   ✓  Shows size: "X MB / 4 MB"');
    console.log('   ✓  NO "Try Again" button');
    console.log('   ✓  "Dismiss" button present\n');
    
    await page.pause();

    console.log('\n📋 SCENARIO 2.2: FILE_TOO_LARGE');
    console.log('-------------------------------------------');
    console.log('Steps:');
    console.log('1. Create TSX file >10MB');
    console.log('2. Import the file');
    console.log('3. Validate similar to 2.1\n');
    
    await page.pause();

    console.log('\n========================================');
    console.log('TEST CATEGORY 3: SYSTEM ERRORS');
    console.log('========================================\n');

    console.log('📋 SCENARIO 3.1: WASM_INIT_FAILED');
    console.log('-------------------------------------------');
    console.log('Steps:');
    console.log('1. This is hard to trigger manually');
    console.log('2. Check if WasmFallback UI appears on old browser');
    console.log('3. Or manually trigger in code/DevTools\n');
    
    await page.pause();

    console.log('\n========================================');
    console.log('TEST CATEGORY 4: CROSS-CUTTING CONCERNS');
    console.log('========================================\n');

    console.log('📋 TESTING: AC9 - Issue Reporting (Dev Mode)');
    console.log('-------------------------------------------');
    console.log('Steps:');
    console.log('1. Trigger any error');
    console.log('2. Look for "Report Issue" button');
    console.log('3. Click it - should open GitHub with pre-filled template');
    console.log('4. Verify template includes error details\n');
    
    await page.pause();

    console.log('\n📋 TESTING: AC10 - Console Logging');
    console.log('-------------------------------------------');
    console.log('Steps:');
    console.log('1. Open browser DevTools (F12)');
    console.log('2. Go to Console tab');
    console.log('3. Trigger any error');
    console.log('4. Verify console shows:');
    console.log('   ✓ Format: [ERROR] [jobId] [category] code: message');
    console.log('   ✓ Includes timestamp, category, code, message, stack trace\n');
    
    await page.pause();

    console.log('\n========================================');
    console.log('TEST CATEGORY 5: ACCESSIBILITY');
    console.log('========================================\n');

    console.log('📋 TESTING: Keyboard Navigation');
    console.log('-------------------------------------------');
    console.log('Steps:');
    console.log('1. Trigger an error');
    console.log('2. Press Tab key');
    console.log('3. Verify focus cycles through: Try Again → Dismiss → Report Issue');
    console.log('4. Press Enter/Space on focused button - should activate it');
    console.log('5. Press Escape - should dismiss error (optional)\n');
    
    await page.pause();

    console.log('\n📋 TESTING: Screen Reader (Optional)');
    console.log('-------------------------------------------');
    console.log('Steps:');
    console.log('1. Enable screen reader (NVDA on Windows, VoiceOver on Mac)');
    console.log('2. Trigger an error');
    console.log('3. Verify error is announced immediately');
    console.log('4. Verify role="alert" and aria-live="assertive" present');
    console.log('5. Tab through buttons - verify labels are clear\n');
    
    await page.pause();

    console.log('\n========================================');
    console.log('TESTING COMPLETE');
    console.log('========================================\n');
    console.log('Next steps:');
    console.log('1. Document findings in test results');
    console.log('2. File any bugs found');
    console.log('3. Update story 3.2 with test sign-off\n');
  });

  test('Quick Error Scenario: Invalid TSX', async ({ context, extensionId }) => {
    console.log('\n🔥 Quick Test: Invalid TSX Parse Error\n');

    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/converter.html`);
    
    // Wait for popup to load
    await page.waitForTimeout(1000);

    console.log('Extension popup loaded. Ready for manual TSX import test.');
    console.log('\nInstructions:');
    console.log('1. Click "Import CV" or trigger TSX input');
    console.log('2. Paste invalid TSX code (missing closing tag)');
    console.log('3. Observe error state');
    console.log('4. Verify all acceptance criteria');
    console.log('\nPress Continue in Playwright Inspector when done.\n');

    // Keep browser open for manual interaction
    await page.pause();
  });

  test('Quick Error Scenario: Large File', async ({ context, extensionId }) => {
    console.log('\n📦 Quick Test: File Size Error\n');

    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/converter.html`);
    
    await page.waitForTimeout(1000);

    console.log('Extension popup loaded. Ready for large file test.');
    console.log('\nInstructions:');
    console.log('1. Create a TSX file >4MB');
    console.log('2. Import it into the extension');
    console.log('3. Verify SIZE category error appears');
    console.log('4. Verify no "Try Again" button (non-recoverable)');
    console.log('5. Verify "Dismiss" button present');
    console.log('\nPress Continue when done.\n');

    await page.pause();
  });
});
