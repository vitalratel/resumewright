/**
 * Onboarding Store
 * First-Time User Guidance
 *
 * Manages onboarding flow state including:
 * - First launch detection
 * - Current screen tracking
 * - Skip/complete state
 * - "Don't show again" preference
 */

import browser from 'webextension-polyfill';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { boolean, integer, minValue, number, object, pipe, safeParse } from '@/shared/domain/validation/valibot';

/**
 * Valibot schema for persisted onboarding state
 * Validates structure when loading from storage
 */
const OnboardingPersistedStateSchema = object({
  hasSeenOnboarding: boolean(),
  currentScreen: pipe(number(), integer(), minValue(0)),
  isOnboardingVisible: boolean(),
  dontShowAgain: boolean(),
});

interface OnboardingState {
  /** Whether user has completed or skipped onboarding */
  hasSeenOnboarding: boolean;

  /** Current onboarding screen (0-2) */
  currentScreen: number;

  /** Whether onboarding is currently shown */
  isOnboardingVisible: boolean;

  /** Whether user has checked "Don't show again" */
  dontShowAgain: boolean;

  /** Actions */
  startOnboarding: () => void;
  nextScreen: () => void;
  previousScreen: () => void;
  skipOnboarding: () => void;
  completeOnboarding: () => void;
  setDontShowAgain: (value: boolean) => void;
  resetOnboarding: () => void; // For testing/debugging
}

const TOTAL_SCREENS = 3;

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, _get) => ({
      // Initial state
      hasSeenOnboarding: false,
      currentScreen: 0,
      isOnboardingVisible: false,
      dontShowAgain: false,

      // Start onboarding flow
      startOnboarding: () => set({
        isOnboardingVisible: true,
        currentScreen: 0,
      }),

      // Move to next screen
      nextScreen: () => set((state) => {
        const nextScreen = state.currentScreen + 1;

        // If reached last screen, complete onboarding
        if (nextScreen >= TOTAL_SCREENS) {
          return {
            currentScreen: TOTAL_SCREENS - 1,
            isOnboardingVisible: false,
            hasSeenOnboarding: true,
          };
        }

        return { currentScreen: nextScreen };
      }),

      // Move to previous screen
      previousScreen: () => set(state => ({
        currentScreen: Math.max(0, state.currentScreen - 1),
      })),

      // Skip onboarding
      skipOnboarding: () => set({
        isOnboardingVisible: false,
        hasSeenOnboarding: true,
      }),

      // Complete onboarding
      completeOnboarding: () => set({
        isOnboardingVisible: false,
        hasSeenOnboarding: true,
        currentScreen: 0, // Reset for next time (if user resets)
      }),

      // Set "Don't show again" preference
      setDontShowAgain: (value: boolean) => set({ dontShowAgain: value }),

      // Reset onboarding (for testing or user re-onboarding)
      resetOnboarding: () => set({
        hasSeenOnboarding: false,
        currentScreen: 0,
        isOnboardingVisible: false,
        dontShowAgain: false,
      }),
    }),
    {
      name: 'resumewright-onboarding',
      // Persist to browser.storage.local for extension persistence
      storage: {
        getItem: async (name): Promise<{ state: OnboardingState; version: number } | null> => {
          // Use Valibot validation for storage data
          try {
            const result = await browser.storage.local.get(name);
            if ((result[name] === null || result[name] === undefined)) {
              return null;
            }

            try {
              const parsed: unknown = JSON.parse(result[name] as string);

              // Zustand persist expects StorageValue format: {state: {...}, version: number}
              // Parse it first, then validate the state portion
              const storageValue = parsed as { state?: unknown; version?: number };

              if ((storageValue.state === null || storageValue.state === undefined)) {
                return parsed as { state: OnboardingState; version: number } | null;
              }

              // Validate the state portion with Valibot schema
              const validationResult = safeParse(OnboardingPersistedStateSchema, storageValue.state);
              if (!validationResult.success) {
                console.error('[OnboardingStore] Invalid onboarding state structure:', validationResult.issues);
                return null; // Return null to reset to default state
              }

              // Return the full StorageValue with validated state
              // Cast to OnboardingState because the schema only validates persisted fields
              return {
                state: validationResult.output as unknown as OnboardingState,
                version: storageValue.version ?? 0,
              };
            }
            catch (parseError) {
              console.error('[OnboardingStore] Failed to parse onboarding data:', parseError);
              return null; // Return null on parse error to reset onboarding state
            }
          }
          catch (error) {
            console.error('[OnboardingStore] Failed to get storage:', error);
            return null;
          }
        },
        setItem: async (name, value) => {
          await browser.storage.local.set({ [name]: JSON.stringify(value) });
        },
        removeItem: async (name) => {
          await browser.storage.local.remove(name);
        },
      },
    },
  ),
);

/**
 * Hook to check if onboarding should be shown (Pure - no side effects)
 * Refactored to remove automatic side effect
 *
 * Returns true if user hasn't seen onboarding and hasn't opted out.
 * Component is responsible for explicitly calling onboarding actions.
 *
 * @example
 * ```tsx
 * function App() {
 *   const shouldShow = useShouldShowOnboarding();
 *   const startOnboarding = useStartOnboarding();
 *
 *   // Explicitly manage side effect in component
 *   useEffect(() => {
 *     if (shouldShow) {
 *       // Delay to ensure UI is ready
 *       const timer = setTimeout(() => {
 *         startOnboarding();
 *       }, 500);
 *       return () => clearTimeout(timer);
 *     }
 *   }, [shouldShow, startOnboarding]);
 *
 *   return shouldShow ? <OnboardingModal /> : <MainApp />;
 * }
 * ```
 */
export function useShouldShowOnboarding(): boolean {
  const { hasSeenOnboarding, dontShowAgain } = useOnboardingStore();

  // Pure computation - no side effects
  return !hasSeenOnboarding && !dontShowAgain;
}

/**
 * Hook to get onboarding action functions
 * Separated actions for explicit side effect management
 *
 * Unused helper hooks removed - components use useOnboardingStore() directly
 * to access actions and state without creating unnecessary wrapper objects.
 */
