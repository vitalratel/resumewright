// ABOUTME: Footer with privacy message, help link, and version info.
// ABOUTME: Help center link opens in new tab for user support.

import { CheckCircleIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import { EXTERNAL_LINKS } from '../../../shared/config/externalLinks';

export function AppFooter() {
  const handleHelpClick = () => {
    void browser.tabs.create({ url: EXTERNAL_LINKS.HELP_URL });
  };

  const version = browser.runtime.getManifest().version;

  return (
    <footer className="bg-card border-t border-border px-4 py-3">
      <div className="flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={handleHelpClick}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background rounded-md px-1 py-0.5"
          aria-label="Open help center in new tab"
        >
          <QuestionMarkCircleIcon className="w-5 h-5" aria-hidden="true" />
          <span>Help & FAQ</span>
        </button>

        <div className="flex items-center gap-2 text-muted-foreground">
          <CheckCircleIcon className="w-5 h-5 text-success" aria-hidden="true" />
          <span>Privacy-first</span>
        </div>

        <span className="text-muted-foreground">v{version}</span>
      </div>
    </footer>
  );
}
