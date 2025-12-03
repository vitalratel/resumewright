/**
 * Theme Selector Component
 *
 * Allows users to choose between light, dark, and auto themes.
 * Auto mode follows system preference.
 *
 * Uses radio input pattern for better semantics and accessibility.
 * Screen readers will announce this as a radio group with proper selection state.
 */

import { useDarkMode } from '@/popup/hooks/ui';
import { tokens } from '../../styles/tokens';
import { ComputerIcon, MoonIcon, SunIcon } from '../common/icons';

export function ThemeSelector() {
  const { theme, setTheme } = useDarkMode();

  return (
    <div>
      <fieldset className="border-0 p-0 m-0">
        <legend
          className={`block ${tokens.typography.small} ${tokens.typography.medium} ${tokens.colors.neutral.text} mb-2`}
        >
          Theme
        </legend>

        <div
          className={`flex ${tokens.spacing.gapSmall}`}
          role="radiogroup"
          aria-label="Theme selection"
        >
          {/* Light Theme */}
          <label
            className={`flex-1 ${tokens.buttons.compact.primary} ${tokens.borders.roundedLg} border-2 ${tokens.transitions.default} cursor-pointer ${
              theme === 'light'
                ? `${tokens.colors.borders.primary} ${tokens.colors.info.bg}`
                : tokens.colors.borders.default
            }`
              .trim()
              .replace(/\s+/g, ' ')}
          >
            <input
              type="radio"
              name="theme"
              value="light"
              checked={theme === 'light'}
              onChange={() => setTheme('light')}
              className="sr-only"
            />
            <span className={`flex items-center justify-center ${tokens.spacing.gapSmall}`}>
              <SunIcon className={tokens.icons.sm} aria-hidden="true" />
              <span className={`${tokens.typography.small} ${tokens.colors.neutral.text}`}>
                Light
              </span>
            </span>
          </label>

          {/* Dark Theme */}
          <label
            className={`flex-1 ${tokens.buttons.compact.primary} ${tokens.borders.roundedLg} border-2 ${tokens.transitions.default} cursor-pointer ${
              theme === 'dark'
                ? `${tokens.colors.borders.primary} ${tokens.colors.info.bg}`
                : tokens.colors.borders.default
            }`
              .trim()
              .replace(/\s+/g, ' ')}
          >
            <input
              type="radio"
              name="theme"
              value="dark"
              checked={theme === 'dark'}
              onChange={() => setTheme('dark')}
              className="sr-only"
            />
            <span className={`flex items-center justify-center ${tokens.spacing.gapSmall}`}>
              <MoonIcon className={tokens.icons.sm} aria-hidden="true" />
              <span className={`${tokens.typography.small} ${tokens.colors.neutral.text}`}>
                Dark
              </span>
            </span>
          </label>

          {/* Auto Theme */}
          <label
            className={`flex-1 ${tokens.buttons.compact.primary} ${tokens.borders.roundedLg} border-2 ${tokens.transitions.default} cursor-pointer ${
              theme === 'auto'
                ? `${tokens.colors.borders.primary} ${tokens.colors.info.bg}`
                : tokens.colors.borders.default
            }`
              .trim()
              .replace(/\s+/g, ' ')}
          >
            <input
              type="radio"
              name="theme"
              value="auto"
              checked={theme === 'auto'}
              onChange={() => setTheme('auto')}
              className="sr-only"
            />
            <span className={`flex items-center justify-center ${tokens.spacing.gapSmall}`}>
              <ComputerIcon className={tokens.icons.sm} aria-hidden="true" />
              <span className={`${tokens.typography.small} ${tokens.colors.neutral.text}`}>
                Auto
              </span>
            </span>
          </label>
        </div>
      </fieldset>

      <p className={`${tokens.typography.xs} ${tokens.colors.neutral.textMuted}`}>
        {theme === 'auto' ? 'Follows your system preference' : `Always use ${theme} mode`}
      </p>
    </div>
  );
}
