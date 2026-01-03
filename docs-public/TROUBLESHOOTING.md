# Troubleshooting Guide

This guide covers common issues you may encounter when developing ResumeWright and their solutions.

## pnpm Installation Issues

### Error: ERR_PNPM_META_FETCH_FAIL

**Symptoms:**
```
ERR_PNPM_META_FETCH_FAIL  GET https://registry.npmjs.org/@crxjs%2Fvite-plugin:
Value of "this" must be of type URLSearchParams
```

**Causes:**
- pnpm version incompatibility
- Network/proxy configuration issues
- Corrupted pnpm store/cache
- Node.js version incompatibility

### Solutions (try in order):

#### 1. Clear pnpm cache
```bash
pnpm store prune
rm -rf node_modules
rm -rf packages/*/node_modules
pnpm install
```

#### 2. Update pnpm
```bash
npm install -g pnpm@latest
pnpm --version  # Should be 8.0+
pnpm install
```

#### 3. Configure registry explicitly
```bash
pnpm config set registry https://registry.npmjs.org/
pnpm config set network-timeout 60000
pnpm install
```

#### 4. Check Node.js version
```bash
node --version  # Should be v22+

# If using nvm, switch to Node 22 LTS
nvm use 22
pnpm install
```

#### 5. Remove lock file and retry
```bash
rm -f pnpm-lock.yaml
pnpm install
```

#### 6. Use npm as fallback
```bash
npm install
# All pnpm scripts will still work
```

#### 7. Check proxy settings
```bash
# If behind corporate proxy
pnpm config set proxy http://proxy.company.com:8080
pnpm config set https-proxy http://proxy.company.com:8080

# If NOT behind proxy
pnpm config delete proxy
pnpm config delete https-proxy
```

#### 8. Fresh pnpm installation
```bash
# Uninstall pnpm
npm uninstall -g pnpm

# Reinstall via standalone script (Unix/macOS/Linux)
curl -fsSL https://get.pnpm.io/install.sh | sh -

# Or via npm
npm install -g pnpm@8

# Try again
pnpm install
```

## Build Issues

### TypeScript Compilation Errors

```bash
# Clean and rebuild
rm -rf dist/
pnpm build
```

### Vite Build Failures

```bash
# Check for config errors
cat packages/extension/vite.config.ts

# Try dev mode first
pnpm dev
```

### Rust Compilation Issues

```bash
# Update Rust
rustup update stable

# Clean Rust build
cargo clean
cargo check --all
```

## Extension Loading Issues

### Extension won't load in Chrome

1. Ensure extension is built:
```bash
pnpm build
```

2. Verify output folder exists:
```bash
ls -la packages/extension/.output/chrome-mv3/
```

3. Check Chrome console for errors:
   - Open `chrome://extensions/`
   - Find ResumeWright
   - Click "service worker" link (background script)
   - Check for errors

4. Try rebuilding from scratch:
```bash
rm -rf packages/extension/.output/ packages/extension/.wxt/
pnpm build
```

### Icons not displaying

If extension icons don't show:

1. Verify icon files exist:
```bash
ls -la packages/extension/public/icons/
```

2. Check WXT generated the manifest correctly:
```bash
cat packages/extension/.output/chrome-mv3/manifest.json | jq .icons
```

3. Rebuild the extension:
```bash
pnpm build
```

## Testing Issues

### Vitest won't run

```bash
# Install test dependencies explicitly
cd packages/extension
pnpm add -D vitest @testing-library/react @testing-library/jest-dom happy-dom

# Run tests
pnpm test
```

### Tests failing

```bash
# Run in watch mode to see details
pnpm test:watch

# Check coverage
pnpm test:coverage
```

## Development Workflow Issues

### Hot reload not working

1. Stop dev server (Ctrl+C)
2. Clear WXT cache:
```bash
rm -rf .wxt/ packages/extension/node_modules/.vite
```
3. Restart: `pnpm dev`

### WXT Build Issues

If `pnpm build` fails with WXT-related errors:

```bash
# Clear WXT cache
rm -rf .wxt/

# Reinstall WXT dependencies
pnpm install --force

# Try building again
pnpm build
```

### Background worker changes not reflecting

Background service workers require full extension reload:
1. Go to `chrome://extensions/`
2. Click reload button for ResumeWright
3. Or remove and re-add the extension

## Network/Connectivity Issues

### Cannot reach npm registry

```bash
# Test connectivity
curl -I https://registry.npmjs.org/

# Use alternative registry (e.g., Taobao in China)
pnpm config set registry https://registry.npmmirror.com/

# Or Cloudflare mirror
pnpm config set registry https://registry.npmjs.cf/
```

### SSL Certificate errors

```bash
# Disable strict SSL (not recommended for production)
pnpm config set strict-ssl false

# Or install/update certificates
# macOS: sudo security find-certificate -a -p /System/Library/Keychains/SystemRootCertificates.keychain > /tmp/certs.pem
# Linux: sudo apt-get install ca-certificates
```

## WASM Build Issues

### wasm-pack build fails

```bash
# Update wasm-pack
cargo install wasm-pack --force

# Clean and rebuild
rm -rf pkg/
pnpm build:wasm
```

### WASM bundle too large

The project has been optimized to 1.43 MB compressed. If you're seeing larger sizes:

```bash
# Check actual bundle size
ls -lh pkg/wasm_bridge_bg.wasm
gzip -c pkg/wasm_bridge_bg.wasm | wc -c

# Verify release profile is being used
cat Cargo.toml | grep -A 10 "\[profile.release\]"

# Rebuild with optimizations
cargo clean
pnpm build:wasm
```

## Getting Help

If none of these solutions work:

1. **Check logs**: Look for detailed error messages in terminal output
2. **Search GitHub issues**:
   - pnpm: https://github.com/pnpm/pnpm/issues
   - WXT: https://github.com/wxt-dev/wxt/issues
   - wasm-pack: https://github.com/rustwasm/wasm-pack/issues
3. **Verify prerequisites**: Ensure all tools are installed and up-to-date
4. **Try on different network**: Corporate networks may block npm registry access
5. **Check system requirements**: Ensure OS, Node, Rust versions are compatible
6. **See README.md**: Review installation prerequisites and setup steps

## Quick Health Check

Run this script to verify your environment:

```bash
#!/bin/bash
echo "=== Environment Health Check ==="
echo ""
echo "Node.js: $(node --version)"
echo "pnpm: $(pnpm --version)"
echo "Rust: $(rustc --version)"
echo "Cargo: $(cargo --version)"
echo ""
echo "Checking pnpm registry..."
pnpm config get registry
echo ""
echo "Checking network connectivity..."
curl -I https://registry.npmjs.org/ 2>&1 | head -1
echo ""
echo "=== End Health Check ==="
```

Save as `check-env.sh`, make executable with `chmod +x check-env.sh`, and run `./check-env.sh`.
