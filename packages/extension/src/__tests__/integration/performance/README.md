# Performance Integration Tests

This directory contains Vitest integration tests that directly test WASM performance for validating conversion speed targets across different device tiers and CV sizes.

**Test Type**: Integration tests using Vitest (Node.js + WASM)
**Location**: `src/__tests__/integration/performance/`
**Original Location**: Migrated from `tests/performance/` (Playwright E2E → Vitest integration)

## Test Files

- **high-end-device.spec.ts**: Tests for high-end devices (8GB+ RAM, modern CPU)
- **low-end-device.spec.ts**: Tests for low-end devices (4GB RAM, Chromebook-level)
- **multi-page-performance.spec.ts**: Multi-page CV specific performance tests
- **font-styling-performance.spec.ts**: Font and styling overhead tests
- **conversion-benchmarks.spec.ts**: Layout algorithm optimization benchmarks

## Performance Targets

### High-End Devices (8GB+ RAM, modern CPU)
- Single-page CV: **<5 seconds**
- Multi-page CV (2-3 pages): **<10 seconds**
- Maximum CV (6 pages): **<15 seconds**

### Low-End Devices (4GB RAM, Chromebook-level CPU)
- Single-page CV: **<8 seconds**
- Multi-page CV (2-3 pages): **<15 seconds**
- Maximum CV (6 pages): **<25 seconds**

## Device Simulation

### High-End Devices
No throttling applied. Tests run at native Node.js/WASM speed.

### Low-End Devices
CPU throttling simulated by multiplying measured times by 4x:
- **4x multiplier** simulates Chromebook-level processor
- Emulates realistic low-end device constraints

```typescript
// Measure actual conversion time
const result = await measureConversion(tsxContent);

// Simulate 4x CPU throttling
const throttledTime = result.totalTime * 4;

expect(throttledTime).toBeLessThan(8000); // <8s target
```

## Running Performance Tests

```bash
# Run all performance tests
pnpm test:ts src/__tests__/integration/performance

# Run specific test file
pnpm test:ts src/__tests__/integration/performance/high-end-device.spec.ts
pnpm test:ts src/__tests__/integration/performance/conversion-benchmarks.spec.ts

# Run with coverage
pnpm test:coverage src/__tests__/integration/performance

# Watch mode for development
pnpm test:watch src/__tests__/integration/performance
```

## Test Structure

### Basic Performance Test
```typescript
it('should convert within target time', async () => {
  // Measure conversion using real WASM
  const result = await measureConversion(tsxContent);
  
  console.warn(`Conversion time: ${result.totalTime.toFixed(2)}ms`);
  console.warn(`  Parse: ${result.parseTime ?? 0}ms`);
  console.warn(`  Layout: ${result.layoutTime ?? 0}ms`);
  console.warn(`  PDF: ${result.pdfTime ?? 0}ms`);
  
  expect(result.totalTime).toBeLessThan(5000);
});
```

### Benchmark Test
```typescript
it('should benchmark average performance', async () => {
  const times: number[] = [];
  
  for (let i = 0; i < 5; i++) {
    const result = await measureConversion(tsxContent);
    times.push(result.totalTime);
  }
  
  const avgTime = times.reduce((a, b) => a + b) / times.length;
  console.warn(`Average: ${avgTime.toFixed(2)}ms`);
  
  expect(avgTime).toBeLessThan(5000);
});
```

## Multi-Page Performance Tests

The `multi-page-performance.spec.ts` file includes comprehensive tests for:

### Coverage
- **2-page CV**: Traditional product manager resume
- **3-page CV**: Academic CV with publications
- **6-page CV**: Executive CV (maximum typical length)

### Validation
1. **Performance Targets**: Verify all conversions meet device tier targets
2. **Linear Scaling**: Confirm pagination scales O(n) with content size
3. **Memory Usage**: Ensure memory stays within bounds (<100MB for 6 pages)
4. **Detailed Profiling**: Break down timing by pipeline stage
5. **Stress Testing**: Validate rapid sequential conversions

### Example: Multi-Page Overhead Test
```typescript
it('compare single-page vs multi-page overhead', async () => {
  const singlePageResult = await measureConversion(singlePageCV);
  const twoPageResult = await measureConversion(twoPageCV);
  
  // Calculate overhead ratio
  const timePerPage = {
    singlePage: singlePageResult.totalTime,
    twoPage: twoPageResult.totalTime / 2,
  };
  
  const overheadRatio = timePerPage.twoPage / timePerPage.singlePage;
  
  // Multi-page overhead should be <3x (accounts for pagination complexity + CI variability)
  expect(overheadRatio).toBeLessThan(3.0);
});
```

## Performance Profiling

