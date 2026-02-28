// ABOUTME: Axe-core wrapper for WCAG 2.1 Level A/AA accessibility testing.
// ABOUTME: Used by accessibility test specs to run compliance scans.

import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';

async function runAccessibilityScan(
  page: Page,
  tags: string[] = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
) {
  const builder = new AxeBuilder({ page }).withTags(tags);
  return builder.analyze();
}

export async function assertNoLevelAViolations(page: Page) {
  const results = await runAccessibilityScan(page, ['wcag2a', 'wcag21a']);

  if (results.violations.length > 0) {
    const violationSummary = results.violations
      .map(
        (v: { id: string; description: string; nodes: unknown[] }) =>
          `- ${v.id}: ${v.description} (${v.nodes.length} instances)`,
      )
      .join('\n');

    throw new Error(
      `Found ${results.violations.length} WCAG Level A violation(s):\n${violationSummary}`,
    );
  }

  return results;
}

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
