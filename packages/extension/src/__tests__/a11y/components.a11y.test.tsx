/**
 * Component Accessibility Tests
 * WCAG 2.1 AA compliance for individual components
 */

import { describe, it } from 'vitest';
import { Button } from '../../popup/components/common/Button';
import { testA11y } from './setup';

describe('Component Accessibility', () => {
  describe('Button', () => {
    it('has accessible name', async () => {
      await testA11y(<Button>Convert</Button>);
    });

    it('disabled state is accessible', async () => {
      await testA11y(<Button disabled>Convert</Button>);
    });
  });
});

/**
 * Accessibility Patterns
 *
 * Buttons: Use semantic <button> with descriptive text
 * Forms: Associate labels with inputs using htmlFor
 * Alerts: Use role="alert" for error messages
 * Status: Use role="status" aria-live="polite" for progress
 * Loading: Use role="status" with spinner and text
 */

/**
 * Component-Specific A11y Requirements
 *
 * Buttons:
 * - Always have accessible text (no icon-only without aria-label)
 * - Disabled state uses disabled attribute (not aria-disabled)
 * - Loading state shows spinner with sr-only text
 *
 * Forms:
 * - Every input has associated <label>
 * - Error messages linked with aria-describedby
 * - Required fields marked with aria-required
 *
 * Progress Indicators:
 * - Use role="progressbar" or role="status"
 * - Include aria-valuenow, aria-valuemin, aria-valuemax
 * - Provide text description of progress
 *
 * Modals/Dialogs:
 * - Use role="dialog" and aria-modal="true"
 * - Focus trap within dialog
 * - Escape key closes
 * - Focus returns to trigger element
 */
