# Development Guide

**ResumeWright** - A privacy-first browser extension that converts Claude-generated CV/resume TSX code into professional PDFs.

This guide covers setting up your development environment, building, testing, and contributing to ResumeWright.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Building for Production](#building-for-production)
- [Contributing](#contributing)

---

## Prerequisites

See [README.md](../README.md#prerequisites) for detailed installation instructions.

**Required:**
- Node.js 18+
- pnpm 8+
- Rust 1.86+
- wasm-pack 0.12+
- Git

**Verify setup:**
```bash
./scripts/verify-prerequisites.sh  # Unix/macOS/Linux
.\scripts\verify-prerequisites.ps1  # Windows
```

---

## Quick Start

```bash
# Clone repository
git clone https://github.com/vitalratel/resumewright.git
cd resumewright

# Install dependencies
pnpm install

# Build WASM core (one-time, or after Rust changes)
pnpm build:wasm

# Start development server with hot reload
pnpm dev

# In another terminal, load extension in Chrome:
# 1. Open chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the `.output/chrome-mv3` directory
```

---

## Project Structure

```
resumewright/
├── packages/
│   ├── extension/          # TypeScript browser extension
│   │   ├── src/
│   │   │   ├── background/ # Service worker (Manifest V3)
│   │   │   ├── popup/      # React UI components
│   │   │   └── shared/     # Shared utilities and types
│   │   ├── tests/          # Vitest unit tests
│   │   └── wxt.config.ts   # WXT configuration
│   └── rust-core/          # Rust/WASM backend
│       ├── tsx-parser/     # TSX parsing with SWC
│       ├── cv-domain/      # Domain models
│       ├── layout-engine/  # Box layout algorithm
│       ├── pdf-generator/  # PDF generation
│       ├── font-toolkit/   # Font subsetting
│       └── wasm-bridge/    # WASM bindings
├── docs-public/            # Documentation
├── scripts/                # Build scripts
└── pkg/                    # Built WASM files (gitignored)
```

**Architecture:** See [ARCHITECTURE.md](ARCHITECTURE.md) for system design overview.

---

## Development Workflow

### Development Mode

**Hot reload for TypeScript/React:**
```bash
pnpm dev  # Starts WXT dev server
```

Changes to `packages/extension/src/**` trigger automatic rebuild and extension reload.

**After Rust changes:**
```bash
pnpm build:wasm  # Rebuild WASM
# Then restart `pnpm dev`
```

### Loading Extension in Browser

**Chrome:**
1. Navigate to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select `.output/chrome-mv3` directory
5. Extension appears in toolbar

**Firefox:**
```bash
pnpm dev:firefox
```
Then navigate to `about:debugging#/runtime/this-firefox` and load temporary add-on.

### Making Changes

**TypeScript/React (Extension UI):**
- Edit files in `packages/extension/src/`
- Changes hot-reload automatically
- Check browser console for errors

**Rust/WASM (PDF Engine):**
- Edit files in `packages/rust-core/`
- Run `pnpm build:wasm` to rebuild
- Restart `pnpm dev`
- Check browser console for WASM errors

**Styles (Tailwind CSS):**
- Edit classes in React components
- Tailwind auto-compiles on change
- See `packages/extension/tailwind.config.js`

---

## Testing

### Run All Tests

```bash
pnpm test  # Runs TypeScript + Rust tests
```

### TypeScript Tests (Vitest)

```bash
pnpm test:ts              # Run once
pnpm test:watch           # Watch mode
pnpm test:coverage        # With coverage report
```

**Test files:** Co-located with source (e.g., `App.test.tsx` next to `App.tsx`)

**Key test utilities:**
- `@testing-library/react` - Component testing
- `fake-indexeddb` - Mock browser storage
- `vitest` - Test runner

### Rust Tests (Cargo)

```bash
pnpm test:rust            # All Rust tests
cd packages/rust-core
cargo test --package tsx-parser  # Specific crate
```

### End-to-End Tests (Playwright)

```bash
pnpm test:e2e             # Run E2E tests
pnpm test:e2e:headed      # With visible browser
pnpm test:e2e:debug       # Debug mode
```

### Visual Regression Tests

**Prerequisites:**
```bash
# Download pdfium library (one-time setup)
bash scripts/download-pdfium-linux.sh
export LD_LIBRARY_PATH=/home/dev/resumewright/lib:$LD_LIBRARY_PATH

# Build PDF-to-PNG converter
cd packages/rust-core
cargo build --release --bin pdf-to-png
```

**Run tests:**
```bash
pnpm build:test-fixtures  # Transpile TSX fixtures
pnpm test:visual          # Run visual tests
```

---

## Building for Production

### Build Extension

```bash
pnpm build  # Builds for Chrome (Manifest V3)
```

Output: `.output/chrome-mv3/` (ready to zip and upload to Chrome Web Store)

**Firefox:**
```bash
pnpm build:firefox
```

Output: `.output/firefox-mv3/`

### Create Store Packages

```bash
pnpm zip          # Creates resumewright-[version]-chrome.zip
pnpm zip:firefox  # Creates resumewright-[version]-firefox.zip
```

### Bundle Size Validation

```bash
pnpm validate:bundle  # Ensures WASM < 2MB threshold
```

Current WASM size: **1.43 MB compressed** (target: < 2 MB)

---

## Code Quality

### Type Checking

```bash
pnpm typecheck  # TypeScript type checking (no build)
```

### Linting

```bash
pnpm lint        # ESLint for TypeScript
pnpm lint --fix  # Auto-fix issues
```

### Formatting

```bash
pnpm format  # Prettier (TypeScript/JSON)
cargo fmt    # Rust formatting
```

### Pre-Commit Hooks

Husky runs automatically before each commit:
- ✅ Type checking
- ✅ Linting

To bypass (emergencies only):
```bash
git commit --no-verify -m "Emergency fix"
```

### Full CI Validation

Run the complete CI pipeline locally:

```bash
pnpm ci  # typecheck → lint → build → test → bundle validation
```

**Use before creating pull requests** to ensure CI passes.

---

## Common Tasks

### Add a New Dependency

**TypeScript:**
```bash
cd packages/extension
pnpm add <package>           # Production dependency
pnpm add -D <package>        # Dev dependency
```

**Rust:**
```bash
cd packages/rust-core/<crate-name>
cargo add <crate>
```

### Debug WASM Issues

**Check WASM loading:**
1. Open browser DevTools (F12)
2. Network tab → Filter "wasm"
3. Verify `wasm_bridge_bg.wasm` loads (should be ~1.4 MB)

**Check WASM errors:**
1. Console tab
2. Look for errors from `wasm-bridge`
3. Check `background` service worker logs

**Rebuild WASM from scratch:**
```bash
rm -rf pkg/
pnpm build:wasm
```

### Update Dependencies

**TypeScript:**
```bash
pnpm update               # Interactive update
pnpm audit                # Check for vulnerabilities
pnpm audit --fix          # Auto-fix vulnerabilities
```

**Rust:**
```bash
cargo update              # Update Cargo.lock
cargo audit               # Check for vulnerabilities
```

### Generate Test Coverage

**TypeScript:**
```bash
pnpm test:coverage
# Opens coverage report in browser
```

**Rust:**
```bash
cd packages/rust-core
cargo llvm-cov --lcov --html --output-dir target/coverage
# Generates lcov.info and HTML report in target/coverage/
```

---

## Troubleshooting

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common issues and solutions.

**Common issues:**

1. **`wasm-pack: command not found`**
   ```bash
   cargo install wasm-pack
   ```

2. **WASM build fails**
   ```bash
   rustup update  # Update Rust toolchain
   ```

3. **Extension not loading**
   - Check `.output/chrome-mv3/manifest.json` exists
   - Check browser console for errors
   - Try removing and re-adding extension

4. **Tests fail with OOM**
   ```bash
   NODE_OPTIONS='--max-old-space-size=4096' pnpm test
   ```

---

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for:
- Code style guidelines
- Pull request process
- Commit message conventions
- Code review expectations

**Quick tips:**
- Write tests for new features
- Run `pnpm ci` before creating PR
- Keep commits focused and atomic
- Follow existing code patterns

---

## Additional Resources

- **Architecture:** [ARCHITECTURE.md](ARCHITECTURE.md)
- **Troubleshooting:** [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- **Security:** [SECURITY.md](../SECURITY.md)
- **Privacy:** [PRIVACY.md](../PRIVACY.md)
- **Changelog:** [CHANGELOG.md](../CHANGELOG.md)

---

**Questions?** Open an issue on GitHub or contact contact@resumewright.com.

---

**Happy coding!** 🚀
