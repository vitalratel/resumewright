/**
 * ABOUTME: jest-axe type definitions for Vitest compatibility
 * ABOUTME: Extends Vitest matchers with toHaveNoViolations for a11y testing
 */

import 'vitest';

interface JestAxeMatchers<R = unknown> {
  /**
   * Assert no accessibility violations found by axe-core
   */
  toHaveNoViolations: () => R;
}

declare module 'vitest' {
  interface Matchers<T> extends JestAxeMatchers<T> {}
}