### Detailed Breakdown
Tests can measure individual pipeline stages:
1. **Parse Time**: TSX parsing
2. **Layout Time**: Layout calculation
3. **Pagination Time**: Multi-page pagination (should be <15% of total)
4. **PDF Generation**: PDF rendering

### Memory Monitoring
```typescript
const memoryBefore = (performance as { memory?: { usedJSHeapSize: number } })
  .memory?.usedJSHeapSize ?? 0;

await measureConversion(tsxContent);

const memoryAfter = (performance as { memory?: { usedJSHeapSize: number } })
  .memory?.usedJSHeapSize ?? 0;

const memoryDelta = memoryAfter - memoryBefore;
const memoryDeltaMB = memoryDelta / 1024 / 1024;

console.warn(`Memory used: ${memoryDeltaMB.toFixed(2)} MB`);
expect(memoryDelta).toBeLessThan(75 * 1024 * 1024); // <75MB
```

## CI/CD Integration

Performance tests run in CI with the following configurations:

### GitHub Actions
```yaml
- name: Run performance integration tests
  run: pnpm test:ts src/__tests__/integration/performance
  
- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: performance-test-results
    path: test-results/
```

### Performance Regression Detection
Tests fail if conversion times exceed targets, preventing performance regressions from merging.

## Troubleshooting

### Tests Timeout
If tests timeout (default 5 minutes in vitest.config.ts):
1. Check WASM module loading with debug logs
2. Verify WASM file exists at `/home/dev/resumewright/pkg/wasm_bridge_bg.wasm`
3. Check for infinite loops in WASM code

### Inconsistent Timing
If times vary significantly between runs:
1. Close other applications during testing
2. Run on dedicated CI runners
3. Use average of multiple iterations
4. Check for background processes affecting CPU

### Low-End Tests Fail
If low-end device tests fail targets:
1. Verify 4x CPU throttling is applied
2. Check if pagination algorithm is O(n)
3. Profile to identify bottlenecks
4. Consider optimizing slow pipeline stages

## Performance Optimization Tips

### WASM Optimization
- Ensure release build with optimizations enabled
- Use `wasm-opt` for size/speed optimization
- Profile WASM execution with browser DevTools

### Layout Engine
- Cache calculated dimensions where possible
- Avoid unnecessary re-layouts
- Use efficient data structures for box tree

### PDF Generation
- Stream PDF generation for large documents
- Compress images and fonts
- Minimize redundant PDF operations

### Pagination
- Maintain O(n) complexity
- Avoid backtracking
- Efficient memory allocation for page splits

## Monitoring in Production

Once deployed, monitor real-world performance:

```javascript
// Track conversion timing
const startTime = performance.now();
await convertToPdf(tsx);
const duration = performance.now() - startTime;

// Send to analytics
analytics.track('cv_conversion_completed', {
  duration_ms: duration,
  page_count: pageCount,
  device_tier: detectDeviceTier(),
});
```

## Font & Styling Performance Tests

The `font-styling-performance.spec.ts` file tests performance overhead introduced by font and color features:

### Performance Targets
- **Font/Color Overhead**: <500ms vs baseline (no custom fonts/colors)
- **Memory Usage**: <5MB per font
- **High-End Total**: Still <5 seconds for single-page CV
- **Low-End Total**: Still <8 seconds for single-page CV

### Test Coverage

- **01-web-safe-fonts**: 5 different font families (Arial, Times, Georgia, Verdana, Courier)
- **02-font-weights**: Multiple font weights (400-700)
- **03-font-styles**: Bold, italic, bold-italic combinations
- **04-colors**: Text and background colors (hex, rgb, rgba, named)
- **05-mixed-styling**: Realistic CV with varied fonts, colors, and decorations

### Baseline Comparison

Tests establish a baseline using a simple CV (no custom fonts/colors), then measure overhead:

```typescript
beforeAll(async () => {
  // Establish baseline (simple CV)
  baselineMetrics = await measureConversion(baselineCV);
  console.warn(`Baseline: ${baselineMetrics.totalTime.toFixed(2)}ms`);
});

it('font mapping adds <500ms overhead', async () => {
  const metrics = await measureConversion(styledCV);
  const overhead = metrics.totalTime - baselineMetrics.totalTime;
  
  console.warn(`Overhead: ${overhead.toFixed(2)}ms`);
  expect(overhead).toBeLessThan(500);
});
```

### Memory Profiling

```typescript
it('font mapping memory usage <5MB per font', async () => {
  const memoryBefore = (performance as { memory?: { usedJSHeapSize: number } })
    .memory?.usedJSHeapSize ?? 0;
  
  // Convert with 5 fonts
  await measureConversion(tsxContentWith5Fonts);
  
  const memoryAfter = (performance as { memory?: { usedJSHeapSize: number } })
    .memory?.usedJSHeapSize ?? 0;
  const memoryIncrease = (memoryAfter - memoryBefore) / (1024 * 1024);
  
  console.warn(`Memory delta: ${memoryIncrease.toFixed(2)}MB`);
  
  // 5 fonts × 5MB = <25MB total
  expect(memoryIncrease).toBeLessThan(25);
});
```

