# ResumeWright Testing Guide

This directory contains comprehensive automated tests for the ResumeWright browser extension.

## Test Structure

```
tests/
├── e2e/                       # End-to-end tests (Playwright)
│   ├── conversion-flow.spec.ts        # Full conversion workflow
│   ├── conversion.spec.ts             # Conversion scenarios
│   ├── error-handling-automated.spec.ts # Error handling
│   ├── extension-loading.spec.ts      # Extension initialization
│   ├── multi-page-pipeline.spec.ts    # Multi-page conversion
│   └── performance-investigation.spec.ts # Performance debugging
├── accessibility/             # Accessibility tests (Playwright)
│   ├── automated-a11y.spec.ts         # Automated accessibility checks
│   ├── popup-accessibility.spec.ts    # Popup accessibility
│   └── popup-full-app.a11y.spec.ts    # Full app accessibility
├── visual/                    # Visual regression tests (Playwright)
│   ├── popup-ui.spec.ts            # UI screenshot comparison
│   ├── custom-fonts-ui.spec.ts     # Custom fonts UI
│   ├── dark-mode.spec.ts           # Dark mode UI
│   └── README.md                   # Visual testing guide
├── fixtures.ts                # Shared test fixtures
├── fixtures/                  # Fixture modules
│   ├── browser-config.ts          # Browser configuration
│   ├── chrome-id-discovery.ts     # Chrome extension ID
│   └── firefox-id-discovery.ts    # Firefox extension ID
├── helpers/                   # Test helper utilities
│   ├── e2eHelpers.ts              # E2E test helpers
│   ├── fixtures.ts                # Additional fixtures
│   └── index.ts                   # Helper exports
└── README.md                  # This file
```

## Prerequisites

### Visual Regression Tests Setup

Visual regression tests require **pdfium-render** (native Rust library) for PDF-to-PNG conversion:

**One-time setup:**
```bash
# Download pdfium library (5.7MB)
bash scripts/download-pdfium-linux.sh

# Build the Rust CLI tool
cd packages/rust-core
cargo build --release --bin pdf-to-png
cd ../extension
```

**Set library path (required for each session):**
```bash
export LD_LIBRARY_PATH=/home/dev/resumewright/lib:$LD_LIBRARY_PATH
```

**Permanent setup (add to shell profile):**
```bash
echo 'export LD_LIBRARY_PATH=/home/dev/resumewright/lib:$LD_LIBRARY_PATH' >> ~/.bashrc
source ~/.bashrc
```

**Verify setup:**
```bash
# Should show help output
../../rust-core/target/release/pdf-to-png --help
```

**Why needed?** Visual regression tests convert PDFs to PNGs for pixel-by-pixel comparison. This requires:
1. The native `libpdfium.so` library (downloaded by script)
2. The `pdf-to-png` Rust CLI tool (built with cargo)
3. `LD_LIBRARY_PATH` set so the CLI can find the library

**Performance:** pdfium-render is ~80x faster than JavaScript-based PDF rendering (36ms vs 2-3s per page).

---

## Quick Start

### Run All Tests

```bash
# From extension package
pnpm test

# From project root
pnpm --filter extension test
```

### Run Specific Test Suites

```bash
# E2E tests
pnpm test:e2e

# Visual regression tests
pnpm test:visual

# Accessibility tests
pnpm test:accessibility
```

## Test Categories

### 1. E2E Tests (`tests/e2e/`)

**Purpose:** Validate complete user workflows in real browser using Playwright.

**What's Tested:**
- Extension loading and initialization
- Service worker activation (Manifest V3)
- Popup UI interactions
- TSX input → PDF conversion flow
- Download functionality
- Error handling

**Run:**
```bash
pnpm test:e2e
```

**Debug:**
```bash
# With browser UI visible
pnpm test:e2e:headed

# With Playwright inspector
pnpm test:e2e:debug

# Interactive UI mode
pnpm test:e2e:ui
```

### 2. Visual Regression Tests (`tests/visual/`)

**Purpose:** Detect unintended UI changes via screenshot comparison using Playwright.

**What's Tested:**
- Popup initial state
- UI with TSX input
- Converting state
- Success state
- Error state

**95% Fidelity Threshold:**
- Configured with 5% pixel tolerance

**Run:**
```bash
# Compare against baselines
pnpm test:visual

# Update baselines (after intentional UI changes)
pnpm test:visual:update
```

**See:** `tests/visual/README.md` for detailed guide

### 3. Accessibility Tests (`tests/accessibility/`)

**Purpose:** Validate WCAG compliance and keyboard navigation using Playwright.

