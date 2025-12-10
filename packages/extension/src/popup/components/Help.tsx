// ABOUTME: Help documentation component for users.
// ABOUTME: Provides getting started guide, FAQ, keyboard shortcuts, and troubleshooting.

import {
  ArrowLeftIcon,
  CommandLineIcon,
  QuestionMarkCircleIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import { getShortcutDisplay } from '../utils/shortcuts';

interface HelpProps {
  onBack: () => void;
}

export function Help({ onBack }: HelpProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="bg-linear-to-r from-primary to-primary/90 text-primary-foreground p-4 flex items-center gap-3 shadow-md dark:shadow-none">
        <button
          type="button"
          onClick={onBack}
          className="min-w-11 min-h-11 p-2 hover:bg-primary-foreground/20 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-foreground/50"
          aria-label="Back to main view"
        >
          <ArrowLeftIcon className="w-6 h-6" aria-hidden="true" />
        </button>
        <h1 className="text-lg font-semibold">Help & Documentation</h1>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 md:space-y-8">
        <div className="max-w-prose mx-auto">
          {/* Table of Contents */}
          <nav
            className="p-6 md:p-8 bg-card border border-border rounded-lg mb-4"
            aria-label="Table of contents"
          >
            <h2 className="text-base font-semibold text-foreground mb-3">On this page</h2>
            <ul className="gap-2 text-sm">
              <li>
                <a
                  href="#getting-started"
                  className="text-primary hover:text-primary/80 underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background rounded-md"
                >
                  Getting Started
                </a>
              </li>
              <li>
                <a
                  href="#keyboard-shortcuts"
                  className="text-primary hover:text-primary/80 hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background rounded-md"
                >
                  Keyboard Shortcuts
                </a>
              </li>
              <li>
                <a
                  href="#troubleshooting"
                  className="text-primary hover:text-primary/80 hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background rounded-md"
                >
                  Troubleshooting
                </a>
              </li>
              <li>
                <a
                  href="#faq"
                  className="text-primary hover:text-primary/80 hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background rounded-md"
                >
                  FAQ
                </a>
              </li>
              <li>
                <a
                  href="#support"
                  className="text-primary hover:text-primary/80 hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background rounded-md"
                >
                  Support
                </a>
              </li>
            </ul>
          </nav>

          {/* Getting Started */}
          <section id="getting-started">
            <div className="flex items-center gap-2 mb-4">
              <QuestionMarkCircleIcon className="w-8 h-8 text-info" aria-hidden="true" />
              <h2 className="text-2xl md:text-2_5xl font-semibold text-foreground">
                Getting Started
              </h2>
            </div>
            <div className="p-6 md:p-8 bg-card border border-border rounded-lg space-y-6 md:space-y-8">
              <div>
                <h3 className="text-xl font-medium text-foreground mb-3">
                  1. Get Your CV from Claude.ai
                </h3>
                <ol className="list-decimal list-inside gap-2 text-sm text-muted-foreground">
                  <li>Ask Claude to create your CV in TSX format</li>
                  <li>Copy the TSX code from Claude&apos;s response</li>
                  <li>
                    Save it as a<code className="bg-muted text-foreground px-1 rounded">.tsx</code>{' '}
                    file on your computer
                  </li>
                </ol>
              </div>
              <div>
                <h3 className="text-xl font-medium text-foreground mb-3">2. Import & Convert</h3>
                <ol className="list-decimal list-inside gap-2 text-sm text-muted-foreground">
                  <li>Click the ResumeWright icon in your browser toolbar</li>
                  <li>Drag and drop your TSX file, or click &ldquo;Browse Files&rdquo;</li>
                  <li>Your CV will be validated and converted to PDF automatically</li>
                  <li>Download your professional PDF resume</li>
                </ol>
              </div>
            </div>
          </section>

          {/* Keyboard Shortcuts */}
          <section id="keyboard-shortcuts">
            <div className="flex items-center gap-2 mb-4">
              <CommandLineIcon className="w-8 h-8 text-info" aria-hidden="true" />
              <h2 className="text-2xl md:text-2_5xl font-semibold text-foreground">
                Keyboard Shortcuts
              </h2>
            </div>
            <div className="p-6 md:p-8 bg-card border border-border rounded-lg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 text-muted-foreground font-medium">Action</th>
                    <th className="text-right py-2 text-muted-foreground font-medium">Shortcut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="py-2 text-foreground">Open extension</td>
                    <td className="text-right">
                      <kbd className="px-2 py-1 bg-muted text-foreground rounded border border-border font-mono text-xs">
                        {getShortcutDisplay('E')}
                      </kbd>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-foreground">Open settings</td>
                    <td className="text-right">
                      <kbd className="px-2 py-1 bg-muted text-foreground rounded border border-border font-mono text-xs">
                        {getShortcutDisplay(',')}
                      </kbd>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-foreground">Toggle quick settings</td>
                    <td className="text-right">
                      <kbd className="px-2 py-1 bg-muted text-foreground rounded border border-border font-mono text-xs">
                        {getShortcutDisplay('K')}
                      </kbd>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-foreground">Convert CV</td>
                    <td className="text-right">
                      <kbd className="px-2 py-1 bg-muted text-foreground rounded border border-border font-mono text-xs">
                        {getShortcutDisplay('Enter')}
                      </kbd>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Troubleshooting */}
          <section id="troubleshooting">
            <div className="flex items-center gap-2 mb-4">
              <WrenchScrewdriverIcon className="w-8 h-8 text-info" aria-hidden="true" />
              <h2 className="text-2xl md:text-2_5xl font-semibold text-foreground">
                Troubleshooting
              </h2>
            </div>
            <div className="p-6 md:p-8 bg-card border border-border rounded-lg space-y-6 md:space-y-8">
              <div>
                <h3 className="text-xl font-medium text-foreground mb-3">File validation errors</h3>
                <p className="text-sm text-foreground mb-3">If your TSX file won&apos;t import:</p>
                <ul className="list-disc list-inside gap-2 text-sm text-muted-foreground ml-4">
                  <li>
                    Ensure the file has a
                    <code className="bg-muted text-foreground px-1 rounded">.tsx</code> extension
                  </li>
                  <li>File size must be under 1MB</li>
                  <li>Check that the file contains valid TSX code from Claude</li>
                  <li>Try regenerating the CV in Claude and exporting again</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-medium text-foreground mb-3">
                  Conversion taking too long
                </h3>
                <p className="text-sm text-foreground mb-3">If conversion seems stuck:</p>
                <ul className="list-disc list-inside gap-2 text-sm text-muted-foreground ml-4">
                  <li>Wait at least 30 seconds - complex CVs take longer</li>
                  <li>Close other browser tabs to free up memory</li>
                  <li>Try simplifying your CV content</li>
                  <li>Refresh the page and try again</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-medium text-foreground mb-3">PDF quality issues</h3>
                <p className="text-sm text-foreground mb-3">If the PDF doesn&apos;t look right:</p>
                <ul className="list-disc list-inside gap-2 text-sm text-muted-foreground ml-4">
                  <li>Adjust page size in Settings (A4, Letter, or Legal)</li>
                  <li>Customize margins using Quick Settings</li>
                  <li>Ensure your original TSX code has proper formatting</li>
                  <li>Try different margin presets</li>
                </ul>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section id="faq">
            <h2 className="text-2xl md:text-2_5xl font-semibold text-foreground mb-4">
              Frequently Asked Questions
            </h2>
            <div className="p-6 md:p-8 bg-card border border-border rounded-lg space-y-6 md:space-y-8">
              <div>
                <h3 className="text-xl font-medium text-foreground mb-3">Is my data secure?</h3>
                <p className="text-sm text-foreground">
                  Yes! ResumeWright processes everything locally in your browser. Your CV data never
                  leaves your device and is not sent to any servers.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-medium text-foreground mb-3">
                  What file formats are supported?
                </h3>
                <p className="text-sm text-foreground">
                  ResumeWright accepts TSX files from Claude.ai and converts them to professional
                  PDF resumes. The output is always PDF/A format for maximum compatibility.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-medium text-foreground mb-3">
                  Can I customize the PDF output?
                </h3>
                <p className="text-sm text-foreground">
                  Yes! Use Settings to adjust page size (A4, Letter, Legal) and orientation. Use
                  Quick Settings for margin presets or custom margin controls.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-medium text-foreground mb-3">
                  Why does it need Claude.ai?
                </h3>
                <p className="text-sm text-foreground">
                  ResumeWright is designed to work with Claude.ai&apos;s CV generation capabilities.
                  Claude creates structured TSX code that ResumeWright converts to beautiful PDFs.
                </p>
              </div>
            </div>
          </section>

          {/* Support */}
          <section id="support">
            <h2 className="text-2xl md:text-2_5xl font-semibold text-foreground mb-4">
              Need More Help?
            </h2>
            <div className="p-6 md:p-8 bg-info/10 border border-info/20 rounded-lg">
              <p className="text-sm text-foreground mb-3">
                For additional support, bug reports, or feature requests:
              </p>
              <ul className="gap-2 text-sm text-foreground">
                <li>
                  <strong>GitHub Issues:</strong>{' '}
                  <a
                    href="https://github.com/vitalratel/resumewright/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background rounded-md"
                  >
                    github.com/vitalratel/resumewright/issues
                  </a>
                </li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
