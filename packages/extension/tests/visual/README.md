# Visual Regression Tests (E2E)

Visual regression tests ensure UI changes don't introduce unintended visual bugs by comparing screenshots against baselines.

## Test Files

E2E tests that require **real browser rendering** and user interaction:

- **`popup-ui.spec.ts`** - Popup UI states (initial, input, converting, success, error)
- **`dark-mode.spec.ts`** - Dark mode rendering across all views
- **`custom-fonts-ui.spec.ts`** - Custom fonts UI (empty state, upload form, storage, badges, messages)

## Running Tests

```bash
# All visual E2E tests
pnpm playwright test tests/visual/

# Specific file
pnpm playwright test tests/visual/popup-ui.spec.ts

# UI mode (interactive)
pnpm playwright test --ui tests/visual/
```

## Baselines

**Baselines are gitignored** (platform-specific, generated per environment).

### Generate baselines locally:
```bash
pnpm playwright test tests/visual/ --update-snapshots
```

### After intentional UI changes:
1. Make your changes
2. Run tests to see failures
3. Review diff images in `test-results/`
4. If intentional, update baselines:
   ```bash
   pnpm playwright test tests/visual/ --update-snapshots
   ```
5. Verify tests pass

**Note:** Baselines are environment-specific. CI generates its own baselines.

## Configuration

Thresholds in `playwright.config.ts`:
- **Max diff pixels:** 100
- **Threshold:** 5% (95% fidelity)
- **Animations:** Disabled for stability

## Troubleshooting

### Tests fail with "Extension not built"
```bash
pnpm build
```

### Tests fail with "Font files missing"
Add test fonts to `tests/fixtures/fonts/`:
- `Roboto-Regular.ttf` / `.woff`
- `OpenSans-Bold.woff2`

Download from [Google Fonts](https://fonts.google.com/) (OFL licensed).

### Inconsistent results (flaky tests)
- Ensure animations disabled in config
- Add waits for fonts: `await page.evaluate(() => document.fonts.ready)`
- Add waits for stability: `await page.waitForTimeout(500)`

### Pixel differences across machines
- Baselines are platform-specific
- Generate baselines in the same environment where tests run
- Use Docker for consistent rendering

## Best Practices

1. **Test isolation** - Clean state in `beforeEach()`
2. **Wait for stability** - Fonts loaded, animations complete
3. **Screenshot specific elements** - More stable than full page
4. **Descriptive test names** - What you're testing, not how
5. **E2E is for browser UI** - Test user interactions and visual rendering in the browser

## Resources

- [Playwright Visual Testing](https://playwright.dev/docs/test-snapshots)
- [Extension Testing](https://playwright.dev/docs/chrome-extensions)
