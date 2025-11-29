# Security Policy

## Overview

ResumeWright is designed with security and privacy as core principles. All CV processing happens **locally in your browser** using WebAssembly - no data is transmitted to external servers.

This document outlines our security practices and how to report vulnerabilities.

---

## Supported Versions

We provide security updates for the following versions:

| Version | Supported          | Status |
| ------- | ------------------ | ------ |
| 0.1.x   | :white_check_mark: | Beta - Active development |

**Note:** Once we reach 1.0.0, we will maintain security updates for the latest major version and the previous major version.

---

## Security Architecture

### Privacy-First Design

- ✅ **100% Local Processing** - All TSX parsing and PDF generation happens in your browser via WebAssembly
- ✅ **No Server Communication** - Extension does not connect to any backend servers
- ✅ **No Analytics/Telemetry** - No usage tracking or data collection
- ✅ **Minimal Permissions** - Only requests `storage` and `downloads` permissions
- ✅ **Content Security Policy** - Strict CSP prevents unauthorized script execution

### Technical Security Measures

1. **Sandboxed Execution**
   - Runs in Chrome/Firefox extension sandbox (isolated from web pages)
   - WASM module execution isolated from JavaScript context
   - No access to arbitrary file system (only Downloads folder)

2. **Content Security Policy**
   ```json
   {
     "extension_pages": "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self'; object-src 'self'"
   }
   ```
   - Prevents inline scripts and eval()
   - Only allows WASM execution (required for PDF generation)
   - No remote resource loading

3. **Input Validation**
   - TSX files validated before parsing (schema validation with Valibot)
   - Font files validated before embedding (TTF/OTF format checks)
   - Settings sanitized before storage

4. **Dependency Management**
   - Regular dependency audits via `pnpm audit`
   - Minimal dependency footprint (only essential libraries)
   - Cargo dependencies scanned for known vulnerabilities

---

## Known Limitations

### Out of Scope

The following are **not** security vulnerabilities:

1. **Malicious TSX Files** - ResumeWright parses user-provided TSX. If you import a malicious file, it may contain harmful content. **Always review TSX files before importing.**
2. **Browser Vulnerabilities** - Security issues in Chrome/Firefox itself are out of scope.
3. **OS-Level Security** - File system permissions, device encryption, etc. are user responsibility.
4. **Physical Access** - If someone has physical access to your device, they can access local storage.

### Known Risks

1. **TSX Code Execution** - TSX files are transpiled and executed in browser context. Only import TSX from trusted sources (e.g., your own Claude.ai conversations).
2. **Font File Parsing** - Custom fonts are parsed by `ttf-parser` (Rust crate). While robustly tested, malformed fonts could theoretically cause issues.
3. **Local Storage** - Settings and history stored in browser's local storage (unencrypted). Use browser master password for protection.

---

## Reporting a Vulnerability

**We take security seriously.** If you discover a vulnerability, please report it responsibly.

### How to Report

**DO NOT** open a public GitHub issue for security vulnerabilities.

Instead, report privately via one of these methods:

1. **GitHub Security Advisories** (Preferred)
   - Go to: https://github.com/vitalratel/resumewright/security/advisories
   - Click "Report a vulnerability"
   - Provide details (see below)

2. **Email** (Alternative)
   - Send to: security@vitalratel.com
   - Subject: "ResumeWright Security Vulnerability"

### What to Include

Please provide:

1. **Description** - Clear explanation of the vulnerability
2. **Impact** - What can an attacker do? (data theft, code execution, etc.)
3. **Affected Versions** - Which versions are vulnerable?
4. **Reproduction Steps** - Detailed steps to reproduce the issue
5. **Proof of Concept** - Code, screenshots, or video demonstrating the issue
6. **Suggested Fix** - If you have ideas for mitigation (optional)

**Example Report:**

```
**Title:** XSS via Unsanitized TSX Input

**Description:** 
The TSX parser does not sanitize HTML entities in text content, allowing 
injection of malicious scripts.

**Impact:** 
An attacker could craft a malicious TSX file that executes JavaScript 
when rendered in the extension popup.

**Affected Versions:** 
0.1.0 - 0.1.5

**Reproduction Steps:**
1. Create TSX file with: <div>{"<script>alert('XSS')</script>"}</div>
2. Import file into ResumeWright
3. Observe script execution in popup

**Suggested Fix:**
Sanitize all text content with DOMPurify before rendering.
```

### Response Timeline

We aim to respond within:

- **24-48 hours** - Initial acknowledgment of report
- **7 days** - Assessment of severity and impact
- **30 days** - Patch developed and tested
- **45 days** - Public disclosure (coordinated with reporter)

**Note:** Timeline may vary based on severity and complexity. We'll keep you updated throughout.

---

## Vulnerability Disclosure Policy

### Coordinated Disclosure

We follow **coordinated disclosure** (also known as responsible disclosure):

1. **Reporter notifies us** - You report the issue privately
2. **We confirm and patch** - We verify the issue and develop a fix (target: 30 days)
3. **Public disclosure** - After patch is released, we publish a security advisory (with credit to reporter)

### Credit & Recognition

Security researchers who report valid vulnerabilities will be:

- ✅ Credited in the security advisory (unless you prefer anonymity)
- ✅ Listed in our CONTRIBUTORS.md file
- ✅ Mentioned in release notes (if you consent)

**We do not offer bug bounties** at this time (open-source project with no revenue).

---

## Security Best Practices for Users

### Recommendations

1. **Keep Browser Updated** - Always use the latest Chrome/Firefox version
2. **Verify Extension Source** - Only install from official Chrome Web Store or Firefox Add-ons
3. **Review TSX Files** - Don't import TSX from untrusted sources
4. **Use Browser Master Password** - Protects local storage from unauthorized access
5. **Check Permissions** - Verify extension only requests `storage` and `downloads`
6. **Review Code** - ResumeWright is open source - audit it yourself!

### Red Flags (Potential Compromise)

If you notice any of these, **uninstall immediately** and report:

- ❌ Extension requests additional permissions (especially `<all_urls>`)
- ❌ Network traffic to unknown domains (check DevTools Network tab)
- ❌ Extension behavior changes unexpectedly after update
- ❌ Unexpected popups or redirects
- ❌ High CPU/memory usage

---

## Security Updates

### How We Communicate Security Issues

1. **GitHub Security Advisories** - Published at https://github.com/vitalratel/resumewright/security/advisories
2. **Release Notes** - Included in CHANGELOG.md with `[SECURITY]` tag
3. **Extension Store Listing** - Updated description with security notice
4. **In-Extension Notification** - Critical issues may show update prompt

### Update Policy

- **Critical Vulnerabilities** (CVE score 9.0+) - Hotfix within 24-48 hours
- **High Severity** (CVE score 7.0-8.9) - Patch within 7 days
- **Medium Severity** (CVE score 4.0-6.9) - Patch within 30 days
- **Low Severity** (CVE score < 4.0) - Patch in next regular release

**Users are strongly encouraged to enable auto-updates in Chrome/Firefox.**

---

## Third-Party Dependencies

### Dependency Security

We regularly audit dependencies for known vulnerabilities:

**Rust Dependencies:**
```bash
cargo audit --database https://github.com/RustSec/advisory-db
```

**JavaScript Dependencies:**
```bash
pnpm audit
```

**Critical Dependencies:**
- `lopdf` - PDF generation (Rust)
- `swc` - TSX parsing (Rust)
- `ttf-parser` - Font parsing (Rust)
- `React` - UI framework (JavaScript)
- `Zustand` - State management (JavaScript)

### Supply Chain Security

- ✅ All dependencies pinned to specific versions (no `^` or `~` in package.json)
- ✅ `pnpm-lock.yaml` committed to repository (ensures reproducible builds)
- ✅ Cargo.lock committed to repository
- ✅ CI runs `pnpm audit` and `cargo audit` on every commit

---

## Security Audits

### Internal Security Reviews

- ✅ Code review required for all PRs (enforced via GitHub branch protection)
- ✅ Static analysis with Clippy (Rust) and ESLint (TypeScript)
- ✅ Automated dependency scanning (Dependabot)

### External Audits

**Status:** No professional security audit yet (open-source project, limited budget)

**Planned:** We plan to request community security reviews before 1.0.0 release.

**Interested in auditing?** Contact us at security@vitalratel.com - we welcome independent security assessments.

---

## Security Changelog

### Version 0.1.0 (Beta)

- ✅ Initial security architecture implemented
- ✅ Content Security Policy enforced
- ✅ Input validation for TSX and fonts
- ✅ Minimal permissions model (`storage`, `downloads` only)
- ✅ 100% local processing (no network requests)

---

## Contact

- **Security Issues:** security@vitalratel.com or GitHub Security Advisories
- **General Questions:** info@vitalratel.com
- **GitHub Issues:** https://github.com/vitalratel/resumewright/issues (non-security issues only)

---

**Thank you for helping keep ResumeWright secure!**

---