**What's Tested:**
- Automated accessibility checks (axe-core)
- Popup keyboard navigation
- Screen reader compatibility
- Focus management

**Run:**
```bash
pnpm test:accessibility
```



## Test Fixtures

### Extension Loading Fixture (`fixtures.ts`)

Automatically loads the extension with **browser abstraction** supporting both Chrome and Firefox:

```typescript
import { test, expect, browserConfigs } from './fixtures';

test('my test', async ({ page, extensionId, browserType }) => {
  // Extension is already loaded
  const config = browserConfigs[browserType];
  await page.goto(`${config.protocol}://${extensionId}/src/popup/index.html`);
  // Test your extension...
});
```

**Fixtures Provided:**
- `context`: Persistent browser context with extension loaded
- `extensionId`: The extension's ID (for accessing extension pages)
- `browserType`: Detected browser type (`'chrome'` or `'firefox'`)
- `backgroundPage`: Service worker reference (may be mocked in MV3)

**Browser Support:**

| Browser | Automated Tests | Protocol | Extension ID Format |
|---------|-----------------|----------|---------------------|
| Chrome | ✅ Fully supported | `chrome-extension://` | 32 lowercase letters (hash-based) |
| Firefox | ⚠️ Manual only | `moz-extension://` | Email format (from manifest) |

**Firefox Testing Limitation:**

Playwright does not support loading Firefox extensions via command-line arguments like Chrome. Firefox tests automatically skip with a clear message directing users to manual testing:

```bash
# Manual Firefox testing (recommended approach)
cd packages/extension/.output/firefox-mv3
web-ext run
```

## CI/CD Integration

### GitHub Actions

Tests run automatically in CI:

```yaml
# .github/workflows/ci.yml
- name: Run tests
  run: pnpm ci

# Includes:
# - pnpm test:e2e (E2E tests)
# - pnpm test:visual (Visual regression)
# - pnpm test:accessibility (Accessibility tests)
```

### Parallel Execution

Playwright tests run in parallel by default:

```typescript
// playwright.config.ts
export default defineConfig({
  fullyParallel: true,
  workers: process.env.CI ? 1 : undefined, // Serial in CI, parallel locally
});
```

## Troubleshooting

### Extension Doesn't Load (Chrome)

**Symptoms:** Tests fail with timeout waiting for service worker

**Solutions:**
1. Ensure extension is built: `pnpm build`
2. Check `.output/chrome-mv3/` directory exists and contains manifest.json
3. Run with `--headed` flag to see browser errors
4. Verify service worker loads: Check browser console for errors

### Firefox Tests Skip Automatically

**Symptoms:** Firefox tests show "skipped" status

**Explanation:** This is expected behavior. Playwright does not support loading Firefox extensions via command-line arguments.

**Solutions:**
1. For automated testing: Use Chrome (fully supported)
2. For Firefox validation: Use manual testing with `web-ext`
   ```bash
   cd packages/extension/.output/firefox-mv3
   web-ext run
   ```
3. For CI/CD: Run Chrome tests only, manual Firefox check before releases

### Visual Tests Fail

**Symptoms:** Screenshot comparison shows differences

**Solutions:**
1. Review diff images in `test-results/`
2. Run `pnpm test:e2e:report` to see HTML report
3. If intentional change: `pnpm test:visual:update`

## Best Practices

### Writing Tests

1. **Use fixtures** for extension setup (see `fixtures.ts`)
2. **Use data-testid** attributes for reliable selectors
3. **Wait for elements** before interacting (auto-wait in Playwright)
4. **Test error paths** not just happy paths
5. **Keep tests independent** (no shared state)

### Visual Regression

1. **Wait for animations** to complete before screenshots
2. **Use consistent viewport** (configured in playwright.config.ts)
3. **Review diffs carefully** before updating baselines
4. **Generate baselines per environment** (platform-specific, not committed)

## Test Commands Reference

### From Extension Package (`packages/extension/`)

```bash
# All tests
pnpm test

# E2E tests
pnpm test:e2e            # Headless
pnpm test:e2e:headed     # With browser UI
pnpm test:e2e:debug      # With Playwright inspector
pnpm test:e2e:ui         # Interactive UI mode
pnpm test:e2e:report     # View last test report

# Specific test suites
pnpm test:e2e            # E2E tests only
pnpm test:visual         # Visual tests only
pnpm test:visual:update  # Update baselines
pnpm test:accessibility  # Accessibility tests only
```

## Documentation

- **Visual Testing:** `tests/visual/README.md`
- **Playwright Docs:** https://playwright.dev/docs/intro

---

**Test Framework:** Playwright 1.56+
**Browser Support:** Chrome (automated) + Firefox (manual)
