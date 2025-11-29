/**
 * Tests for onboardingStore
 *
 * Tests user-visible behavior:
 * - Onboarding flow navigation
 * - State persistence
 * - Input validation
 * - Error handling
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import browser from 'webextension-polyfill';
import { useOnboardingStore, useShouldShowOnboarding } from '../onboardingStore';

// Mock browser API
vi.mock('webextension-polyfill', () => ({
  default: {
    storage: {
      local: {
        get: vi.fn(),
        set: vi.fn(),
        remove: vi.fn(),
      },
    },
  },
}));

describe('useOnboardingStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock: empty storage
    vi.mocked(browser.storage.local.get).mockResolvedValue({});
    vi.mocked(browser.storage.local.set).mockResolvedValue(undefined);
    vi.mocked(browser.storage.local.remove).mockResolvedValue(undefined);
  });

  afterEach(() => {
    // Reset store state
    const { result } = renderHook(() => useOnboardingStore());
    act(() => {
      result.current.resetOnboarding();
    });
  });

  describe('initial state', () => {
    it('should start with default values', () => {
      const { result } = renderHook(() => useOnboardingStore());

      expect(result.current.hasSeenOnboarding).toBe(false);
      expect(result.current.currentScreen).toBe(0);
      expect(result.current.isOnboardingVisible).toBe(false);
      expect(result.current.dontShowAgain).toBe(false);
    });
  });

  describe('onboarding flow', () => {
    it('should start onboarding', () => {
      const { result } = renderHook(() => useOnboardingStore());

      act(() => {
        result.current.startOnboarding();
      });

      expect(result.current.isOnboardingVisible).toBe(true);
      expect(result.current.currentScreen).toBe(0);
    });

    it('should navigate to next screen', () => {
      const { result } = renderHook(() => useOnboardingStore());

      act(() => {
        result.current.startOnboarding();
      });

      act(() => {
        result.current.nextScreen();
      });

      expect(result.current.currentScreen).toBe(1);
      expect(result.current.isOnboardingVisible).toBe(true);
    });

    it('should navigate to previous screen', () => {
      const { result } = renderHook(() => useOnboardingStore());

      act(() => {
        result.current.startOnboarding();
        result.current.nextScreen();
        result.current.nextScreen();
      });

      expect(result.current.currentScreen).toBe(2);

      act(() => {
        result.current.previousScreen();
      });

      expect(result.current.currentScreen).toBe(1);
    });

    it('should not go below screen 0', () => {
      const { result } = renderHook(() => useOnboardingStore());

      act(() => {
        result.current.startOnboarding();
      });

      expect(result.current.currentScreen).toBe(0);

      act(() => {
        result.current.previousScreen();
      });

      expect(result.current.currentScreen).toBe(0);
    });

    it('should complete onboarding at last screen', () => {
      const { result } = renderHook(() => useOnboardingStore());

      act(() => {
        result.current.startOnboarding();
      });

      // Navigate through all screens (assuming 5 total)
      for (let i = 0; i < 5; i++) {
        act(() => {
          result.current.nextScreen();
        });
      }

      expect(result.current.isOnboardingVisible).toBe(false);
      expect(result.current.hasSeenOnboarding).toBe(true);
    });

    it('should skip onboarding', () => {
      const { result } = renderHook(() => useOnboardingStore());

      act(() => {
        result.current.startOnboarding();
        result.current.nextScreen();
      });

      expect(result.current.currentScreen).toBe(1);

      act(() => {
        result.current.skipOnboarding();
      });

      expect(result.current.isOnboardingVisible).toBe(false);
      expect(result.current.hasSeenOnboarding).toBe(true);
    });

    it('should complete onboarding manually', () => {
      const { result } = renderHook(() => useOnboardingStore());

      act(() => {
        result.current.startOnboarding();
        result.current.nextScreen();
        result.current.nextScreen();
      });

      act(() => {
        result.current.completeOnboarding();
      });

      expect(result.current.isOnboardingVisible).toBe(false);
      expect(result.current.hasSeenOnboarding).toBe(true);
      expect(result.current.currentScreen).toBe(0);
    });
  });

  describe('preferences', () => {
    it('should set dont show again preference', () => {
      const { result } = renderHook(() => useOnboardingStore());

      act(() => {
        result.current.setDontShowAgain(true);
      });

      expect(result.current.dontShowAgain).toBe(true);

      act(() => {
        result.current.setDontShowAgain(false);
      });

      expect(result.current.dontShowAgain).toBe(false);
    });
  });

  describe('reset', () => {
    it('should reset to initial state', () => {
      const { result } = renderHook(() => useOnboardingStore());

      act(() => {
        result.current.startOnboarding();
        result.current.nextScreen();
        result.current.setDontShowAgain(true);
        result.current.completeOnboarding();
      });

      expect(result.current.hasSeenOnboarding).toBe(true);

      act(() => {
        result.current.resetOnboarding();
      });

      expect(result.current.hasSeenOnboarding).toBe(false);
      expect(result.current.currentScreen).toBe(0);
      expect(result.current.isOnboardingVisible).toBe(false);
      expect(result.current.dontShowAgain).toBe(false);
    });
  });

  describe('storage persistence', () => {
    it('should persist state to storage', async () => {
      const { result } = renderHook(() => useOnboardingStore());

      act(() => {
        result.current.completeOnboarding();
      });

      await waitFor(() => {
        expect(browser.storage.local.set).toHaveBeenCalled();
      });

      const calls = vi.mocked(browser.storage.local.set).mock.calls;
      const lastCall = calls[calls.length - 1][0];
      expect(lastCall).toMatchObject({
        'resumewright-onboarding': expect.stringContaining('hasSeenOnboarding'),
      });
    });

    it('should persist state changes', async () => {
      const { result } = renderHook(() => useOnboardingStore());

      // Change state that should persist
      act(() => {
        result.current.setDontShowAgain(true);
        result.current.completeOnboarding();
      });

      // Verify storage was called with updated state
      await waitFor(() => {
        expect(browser.storage.local.set).toHaveBeenCalled();
      });

      const calls = vi.mocked(browser.storage.local.set).mock.calls;
      const lastCall = calls[calls.length - 1][0];
      const storedData = JSON.parse(lastCall['resumewright-onboarding'] as string);

      expect(storedData.state.hasSeenOnboarding).toBe(true);
      expect(storedData.state.dontShowAgain).toBe(true);
    });

    it('should handle invalid persisted data', async () => {
      const invalidData = {
        'resumewright-onboarding': JSON.stringify({
          state: {
            hasSeenOnboarding: 'not-a-boolean', // Invalid type
            currentScreen: 'not-a-number', // Invalid type
          },
          version: 0,
        }),
      };

      vi.mocked(browser.storage.local.get).mockResolvedValue(invalidData);

      const { result } = renderHook(() => useOnboardingStore());

      // Should fall back to default state
      await waitFor(() => {
        expect(result.current.hasSeenOnboarding).toBe(false);
      });

      expect(result.current.currentScreen).toBe(0);
    });

    it('should handle malformed JSON', async () => {
      const malformedData = {
        'resumewright-onboarding': 'not valid json{',
      };

      vi.mocked(browser.storage.local.get).mockResolvedValue(malformedData);

      const { result } = renderHook(() => useOnboardingStore());

      // Should fall back to default state without crashing
      await waitFor(() => {
        expect(result.current.hasSeenOnboarding).toBe(false);
      });
    });

    it('should handle storage errors', async () => {
      vi.mocked(browser.storage.local.get).mockRejectedValue(
        new Error('Storage quota exceeded'),
      );

      const { result } = renderHook(() => useOnboardingStore());

      // Should use default state when storage fails
      expect(result.current.hasSeenOnboarding).toBe(false);
      expect(result.current.currentScreen).toBe(0);
    });

    it('should handle missing storage data', async () => {
      vi.mocked(browser.storage.local.get).mockResolvedValue({});

      const { result } = renderHook(() => useOnboardingStore());

      // Should use default state
      expect(result.current.hasSeenOnboarding).toBe(false);
      expect(result.current.currentScreen).toBe(0);
    });
  });
});

describe('useShouldShowOnboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(browser.storage.local.get).mockResolvedValue({});
  });

  afterEach(() => {
    const { result } = renderHook(() => useOnboardingStore());
    act(() => {
      result.current.resetOnboarding();
    });
  });

  it('should show onboarding when not seen', () => {
    const { result: storeResult } = renderHook(() => useOnboardingStore());
    const { result: shouldShowResult } = renderHook(() => useShouldShowOnboarding());

    // Initial state: not seen, should show
    expect(shouldShowResult.current).toBe(true);

    // Mark as seen
    act(() => {
      storeResult.current.completeOnboarding();
    });

    // Should not show after completion
    const { result: updatedResult } = renderHook(() => useShouldShowOnboarding());
    expect(updatedResult.current).toBe(false);
  });

  it('should not show when dont show again is set', () => {
    const { result: storeResult } = renderHook(() => useOnboardingStore());

    act(() => {
      storeResult.current.setDontShowAgain(true);
    });

    const { result: shouldShowResult } = renderHook(() => useShouldShowOnboarding());
    expect(shouldShowResult.current).toBe(false);
  });

  it('should not show when already completed', () => {
    const { result: storeResult } = renderHook(() => useOnboardingStore());

    act(() => {
      storeResult.current.completeOnboarding();
    });

    const { result: shouldShowResult } = renderHook(() => useShouldShowOnboarding());
    expect(shouldShowResult.current).toBe(false);
  });
});
