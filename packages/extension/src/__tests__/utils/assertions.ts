/**
 * Custom Assertion Helpers
 *
 * Domain-specific assertions for ResumeWright extension tests.
 * Provides readable, reusable checks for common test scenarios.
 *
 * Usage:
 * ```typescript
 * import { expectConversionSuccess, expectErrorState } from '@tests/utils/assertions';
 *
 * expectConversionSuccess();
 * expectErrorState('Parse error');
 * expectLoadingState(false);
 * ```
 */

import type { ErrorCategory, ErrorCode } from '@/shared/types/errors';
import { screen, within } from '@testing-library/react';
import { expect } from 'vitest';

/**
 * Assert that conversion success state is displayed
 *
 * @param options - Optional assertions about success state
 * @param options.downloadButton - Check for download button (default: true)
 * @param options.message - Check for specific success message
 *
 * @example
 * ```typescript
 * expectConversionSuccess();
 * expectConversionSuccess({ downloadButton: true });
 * ```
 */
export function expectConversionSuccess(options?: {
  /** Check for download button (default: true) */
  downloadButton?: boolean;
  /** Check for specific success message */
  message?: string | RegExp;
}) {
  const { downloadButton = true, message } = options || {};

  // Check for success indicator
  const successElement = screen.queryByText(/success/i) ?? screen.queryByText(/complete/i) ?? screen.queryByText(/ready/i);
  expect(successElement).toBeTruthy();
  expect(successElement).toBeInTheDocument();

  // Check for download button if requested
  if (downloadButton === true) {
    expect(
      screen.getByRole('button', { name: /download/i }),
    ).toBeInTheDocument();
  }

  // Check for specific message if provided
  if (message !== null && message !== undefined && message !== '') {
    expect(screen.getByText(message)).toBeInTheDocument();
  }
}

/**
 * Assert that error state is displayed
 *
 * @param messagePattern - Expected error message (string or regex)
 * @param options - Additional error state assertions
 * @param options.dismissible - Check if error is dismissible
 * @param options.hasSuggestions - Check if error has suggestions
 * @param options.hasTechnicalDetails - Check if error has technical details
 *
 * @example
 * ```typescript
 * expectErrorState(/parse error/i);
 * expectErrorState('Failed to parse CV code', { dismissible: true });
 * ```
 */
export function expectErrorState(
  messagePattern?: string | RegExp,
  options?: {
    /** Check for dismiss/retry button */
    dismissible?: boolean;
    /** Check for suggestions */
    hasSuggestions?: boolean;
    /** Check for technical details */
    hasTechnicalDetails?: boolean;
  },
) {
  const { dismissible = false, hasSuggestions = false, hasTechnicalDetails = false } = options || {};

  // Check for error indicator
  const errorElement
    = screen.queryByRole('alert')
      || screen.queryByText(/error/i)
      || screen.queryByText(/failed/i);

  expect(errorElement).toBeInTheDocument();

  // Check for specific message if provided
  if (messagePattern !== null && messagePattern !== undefined) {
    expect(screen.getByText(messagePattern)).toBeInTheDocument();
  }

  // Check for dismiss/retry button if requested
  if (dismissible === true) {
    expect(
      screen.getByRole('button', { name: /dismiss|retry|close/i }),
    ).toBeInTheDocument();
  }

  // Check for suggestions if requested
  if (hasSuggestions) {
    expect(screen.getByText(/suggestion|try|tip/i)).toBeInTheDocument();
  }

  // Check for technical details if requested
  if (hasTechnicalDetails) {
    expect(screen.getByText(/detail|technical|debug/i)).toBeInTheDocument();
  }
}

/**
 * Assert that loading state is displayed (or not)
 *
 * @param isLoading - Whether loading should be displayed (default: true)
 * @param message - Optional specific loading message
 *
 * @example
 * ```typescript
 * expectLoadingState(); // Loading should be shown
 * expectLoadingState(false); // Loading should NOT be shown
 * expectLoadingState(true, 'Converting');
 * ```
 */
export function expectLoadingState(isLoading = true, message?: string | RegExp) {
  const loadingIndicator
    = screen.queryByText(/loading/i)
      || screen.queryByText(/converting/i)
      || screen.queryByText(/processing/i)
      || screen.queryByRole('status');

  if (isLoading) {
    expect(loadingIndicator).toBeInTheDocument();

    if (message !== null && message !== undefined) {
      expect(screen.getByText(message)).toBeInTheDocument();
    }
  }
  else {
    expect(loadingIndicator).not.toBeInTheDocument();
  }
}

/**
 * Assert that a specific error code is displayed
 *
 * @param errorCode - Expected ErrorCode
 *
 * @example
 * ```typescript
 * expectErrorCode(ErrorCode.TSX_PARSE_ERROR);
 * ```
 */
export function expectErrorCode(errorCode: ErrorCode) {
  // Error code might be in metadata, technical details, or aria-label
  const codeString = errorCode.toString();
  const elements = screen.queryAllByText(new RegExp(codeString, 'i'));

  expect(elements.length).toBeGreaterThan(0);
}

