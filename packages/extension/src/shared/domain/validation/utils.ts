// ABOUTME: Shared utilities for Valibot schema validation.
// ABOUTME: Provides common error formatting helpers.

/**
 * Minimal interface for validation issues used by formatValidationIssues.
 * Compatible with Valibot's BaseIssue but only requires the fields we use.
 * The key type is unknown to accommodate Valibot's MapPathItem which has unknown keys.
 */
interface ValidationIssue {
  message: string;
  path?: ReadonlyArray<{ key: unknown }> | null;
}

/**
 * Format validation issues into a readable error string
 *
 * Converts Valibot validation issues into human-readable error messages
 * with dot-notation paths (e.g., "margin.top: Value must be positive").
 *
 * @param issues - Array of validation issues (compatible with Valibot BaseIssue)
 * @returns Formatted error string with all issues joined by ", "
 */
export function formatValidationIssues(issues: readonly ValidationIssue[]): string {
  return issues
    .map((issue) => {
      const path =
        issue.path !== null && issue.path !== undefined
          ? issue.path.map((p) => p.key).join('.') || 'root'
          : 'root';
      return `${path}: ${issue.message}`;
    })
    .join(', ');
}
