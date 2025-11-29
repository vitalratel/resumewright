/**
 * Navigation Buttons
 * Back/Next/Skip buttons with screen counter
 *
 * Reusable component for multi-step wizards
 */

import { memo } from 'react';
import { tokens } from '../../styles/tokens';

interface NavigationButtonsProps {
  currentScreen: number;
  totalScreens: number;
  onPrevious: () => void;
  onNext: () => void;
}

export const NavigationButtons = memo(
  ({ currentScreen, totalScreens, onPrevious, onNext }: NavigationButtonsProps) => {
    const isFirstScreen = currentScreen === 0;
    const isLastScreen = currentScreen === totalScreens - 1;

    return (
      <div className={`flex items-center justify-between ${tokens.spacing.paddingY}`}>
        {/* Skip / Back button */}
        <button
          type="button"
          onClick={onPrevious}
          className={`${tokens.colors.neutral.textMuted} ${tokens.colors.link.hover} ${tokens.buttons.compact.primary} ${tokens.typography.small} ${tokens.typography.medium} ${tokens.transitions.default} ${tokens.effects.focusRingLight} ${tokens.borders.rounded}`}
        >
          {isFirstScreen ? 'Skip' : 'Back'}
        </button>

        {/* Screen counter */}
        <span className={`${tokens.typography.small} ${tokens.colors.neutral.textMuted}`}>
          {currentScreen + 1} /{totalScreens}
        </span>

        {/* Next / Get Started button */}
        <button
          type="button"
          onClick={onNext}
          className={`${tokens.buttons.variants.success} text-white ${tokens.buttons.default.secondary} ${tokens.borders.rounded} ${tokens.typography.medium} ${tokens.transitions.default} ${tokens.effects.focusRing}`}
        >
          {isLastScreen ? 'Get Started' : 'Next'}
        </button>
      </div>
    );
  }
);
