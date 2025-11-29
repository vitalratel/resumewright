# Manual Error Handling Testing Guide

## Quick Start

### 1. Build the Extension
```bash
pnpm build
```

### 2. Run Manual Tests

#### Option A: Interactive Test Suite (Comprehensive)
```bash
cd packages/extension
pnpm playwright test tests/manual/error-testing.spec.ts --headed --grep "Interactive Error Testing Suite"
```

This will:
- Open Chromium with the extension loaded
- Open the extension popup
- Pause at each error scenario with instructions
- Wait for you to manually trigger and verify each error

Press **Resume** in the Playwright Inspector to move to the next scenario.

#### Option B: Quick Individual Tests
```bash
# Test invalid TSX parse error
pnpm playwright test tests/manual/error-testing.spec.ts --headed --grep "Invalid TSX"

# Test large file size error  
pnpm playwright test tests/manual/error-testing.spec.ts --headed --grep "Large File"
```

### 3. Generate Test Data

#### Create Large Test Files
```bash
cd tests/manual/test-data

# Generate 5MB file (triggers MEMORY_LIMIT_EXCEEDED)
node generate-large-file.js 5

# Generate 11MB file (triggers FILE_TOO_LARGE)
node generate-large-file.js 11
```

## Test Data Files

Pre-created test files in `tests/manual/test-data/`:

- **invalid-syntax.tsx** - TSX_PARSE_ERROR (missing closing tag)
- **invalid-structure.tsx** - TSX_VALIDATION_ERROR (invalid CV structure)
- **runtime-error.tsx** - TSX_EXECUTION_ERROR (throws error on execution)
- **generate-large-file.js** - Script to create large files for SIZE errors

## Manual Testing Checklist

### Error Categories to Test

#### 1. TSX Parse Errors (SYNTAX)
- [ ] TSX_PARSE_ERROR - Invalid syntax
- [ ] TSX_VALIDATION_ERROR - Valid syntax, invalid structure
- [ ] TSX_EXECUTION_ERROR - Runtime error

#### 2. Size/Memory Errors (SIZE)
- [ ] MEMORY_LIMIT_EXCEEDED - File >4MB
- [ ] FILE_TOO_LARGE - File >10MB

#### 3. System Errors (SYSTEM)
- [ ] WASM_INIT_FAILED - WASM initialization failure
- [ ] WASM_EXECUTION_ERROR - WASM execution error
- [ ] UNKNOWN_ERROR - Unexpected internal error

#### 4. Network/Resource Errors (NETWORK)
- [ ] FONT_LOAD_ERROR - Font loading failure
- [ ] RESOURCE_LOAD_ERROR - External resource failure

#### 5. Rendering Errors
- [ ] RENDER_ERROR - Rendering failure
- [ ] LAYOUT_ERROR - Layout calculation failure

#### 6. PDF Generation Errors (SYSTEM)
- [ ] PDF_GENERATION_FAILED - PDF generation failure

#### 7. Conversion Flow Errors
- [ ] CONVERSION_TIMEOUT - Conversion >60s
- [ ] CONVERSION_CANCELLED - User cancellation
- [ ] INVALID_CONFIG - Corrupt configuration

### Error Handling Requirements to Verify

For each error, verify:

- ✓ User-friendly message (no stack traces)
- ✓ Plain language (non-technical)
- ✓ Actionable suggestions (2-3 concrete next steps)
- ✓ Category badge (SYNTAX/SIZE/SYSTEM/NETWORK/UNKNOWN)
- ✓ Line/column numbers (for parse errors)
- ✓ Size information (for size errors)
- ✓ System action suggestions (for system errors)
- ✓ "Try Again" button (recoverable errors only)
- ✓ "Dismiss" button (non-recoverable errors)
- ✓ "Report Issue" button (dev mode only)
- ✓ Console logs full error details

### Cross-Cutting Concerns

