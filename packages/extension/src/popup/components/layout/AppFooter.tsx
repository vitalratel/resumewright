// ABOUTME: Footer with privacy message, help link, and version info.
// ABOUTME: Help center link opens in new tab for user support.

import { HiOutlineCheckCircle, HiOutlineQuestionMarkCircle } from 'solid-icons/hi';
import { EXTERNAL_LINKS } from '../../../shared/config/externalLinks';

export function AppFooter() {
  const handleHelpClick = () => {
    void browser.tabs.create({ url: EXTERNAL_LINKS.HELP_URL });
  };

  const version = browser.runtime.getManifest().version;

  return (
    <footer class="bg-card border-t border-border px-4 py-3">
      <div class="flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={handleHelpClick}
          class="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background rounded-md px-1 py-0.5"
          aria-label="Open help center in new tab"
        >
          <HiOutlineQuestionMarkCircle class="w-5 h-5" aria-hidden="true" />
          <span>Help & FAQ</span>
        </button>

        <div class="flex items-center gap-2 text-muted-foreground">
          <HiOutlineCheckCircle class="w-5 h-5 text-success" aria-hidden="true" />
          <span>Privacy-first</span>
        </div>

        <span class="text-muted-foreground">v{version}</span>
      </div>
    </footer>
  );
}
