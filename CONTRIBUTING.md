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

See [README.md](README.md#prerequisites) for prerequisites and [Setup Guide](docs-public/SETUP.md) for installation instructions.

```bash
git clone https://github.com/vitalratel/resumewright.git
cd resumewright
pnpm install
pnpm build
pnpm test  # verify setup
```

---

## Project Structure

```
resumewright/
├── packages/
│   ├── extension/       # TypeScript browser extension
│   │   ├── src/
│   │   │   ├── background/   # Service worker
│   │   │   ├── popup/        # React UI
│   │   │   └── shared/       # Shared types
│   │   └── tests/        # E2E and visual tests
│   └── rust-core/       # Rust/WASM core
│       ├── tsx-parser/
│       ├── cv-domain/
│       ├── layout-engine/
│       ├── pdf-generator/
│       └── ...
├── docs-public/         # Documentation
├── scripts/             # Build and utility scripts
```

**Key Concepts:**
- **Monorepo:** Uses pnpm workspaces (TypeScript) + Cargo workspaces (Rust)
- **WASM Bridge:** `rust-core/wasm-bridge/` connects Rust to TypeScript
- **Modular Crates:** Each Rust crate has a focused purpose

See `docs-public/ARCHITECTURE.md` for detailed architectural information.

---

## Contribution Workflow

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
   pnpm typecheck && pnpm lint && pnpm test
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
- Keep modules focused
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
- Rust: 80%+ 
- TypeScript: 80%+

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

**1. CI Pipeline (`.github/workflows/ci.yml`)**
- Rust checks (format, clippy, tests)
- WASM build and bundle size validation
- TypeScript lint and typecheck
- Unit tests (sharded for speed)
- Playwright tests (accessibility, visual regression)
- Extension build verification

**2. Weekly CI (`.github/workflows/ci-weekly.yml`)**
- Cross-platform testing
- Extended test coverage

**3. Security Audit (`.github/workflows/audit.yml`)**
- npm and cargo security audits

**4. Pre-Release (`.github/workflows/pre-release.yml`)**
- Manual trigger for release candidates
- Full validation and draft GitHub release

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
**Solution:** Optimize dependencies or WASM code.

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
   pnpm typecheck && pnpm lint && pnpm test
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
- [ ] All checks pass (`pnpm typecheck && pnpm lint && pnpm test`)
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

See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

---

## Getting Help

**Stuck?** Here's how to get help:

1. **Check documentation:**
   - `docs-public/SETUP.md` - Setup and installation
   - `docs-public/ARCHITECTURE.md` - Architecture overview
   - `docs-public/TROUBLESHOOTING.md` - Common issues

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
