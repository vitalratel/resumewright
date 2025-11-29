/**
 * Onboarding Component
 * First-Time User Guidance
 * Visual example of Claude.ai UI
 * P2-A11Y-009: Technical terms explained
 *
 * 3-screen welcome flow for first-time users:
 * - Screen 1: Welcome + value proposition
 * - Screen 2: How to get TSX code from Claude (with visual guide)
 * - Screen 3: Quick start guide (icon tour)
 *
 * Features:
 * - Skip button on each screen
 * - "Don't show again" checkbox
 * - Keyboard navigation (Escape to skip, Enter to continue)
 * - Progress indicator
 */

import React, { lazy, Suspense, useCallback, useEffect, useMemo } from 'react';
import { useOnboardingStore } from '../../store/onboardingStore';
import { tokens } from '../../styles/tokens';
import { ErrorBoundary } from '../ErrorBoundary';

// Lazy load onboarding components for bundle size optimization
// Only shown on first launch, so no need to load eagerly
const OnboardingModal = lazy(async () => import('./OnboardingModal').then(m => ({ default: m.OnboardingModal })));
const WelcomeScreen = lazy(async () => import('./screens/WelcomeScreen').then(m => ({ default: m.WelcomeScreen })));
const HowToScreen = lazy(async () => import('./screens/HowToScreen').then(m => ({ default: m.HowToScreen })));
const QuickStartScreen = lazy(async () => import('./screens/QuickStartScreen').then(m => ({ default: m.QuickStartScreen })));

export const Onboarding = React.memo(() => {
  const {
    isOnboardingVisible,
    currentScreen,
    dontShowAgain,
    nextScreen,
    previousScreen,
    skipOnboarding,
    completeOnboarding,
    setDontShowAgain,
  } = useOnboardingStore();

  // Memoize keyboard handler to prevent re-registration on every render
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      skipOnboarding();
    }
    else if (e.key === 'Enter') {
      if (currentScreen === 2) {
        completeOnboarding();
      }
      else {
        nextScreen();
      }
    }
  }, [currentScreen, nextScreen, skipOnboarding, completeOnboarding]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOnboardingVisible)
      return;

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOnboardingVisible, handleKeyDown]);

  // Memoize callbacks to prevent NavigationButtons re-renders
  // Zustand actions are already stable, but conditional ternaries create new refs
  // MUST be before early return to satisfy rules-of-hooks
  const handlePrevious = useMemo(
    () => (currentScreen === 0 ? skipOnboarding : previousScreen),
    [currentScreen, skipOnboarding, previousScreen],
  );

  const handleNext = useMemo(
    () => (currentScreen === 2 ? completeOnboarding : nextScreen),
    [currentScreen, completeOnboarding, nextScreen],
  );

  if (!isOnboardingVisible)
    return null;

  // Lazy-loaded screens with Suspense fallback
  const screenFallback = <div className="flex items-center justify-center p-8" role="status"><span className={tokens.colors.neutral.textMuted}>Loading...</span></div>;

  const screens = [
    <Suspense key="welcome" fallback={screenFallback}><WelcomeScreen /></Suspense>,
    <Suspense key="how-to" fallback={screenFallback}><HowToScreen /></Suspense>,
    <Suspense key="quick-start" fallback={screenFallback}><QuickStartScreen /></Suspense>,
  ];

  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center" role="status" aria-label="Loading onboarding"><span className="text-white">Loading...</span></div>}>
        <OnboardingModal
          currentScreen={currentScreen}
          totalScreens={screens.length}
          screenContent={screens[currentScreen]}
          dontShowAgain={dontShowAgain}
          onDontShowAgainChange={setDontShowAgain}
          onPrevious={handlePrevious}
          onNext={handleNext}
          showDontShowAgain={true}
        />
      </Suspense>
    </ErrorBoundary>
  );
});
