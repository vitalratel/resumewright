# Large Font Test Fixtures

## Purpose

These large font files are **test fixtures** designed to enable edge case testing for custom font storage limits in the ResumeWright browser extension.

## Files

- **Font-1.ttf** through **Font-10.ttf**: 10 font files, each exactly 2MB (2,097,152 bytes)
- **Total size**: 20MB

## How They're Created

Each file is a copy of `Roboto-Regular.ttf` padded with null bytes to reach exactly 2MB. The padding is appended to the end of the TTF file, which font parsers ignore. This means:

- ✅ The fonts remain **functionally valid** and can be parsed
- ✅ They test **realistic file sizes** for custom font uploads
- ✅ No licensing concerns (based on Apache 2.0-licensed Roboto)

## Test Scenarios

These fixtures enable testing of:

### 1. Storage Progress Bar - Yellow (70-90%)
**Test**: `progress bar yellow when storage 70-90%`  
**Font count**: 7-9 fonts (~14-18MB)  
**Expected**: Progress bar displays yellow, indicating high storage usage

### 2. Storage Progress Bar - Red (>90%)
**Test**: `progress bar red when storage > 90%`  
**Font count**: 9-10 fonts (~18-20MB)  
**Expected**: Progress bar displays red, indicating critical storage usage

### 3. Font Count Limit
**Test**: `upload disabled when font count limit reached`  
**Font count**: 10 fonts (maximum allowed)  
**Expected**: Upload input disabled, warning message displayed

## Chrome Extension Storage Quota

- **Chrome**: ~20MB per extension
- **Firefox**: Similar limits
- **Test targets**:
  - 70% = ~14MB
  - 90% = ~18MB
  - 100% = ~20MB

## Usage in Tests

```typescript
import path from 'path';

// Upload fonts to reach 70-90% storage
for (let i = 1; i <= 8; i++) {
  const fontPath = path.join(__dirname, `../fixtures/fonts/large/Font-${i}.ttf`);
  await uploadCustomFont(extensionPage, fontPath, {
    family: `TestFont${i}`,
    weight: 400,
    style: 'normal',
  });
}

// Verify yellow progress bar
const color = await getProgressBarColor(extensionPage);
expect(color).toBe('yellow');
```

## Git Considerations

⚠️ **Size Impact**: These fixtures add 20MB to the repository.

**Options**:
1. Keep in repo (currently chosen) - simplifies CI/CD
2. Use Git LFS - reduces clone size but adds complexity
3. Generate programmatically in test setup - cleaner but slower

For now, we keep them in the repo since:
- One-time 20MB impact is acceptable
- Simplifies test execution
- No external dependencies needed
- Fast test setup

## Maintenance

If storage limits change in future browser versions:
- Regenerate fixtures with adjusted sizes
- Update test thresholds accordingly
- Rerun: `pnpm playwright test custom-fonts-ui.spec.ts --update-snapshots`

---

**Created**: 2025-10-19  
**Story**: 2.7 - Task 2.3 (Custom Fonts Visual Tests)  
**License**: Based on Roboto (Apache 2.0)
