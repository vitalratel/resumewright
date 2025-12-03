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

/**
 * Test specific WCAG 2.1 AA criteria
 */
export const wcagTests = {
  /**
   * Contrast (Minimum) - Level AA
   * Text and images of text must have contrast ratio of at least 4.5:1
   */
  async colorContrast(component: ReactElement) {
    return testA11y(component, {
      runOnly: {
        type: 'tag',
        values: ['wcag2aa', 'wcag143'],
      },
    });
  },

  /**
   * Keyboard - Level A
   * All functionality available via keyboard
   */
  async keyboard(component: ReactElement) {
    return testA11y(component, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag211'],
      },
    });
  },

  /**
   * Focus Order - Level A
   * Focusable components receive focus in a logical order
   */
  async focusOrder(component: ReactElement) {
    return testA11y(component, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag243'],
      },
    });
  },

  /**
   * On Input - Level A
   * Changing input values doesn't cause unexpected context changes
   */
  async onInput(component: ReactElement) {
    return testA11y(component, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag322'],
      },
    });
  },

  /**
   * Name, Role, Value - Level A
   * All UI components have accessible names and roles
   */
  async nameRoleValue(component: ReactElement) {
    return testA11y(component, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag412'],
      },
    });
  },
};

/**
 * Run all WCAG 2.1 AA tests
 */
export async function testWCAG_AA(component: ReactElement) {
  return testA11y(component, {
    runOnly: {
      type: 'tag',
      values: ['wcag2aa'],
    },
  });
}
