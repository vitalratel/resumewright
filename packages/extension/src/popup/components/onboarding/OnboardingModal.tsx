/**
 * OnboardingModal Component
 *
 * First-time user onboarding with step-by-step instructions and keyboard navigation.
 * Shows how to generate CV in Claude.ai and export with the extension.
 *
 * Onboarding screens:
 * 1. Welcome - Introduction to ResumeWright
 * 2. How-to - Generate CV in Claude.ai
 * 3. Quick Start - Use the extension
 *
 * Features:
 * - Multi-screen wizard with progress indicator
 * - Keyboard navigation (Arrow keys, Enter, Escape)
 * - "Don't show again" preference
 * - Previous/Next navigation
 * - Skip option
 * - Accessibility support
 *
 * @example
 * ```tsx
 * <OnboardingModal
 *   currentScreen={0}
 *   totalScreens={3}
 *   screenContent={<WelcomeScreen />}
 *   dontShowAgain={false}
 *   onDontShowAgainChange={(value) => setPreference(value)}
 *   onPrevious={() => goBack()}
 *   onNext={() => goForward()}
 *   showDontShowAgain={true}
 * />
 * ```
 *
 * @see {@link WelcomeScreen} for first screen
 * @see {@link HowToScreen} for second screen
 * @see {@link QuickStartScreen} for third screen
 */

import type { ReactNode } from 'react';
import { memo } from 'react';
import { useFocusTrap } from '../../hooks/ui/useFocusManagement';
import { tokens } from '../../styles/tokens';
import { DontShowAgainCheckbox } from './DontShowAgainCheckbox';
import { KeyboardHints } from './KeyboardHints';
import { NavigationButtons } from './NavigationButtons';
import { ProgressIndicator } from './ProgressIndicator';

interface OnboardingModalProps {
  currentScreen: number;
  totalScreens: number;
  screenContent: ReactNode;
  dontShowAgain: boolean;
  onDontShowAgainChange: (value: boolean) => void;
  onPrevious: () => void;
  onNext: () => void;
  showDontShowAgain: boolean;
}

export const OnboardingModal = memo(({
  currentScreen,
  totalScreens,
  screenContent,
  dontShowAgain,
  onDontShowAgainChange,
  onPrevious,
  onNext,
  showDontShowAgain,
}: OnboardingModalProps) => {
  const trapRef = useFocusTrap(true);

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-${tokens.zIndex.modal} ${tokens.spacing.card}`}
    >
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        className={`${tokens.colors.neutral.bgWhite} ${tokens.borders.roundedLg} ${tokens.effects.shadowXl} max-w-lg w-full ${tokens.spacing.cardGenerous} ${tokens.spacing.sectionGap}`}
      >
        <ProgressIndicator current={currentScreen} total={totalScreens} />

        <div className={tokens.spacing.paddingYContent}>
          {screenContent}
        </div>

        {showDontShowAgain && (
          <DontShowAgainCheckbox
            checked={dontShowAgain}
            onChange={onDontShowAgainChange}
          />
        )}

        <NavigationButtons
          currentScreen={currentScreen}
          totalScreens={totalScreens}
          onPrevious={onPrevious}
          onNext={onNext}
        />

        <KeyboardHints />
      </div>
    </div>
  );
});