/**
 * Assert that error category badge is displayed
 *
 * @param category - Expected ErrorCategory
 *
 * @example
 * ```typescript
 * expectErrorCategory(ErrorCategory.SYNTAX);
 * ```
 */
export function expectErrorCategory(category: ErrorCategory) {
  expect(
    screen.getByText(new RegExp(category, 'i')),
  ).toBeInTheDocument();
}

/**
 * Assert that a button is disabled (or enabled)
 *
 * @param buttonName - Button text or regex
 * @param disabled - Whether button should be disabled (default: true)
 *
 * @example
 * ```typescript
 * expectButtonDisabled('Convert');
 * expectButtonDisabled(/download/i, false); // Should be enabled
 * ```
 */
export function expectButtonDisabled(
  buttonName: string | RegExp,
  disabled = true,
) {
  const button = screen.getByRole('button', { name: buttonName });

  if (disabled) {
    expect(button).toBeDisabled();
  }
  else {
    expect(button).toBeEnabled();
  }
}

/**
 * Assert that progress indicator shows specific percentage
 *
 * @param percentage - Expected progress (0-100)
 * @param tolerance - Allowed difference (default: 5)
 *
 * @example
 * ```typescript
 * expectProgress(50);
 * expectProgress(75, 10); // 65-85%
 * ```
 */
export function expectProgress(percentage: number, tolerance = 5) {
  const progressBar = screen.getByRole('progressbar');
  const value = progressBar.getAttribute('aria-valuenow');

  expect(value).toBeTruthy();
  const actual = Number.parseFloat(value!);

  expect(actual).toBeGreaterThanOrEqual(percentage - tolerance);
  expect(actual).toBeLessThanOrEqual(percentage + tolerance);
}

/**
 * Assert that settings form shows specific values
 *
 * @param settings - Expected setting values
 *
 * @example
 * ```typescript
 * expectSettingsValues({
 *   'Page Size': 'A4',
 *   'Font Size': '12',
 *   'Compress PDF': true
 * });
 * ```
 */
export function expectSettingsValues(settings: Record<string, string | boolean>) {
  Object.entries(settings).forEach(([label, value]) => {
    const field = screen.getByLabelText(label);

    if (typeof value === 'boolean') {
      // Checkbox
      if (value) {
        expect(field).toBeChecked();
      }
      else {
        expect(field).not.toBeChecked();
      }
    }
    else {
      // Text input or select
      expect(field).toHaveValue(value);
    }
  });
}

/**
 * Assert that accessibility attributes are correct
 *
 * @param element - Element or text to find element
 * @param attributes - Expected ARIA attributes
 *
 * @example
 * ```typescript
 * expectAccessibility('Convert button', {
 *   'aria-label': 'Convert CV to PDF',
 *   'aria-disabled': 'false'
 * });
 * ```
 */
export function expectAccessibility(
  element: HTMLElement | string,
  attributes: Record<string, string>,
) {
  const el = typeof element === 'string'
    ? screen.getByText(element)
    : element;

  Object.entries(attributes).forEach(([attr, value]) => {
    expect(el).toHaveAttribute(attr, value);
  });
}

/**
 * Assert that file size is displayed with correct format
 *
 * @param sizePattern - Expected size pattern (e.g., "1.5 MB", /\d+\.\d+ MB/)
 *
 * @example
 * ```typescript
 * expectFileSize(/\d+\.\d+ MB/);
 * expectFileSize('1.5 MB');
 * ```
 */
export function expectFileSize(sizePattern: string | RegExp) {
  expect(screen.getByText(sizePattern)).toBeInTheDocument();
}

/**
 * Assert that specific number of items are in a list
 *
 * @param containerLabel - List container label or test ID
 * @param count - Expected item count
 * @param itemRole - ARIA role of list items (default: 'listitem')
 *
 * @example
 * ```typescript
 * expectListItemCount('Custom Fonts', 3);
 * expectListItemCount('font-list', 5, 'option');
 * ```
 */
export function expectListItemCount(
  containerLabel: string,
  count: number,
  itemRole: string = 'listitem',
) {
  const container = screen.queryByLabelText(containerLabel) ?? screen.getByTestId(containerLabel);
   
  const items = within(container).getAllByRole(itemRole as any);

  expect(items).toHaveLength(count);
}

/**
 * Assert that modal/dialog is open (or closed)
 *
 * @param title - Modal title text or regex
 * @param isOpen - Whether modal should be open (default: true)
 *
 * @example
 * ```typescript
 * expectModal('Unsaved Changes', true);
 * expectModal(/confirm/i, false);
 * ```
 */
export function expectModal(title: string | RegExp, isOpen = true) {
  const dialog = screen.queryByRole('dialog', { name: title });

  if (isOpen) {
    expect(dialog).toBeInTheDocument();
  }
  else {
    expect(dialog).not.toBeInTheDocument();
  }
}
