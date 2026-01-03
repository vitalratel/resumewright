# Font Fixtures for Visual Tests

This directory contains test font files used by Story 2.7 visual regression tests.

## Current Status

✅ **All Required Fonts Available:**
- `Roboto-Regular.ttf` (504 KB) - TrueType font
- `Roboto-Regular.woff` (15 KB) - WOFF compressed font
- `Roboto-Regular.woff2` (11 KB) - WOFF2 compressed font
- `OpenSans-Bold.ttf` (144 KB) - TrueType font
- `OpenSans-Bold.woff2` (18 KB) - WOFF2 compressed font

## Required Files

The visual tests in `custom-fonts-ui.spec.ts` expect:

1. **Roboto-Regular.ttf** (~160KB) ✅
2. **Roboto-Regular.woff** (~15KB) ✅
3. **OpenSans-Bold.woff2** (~18KB) ✅

All required files are now present and ready for testing!

## How Files Were Obtained

Font files were downloaded from:
- **jsDelivr CDN** (@fontsource packages) - WOFF/WOFF2 formats
- **Google Fonts GitHub** - TrueType (TTF) formats

These are all open-source fonts with Apache License 2.0.

## Regenerating Files (If Needed)

### Option 2: Using fonttools (Python)

```bash
# Install fonttools
pip install fonttools brotli zopfli

# Convert TTF to WOFF
pyftsubset Roboto-Regular.ttf --output-file=Roboto-Regular.woff --flavor=woff

# Convert TTF to WOFF2
pyftsubset OpenSans-Bold.ttf --output-file=OpenSans-Bold.woff2 --flavor=woff2
```

### Option 3: Using Project's Rust Code (Future)

The project has WOFF/WOFF2 decompression code in `packages/rust-core/pdf-generator/`.
A conversion CLI tool could be added in the future.

## Font Licenses

- **Roboto**: Apache License 2.0 (Google)
- **Open Sans**: Apache License 2.0 (Google Fonts)

Both fonts are open-source and safe for testing purposes.

## Test Usage

These fonts are used by PDF generation integration tests.
