/**
 * App-level constants
 * Extracted from App.tsx for better maintainability
 */

import { tokens } from '../styles/tokens';
import { getViewContext } from '../utils/viewContext';

/**
 * Popup window dimensions (in pixels)
 */
export const POPUP_DIMENSIONS = {
  width: 400,
  height: 600,
} as const;

/**
 * CSS class for popup container
 */
export const POPUP_CONTAINER = `w-[${POPUP_DIMENSIONS.width}px] h-[${POPUP_DIMENSIONS.height}px] overflow-hidden`;

/**
 * CSS class for full-page converter container
 * Uses flex centering and responsive max-width for better UX on large screens
 */
export const CONVERTER_CONTAINER = `min-h-screen flex flex-col items-center ${tokens.colors.neutral.bgPage}`;

/**
 * CSS class for converter content wrapper
 * Constrains max width while allowing responsive behavior
 */
export const CONVERTER_CONTENT = 'w-full max-w-2xl mx-auto';

/**
 * Get the appropriate container class based on view context
 * @returns Container CSS class for current context (popup or converter)
 */
export function getContainerClass(): string {
  const context = getViewContext();
  return context === 'popup' ? POPUP_CONTAINER : CONVERTER_CONTAINER;
}

/**
 * Get the appropriate content wrapper class based on view context
 * @returns Content wrapper CSS class for current context
 */
export function getContentWrapperClass(): string {
  const context = getViewContext();
  return context === 'popup'
    ? 'flex flex-col h-full'
    : 'w-full max-w-2xl flex flex-col py-8 px-4 sm:px-6 lg:px-8';
}

/**
 * Loading messages for WASM initialization
 * Clear, helpful status messages
 */
export const WASM_LOADING_MESSAGES = {
  title: 'Loading PDF converter...',
  subtitle: 'First launch may take a few seconds',
  ariaLabel: 'Loading in progress',
} as const;

/**
 * File size thresholds (in bytes)
 */
export const FILE_SIZE_THRESHOLDS = {
  largeFileWarning: 500_000, // 500KB
} as const;

/**
 * Error messages
 * P1-A11Y-001: Simplified, user-friendly error messages
 */
export const ERROR_MESSAGES = {
  fileReadFailed: 'Unable to read this file. Please try exporting your CV from Claude again.',
  noFileImported: 'No file imported',
  wasmNotReady: 'PDF converter is not ready. Please try reloading the extension.',
  conversionStartFailed: 'We couldn\'t start converting your CV. This might be a temporary issue.',
} as const;

/**
 * Default job ID for single conversion
 */
export const DEFAULT_JOB_ID = 'default';

/**
 * CV placeholder defaults
 * Default values for CVDetected component when CV info is unavailable
 */
export const CV_DEFAULTS = {
  name: 'John Doe',
  role: 'Software Engineer',
} as const;