### Timing Breakdown

Tests log detailed timing for debugging:

```
Font/Styling Performance:
  Total time: 285ms
  Overhead: 135ms (47.4%)
  Parse: 20ms
  Layout: 30ms
  Font Mapping: 50ms  ← New overhead
  PDF Generation: 150ms
```

### Low-End Device Testing

With 4x CPU throttling simulation:
```typescript
it('font styling conversion on low-end device <8 seconds', async () => {
  const metrics = await measureConversion(styledCV);
  
  // Simulate 4x CPU throttling
  const throttledTime = metrics.totalTime * 4;
  
  console.warn(`Throttled time: ${throttledTime.toFixed(2)}ms`);
  expect(throttledTime).toBeLessThan(8000);
});
```

### Performance Regression Detection

```typescript
it('verify font mapping optimization (linear complexity)', async () => {
  const smallCV = baselineCV;
  const mediumCV = baselineCV.repeat(5);  // 5x content
  const largeCV = baselineCV.repeat(10);  // 10x content
  
  const smallTime = await measureConversion(smallCV);
  const mediumTime = await measureConversion(mediumCV);
  const largeTime = await measureConversion(largeCV);
  
  // Linear growth: ratio should be close to content size ratio
  const growthRatio = mediumTime.totalTime / smallTime.totalTime;
  
  // Should be ~5x for linear, not 25x for quadratic
  expect(growthRatio).toBeLessThan(10);
});
```

### Running Font/Styling Performance Tests

```bash
# Run font/styling performance tests
pnpm test:ts src/__tests__/integration/performance/font-styling-performance.spec.ts

# Run with detailed console output
pnpm test:ts src/__tests__/integration/performance/font-styling-performance.spec.ts --reporter=verbose

# Watch mode for development
pnpm test:watch src/__tests__/integration/performance/font-styling-performance.spec.ts
```

### Performance Report Output

Tests generate a detailed performance summary:

```
======================================================================
📊 FONT/STYLING PERFORMANCE REPORT
======================================================================

Test Date: 2025-10-16T12:34:56.789Z
Baseline: Simple CV (no custom fonts/colors)
Baseline Time: 150.23ms

Performance Breakdown:

01-web-safe-fonts.tsx:
  Total: 285.45ms
  Overhead: 135.22ms (90.0%)
  Parse: 20ms
  Layout: 30ms
  Font Mapping: 50ms
  PDF Generation: 150ms
  Status: ✅ PASS (<500ms overhead)

02-font-weights.tsx:
  Total: 295.67ms
  Overhead: 145.44ms (96.8%)
  ...

======================================================================
Target: <500ms overhead vs baseline
High-End Device Target: <5 seconds total
Low-End Device Target: <8 seconds total (4x throttling)
======================================================================
```

### CI/CD Integration

Performance tests run in CI (can be configured as informational):

```yaml
- name: Run performance tests (font/styling overhead)
  run: pnpm test:ts src/__tests__/integration/performance/font-styling-performance.spec.ts
  continue-on-error: true  # Optional: make informational, not blocking

- name: Comment PR with performance results
  uses: actions/github-script@v7
  # Posts performance breakdown to PR
```

### Performance Optimization Notes

**Font Mapping Optimization:**
- Font mapping is O(n) - linear with content size
- Uses hash map for fast font family lookups
- Caches font metrics to avoid recalculation
- All font data embedded at build time (no runtime lookups)

**Color Processing:**
- Color parsing is negligible overhead (<5ms)
- Uses pre-computed color tables for named colors
- RGB/RGBA/Hex parsing is O(1) constant time

**Expected Overhead:**
- Web-safe fonts: 40-60ms (font mapping)
- Colors: 5-10ms (color parsing)
- Combined: 50-70ms typical overhead

**If Overhead Exceeds 500ms:**
1. Profile font mapper with DevTools
2. Check for O(n²) loops in font matching
3. Verify font cache is being used
4. Consider lazy font loading for unused fonts

## Related Documentation

- Vitest Testing Guide: https://vitest.dev/guide/
- WASM Performance Best Practices: https://webassembly.org/docs/
- Node.js Performance Measurement: https://nodejs.org/api/perf_hooks.html

---

**Last Updated**: 2025-10-16
**Performance Targets**: 
- Multi-page: High-end <15s (6 pages), Low-end <25s (6 pages)
- Font/styling overhead: <500ms vs baseline, <5MB per font
