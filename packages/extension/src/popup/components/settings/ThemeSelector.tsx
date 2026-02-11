// ABOUTME: Theme selector component for light, dark, and auto modes.
// ABOUTME: Uses radio input pattern for accessibility with system preference support.

import { HiOutlineComputerDesktop, HiOutlineMoon, HiOutlineSun } from 'solid-icons/hi';
import { createDarkMode } from '../../reactivity/theme';

export function ThemeSelector() {
  const { theme, setTheme } = createDarkMode();

  return (
    <div>
      <fieldset class="border-0 p-0 m-0">
        <legend class="block text-sm font-medium text-foreground mb-2">Theme</legend>

        <div class="flex gap-2" role="radiogroup" aria-label="Theme selection">
          {/* Light Theme */}
          <label
            class={`flex-1 px-4 py-2 min-h-[38px] rounded-lg border-2 transition-colors cursor-pointer ${
              theme() === 'light' ? 'border-primary bg-info/10' : 'border-border'
            }`}
          >
            <input
              type="radio"
              name="theme"
              value="light"
              checked={theme() === 'light'}
              onChange={() => setTheme('light')}
              class="sr-only"
            />
            <span class="flex items-center justify-center gap-2">
              <HiOutlineSun class="w-5 h-5" aria-hidden="true" />
              <span class="text-sm text-foreground">Light</span>
            </span>
          </label>

          {/* Dark Theme */}
          <label
            class={`flex-1 px-4 py-2 min-h-[38px] rounded-lg border-2 transition-colors cursor-pointer ${
              theme() === 'dark' ? 'border-primary bg-info/10' : 'border-border'
            }`}
          >
            <input
              type="radio"
              name="theme"
              value="dark"
              checked={theme() === 'dark'}
              onChange={() => setTheme('dark')}
              class="sr-only"
            />
            <span class="flex items-center justify-center gap-2">
              <HiOutlineMoon class="w-5 h-5" aria-hidden="true" />
              <span class="text-sm text-foreground">Dark</span>
            </span>
          </label>

          {/* Auto Theme */}
          <label
            class={`flex-1 px-4 py-2 min-h-[38px] rounded-lg border-2 transition-colors cursor-pointer ${
              theme() === 'auto' ? 'border-primary bg-info/10' : 'border-border'
            }`}
          >
            <input
              type="radio"
              name="theme"
              value="auto"
              checked={theme() === 'auto'}
              onChange={() => setTheme('auto')}
              class="sr-only"
            />
            <span class="flex items-center justify-center gap-2">
              <HiOutlineComputerDesktop class="w-5 h-5" aria-hidden="true" />
              <span class="text-sm text-foreground">Auto</span>
            </span>
          </label>
        </div>
      </fieldset>

      <p class="text-xs text-muted-foreground">
        {theme() === 'auto' ? 'Follows your system preference' : `Always use ${theme()} mode`}
      </p>
    </div>
  );
}
