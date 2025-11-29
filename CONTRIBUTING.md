# Contributing to ResumeWright

Thank you for your interest in contributing to ResumeWright! This document provides guidelines and instructions for contributing to the project.

---

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Communication](#communication)

---

## Getting Started

### Prerequisites

Before contributing, ensure you have the following installed:

| Tool | Minimum Version | Check Command |
|------|----------------|---------------|
| Node.js | 22.0+ | `node --version` |
| pnpm | 10.0+ | `pnpm --version` |
| Rust | 1.91+ | `rustc --version` |
| wasm-pack | 0.12+ | `wasm-pack --version` |
| Git | any recent | `git --version` |

See `README.md` for detailed installation instructions.

### First-Time Setup

```bash
# Fork and clone the repository
git clone https://github.com/vitalratel/resumewright.git
cd resumewright

# Install dependencies
pnpm install

# Build WASM
pnpm build:wasm

# Run tests to verify setup
pnpm test

# Start development server
pnpm dev
```

### Verify Your Setup

```bash
# Full CI validation (must pass before contributing)
pnpm ci
```

This runs: typecheck → lint → build → test

---

## Development Setup

### IDE Recommendations

**VS Code** (recommended):
- Extensions: Rust Analyzer, ESLint, Prettier, Tailwind CSS IntelliSense
- Settings: Enable format on save, enable ESLint auto-fix

**Other IDEs:**
- Any IDE with Rust and TypeScript support works
- Ensure Rust Analyzer and ESLint are configured

### Environment Configuration

No special environment variables required for local development.

---

## Project Structure

```
resumewright/
├── packages/
│   ├── extension/       # TypeScript browser extension
│   │   ├── src/
│   │   │   ├── background/   # Service worker
│   │   │   ├── popup/        # React UI
│   │   │   ├── content/      # TSX extractor
│   │   │   └── shared/       # Shared types
│   │   └── tests/            # E2E and visual tests
│   └── rust-core/       # Rust/WASM core (14 crates)
│       ├── tsx-parser/
│       ├── cv-domain/
│       ├── layout-engine/
│       ├── pdf-generator/
│       └── ...
├── docs/                # Documentation
├── scripts/             # Build and utility scripts
└── ARCHITECTURE.md      # Architecture overview
```

**Key Concepts:**
- **Monorepo:** Uses pnpm workspaces (TypeScript) + Cargo workspaces (Rust)
- **WASM Bridge:** `rust-core/wasm-bridge/` connects Rust to TypeScript
- **Modular Crates:** Each Rust crate has a focused purpose (100-450 lines per module)

See `ARCHITECTURE.md` for detailed architectural information.

---

## Development Workflow

### Creating a New Feature

1. **Create a branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes:**
   - Write code following coding standards
   - Add tests for new functionality
   - Update documentation if needed

3. **Test locally:**
   ```bash
   pnpm ci  # Must pass
   ```

4. **Commit changes:**
   ```bash
   git add .
   git commit -m "feat: add feature description"
   ```

5. **Push and create PR:**
   ```bash
   git push origin feature/your-feature-name
   ```
   Then create a pull request on GitHub.

### Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic changes)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Build process or tooling changes

**Examples:**
```
feat(pdf-generator): add multi-page support
fix(layout-engine): correct text wrapping calculation
docs: update ARCHITECTURE.md with new crate structure
test(tsx-parser): add test for nested JSX elements
```

### Pre-Commit Hooks

Husky automatically runs checks before each commit:
- ✅ TypeScript type checking
- ✅ ESLint linting

**If hooks fail:** Fix the errors before committing. The hooks prevent broken code from entering version control.

**Emergency bypass** (use sparingly):
```bash
git commit --no-verify -m "Emergency fix"
```

---

## Coding Standards

### TypeScript/React

**Style:**
- Use functional components with hooks (no class components)
- Use TypeScript `interface` for props, `type` for unions/intersections
- Prefer `const` over `let`, avoid `var`
- Use arrow functions for callbacks
- Enable strict mode in `tsconfig.json`

**Naming:**
- Components: PascalCase (`ConversionButton.tsx`)
- Files: kebab-case for utilities (`parse-tsx.ts`)
- Functions: camelCase (`parseDocument`)
- Constants: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`)

**Example:**
```typescript
interface ConversionButtonProps {
  onConvert: (tsx: string) => void;
  disabled?: boolean;
}

export const ConversionButton: React.FC<ConversionButtonProps> = ({
  onConvert,
  disabled = false,
}) => {
  const handleClick = () => {
    // Implementation
  };

  return <button onClick={handleClick} disabled={disabled}>Convert</button>;
};
```

**State Management:**
- Use Zustand for global state
- Use React hooks (`useState`, `useEffect`) for local state
- Avoid prop drilling (use context or Zustand)

**Imports:**
```typescript
// 1. React imports
import React, { useState, useEffect } from 'react';

// 2. Third-party imports
import { create } from 'zustand';

// 3. Local imports
import { parseDocument } from '@/shared/utils';
import type { CVDocument } from '@/shared/types';
```

### Rust

**Style:**
- Follow [Rust API Guidelines](https://rust-lang.github.io/api-guidelines/)
- Run `cargo clippy -- -D warnings` (must pass with zero warnings)
- Use `rustfmt` for formatting
- Prefer `Result` over `panic!` for error handling
- Use `thiserror` for error types

**Naming:**
- Modules: snake_case (`tsx_parser`)
- Structs/Enums: PascalCase (`CVMetadata`)
- Functions: snake_case (`parse_tsx`)
- Constants: UPPER_SNAKE_CASE (`MAX_PAGES`)

**Example:**
```rust
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ParseError {
    #[error("Invalid syntax at line {0}")]
    InvalidSyntax(usize),
}

pub fn parse_tsx(input: &str) -> Result<Document, ParseError> {
    // Implementation
    Ok(Document::default())
}
```

**Module Organization:**
- Keep modules focused (100-450 lines ideal)
- Use `lib.rs` as module hub
- Separate concerns (parsing, validation, transformation)

**Error Handling:**
```rust
// Use thiserror for domain errors
#[derive(Error, Debug)]
pub enum ConversionError {
    #[error("Parse error: {0}")]
    Parse(#[from] ParseError),
}

// Use anyhow for application-level errors
fn main() -> anyhow::Result<()> {
    // ...
}
```

### Documentation

**TypeScript:**
```typescript
/**
 * Converts TSX string to PDF bytes.
 *
 * @param tsx - The TSX source code
 * @param config - Optional configuration
 * @returns PDF as Uint8Array
 * @throws {ConversionError} If conversion fails
 */
export function convertToPdf(
  tsx: string,
  config?: PdfConfig
): Uint8Array {
  // ...
}
```

**Rust:**
```rust
/// Parses TSX source code into an AST.
///
/// # Arguments
///
/// * `input` - TSX source code as string slice
///
/// # Returns
///
/// * `Ok(Document)` - Parsed document
/// * `Err(ParseError)` - If syntax is invalid
///
/// # Examples
///
/// ```
/// let doc = parse_tsx("<div>Hello</div>")?;
/// ```
pub fn parse_tsx(input: &str) -> Result<Document, ParseError> {
    // ...
}
```

---

## Testing Guidelines

### Testing Requirements

**All contributions must include tests:**
- New features: Add unit tests + integration tests
- Bug fixes: Add regression test
- Refactoring: Ensure existing tests pass

**Coverage Targets:**
- Rust: 70%+ (current: 77.33%)
- TypeScript: 80%+ (current: 79.7%)

### Running Tests

```bash
# All tests (TypeScript + Rust)
pnpm test

# TypeScript tests only
pnpm test:ts

# Rust tests only
pnpm test:rust
cargo test --workspace

# E2E tests
pnpm test:e2e

# Visual regression tests
pnpm test:visual

# Specific crate
cargo test -p tsx-parser

# Specific test
cargo test test_parse_simple_jsx
```

### Writing Tests

**TypeScript (Vitest):**
```typescript
import { describe, it, expect } from 'vitest';
import { parseDocument } from './parser';

describe('parseDocument', () => {
  it('should parse simple TSX', () => {
    const tsx = '<div>Hello</div>';
    const result = parseDocument(tsx);
    expect(result).toBeDefined();
  });

  it('should throw on invalid syntax', () => {
    const tsx = '<div>Unclosed';
    expect(() => parseDocument(tsx)).toThrow();
  });
});
```

**Rust (cargo test):**
```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_simple_tsx() {
        let tsx = "<div>Hello</div>";
        let result = parse_tsx(tsx);
        assert!(result.is_ok());
    }

    #[test]
    fn test_parse_invalid_syntax() {
        let tsx = "<div>Unclosed";
        let result = parse_tsx(tsx);
        assert!(result.is_err());
    }
}
```

**Integration Tests:**
Place in `tests/` directory (separate from `src/`):
```rust
// tests/integration_test.rs
#[test]
fn test_full_conversion_pipeline() {
    let tsx = include_str!("fixtures/simple-cv.tsx");
    let pdf = convert_to_pdf(tsx).unwrap();
    assert!(pdf.len() > 1000); // PDF has reasonable size
}
```

---

## CI/CD Pipeline

### Overview

ResumeWright uses GitHub Actions for continuous integration and deployment. All pull requests must pass CI checks before merging.

### Automated Workflows

**1. Main CI Pipeline (`.github/workflows/ci.yml`)**
- Rust format check and clippy
- TypeScript lint and typecheck
- All tests (Rust, TypeScript, E2E)
- WASM build verification

**2. Test Suite (`.github/workflows/test.yml`)**
- Comprehensive test execution across all test types
- Visual regression tests
- Accessibility tests
- ATS compatibility tests

**3. Bundle Size Check (`.github/workflows/bundle-size-check.yml`)**
- Monitors WASM bundle size
- Fails if compressed bundle exceeds 1.6 MB
- Posts PR comments with size report

**4. Performance Regression (`.github/workflows/performance-regression.yml`)**
- Runs performance benchmarks
- Compares against baseline
- Fails if 50% slower than baseline

**5. Pre-Release Validation (`.github/workflows/pre-release.yml`)**
- Manual trigger for release candidates
- Full validation: tests, build, bundle size, version check
- Creates draft GitHub release

### Test Counts

- **Rust:** 750+ tests (unit + integration + doc tests)
- **TypeScript:** 396+ unit tests
- **Playwright:** 159+ tests (E2E + visual + performance + accessibility)
- **Total:** 1,305+ automated tests

### CI Requirements

**For all PRs:**
- ✅ All tests must pass
- ✅ 0 Rust clippy warnings
- ✅ 0 TypeScript ESLint errors
- ✅ Bundle size within limits
- ✅ No performance regressions

**Automated checks:**
- Unit tests (Rust + TypeScript)
- Integration tests
- E2E tests (Chrome + Firefox)
- Visual regression tests
- Accessibility tests (WCAG 2.1 AA)
- Security audit (npm + cargo)
- Bundle size monitoring
- Performance benchmarks

### Local CI Validation

Before pushing, run the same checks locally:

```bash
# Full CI validation
pnpm ci

# Individual checks
cargo fmt -- --check           # Rust formatting
cargo clippy -- -D warnings    # Rust linting
pnpm lint                      # TypeScript linting
pnpm typecheck                 # TypeScript type checking
pnpm test                      # All tests
pnpm build                     # Full build
```

### Viewing CI Results

**PR Status Checks:**
- GitHub will show all CI checks at the bottom of your PR
- Click "Details" on any failed check to see logs
- All checks must be green before merging

**Automated PR Comments:**
- Bundle size report (shows compressed/uncompressed sizes)
- Performance benchmark results (if performance tests run)
- Visual test results (if visual changes detected)

### Common CI Issues

**1. Bundle Size Exceeded**
```
❌ FAIL: Compressed bundle exceeds limit
```
**Solution:** Optimize dependencies or WASM code. See `docs/architecture/performance-optimization.md`.

**2. Performance Regression**
```
⚠️ Performance regression detected (52% slower)
```
**Solution:** Profile and optimize hot path code. Run `pnpm test:performance` locally.

**3. Visual Test Failures**
```
❌ Visual regression: 3 screenshots differ
```
**Solution:** Review diff images in CI artifacts. Update baselines if intentional changes.

**4. Accessibility Violations**
```
❌ WCAG violations found: color-contrast
```
**Solution:** Fix accessibility issues. Run `pnpm test:a11y` locally to debug.

### Skipping CI (Not Recommended)

To skip CI for documentation-only changes:
```bash
git commit -m "docs: update README [skip ci]"
```

**Note:** Use sparingly. Most changes should run CI.

---

## Pull Request Process

### Before Submitting

1. **Ensure all tests pass:**
   ```bash
   pnpm ci
   ```

2. **Run linters:**
   ```bash
   pnpm lint
   cargo clippy -- -D warnings
   ```

3. **Update documentation** if needed

4. **Commit with conventional commit message**

### PR Guidelines

**Title:** Use conventional commit format
```
feat(pdf-generator): add support for custom fonts
```

**Description Template:**
```markdown
## Summary
Brief description of changes (2-3 sentences).

## Changes
- Added X feature
- Fixed Y bug
- Updated Z documentation

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Tests added for new functionality
- [ ] Documentation updated
- [ ] `pnpm ci` passes
- [ ] No new ESLint/clippy warnings
```

### Review Process

1. **Automated checks run** (GitHub Actions)
2. **Code review** by maintainer
3. **Feedback addressed** if needed
4. **Merge** when approved + checks pass

**Expected response time:** 2-7 days for initial review

---

## Communication

### Where to Ask Questions

- **GitHub Issues:** Bug reports, feature requests
- **GitHub Discussions:** General questions, ideas
- **Pull Request Comments:** Code-specific questions

### Reporting Bugs

**Use GitHub Issues with this template:**

```markdown
**Bug Description:**
Clear description of the bug.

**Steps to Reproduce:**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior:**
What you expected to happen.

**Actual Behavior:**
What actually happened.

**Environment:**
- OS: [e.g., Windows 11, macOS 14, Ubuntu 22.04]
- Browser: [e.g., Chrome 120, Firefox 121]
- Extension Version: [e.g., 0.1.0]

**Screenshots/Logs:**
If applicable, add screenshots or error logs.
```

### Feature Requests

**Use GitHub Issues with this template:**

```markdown
**Feature Description:**
Clear description of the feature.

**Use Case:**
Why is this feature needed? What problem does it solve?

**Proposed Solution:**
How might this feature work?

**Alternatives:**
Any alternative solutions you've considered?
```

---

## Code of Conduct

### Our Standards

- **Be respectful:** Treat all contributors with respect
- **Be collaborative:** Work together constructively
- **Be inclusive:** Welcome diverse perspectives
- **Be patient:** Remember we're all volunteers
- **Be constructive:** Provide helpful feedback

### Unacceptable Behavior

- Harassment, discrimination, or offensive comments
- Trolling, insulting, or derogatory remarks
- Publishing others' private information
- Other unprofessional conduct

### Enforcement

Violations may result in:
1. Warning
2. Temporary ban
3. Permanent ban

Report violations to: [project maintainer email]

---

## Getting Help

**Stuck?** Here's how to get help:

1. **Check documentation:**
   - `README.md` - Setup and getting started
   - `ARCHITECTURE.md` - Architecture overview
   - `docs/TROUBLESHOOTING.md` - Common issues
   - `docs/architecture/` - Detailed architecture

2. **Search existing issues:**
   - Someone may have already asked your question
   - https://github.com/vitalratel/resumewright/issues

3. **Ask in GitHub Discussions:**
   - https://github.com/vitalratel/resumewright/discussions

4. **Create a new issue:**
   - Provide as much context as possible
   - Include error messages, steps to reproduce, etc.

---

## Recognition

Contributors will be recognized in:
- `CONTRIBUTORS.md` file
- Release notes
- GitHub contributor graph

Thank you for contributing to ResumeWright!

---
