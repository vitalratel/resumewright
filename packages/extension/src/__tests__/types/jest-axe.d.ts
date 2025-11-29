/**
 * jest-axe Vitest compatibility types
 * Proper type definitions for jest-axe with Vitest
 *
 * jest-axe provides accessibility testing matchers that work with Vitest
 * even though the official types are for Jest
 */

import 'vitest';

// Extend Vitest's expect interface
declare module 'vitest' {
   
  interface Assertion<T = any> {
    /**
     * Custom matcher from jest-axe to assert no accessibility violations
     * Works with Vitest despite being designed for Jest
     */
    toHaveNoViolations: () => T;
  }

  interface AsymmetricMatchersContaining {
     
    toHaveNoViolations: () => any;
  }
}
