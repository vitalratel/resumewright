/**
 * Error Formatting Utilities
 *
 * Utilities for formatting code context for display in the UI.
 * This module is separated from enrichment to focus on presentation concerns.
 */

import type { CodeContext } from '../factory/enrichment';

/**
 * Format code context for display
 * Re-exported from enrichment for convenience
 */
export function formatCodeContext(
  lines: Array<{ lineNumber: number; content: string; isError: boolean }>,
): string {
  // Find max line number width for alignment
  const maxLineNumber = Math.max(...lines.map(l => l.lineNumber));
  const lineNumberWidth = String(maxLineNumber).length;

  return lines
    .map(({ lineNumber, content, isError }) => {
      const lineNumStr = String(lineNumber).padStart(lineNumberWidth, ' ');
      const prefix = isError ? '→' : ' ';
      const line = `${prefix} ${lineNumStr} | ${content}`;

      // Add error indicator below the line
      if (isError) {
        const indicatorLine = ' '.repeat(lineNumberWidth + 4) + '^'.repeat(Math.min(content.length, 50));
        return `${line}\n${indicatorLine}`;
      }

      return line;
    })
    .join('\n');
}

/**
 * Format code context with column highlighting
 */
export function formatCodeContextWithColumn(
  lines: Array<{ lineNumber: number; content: string; isError: boolean }>,
  errorColumn: number,
): string {
  const maxLineNumber = Math.max(...lines.map(l => l.lineNumber));
  const lineNumberWidth = String(maxLineNumber).length;

  return lines
    .map(({ lineNumber, content, isError }) => {
      const lineNumStr = String(lineNumber).padStart(lineNumberWidth, ' ');
      const prefix = isError ? '→' : ' ';
      const line = `${prefix} ${lineNumStr} | ${content}`;

      if (isError && errorColumn > 0) {
        // Show indicator at specific column
        const spaces = ' '.repeat(lineNumberWidth + 4 + errorColumn - 1);
        const indicator = '^';
        return `${line}\n${spaces}${indicator}`;
      }

      return line;
    })
    .join('\n');
}

/**
 * Format code context as HTML for rich display
 * (Future enhancement - currently returns plain text)
 */
export function formatCodeContextAsHtml(context: CodeContext): string {
  // For now, wrap in <pre> tag
  // Future: Add syntax highlighting
  return `<pre class="code-context">${context.formatted}</pre>`;
}

/**
 * Report an issue (stub for backward compatibility)
 * TODO: Implement proper issue reporting or remove this feature
 */
export function reportIssue(details: {
  errorId: string;
  message: string;
  technicalDetails?: string;
}): void {
  // Stub implementation - log to console for now
  console.warn('Issue reporting not yet implemented:', details);
  // Future: Open GitHub issue template or email client
}
