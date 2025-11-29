/**
 * Timing Constants
 * Centralized timing values for consistent UX
 *
 * All timing values in milliseconds
 */

/**
 * Debounce delays for user input
 */
export const DEBOUNCE_DELAYS = {
  /** Settings auto-save delay */
  SETTINGS_AUTOSAVE: 500,

  /** Custom margin inputs debounce */
  MARGIN_INPUTS: 500,

  /** General input debounce (search, filters) */
  INPUT_DEFAULT: 300,
} as const;

/**
 * UI animation/feedback delays
 */
export const UI_DELAYS = {
  /** Success message display duration */
  SUCCESS_MESSAGE: 3000,

  /** Toast notification duration */
  TOAST_DURATION: 2000,

  /** Copy success feedback duration */
  COPY_SUCCESS_FEEDBACK: 2000,

  /** Auto-save "Saved" feedback duration  */
  AUTOSAVE_FEEDBACK: 1500,
} as const;
