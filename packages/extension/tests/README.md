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
├── fixtures.ts                # Shared test fixtures
├── fixtures/                  # Fixture modules
│   ├── browser-config.ts          # Browser configuration
│   └── chrome-id-discovery.ts     # Chrome extension ID
├── helpers/                   # Test helper utilities
│   ├── e2eHelpers.ts              # E2E test helpers
│   ├── fixtures.ts                # Additional fixtures
│   └── index.ts                   # Helper exports
└── README.md                  # This file
```

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

# Accessibility tests
pnpm test:a11y
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

### 2. Accessibility Tests (`tests/accessibility/`)

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

Automatically loads the Chrome extension:

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
- `browserType`: Always `'chrome'` (Firefox not supported by Playwright)
- `backgroundPage`: Service worker reference (may be mocked in MV3)

**Note:** Playwright does not support loading Firefox extensions. Firefox testing requires manual testing with `web-ext run`.

## CI/CD Integration

### GitHub Actions

Tests run automatically in CI:

```yaml
# .github/workflows/ci.yml
- name: Run tests
  run: pnpm ci

# Includes:
# - pnpm test:e2e (E2E tests)
# - pnpm test:a11y (Accessibility tests)
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

### Extension Doesn't Load

**Symptoms:** Tests fail with timeout waiting for service worker

**Solutions:**
1. Ensure extension is built: `pnpm build`
2. Check `.output/chrome-mv3/` directory exists and contains manifest.json
3. Run with `--headed` flag to see browser errors
4. Verify service worker loads: Check browser console for errors

## Best Practices

### Writing Tests

1. **Use fixtures** for extension setup (see `fixtures.ts`)
2. **Use data-testid** attributes for reliable selectors
3. **Wait for elements** before interacting (auto-wait in Playwright)
4. **Test error paths** not just happy paths
5. **Keep tests independent** (no shared state)

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
pnpm test:a11y           # Accessibility tests only
```

## Documentation

- **Playwright Docs:** https://playwright.dev/docs/intro

---

**Test Framework:** Playwright 1.56+
**Browser Support:** Chrome (automated)
