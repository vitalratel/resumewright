/**
 * Accessibility Testing Utility
 *
 * Wrapper for axe-core with WCAG 2.1 Level A/AA config
 */

import type { Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Run axe accessibility scan on a page
 *
 * @param page - Playwright page object
 * @param tags - Accessibility tags to test (default: WCAG 2.1 A and AA)
 * @returns Axe scan results
 */
export async function runAccessibilityScan(
  page: Page,
  tags: string[] = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
) {
  const builder = new AxeBuilder({ page }).withTags(tags);

  const results = await builder.analyze();

  return results;
}

/**
 * Assert zero WCAG Level A violations (hard requirement)
 *
 * @param page - Playwright page object
 * @throws Error if Level A violations found
 */
export async function assertNoLevelAViolations(page: Page) {
  const results = await runAccessibilityScan(page, ['wcag2a', 'wcag21a']);

  if (results.violations.length > 0) {
    const violationSummary = results.violations
      .map(
        (v: { id: string; description: string; nodes: unknown[] }) =>
          `- ${v.id}: ${v.description} (${v.nodes.length} instances)`
      )
      .join('\n');

    throw new Error(
      `Found ${results.violations.length} WCAG Level A violation(s):\n${violationSummary}`
    );
  }

  return results;
}

/**
 * Check for WCAG Level AA violations (target for production)
 *
 * @param page - Playwright page object
 * @returns Scan results with violations
 */
export async function checkLevelAAViolations(page: Page) {
  const results = await runAccessibilityScan(page, ['wcag2aa', 'wcag21aa']);

  return {
    violations: results.violations,
    violationCount: results.violations.length,
    passes: results.passes,
    summary: results.violations
      .map((v: { id: string; description: string }) => `${v.id}: ${v.description}`)
      .join(', '),
  };
}
