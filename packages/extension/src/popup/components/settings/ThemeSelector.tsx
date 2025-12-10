// ABOUTME: Theme selector component for light, dark, and auto modes.
// ABOUTME: Uses radio input pattern for accessibility with system preference support.

import { useDarkMode } from '@/popup/hooks/ui/useDarkMode';
import { ComputerIcon } from '../common/icons/ComputerIcon';
import { MoonIcon } from '../common/icons/MoonIcon';
import { SunIcon } from '../common/icons/SunIcon';

export function ThemeSelector() {
  const { theme, setTheme } = useDarkMode();

  return (
    <div>
      <fieldset className="border-0 p-0 m-0">
        <legend className="block text-sm font-medium text-foreground mb-2">Theme</legend>

        <div className="flex gap-2" role="radiogroup" aria-label="Theme selection">
          {/* Light Theme */}
          <label
            className={`flex-1 px-4 py-2 min-h-[38px] rounded-lg border-2 transition-colors cursor-pointer ${
              theme === 'light' ? 'border-primary bg-info/10' : 'border-border'
            }`}
          >
            <input
              type="radio"
              name="theme"
              value="light"
              checked={theme === 'light'}
              onChange={() => setTheme('light')}
              className="sr-only"
            />
            <span className="flex items-center justify-center gap-2">
              <SunIcon className="w-5 h-5" aria-hidden="true" />
              <span className="text-sm text-foreground">Light</span>
            </span>
          </label>

          {/* Dark Theme */}
          <label
            className={`flex-1 px-4 py-2 min-h-[38px] rounded-lg border-2 transition-colors cursor-pointer ${
              theme === 'dark' ? 'border-primary bg-info/10' : 'border-border'
            }`}
          >
            <input
              type="radio"
              name="theme"
              value="dark"
              checked={theme === 'dark'}
              onChange={() => setTheme('dark')}
              className="sr-only"
            />
            <span className="flex items-center justify-center gap-2">
              <MoonIcon className="w-5 h-5" aria-hidden="true" />
              <span className="text-sm text-foreground">Dark</span>
            </span>
          </label>

          {/* Auto Theme */}
          <label
            className={`flex-1 px-4 py-2 min-h-[38px] rounded-lg border-2 transition-colors cursor-pointer ${
              theme === 'auto' ? 'border-primary bg-info/10' : 'border-border'
            }`}
          >
            <input
              type="radio"
              name="theme"
              value="auto"
              checked={theme === 'auto'}
              onChange={() => setTheme('auto')}
              className="sr-only"
            />
            <span className="flex items-center justify-center gap-2">
              <ComputerIcon className="w-5 h-5" aria-hidden="true" />
              <span className="text-sm text-foreground">Auto</span>
            </span>
          </label>
        </div>
      </fieldset>

      <p className="text-xs text-muted-foreground">
        {theme === 'auto' ? 'Follows your system preference' : `Always use ${theme} mode`}
      </p>
    </div>
  );
}
