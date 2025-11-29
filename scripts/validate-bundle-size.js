const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Color output for terminal
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
};

// Bundle size limits (from Architecture Section 5.3)
const LIMITS = {
  wasmUncompressed: 500 * 1024, // 500KB
  wasmGzipped: 400 * 1024,      // 400KB (P1 target)
};

function getWASMFiles() {
  const pkgDir = path.join(__dirname, '../pkg');
  if (!fs.existsSync(pkgDir)) {
    console.error(`${colors.red}❌ pkg/ directory not found. Run 'pnpm build:wasm' first.${colors.reset}`);
    process.exit(1);
  }
  const files = fs.readdirSync(pkgDir);
  return files.filter(f => f.endsWith('.wasm')).map(f => path.join(pkgDir, f));
}

function getFileSize(filePath) {
  const stats = fs.statSync(filePath);
  return stats.size;
}

function getGzippedSize(filePath) {
  const content = fs.readFileSync(filePath);
  const gzipped = zlib.gzipSync(content);
  return gzipped.length;
}

function formatSize(bytes) {
  return (bytes / 1024).toFixed(1) + ' KB';
}

function formatPercent(value, limit) {
  return ((value / limit) * 100).toFixed(1) + '%';
}

function validateBundleSize() {
  console.log(`\n${colors.cyan}📦 Validating WASM bundle size...${colors.reset}\n`);

  const wasmFiles = getWASMFiles();

  if (wasmFiles.length === 0) {
    console.error(`${colors.red}❌ No WASM files found in pkg/${colors.reset}`);
    process.exit(1);
  }

  let hasFailure = false;
  const results = [];

  for (const wasmFile of wasmFiles) {
    const fileName = path.basename(wasmFile);
    const uncompressedSize = getFileSize(wasmFile);
    const gzippedSize = getGzippedSize(wasmFile);

    console.log(`${colors.cyan}File: ${fileName}${colors.reset}`);
    console.log(`  Uncompressed: ${formatSize(uncompressedSize)} / ${formatSize(LIMITS.wasmUncompressed)} (${formatPercent(uncompressedSize, LIMITS.wasmUncompressed)})`);
    console.log(`  Gzipped:      ${formatSize(gzippedSize)} / ${formatSize(LIMITS.wasmGzipped)} (${formatPercent(gzippedSize, LIMITS.wasmGzipped)})`);

    // Check uncompressed size
    const uncompressedPass = uncompressedSize <= LIMITS.wasmUncompressed;
    if (!uncompressedPass) {
      console.log(`  ${colors.red}❌ FAIL: Uncompressed size exceeds limit${colors.reset}`);
      hasFailure = true;
    } else {
      console.log(`  ${colors.green}✅ PASS: Uncompressed size OK${colors.reset}`);
    }

    // Check gzipped size (P1 target)
    const gzippedPass = gzippedSize <= LIMITS.wasmGzipped;
    if (!gzippedPass) {
      console.log(`  ${colors.red}❌ FAIL: Gzipped size exceeds limit${colors.reset}`);
      hasFailure = true;
    } else {
      console.log(`  ${colors.green}✅ PASS: Gzipped size OK${colors.reset}`);
    }

    // Load and compare to baseline
    const baselinePath = path.join(__dirname, '../.bundle-size-baseline.json');
    if (fs.existsSync(baselinePath)) {
      const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
      const baselineSize = baseline[fileName]?.gzippedSize;

      if (baselineSize) {
        const diff = gzippedSize - baselineSize;
        const diffPercent = (diff / baselineSize * 100).toFixed(1);

        if (diff > 0) {
          const color = Math.abs(parseFloat(diffPercent)) > 10 ? colors.red : colors.yellow;
          console.log(`  ${color}📈 Size increased: +${formatSize(diff)} (+${diffPercent}%)${colors.reset}`);

          if (Math.abs(parseFloat(diffPercent)) > 10) {
            console.log(`  ${colors.yellow}⚠️  Warning: Size increase >10% from baseline${colors.reset}`);
          }
        } else if (diff < 0) {
          console.log(`  ${colors.green}📉 Size decreased: ${formatSize(diff)} (${diffPercent}%)${colors.reset}`);
        } else {
          console.log(`  ${colors.cyan}ℹ️  Size unchanged${colors.reset}`);
        }
      }
    }

    // Update baseline
    updateBaseline(fileName, { uncompressedSize, gzippedSize });

    results.push({
      fileName,
      uncompressedSize,
      gzippedSize,
      pass: uncompressedPass && gzippedPass
    });

    console.log('');
  }

  // Print summary
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);

  if (hasFailure) {
    console.error(`${colors.red}❌ Bundle size validation FAILED${colors.reset}`);
    console.log(`\n${colors.yellow}Action required: Reduce bundle size or update limits if intentional${colors.reset}\n`);
    process.exit(1);
  } else {
    console.log(`${colors.green}✅ Bundle size validation PASSED${colors.reset}`);
    console.log(`\nAll WASM bundles are within size limits.`);
    console.log(`Baseline updated at .bundle-size-baseline.json\n`);
    process.exit(0);
  }
}

function updateBaseline(fileName, sizes) {
  const baselinePath = path.join(__dirname, '../.bundle-size-baseline.json');
  let baseline = {};

  if (fs.existsSync(baselinePath)) {
    baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
  }

  baseline[fileName] = {
    ...sizes,
    timestamp: new Date().toISOString(),
    commit: process.env.GITHUB_SHA || 'local',
  };

  fs.writeFileSync(baselinePath, JSON.stringify(baseline, null, 2));
}

// Run validation
validateBundleSize();
