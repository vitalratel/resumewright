/**
 * User Event Test Helpers
 *
 * Reusable interaction patterns for testing user actions.
 * Wraps @testing-library/user-event for common extension workflows.
 *
 * Usage:
 * ```typescript
 * import { clickButton, uploadFile, fillFormField } from '@tests/utils/userEvents';
 *
 * await clickButton('Convert to PDF');
 * await uploadFile(input, mockFile);
 * await fillFormField('Font Size', '14');
 * ```
 */

import type { ByRoleMatcher } from '@testing-library/react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Click a button by text content
 *
 * @param text - Button text or regex pattern
 * @param options - Click options
 * @returns Promise resolving when click completes
 *
 * @example
 * ```typescript
 * await clickButton('Convert to PDF');
 * await clickButton(/convert/i);
 * ```
 */
export async function clickButton(
  text: string | RegExp,
  options?: Parameters<typeof userEvent.click>[1],
) {
  const button = screen.getByRole('button', { name: text });
  await userEvent.click(button, options);
}

/**
 * Upload a file to an input element
 *
 * @param input - File input element or label text
 * @param file - File object to upload
 * @returns Promise resolving when upload completes
 *
 * @example
 * ```typescript
 * const file = new File(['content'], 'cv.tsx', { type: 'text/plain' });
 * const input = screen.getByLabelText('Upload CV');
 * await uploadFile(input, file);
 * ```
 */
export async function uploadFile(
  input: HTMLElement | string,
  file: File,
) {
  const element
    = typeof input === 'string'
      ? screen.getByLabelText(input)
      : input;

  await userEvent.upload(element as HTMLInputElement, file);
}

/**
 * Upload multiple files to an input element
 *
 * @param input - File input element or label text
 * @param files - Array of File objects
 * @returns Promise resolving when upload completes
 *
 * @example
 * ```typescript
 * const files = [
 *   new File(['font1'], 'roboto.ttf'),
 *   new File(['font2'], 'opensans.woff2')
 * ];
 * await uploadMultipleFiles('Upload Fonts', files);
 * ```
 */
export async function uploadMultipleFiles(
  input: HTMLElement | string,
  files: File[],
) {
  const element
    = typeof input === 'string'
      ? screen.getByLabelText(input)
      : input;

  await userEvent.upload(element as HTMLInputElement, files);
}

/**
 * Fill a form field by label
 *
 * @param label - Field label text or regex
 * @param value - Value to enter
 * @returns Promise resolving when input completes
 *
 * @example
 * ```typescript
 * await fillFormField('Font Size', '14');
 * await fillFormField(/margin/i, '0.5');
 * ```
 */
export async function fillFormField(
  label: string | RegExp,
  value: string,
) {
  const field = screen.getByLabelText(label);
  await userEvent.clear(field);
  await userEvent.type(field, value);
}

/**
 * Select an option from a dropdown
 *
 * @param label - Select label text or regex
 * @param option - Option text or value to select
 * @returns Promise resolving when selection completes
 *
 * @example
 * ```typescript
 * await selectOption('Page Size', 'A4');
 * await selectOption(/paper/i, 'Letter');
 * ```
 */
export async function selectOption(
  label: string | RegExp,
  option: string,
) {
  const select = screen.getByLabelText(label);
  await userEvent.selectOptions(select, option);
}

/**
 * Toggle a checkbox by label
 *
 * @param label - Checkbox label text or regex
 * @returns Promise resolving when toggle completes
 *
 * @example
 * ```typescript
 * await toggleCheckbox('Compress PDF');
 * await toggleCheckbox(/metadata/i);
 * ```
 */
export async function toggleCheckbox(label: string | RegExp) {
  const checkbox = screen.getByLabelText(label);
  await userEvent.click(checkbox);
}

/**
 * Click a link by text
 *
 * @param text - Link text or regex
 * @returns Promise resolving when click completes
 *
 * @example
 * ```typescript
 * await clickLink('Learn more');
 * await clickLink(/help/i);
 * ```
 */
export async function clickLink(text: string | RegExp) {
  const link = screen.getByRole('link', { name: text });
  await userEvent.click(link);
}

/**
 * Press a keyboard key
 *
 * @param key - Key name (e.g., 'Enter', 'Escape', 'Tab')
 * @returns Promise resolving when key press completes
 *
 * @example
 * ```typescript
 * await pressKey('Enter');
 * await pressKey('Escape');
 * await pressKey('{Shift>}Tab{/Shift}'); // Shift+Tab
 * ```
 */
export async function pressKey(key: string) {
  await userEvent.keyboard(key);
}

/**
 * Type text into currently focused element
 *
 * @param text - Text to type
 * @param options - Typing options
 * @returns Promise resolving when typing completes
 *
 * @example
 * ```typescript
 * await typeText('Hello World');
 * await typeText('Fast typing', { delay: 10 });
 * ```
 */
export async function typeText(
  text: string,
  options?: Parameters<typeof userEvent.type>[2],
) {
  const activeElement = document.activeElement as HTMLElement;
  if (activeElement === null || activeElement === undefined) {
    throw new Error('No element is focused');
  }
  await userEvent.type(activeElement, text, options);
}

/**
 * Clear a text input field
 *
 * @param label - Field label text or regex
 * @returns Promise resolving when clear completes
 *
 * @example
 * ```typescript
 * await clearField('Font Size');
 * ```
 */
export async function clearField(label: string | RegExp) {
  const field = screen.getByLabelText(label);
  await userEvent.clear(field);
}

/**
 * Hover over an element
 *
 * @param text - Element text or role
 * @param role - Optional ARIA role (if omitted, searches by text)
 * @returns Promise resolving when hover completes
 *
 * @example
 * ```typescript
 * await hoverOver('Help Icon');
 * await hoverOver('Tooltip trigger', 'button');
 * ```
 */
export async function hoverOver(
  text: string | RegExp,
  role?: ByRoleMatcher,
) {
  const element = (role !== null && role !== undefined)
    ? screen.getByRole(role, { name: text })
    : screen.getByText(text);
  await userEvent.hover(element);
}

/**
 * Double-click an element
 *
 * @param text - Element text or regex
 * @param role - Optional ARIA role (if omitted, searches by text)
 * @returns Promise resolving when double-click completes
 *
 * @example
 * ```typescript
 * await doubleClick('Edit');
 * ```
 */
export async function doubleClick(
  text: string | RegExp,
  role?: ByRoleMatcher,
) {
  const element = (role !== null && role !== undefined)
    ? screen.getByRole(role, { name: text })
    : screen.getByText(text);
  await userEvent.dblClick(element);
}

/**
 * Wait for an element to appear, then click it
 *
 * @param text - Element text or regex
 * @param role - ARIA role (default: 'button')
 * @param timeout - Max wait time in ms (default: 5000)
 * @returns Promise resolving when click completes
 *
 * @example
 * ```typescript
 * await waitAndClick('Convert');
 * await waitAndClick(/download/i, 'link');
 * ```
 */
export async function waitAndClick(
  text: string | RegExp,
  role: string = 'button',
  timeout = 5000,
) {
  const element = await waitFor(
    () => screen.getByRole(role as 'button' | 'link' | 'textbox', { name: text }),
    { timeout },
  );
  await userEvent.click(element);
}
