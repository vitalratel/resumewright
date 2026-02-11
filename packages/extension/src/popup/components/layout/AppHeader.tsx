// ABOUTME: Header with branding, settings button, keyboard shortcuts, and help access.
// ABOUTME: Includes skip-to-main-content link for keyboard navigation (WCAG 2.1 SC 2.4.1).

import { HiOutlineCog6Tooth, HiOutlineLifebuoy, HiOutlineQuestionMarkCircle } from 'solid-icons/hi';
import { Show } from 'solid-js';

interface AppHeaderProps {
  onOpenSettings: () => void;
  onShowKeyboardShortcuts?: () => void;
  /** Help access */
  onShowHelp?: () => void;
}

const headerButtonClasses =
  'flex items-center gap-2 px-3 py-2 rounded-md bg-black/10 hover:bg-black/20 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-primary transition-colors duration-200';

export function AppHeader(props: AppHeaderProps) {
  return (
    <header class="bg-primary text-primary-foreground p-4 flex items-center justify-between shadow-md dark:shadow-none border-b-2 border-primary/70 relative z-10">
      <a
        href="#main-content"
        class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-card focus:text-foreground focus:px-4 focus:py-2 focus:rounded focus:shadow-lg"
      >
        Skip to main content
      </a>

      <div class="flex items-center gap-2">
        <img src="/icons/icon-48.svg" alt="ResumeWright Logo" class="w-6 h-6" />
        <h1 class="text-lg font-semibold">ResumeWright</h1>
      </div>

      <div class="flex items-center gap-2">
        <Show when={props.onShowHelp}>
          {(onShowHelp) => (
            <button
              type="button"
              onClick={() => onShowHelp()()}
              class={headerButtonClasses}
              aria-label="Open help documentation"
              title="Help (F1)"
            >
              <HiOutlineLifebuoy class="w-6 h-6 shrink-0" aria-hidden="true" />
              <span class="text-sm font-medium whitespace-nowrap">Help</span>
            </button>
          )}
        </Show>
        <Show when={props.onShowKeyboardShortcuts}>
          {(onShowKeyboardShortcuts) => (
            <button
              type="button"
              onClick={() => onShowKeyboardShortcuts()()}
              class={headerButtonClasses}
              aria-label="View keyboard shortcuts"
              title="Keyboard Shortcuts (Ctrl+K or ?)"
            >
              <HiOutlineQuestionMarkCircle class="w-6 h-6 shrink-0" aria-hidden="true" />
              <span class="text-sm font-medium whitespace-nowrap">Shortcuts</span>
            </button>
          )}
        </Show>
        <button
          type="button"
          onClick={() => props.onOpenSettings()}
          class={headerButtonClasses}
          aria-label="Open settings"
        >
          <HiOutlineCog6Tooth class="w-6 h-6 shrink-0" aria-hidden="true" />
          <span class="text-sm font-medium whitespace-nowrap">Settings</span>
        </button>
      </div>
    </header>
  );
}
