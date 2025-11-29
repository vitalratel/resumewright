/**
 * localStorage Key Namespacing Utility
 * Namespace onboarding localStorage keys
 *
 * Prevents conflicts with other extensions by prefixing all localStorage keys.
 * Use these helpers instead of direct localStorage access or raw keys.
 */

const NAMESPACE = 'resumewright-';

/**
 * Creates a namespaced localStorage key
 *
 * @param key - The raw key name
 * @returns The namespaced key (e.g., "resumewright-infoCardMinimized")
 *
 * @example
 * const key = namespacedKey('infoCardMinimized');
 * // Returns: "resumewright-infoCardMinimized"
 */
export function namespacedKey(key: string): string {
  // Prevent double-namespacing if key already has prefix
  if (key.startsWith(NAMESPACE)) {
    return key;
  }
  return `${NAMESPACE}${key}`;
}

/**
 * Pre-namespaced keys for common localStorage items
 * Use these constants to ensure consistency across the app
 */
export const LocalStorageKeys = {
  /** Info card minimized state (ImportInfoCard) */
  INFO_CARD_MINIMIZED: namespacedKey('infoCardMinimized'),

  /** Launch count for auto-minimize logic (ImportInfoCard) */
  LAUNCH_COUNT: namespacedKey('launchCount'),

  /** Quick settings panel expanded state (QuickSettings) */
  QUICK_SETTINGS_EXPANDED: namespacedKey('quickSettingsExpanded'),
} as const;
