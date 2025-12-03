/**
 * View Context Detection
 * Determines whether the app is running in popup or full-page converter context
 */

export type ViewContext = 'popup' | 'converter';

/**
 * Detects the current view context based on the URL pathname
 * @returns 'popup' if in extension popup, 'converter' if in full-page tab
 */
export function getViewContext(): ViewContext {
  // Check pathname to determine context
  const pathname = window.location.pathname;

  if (pathname.includes('converter.html')) {
    return 'converter';
  }

  // Default to popup
  return 'popup';
}
