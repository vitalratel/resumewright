/**
 * Help Component
 *
 * Help documentation for users
 *
 * Provides comprehensive help documentation including:
 * - Getting started guide
 * - FAQ
 * - Keyboard shortcuts reference
 * - Troubleshooting tips
 * - Contact/support information
 */

import { ArrowLeftIcon, CommandLineIcon, QuestionMarkCircleIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import { tokens } from '../styles/tokens';
import { getShortcutDisplay } from './common';

interface HelpProps {
  onBack: () => void;
}

export function Help({ onBack }: HelpProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className={`${tokens.gradients.blueHeader} text-white p-4 flex items-center ${tokens.spacing.gapMedium} ${tokens.effects.shadowMd}`}>
        <button
          type="button"
          onClick={onBack}
          className={`${tokens.buttons.iconOnly.default} ${tokens.buttons.variants.ghostPrimary} ${tokens.borders.rounded} ${tokens.effects.focusRingLight}`}
          aria-label="Back to main view"
        >
          <ArrowLeftIcon className={tokens.icons.md} aria-hidden="true" />
        </button>
        <h1 className={`${tokens.typography.large} ${tokens.typography.semibold}`}>Help & Documentation</h1>
      </header>

      {/* Content */}
      <div className={`flex-1 overflow-y-auto ${tokens.spacing.card} ${tokens.spacing.heroSpacing}`}>
        <div className="max-w-prose mx-auto">
          {/* Table of Contents */}
          <nav className={`${tokens.spacing.cardGenerous} ${tokens.colors.neutral.bgWhite} ${tokens.borders.default} ${tokens.borders.roundedLg} ${tokens.spacing.marginMedium}`} aria-label="Table of contents">
            <h2 className={`${tokens.typography.base} ${tokens.typography.semibold} ${tokens.colors.neutral.text} ${tokens.spacing.marginSmall}`}>On this page</h2>
            <ul className={`${tokens.spacing.gapSmall} ${tokens.typography.small}`}>
              <li>
                <a
                  href="#getting-started"
                  className={`${tokens.colors.link.text} ${tokens.colors.link.hover} ${tokens.colors.link.underline} ${tokens.effects.focusRing} ${tokens.borders.rounded}`}
                >
                  Getting Started
                </a>
              </li>
              <li>
                <a
                  href="#keyboard-shortcuts"
                  className={`${tokens.colors.link.text} ${tokens.colors.link.hoverUnderline} ${tokens.effects.focusRing} ${tokens.borders.rounded}`}
                >
                  Keyboard Shortcuts
                </a>
              </li>
              <li>
                <a
                  href="#troubleshooting"
                  className={`${tokens.colors.link.text} ${tokens.colors.link.hoverUnderline} ${tokens.effects.focusRing} ${tokens.borders.rounded}`}
                >
                  Troubleshooting
                </a>
              </li>
              <li>
                <a
                  href="#faq"
                  className={`${tokens.colors.link.text} ${tokens.colors.link.hoverUnderline} ${tokens.effects.focusRing} ${tokens.borders.rounded}`}
                >
                  FAQ
                </a>
              </li>
              <li>
                <a
                  href="#support"
                  className={`${tokens.colors.link.text} ${tokens.colors.link.hoverUnderline} ${tokens.effects.focusRing} ${tokens.borders.rounded}`}
                >
                  Support
                </a>
              </li>
            </ul>
          </nav>

          {/* Getting Started */}
          <section id="getting-started">
            <div className={`flex items-center ${tokens.spacing.gapSmall} ${tokens.spacing.marginMedium}`}>
              <QuestionMarkCircleIcon className={`${tokens.icons.lg} ${tokens.colors.info.icon}`} aria-hidden="true" />
              <h2 className={`${tokens.typography.sectionHeading} ${tokens.colors.neutral.text}`}>Getting Started</h2>
            </div>
            <div className={`${tokens.spacing.cardGenerous} ${tokens.colors.neutral.bgWhite} ${tokens.borders.default} ${tokens.borders.roundedLg} ${tokens.spacing.sectionGap}`}>
              <div>
                <h3 className={`${tokens.typography.cardHeading} ${tokens.colors.neutral.text} ${tokens.spacing.marginSmall}`}>1. Get Your CV from Claude.ai</h3>
                <ol className={`list-decimal list-inside ${tokens.spacing.gapSmall} ${tokens.typography.small} ${tokens.colors.neutral.textMuted}`}>
                  <li>Ask Claude to create your CV in TSX format</li>
                  <li>Copy the TSX code from Claude&apos;s response</li>
                  <li>
                    Save it as a
                    <code className={tokens.code.inline}>.tsx</code>
                    {' '}
                    file on your computer
                  </li>
                </ol>
              </div>
              <div>
                <h3 className={`${tokens.typography.cardHeading} ${tokens.colors.neutral.text} ${tokens.spacing.marginSmall}`}>2. Import & Convert</h3>
                <ol className={`list-decimal list-inside ${tokens.spacing.gapSmall} ${tokens.typography.small} ${tokens.colors.neutral.textMuted}`}>
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
            <div className={`flex items-center ${tokens.spacing.gapSmall} ${tokens.spacing.marginMedium}`}>
              <CommandLineIcon className={`${tokens.icons.lg} ${tokens.colors.info.icon}`} aria-hidden="true" />
              <h2 className={`${tokens.typography.sectionHeading} ${tokens.colors.neutral.text}`}>Keyboard Shortcuts</h2>
            </div>
            <div className={`${tokens.spacing.cardGenerous} ${tokens.colors.neutral.bgWhite} ${tokens.borders.default} ${tokens.borders.roundedLg}`}>
              <table className="w-full text-sm">
                <thead>
                  <tr className={tokens.table.header}>
                    <th className={`text-left ${tokens.table.headerCell}`}>Action</th>
                    <th className={`text-right ${tokens.table.headerCell}`}>Shortcut</th>
                  </tr>
                </thead>
                <tbody className={tokens.table.body}>
                  <tr>
                    <td className={tokens.table.cell}>Open extension</td>
                    <td className="text-right">
                      <kbd className={tokens.code.kbd}>
                        {getShortcutDisplay('E')}
                      </kbd>
                    </td>
                  </tr>
                  <tr>
                    <td className={tokens.table.cell}>Open settings</td>
                    <td className="text-right">
                      <kbd className={tokens.code.kbd}>
                        {getShortcutDisplay(',')}
                      </kbd>
                    </td>
                  </tr>
                  <tr>
                    <td className={tokens.table.cell}>Toggle quick settings</td>
                    <td className="text-right">
                      <kbd className={tokens.code.kbd}>
                        {getShortcutDisplay('K')}
                      </kbd>
                    </td>
                  </tr>
                  <tr>
                    <td className={tokens.table.cell}>Convert CV</td>
                    <td className="text-right">
                      <kbd className={tokens.code.kbd}>
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
            <div className={`flex items-center ${tokens.spacing.gapSmall} ${tokens.spacing.marginMedium}`}>
              <WrenchScrewdriverIcon className={`${tokens.icons.lg} ${tokens.colors.info.icon}`} aria-hidden="true" />
              <h2 className={`${tokens.typography.sectionHeading} ${tokens.colors.neutral.text}`}>Troubleshooting</h2>
            </div>
            <div className={`${tokens.spacing.cardGenerous} ${tokens.colors.neutral.bgWhite} ${tokens.borders.default} ${tokens.borders.roundedLg} ${tokens.spacing.sectionGap}`}>
              <div>
                <h3 className={`${tokens.typography.cardHeading} ${tokens.colors.neutral.text} ${tokens.spacing.marginSmall}`}>File validation errors</h3>
                <p className={`${tokens.typography.small} ${tokens.colors.neutral.text} ${tokens.spacing.marginSmall}`}>If your TSX file won&apos;t import:</p>
                <ul className={`list-disc list-inside ${tokens.spacing.gapSmall} ${tokens.typography.small} ${tokens.colors.neutral.textMuted} ml-4`}>
                  <li>
                    Ensure the file has a
                    <code className={tokens.code.inline}>.tsx</code>
                    {' '}
                    extension
                  </li>
                  <li>File size must be under 1MB</li>
                  <li>Check that the file contains valid TSX code from Claude</li>
                  <li>Try regenerating the CV in Claude and exporting again</li>
                </ul>
              </div>
              <div>
                <h3 className={`${tokens.typography.cardHeading} ${tokens.colors.neutral.text} ${tokens.spacing.marginSmall}`}>Conversion taking too long</h3>
                <p className={`${tokens.typography.small} ${tokens.colors.neutral.text} ${tokens.spacing.marginSmall}`}>If conversion seems stuck:</p>
                <ul className={`list-disc list-inside ${tokens.spacing.gapSmall} ${tokens.typography.small} ${tokens.colors.neutral.textMuted} ml-4`}>
                  <li>Wait at least 30 seconds - complex CVs take longer</li>
                  <li>Close other browser tabs to free up memory</li>
                  <li>Try simplifying your CV content</li>
                  <li>Refresh the page and try again</li>
                </ul>
              </div>
              <div>
                <h3 className={`${tokens.typography.cardHeading} ${tokens.colors.neutral.text} ${tokens.spacing.marginSmall}`}>PDF quality issues</h3>
                <p className={`${tokens.typography.small} ${tokens.colors.neutral.text} ${tokens.spacing.marginSmall}`}>If the PDF doesn&apos;t look right:</p>
                <ul className={`list-disc list-inside ${tokens.spacing.gapSmall} ${tokens.typography.small} ${tokens.colors.neutral.textMuted} ml-4`}>
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
            <h2 className={`${tokens.typography.sectionHeading} ${tokens.colors.neutral.text} ${tokens.spacing.marginMedium}`}>Frequently Asked Questions</h2>
            <div className={`${tokens.spacing.cardGenerous} ${tokens.colors.neutral.bgWhite} ${tokens.borders.default} ${tokens.borders.roundedLg} ${tokens.spacing.sectionGap}`}>
              <div>
                <h3 className={`${tokens.typography.cardHeading} ${tokens.colors.neutral.text} ${tokens.spacing.marginSmall}`}>Is my data secure?</h3>
                <p className={`${tokens.typography.small} ${tokens.colors.neutral.text}`}>
                  Yes! ResumeWright processes everything locally in your browser. Your CV data never leaves your device
                  and is not sent to any servers.
                </p>
              </div>
              <div>
                <h3 className={`${tokens.typography.cardHeading} ${tokens.colors.neutral.text} ${tokens.spacing.marginSmall}`}>What file formats are supported?</h3>
                <p className={`${tokens.typography.small} ${tokens.colors.neutral.text}`}>
                  ResumeWright accepts TSX files from Claude.ai and converts them to professional PDF resumes.
                  The output is always PDF/A format for maximum compatibility.
                </p>
              </div>
              <div>
                <h3 className={`${tokens.typography.cardHeading} ${tokens.colors.neutral.text} ${tokens.spacing.marginSmall}`}>Can I customize the PDF output?</h3>
                <p className={`${tokens.typography.small} ${tokens.colors.neutral.text}`}>
                  Yes! Use Settings to adjust page size (A4, Letter, Legal) and orientation. Use Quick Settings
                  for margin presets or custom margin controls.
                </p>
              </div>
              <div>
                <h3 className={`${tokens.typography.cardHeading} ${tokens.colors.neutral.text} ${tokens.spacing.marginSmall}`}>Why does it need Claude.ai?</h3>
                <p className={`${tokens.typography.small} ${tokens.colors.neutral.text}`}>
                  ResumeWright is designed to work with Claude.ai&apos;s CV generation capabilities. Claude creates
                  structured TSX code that ResumeWright converts to beautiful PDFs.
                </p>
              </div>
            </div>
          </section>

          {/* Support */}
          <section id="support">
            <h2 className={`${tokens.typography.sectionHeading} ${tokens.colors.neutral.text} ${tokens.spacing.marginMedium}`}>Need More Help?</h2>
            <div className={`${tokens.spacing.cardGenerous} ${tokens.colors.info.bg} ${tokens.borders.default} ${tokens.colors.info.border} ${tokens.borders.roundedLg}`}>
              <p className={`${tokens.typography.small} ${tokens.colors.neutral.text} ${tokens.spacing.marginSmall}`}>
                For additional support, bug reports, or feature requests:
              </p>
              <ul className={`${tokens.spacing.gapSmall} ${tokens.typography.small} ${tokens.colors.neutral.text}`}>
                <li>
                  <strong>GitHub Issues:</strong>
                  {' '}
                  <a
                    href="https://github.com/vitalratel/resumewright/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${tokens.colors.link.text} ${tokens.colors.link.hover} ${tokens.colors.link.underline} ${tokens.effects.focusRing} ${tokens.borders.rounded}`}
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
