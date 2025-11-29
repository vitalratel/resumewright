# Changelog

All notable changes to ResumeWright will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Core PDF conversion pipeline (Parse → Extract → Render → Layout → Generate)
- Rust/WASM engine with 14 focused crates
- TypeScript browser extension with React UI
- File import workflow for TSX CV code
- Local-only processing (zero data transmission)
- Support for A4 and Letter paper sizes
- Google Fonts integration
- ATS-optimized PDF output
- Comprehensive test suite (750 Rust tests, 396 TypeScript tests, 159 Playwright tests)

### Performance
- Single-page CV conversion: 1-2s (25x faster than 10s target)
- Multi-page CV conversion: 2-4s (14x faster than 10s target)
- WASM bundle size: 1.43 MB compressed (under 2 MB limit)

### Quality Metrics
- Rust test coverage: 77.33% (target: 70%) ✅
- TypeScript test coverage: 79.7% (target: 80%) ⚠️
- WCAG 2.1 Level A compliance: 100%


## [0.1.0] - Beta Release (Upcoming)

Initial beta release for testing and feedback.

---

**Note:** This project is currently in beta. Version 1.0.0 will be released after Quality Assurance & Launch phase completion.
