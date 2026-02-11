// ABOUTME: Accessibility test setup using axe-core for WCAG 2.1 AA compliance.
// ABOUTME: Provides testA11y helper that renders a Solid component and checks violations.

import { render } from '@solidjs/testing-library';
import type { MatchersObject } from '@vitest/expect';
import type { RunOptions } from 'axe-core';
import { axe, toHaveNoViolations } from 'jest-axe';
import type { JSX } from 'solid-js';

// Extend Vitest expect with jest-axe matchers
// Type assertion needed - jest-axe designed for Jest, but works with Vitest at runtime
expect.extend(toHaveNoViolations as unknown as MatchersObject);

/**
 * Test a component for accessibility violations
 * @param component - Solid component render function
 * @param options - axe-core configuration options
 */
export async function testA11y(component: () => JSX.Element, options?: RunOptions) {
  const { container } = render(component);
  const results = await axe(container, options);
  expect(results).toHaveNoViolations();
  return results;
}
