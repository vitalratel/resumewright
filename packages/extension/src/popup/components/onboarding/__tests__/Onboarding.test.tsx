/**
 * Onboarding Component Tests
 * First-Time User Guidance
 *
 * Tests for the onboarding flow including:
 * - First launch detection
 * - Screen navigation
 * - Skip functionality
 * - Don't show again preference
 * - Keyboard shortcuts
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useOnboardingStore } from '../../../store/onboardingStore';
import { Onboarding } from '../Onboarding';

// Mock webextension-polyfill
vi.mock('webextension-polyfill', () => ({
  default: {
    runtime: {
      getManifest: () => ({ version: '1.0.0-test' }),
      sendMessage: vi.fn(),
      onMessage: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
      },
    },
    storage: {
      local: {
        get: vi.fn().mockResolvedValue({}),
        set: vi.fn().mockResolvedValue(undefined),
        remove: vi.fn().mockResolvedValue(undefined),
      },
    },
  },
}));

// Mock chrome.storage API for backward compatibility
(global as { chrome?: unknown }).chrome = {
  storage: {
    local: {
      get: vi.fn(async (_keys) => Promise.resolve({})),
      set: vi.fn(async () => Promise.resolve()),
      remove: vi.fn(async () => Promise.resolve()),
    },
  },
} as unknown;

// Mock lazy-loaded OnboardingModal to avoid Suspense issues in tests
vi.mock('../OnboardingModal', () => ({
  OnboardingModal: ({
    currentScreen,
    totalScreens,
    screenContent,
    dontShowAgain,
    onDontShowAgainChange,
    onPrevious,
    onNext,
    showDontShowAgain,
  }: {
    currentScreen: number;
    totalScreens: number;
    screenContent: React.ReactNode;
    dontShowAgain: boolean;
    onDontShowAgainChange: (checked: boolean) => void;
    onPrevious: () => void;
    onNext: () => void;
    showDontShowAgain: boolean;
  }) => (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      data-testid="onboarding-modal"
    >
      <div id="onboarding-title">Onboarding</div>
      <div data-testid="screen-content">{screenContent}</div>
      <div data-testid="progress-text">
        {currentScreen + 1} / {totalScreens}
      </div>
      {showDontShowAgain && (
        <label>
          <input
            type="checkbox"
            checked={dontShowAgain}
            onChange={(e) => onDontShowAgainChange(e.target.checked)}
            aria-label="Don't show this again"
          />
          Don&apos;t show this again
        </label>
      )}
      <button type="button" onClick={onPrevious}>
        {currentScreen === 0 ? 'Skip' : 'Back'}
      </button>
      <button type="button" onClick={onNext}>
        {currentScreen === totalScreens - 1 ? 'Get Started' : 'Next'}
      </button>
      <div className="text-sm text-gray-500">
        Press <kbd>Enter</kbd> to continue or <kbd>Esc</kbd> to skip
      </div>
      {/* Progress indicators */}
      {Array.from({ length: totalScreens }, (_, index) => index).map((index) => (
        <span
          key={`screen-${index}-${currentScreen}`}
          aria-label={
            index < currentScreen
              ? `Screen ${index + 1} (completed)`
              : index === currentScreen
                ? `Screen ${index + 1} (current)`
                : `Screen ${index + 1} (upcoming)`
          }
        />
      ))}
    </div>
  ),
}));

