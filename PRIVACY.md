# Privacy Policy

## Overview

ResumeWright is committed to protecting your privacy. This privacy policy explains how we handle data when you use our browser extension to convert TSX resume files into professional PDF documents.

## Data Collection

**We collect NO personal data.**

### What We Don't Collect

- No personal information
- No browsing history
- No analytics or tracking data
- No crash reports or diagnostic data
- No account credentials or authentication data
- No files or documents you generate

### Local Storage Only

The extension stores only user preferences locally on your device:
- PDF page size settings (Letter, A4, Legal)
- Margin preferences
- Theme preference (light/dark/auto)

This data never leaves your device and is stored using the browser's local storage API.

## How the Extension Works

### Client-Side Processing

All PDF generation happens **entirely in your browser**:
1. You import a TSX resume file via drag & drop or file browser
2. The TSX code is processed locally using Rust/WebAssembly
3. PDF is generated on your device
4. The file is saved to your local downloads folder

### No Server Communication

ResumeWright operates **100% offline** after installation:
- No data is transmitted to external servers
- No network requests are made during PDF generation
- No telemetry or usage statistics are collected
- The only network activity is downloading the extension itself from the Chrome/Firefox store

## Browser Permissions

The extension requests only two permissions:

### storage
- **Purpose:** Save your preferences (page size, margins, theme)
- **Scope:** Local storage only, never synchronized or transmitted

### downloads
- **Purpose:** Save generated PDF files to your downloads folder
- **Scope:** Write-only access to save PDFs you explicitly generate

## Third-Party Services

### None

ResumeWright does not:
- Access any websites or web content
- Use analytics services (Google Analytics, etc.)
- Integrate with advertising networks
- Share data with any third-party services
- Use external APIs or cloud services

## Data Security

Since no data leaves your device:
- Your resume content remains private on your computer
- No risk of data breaches or unauthorized access to our servers (we don't have any)
- PDF generation happens in an isolated browser context
- No persistent storage of your resume content

## Children's Privacy

ResumeWright does not knowingly collect data from anyone, including children under 13. Since we collect no personal information, the extension is safe for all age groups.

## Changes to This Policy

We may update this privacy policy to reflect:
- Changes in browser extension functionality
- Legal or regulatory requirements
- Improvements to our privacy practices

Changes will be posted at:
- GitHub: https://github.com/vitalratel/resumewright/blob/main/PRIVACY.md
- Extension store listings will reference the latest version

## Your Rights

Since we collect no personal data, there is no data to:
- Request access to
- Request deletion of
- Request correction of
- Request portability of

Your preferences are stored locally and can be reset by:
1. Clearing browser extension storage
2. Uninstalling and reinstalling the extension

## Open Source

ResumeWright is open source software:
- **Source Code:** https://github.com/vitalratel/resumewright
- **License:** AGPL-3.0
- You can inspect the code to verify our privacy claims

## Contact

For privacy questions or concerns:
- **GitHub Issues:** https://github.com/vitalratel/resumewright/issues

---

**Summary:** ResumeWright is privacy-first by design. We collect nothing, store nothing remotely, and transmit nothing. Your resume content stays on your device from start to finish.
