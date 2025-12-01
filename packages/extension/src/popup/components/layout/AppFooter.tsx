/**
 * AppFooter Component
 * Footer with privacy message and help link
 * Help center link for user support
 */

import { CheckCircleIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import { EXTERNAL_LINKS } from '../../../shared/config/externalLinks';
import { tokens } from '../../styles/tokens';

export function AppFooter() {
  const handleHelpClick = () => {
    // Open help center in new tab
    // Configurable help URL from central config
    void browser.tabs.create({
      url: EXTERNAL_LINKS.HELP_URL,
    });
  };

  // Get extension version for display
  const version = browser.runtime.getManifest().version;

  return (
    <footer className={`${tokens.colors.neutral.bgWhite} border-t ${tokens.borders.default} px-4 py-3`}>
      <div className={`flex items-center justify-between ${tokens.typography.xs}`}>
        {/* Help & FAQ Link */}
        <button
          type="button"
          onClick={handleHelpClick}
          className={`flex items-center gap-1.5 ${tokens.colors.neutral.textMuted} ${tokens.colors.link.hover} ${tokens.transitions.default} ${tokens.effects.focusRing} ${tokens.borders.rounded} px-1 py-0.5`
            .trim()
            .replace(/\s+/g, ' ')}
          aria-label="Open help center in new tab"
        >
          <QuestionMarkCircleIcon className={tokens.icons.sm} aria-hidden="true" />
          <span>Help & FAQ</span>
        </button>

        {/* Privacy Message */}
        <div className={`flex items-center ${tokens.spacing.gapSmall} ${tokens.colors.neutral.textMuted}`}>
          <CheckCircleIcon className={`${tokens.icons.sm} ${tokens.colors.success.icon}`} aria-hidden="true" />
          <span>Privacy-first</span>
        </div>

        {/* Version Info */}
        <span className={tokens.colors.neutral.textLight}>
          v
          {version}
        </span>
      </div>
    </footer>
  );
}