describe('Onboarding Component', () => {
  beforeEach(() => {
    // Reset store before each test
    useOnboardingStore.getState().resetOnboarding();
  });

  describe('Visibility', () => {
    it('should not render when onboarding is not visible', () => {
      const { container } = render(<Onboarding />);
      expect(container.firstChild).toBeNull();
    });

    it('should render when onboarding is visible', async () => {
      const { startOnboarding } = useOnboardingStore.getState();
      startOnboarding();

      render(<Onboarding />);
      // Wait for lazy-loaded component to render
      expect(await screen.findByRole('dialog')).toBeInTheDocument();
    });

    it('should show modal with correct aria attributes', async () => {
      const { startOnboarding } = useOnboardingStore.getState();
      startOnboarding();

      render(<Onboarding />);
      // Wait for lazy-loaded component to render
      const dialog = await screen.findByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'onboarding-title');
    });
  });

  describe('Screen Navigation', () => {
    beforeEach(() => {
      const { startOnboarding } = useOnboardingStore.getState();
      startOnboarding();
    });

    it('should start on screen 1', async () => {
      render(<Onboarding />);
      expect(await screen.findByText('Welcome to ResumeWright!')).toBeInTheDocument();
      expect(await screen.findByText('1 / 3')).toBeInTheDocument();
    });

    it('should navigate to next screen on Next click', async () => {
      render(<Onboarding />);

      const nextButton = await screen.findByRole('button', { name: /next/i });
      fireEvent.click(nextButton);

      expect(await screen.findByText('How to Get Your CV Code')).toBeInTheDocument();
      expect(await screen.findByText('2 / 3')).toBeInTheDocument();
    });

    it('should navigate to previous screen on Back click', async () => {
      render(<Onboarding />);

      // Go to screen 2
      const nextButton = await screen.findByRole('button', { name: /next/i });
      fireEvent.click(nextButton);
      expect(await screen.findByText('2 / 3')).toBeInTheDocument();

      // Go back to screen 1
      const backButton = await screen.findByRole('button', { name: /back/i });
      fireEvent.click(backButton);
      expect(await screen.findByText('1 / 3')).toBeInTheDocument();
    });

    it('should show all 3 screens in sequence', async () => {
      render(<Onboarding />);

      // Screen 1
      expect(await screen.findByText('Welcome to ResumeWright!')).toBeInTheDocument();

      // Screen 2
      const nextButton1 = await screen.findByRole('button', { name: /next/i });
      fireEvent.click(nextButton1);
      expect(await screen.findByText('How to Get Your CV Code')).toBeInTheDocument();

      // Screen 3
      const nextButton2 = await screen.findByRole('button', { name: /next/i });
      fireEvent.click(nextButton2);
      expect(await screen.findByText('Quick Start Guide')).toBeInTheDocument();
    });

    it('should show progress indicator correctly', async () => {
      render(<Onboarding />);

      // Check initial progress (screen 1)
      expect(await screen.findByLabelText(/Screen 1 \(current\)/i)).toBeInTheDocument();

      // Move to screen 2
      const nextButton = await screen.findByRole('button', { name: /next/i });
      fireEvent.click(nextButton);
      expect(await screen.findByLabelText(/Screen 1 \(completed\)/i)).toBeInTheDocument();
      expect(await screen.findByLabelText(/Screen 2 \(current\)/i)).toBeInTheDocument();
    });
  });

  describe('Skip Functionality', () => {
    it('should close onboarding on Skip click from first screen', async () => {
      const { startOnboarding } = useOnboardingStore.getState();
      startOnboarding();

      render(<Onboarding />);

      const skipButton = await screen.findByRole('button', { name: /skip/i });
      fireEvent.click(skipButton);

      // Store should mark as seen
      expect(useOnboardingStore.getState().hasSeenOnboarding).toBe(true);
      expect(useOnboardingStore.getState().isOnboardingVisible).toBe(false);
    });

    it('should not show Skip button on screens 2-3', async () => {
      const { startOnboarding } = useOnboardingStore.getState();
      startOnboarding();

      render(<Onboarding />);

      // Move to screen 2
      const nextButton = await screen.findByRole('button', { name: /next/i });
      fireEvent.click(nextButton);

      // Should show "Back" instead of "Skip"
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /skip/i })).not.toBeInTheDocument();
      });
      expect(await screen.findByRole('button', { name: /back/i })).toBeInTheDocument();
    });
  });

  describe('Completion', () => {
    it('should complete onboarding on Get Started click', async () => {
      const { startOnboarding } = useOnboardingStore.getState();
      startOnboarding();

      render(<Onboarding />);

      // Navigate to last screen
      const nextButton1 = await screen.findByRole('button', { name: /next/i });
      fireEvent.click(nextButton1);
      const nextButton2 = await screen.findByRole('button', { name: /next/i });
      fireEvent.click(nextButton2);

      // Click Get Started
      const getStartedButton = await screen.findByRole('button', { name: /get started/i });
      fireEvent.click(getStartedButton);

      // Store should mark as completed
      expect(useOnboardingStore.getState().hasSeenOnboarding).toBe(true);
      expect(useOnboardingStore.getState().isOnboardingVisible).toBe(false);
    });
  });

  describe("Don't Show Again", () => {
    // Checkbox now shows on all screens for better UX
    it('should show checkbox on all screens', async () => {
      const { startOnboarding } = useOnboardingStore.getState();
      startOnboarding();

      render(<Onboarding />);

      // Yes on screen 1
      expect(await screen.findByLabelText(/don't show this again/i)).toBeInTheDocument();

      // Yes on screen 2
      const nextButton1 = await screen.findByRole('button', { name: /next/i });
      fireEvent.click(nextButton1);
      expect(await screen.findByLabelText(/don't show this again/i)).toBeInTheDocument();

      // Yes on screen 3
      const nextButton2 = await screen.findByRole('button', { name: /next/i });
      fireEvent.click(nextButton2);
      expect(await screen.findByLabelText(/don't show this again/i)).toBeInTheDocument();
    });

    it('should save preference when checkbox is checked', async () => {
      const { startOnboarding } = useOnboardingStore.getState();
      startOnboarding();

      render(<Onboarding />);

      // Navigate to last screen
      const nextButton1 = await screen.findByRole('button', { name: /next/i });
      fireEvent.click(nextButton1);
      const nextButton2 = await screen.findByRole('button', { name: /next/i });
      fireEvent.click(nextButton2);

      // Check the checkbox
      const checkbox = await screen.findByLabelText(/don't show this again/i);
      fireEvent.click(checkbox);

      expect(useOnboardingStore.getState().dontShowAgain).toBe(true);
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should skip on Escape key', async () => {
      const { startOnboarding } = useOnboardingStore.getState();
      startOnboarding();

      render(<Onboarding />);

      // Wait for component to load
      await screen.findByText('Welcome to ResumeWright!');

      // Press Escape
      fireEvent.keyDown(document, { key: 'Escape' });

      expect(useOnboardingStore.getState().hasSeenOnboarding).toBe(true);
      expect(useOnboardingStore.getState().isOnboardingVisible).toBe(false);
    });

    it('should advance on Enter key', async () => {
      const { startOnboarding } = useOnboardingStore.getState();
      startOnboarding();

      render(<Onboarding />);

      expect(await screen.findByText('1 / 3')).toBeInTheDocument();

      // Press Enter to advance
      fireEvent.keyDown(document, { key: 'Enter' });

      expect(useOnboardingStore.getState().currentScreen).toBe(1);
    });

    it('should complete on Enter key on last screen', async () => {
      const { startOnboarding } = useOnboardingStore.getState();
      startOnboarding();

      render(<Onboarding />);

      // Navigate to last screen
      const nextButton1 = await screen.findByRole('button', { name: /next/i });
      fireEvent.click(nextButton1);
      const nextButton2 = await screen.findByRole('button', { name: /next/i });
      fireEvent.click(nextButton2);

      // Wait for last screen to render
      await screen.findByText('Quick Start Guide');

      // Press Enter to complete
      fireEvent.keyDown(document, { key: 'Enter' });

      expect(useOnboardingStore.getState().hasSeenOnboarding).toBe(true);
      expect(useOnboardingStore.getState().isOnboardingVisible).toBe(false);
    });
  });

  describe('Content', () => {
    it('should display correct icon for each screen', async () => {
      const { startOnboarding } = useOnboardingStore.getState();
      startOnboarding();

      const { rerender } = render(<Onboarding />);

      // Each screen has a distinctive icon
      // We check by looking for the title which confirms the right screen
      expect(await screen.findByText('Welcome to ResumeWright!')).toBeInTheDocument();

      const nextButton1 = await screen.findByRole('button', { name: /next/i });
      fireEvent.click(nextButton1);
      rerender(<Onboarding />);
      expect(await screen.findByText('How to Get Your CV Code')).toBeInTheDocument();

      const nextButton2 = await screen.findByRole('button', { name: /next/i });
      fireEvent.click(nextButton2);
      rerender(<Onboarding />);
      expect(await screen.findByText('Quick Start Guide')).toBeInTheDocument();
    });

    it('should display keyboard hint', async () => {
      const { startOnboarding } = useOnboardingStore.getState();
      startOnboarding();

      render(<Onboarding />);

      expect(await screen.findByText(/press/i)).toBeInTheDocument();
      expect(await screen.findByText('Enter')).toBeInTheDocument();
      expect(await screen.findByText('Esc')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      const { startOnboarding } = useOnboardingStore.getState();
      startOnboarding();

      render(<Onboarding />);

      const dialog = await screen.findByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'onboarding-title');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('should have descriptive button labels', async () => {
      const { startOnboarding } = useOnboardingStore.getState();
      startOnboarding();

      render(<Onboarding />);

      expect(await screen.findByRole('button', { name: /skip/i })).toBeInTheDocument();
      expect(await screen.findByRole('button', { name: /next/i })).toBeInTheDocument();
    });

    it('should have accessible progress indicators', async () => {
      const { startOnboarding } = useOnboardingStore.getState();
      startOnboarding();

      render(<Onboarding />);

      // Check for aria-label on progress dots
      expect(await screen.findByLabelText(/Screen 1 \(current\)/i)).toBeInTheDocument();
      expect(await screen.findByLabelText(/Screen 2 \(upcoming\)/i)).toBeInTheDocument();
      expect(await screen.findByLabelText(/Screen 3 \(upcoming\)/i)).toBeInTheDocument();
    });
  });
});
