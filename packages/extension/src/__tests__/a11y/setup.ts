/**
 * Accessibility Test Setup
 * Helper functions for WCAG 2.1 AA compliance testing
 */

import { render } from '@testing-library/react';
import type { MatchersObject } from '@vitest/expect';
import type { RunOptions } from 'axe-core';
import { axe, toHaveNoViolations } from 'jest-axe';
import type { ReactElement } from 'react';

// Extend Vitest expect with jest-axe matchers
// Type assertion needed - jest-axe designed for Jest, but works with Vitest at runtime
expect.extend(toHaveNoViolations as unknown as MatchersObject);

/**
 * Test a component for accessibility violations
 * @param component - React component to test
 * @param options - axe-core configuration options
 */
export async function testA11y(component: ReactElement, options?: RunOptions) {
  const { container } = render(component);
  const results = await axe(container, options);
  // Type definitions now available in __tests__/types/jest-axe.d.ts
  expect(results).toHaveNoViolations();
  return results;
}
