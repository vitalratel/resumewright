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
- Node.js 22+
- pnpm 10+
- Rust 1.91+
- wasm-pack 0.12+
- Gleam 1.14+ (via mise: `mise install`)
- Git

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

# Build Gleam application
pnpm build:gleam

# Load the extension in Chrome:
# 1. Open chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the `packages/extension/public` directory
```

---

## Project Structure

```
resumewright/
├── packages/
│   ├── app_gleam/              # Gleam/Lustre application
│   │   ├── src/
│   │   │   ├── app/            # MVU core (model, view, update, msg)
│   │   │   ├── background/     # Service worker (message handling, conversion)
│   │   │   ├── shared/         # Shared types, codecs, validation
│   │   │   ├── view/           # View layer (importing, converting, success, error, settings)
│   │   │   └── ffi/            # Chrome extension API FFI wrappers
│   │   ├── test/               # Gleam unit tests
│   │   └── gleam.toml          # Gleam project config
│   ├── extension/              # Extension packaging and tests
│   │   ├── entrypoints/        # HTML shells (converter, popup)
│   │   ├── public/             # Static assets + built Gleam bundle
│   │   │   └── gleam/          # Built JS output (gitignored)
│   │   ├── tests/              # E2E (Playwright) and accessibility tests
│   │   └── wxt.config.ts       # Extension manifest config
│   └── rust-core/              # Rust/WASM backend
│       ├── tsx-parser/         # TSX parsing with OXC
│       ├── cv-domain/          # Domain models
│       ├── layout-engine/      # Box layout algorithm
│       ├── pdf-generator/      # PDF generation
│       ├── font-toolkit/       # Font subsetting
│       └── wasm-bridge/        # WASM bindings
├── docs-public/                # Documentation
└── scripts/                    # Build scripts
```

**Architecture:** See [ARCHITECTURE.md](ARCHITECTURE.md) for system design overview.

---

## Development Workflow

### Making Changes

**Gleam/Lustre (Extension UI):**
```bash
cd packages/app_gleam
mise exec -- gleam test   # Run unit tests
pnpm build:gleam           # Rebuild and reload extension
```

**Rust/WASM (PDF Engine):**
```bash
pnpm build:wasm   # Rebuild WASM
# Then reload extension in chrome://extensions/
```

**Styles (Tailwind CSS):**
- Edit `packages/extension/src/popup/index.css`
- Run `pnpm build` to recompile CSS

### Loading Extension in Browser

**Chrome:**
1. Navigate to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select `packages/extension/public` directory
5. After rebuilding, click the refresh icon on the extension card

---

## Testing

### Run All Tests

```bash
pnpm test:all   # E2E + accessibility tests
```

### Gleam Unit Tests

```bash
cd packages/app_gleam
mise exec -- gleam test   # Run all Gleam tests
```

### End-to-End Tests (Playwright)

```bash
cd packages/extension
pnpm test:e2e             # Run E2E tests (headless Chrome)
pnpm test:e2e:headed      # With visible browser
pnpm test:e2e:debug       # Debug mode
```

### Accessibility Tests

```bash
cd packages/extension
pnpm test:a11y            # WCAG 2.1 Level A/AA checks (axe-core)
```

### Rust Tests (Cargo)

```bash
pnpm test:rust                               # All Rust tests
cd packages/rust-core
cargo test --package tsx-parser              # Specific crate
```

---

## Building for Production

### Build Extension

```bash
pnpm build   # Full build: WASM + Gleam + CSS
```

Output: `packages/extension/public/` (load unpacked from this directory)

### Create Store Packages

```bash
pnpm zip   # Creates resumewright-[version]-chrome.zip
```

### Bundle Size Validation

```bash
pnpm validate:bundle   # Ensures WASM < 4MB threshold
```

---

## Code Quality

### Type Checking

```bash
pnpm typecheck   # TypeScript type checking for Playwright configs
```

### Linting / Formatting

```bash
pnpm lint        # Biome lint for TypeScript test files
pnpm format      # Biome format
cargo fmt        # Rust formatting
```

### Gleam Formatting

```bash
cd packages/app_gleam
mise exec -- gleam format
```

---

## Common Tasks

### Add a Gleam Dependency

```bash
cd packages/app_gleam
mise exec -- gleam add <package>
```

### Add a TypeScript Dev Dependency (tests only)

```bash
cd packages/extension
pnpm add -D <package>
```

### Add a Rust Dependency

```bash
cd packages/rust-core/<crate-name>
cargo add <crate>
```

### Debug WASM Issues

**Check WASM loading:**
1. Open browser DevTools (F12)
2. Network tab → Filter "wasm"
3. Verify `wasm_bridge_bg.wasm` loads

**Check WASM errors:**
1. Console tab
2. Look for errors from `wasm-bridge`
3. Check background service worker logs

**Rebuild WASM from scratch:**
```bash
rm -rf packages/rust-core/wasm-bridge/pkg/
pnpm build:wasm
```

### Update Dependencies

**Gleam:**
```bash
cd packages/app_gleam
mise exec -- gleam update
```

**TypeScript:**
```bash
pnpm update
pnpm audit
```

**Rust:**
```bash
cargo update
cargo audit
```

---

## Troubleshooting

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common issues and solutions.

**Common issues:**

1. **`gleam: command not found`**
   ```bash
   mise install   # installs Gleam and rebar3 via mise.toml
   ```

2. **`wasm-pack: command not found`**
   ```bash
   cargo install wasm-pack
   ```

3. **WASM build fails**
   ```bash
   rustup update   # Update Rust toolchain
   ```

4. **Extension not loading**
   - Check `packages/extension/public/manifest.json` exists
   - Check browser console for errors
   - Try removing and re-adding extension

5. **Gleam build fails with "module not found"**
   ```bash
   cd packages/app_gleam
   mise exec -- gleam deps download
   ```

---

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for:
- Code style guidelines
- Pull request process
- Commit message conventions
- Code review expectations

**Quick tips:**
- Write tests for new features (Gleam unit tests + Playwright E2E where relevant)
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
