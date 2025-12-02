/**
 * AppHeader Component
 *
 * Header with branding, settings button, keyboard shortcuts, and help access.
 * Includes skip-to-main-content link for keyboard navigation (WCAG 2.1 SC 2.4.1).
 */

import { Cog6ToothIcon, LifebuoyIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import { tokens } from '../../styles/tokens';

interface AppHeaderProps {
  onOpenSettings: () => void;
  onShowKeyboardShortcuts?: () => void;
  /** Help access */
  onShowHelp?: () => void;
}

export function AppHeader({ onOpenSettings, onShowKeyboardShortcuts, onShowHelp }: AppHeaderProps) {
  return (
    <header
      className={`${tokens.colors.primary.bg} text-white ${tokens.spacing.card} flex items-center justify-between ${tokens.effects.shadowMd} border-b-2 ${tokens.colors.borders.primary} relative z-${tokens.zIndex.dropdown}`}
    >
      {/* Skip to main content link for keyboard users (WCAG 2.1 SC 2.4.1) */}
      <a
        href="#main-content"
        className={`sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-${tokens.zIndex.modal} focus:bg-white ${tokens.colors.primary.text} focus:px-4 focus:py-2 focus:rounded focus:shadow-lg focus:dark:shadow-xl`}
      >
        Skip to main content
      </a>

      <div className={`flex items-center ${tokens.spacing.gapSmall}`}>
        <img src="/icons/icon-48.svg" alt="ResumeWright Logo" className="w-6 h-6" />
        <h1 className={`${tokens.typography.large} ${tokens.typography.semibold}`}>ResumeWright</h1>
      </div>

      {/* Action buttons with visible labels */}
      <div className={`flex items-center ${tokens.spacing.gapSmall}`}>
        {/* Help button */}
        {onShowHelp && (
          <button
            type="button"
            onClick={onShowHelp}
            className={`flex items-center ${tokens.spacing.gapSmall} px-3 py-2 ${tokens.borders.rounded} ${tokens.colors.primary.hover} ${tokens.effects.focusRing} ${tokens.transitions.default}`}
            aria-label="Open help documentation"
            title="Help (F1)"
          >
            <LifebuoyIcon className={`${tokens.icons.md} shrink-0`} aria-hidden="true" />
            <span
              className={`${tokens.typography.small} ${tokens.typography.medium} whitespace-nowrap`}
            >
              Help
            </span>
          </button>
        )}
        {onShowKeyboardShortcuts && (
          <button
            type="button"
            onClick={onShowKeyboardShortcuts}
            className={`flex items-center ${tokens.spacing.gapSmall} px-3 py-2 ${tokens.borders.rounded} ${tokens.colors.primary.hover} ${tokens.effects.focusRing} ${tokens.transitions.default}`}
            aria-label="View keyboard shortcuts"
            title="Keyboard Shortcuts (Ctrl+K or ?)"
          >
            <QuestionMarkCircleIcon className={`${tokens.icons.md} shrink-0`} aria-hidden="true" />
            <span
              className={`${tokens.typography.small} ${tokens.typography.medium} whitespace-nowrap`}
            >
              Shortcuts
            </span>
          </button>
        )}
        <button
          type="button"
          onClick={onOpenSettings}
          className={`flex items-center ${tokens.spacing.gapSmall} px-3 py-2 ${tokens.borders.rounded} ${tokens.colors.primary.hover} ${tokens.effects.focusRing} ${tokens.transitions.default}`}
          aria-label="Open settings"
        >
          <Cog6ToothIcon className={`${tokens.icons.md} shrink-0`} aria-hidden="true" />
          <span
            className={`${tokens.typography.small} ${tokens.typography.medium} whitespace-nowrap`}
          >
            Settings
          </span>
        </button>
      </div>
    </header>
  );
}