#### Console Logging
1. Open DevTools (F12) → Console tab
2. Trigger any error
3. Verify format: `[ERROR] [jobId] [category] code: message`
4. Verify includes: timestamp, category, code, message, stack trace

#### Issue Reporting
**Dev Mode Only:**
1. Trigger any error
2. Click "Report Issue" button
3. Verify GitHub opens with pre-filled template
4. Verify template includes error details

**Production Mode:**
1. Build production: `pnpm build` (no --mode dev)
2. Verify "Report Issue" button NOT visible

#### Retry Functionality
**Recoverable Errors:**
1. Trigger error (e.g., TSX_PARSE_ERROR)
2. Click "Try Again" button
3. Verify conversion retries
4. Verify state preserved

**Non-Recoverable Errors:**
1. Trigger error (e.g., MEMORY_LIMIT_EXCEEDED)
2. Verify NO "Try Again" button
3. Verify "Dismiss" button present

### Accessibility Testing

#### Keyboard Navigation
1. Trigger any error
2. Press **Tab** - focus moves to first button
3. Press **Tab** again - cycles through buttons
4. Press **Enter** or **Space** - activates focused button
5. Press **Escape** - dismisses error (optional)

Expected tab order:
- "Try Again" button (if present)
- "Dismiss" button
- "Report Issue" button (if dev mode)

#### Screen Reader (Optional)
1. Enable screen reader:
   - **Windows**: NVDA
   - **Mac**: VoiceOver (Cmd+F5)
2. Trigger error
3. Verify error announced immediately
4. Tab through buttons - verify labels clear
5. Check HTML attributes:
   - `role="alert"`
   - `aria-live="assertive"`
   - `aria-label` on buttons

#### Focus Management
1. Trigger error during conversion
2. Verify focus moves to ErrorState component
3. Verify user can navigate without mouse

## How to Trigger Specific Errors

### TSX_PARSE_ERROR
1. Load extension popup
2. Import `test-data/invalid-syntax.tsx`
3. Verify error appears

### TSX_VALIDATION_ERROR
1. Load extension popup
2. Import `test-data/invalid-structure.tsx`
3. Verify error appears

### TSX_EXECUTION_ERROR
1. Load extension popup
2. Import `test-data/runtime-error.tsx`
3. Verify error appears

### MEMORY_LIMIT_EXCEEDED
1. Generate 5MB file: `node generate-large-file.js 5`
2. Import `test-data/large-file-5mb.tsx`
3. Verify SIZE error with no "Try Again" button

### FILE_TOO_LARGE
1. Generate 11MB file: `node generate-large-file.js 11`
2. Import `test-data/large-file-11mb.tsx`
3. Verify SIZE error with file size info

### WASM_INIT_FAILED
**Hard to trigger manually - options:**
1. Use very old browser (no WASM support)
2. Manually corrupt WASM file in `dist/assets/`
3. Inject error in DevTools console
4. Check for WasmFallback UI instead

### FONT_LOAD_ERROR
1. Open DevTools (F12) → Network tab
2. Block `fonts.googleapis.com`
3. Trigger CV conversion
4. Verify NETWORK error

### Conversion Timeout
1. Create extremely complex CV (large nested structures)
2. Or manually set timeout to 5s in code
3. Trigger conversion
4. Verify timeout error appears

## Tips

1. **Keep DevTools open** - Monitor console for error logging validation
2. **Test in both dev and production builds** - Issue reporting behavior differs
3. **Take screenshots** - Document any issues found
4. **Test keyboard navigation** - Don't rely only on mouse
5. **Clear extension state** - Between tests to ensure clean slate

## Reporting Issues

If you find bugs during manual testing:

1. Note the error scenario
2. Screenshot the error state
3. Copy console logs
4. File issue with:
   - Steps to reproduce
   - Expected vs actual behavior
   - Browser/OS version
   - Extension build version

## Testing Completion

**Tester:** _________________  
**Date:** _________________  
**Build:** _________________  
**Result:** ☐ PASS ☐ FAIL

**Notes:**
_________________
