/**
 * Error Enrichment Utilities
 *
 * Functions to enhance errors with additional context
 * like code snippets and location information.
 */

/**
 * Code context with line highlighting
 */
export interface CodeContext {
  /** Array of code lines with line numbers */
  lines: Array<{ lineNumber: number; content: string; isError: boolean }>;

  /** Formatted string ready for display */
  formatted: string;

  /** Index of the error line in the lines array */
  errorLineIndex: number;
}

/**
 * Extract code context around an error line
 *
 * @param code - Full code string
 * @param errorLine - 1-based line number where error occurred
 * @param contextLines - Number of lines to show before/after error (default: 5, P2-ERROR-003)
 * @returns Code context with formatted display string
 *
 * @example
 * ```ts
 * const tsx = '<div>\n  <Experience>\n    <Role>Developer\n  </Experience>\n</div>';
 * const context = extractCodeContext(tsx, 3, 2);
 * // Shows lines 1-5 with line 3 highlighted
 * ```
 */
export function extractCodeContext(
  code: string,
  errorLine: number,
  contextLines: number = 5,
): CodeContext {
  const lines = code.split('\n');
  const errorIndex = errorLine - 1; // Convert to 0-based

  // Calculate range (ensure within bounds)
  const startIndex = Math.max(0, errorIndex - contextLines);
  const endIndex = Math.min(lines.length, errorIndex + contextLines + 1);

  // Extract lines with metadata
  const contextLinesData = [];
  for (let i = startIndex; i < endIndex; i++) {
    contextLinesData.push({
      lineNumber: i + 1,
      content: lines[i] || '',
      isError: i === errorIndex,
    });
  }

  // Format for display
  const formatted = formatCodeContext(contextLinesData);

  return {
    lines: contextLinesData,
    formatted,
    errorLineIndex: errorIndex - startIndex,
  };
}

/**
 * Format code context for display
 *
 * @param lines - Array of lines with metadata
 * @returns Formatted string with line numbers and error indicator
 */
function formatCodeContext(
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
 * Extract code context with column highlighting
 *
 * @param code - Full code string
 * @param errorLine - 1-based line number
 * @param errorColumn - 1-based column number
 * @param contextLines - Number of lines before/after
 * @returns Code context with column highlighted
 */
export function extractCodeContextWithColumn(
  code: string,
  errorLine: number,
  errorColumn: number,
  contextLines: number = 5,
): CodeContext {
  const lines = code.split('\n');
  const errorIndex = errorLine - 1;

  const startIndex = Math.max(0, errorIndex - contextLines);
  const endIndex = Math.min(lines.length, errorIndex + contextLines + 1);

  const contextLinesData = [];
  for (let i = startIndex; i < endIndex; i++) {
    contextLinesData.push({
      lineNumber: i + 1,
      content: lines[i] || '',
      isError: i === errorIndex,
    });
  }

  // Format with column indicator
  const formatted = formatCodeContextWithColumn(contextLinesData, errorColumn);

  return {
    lines: contextLinesData,
    formatted,
    errorLineIndex: errorIndex - startIndex,
  };
}

/**
 * Format code context with column highlighting
 */
function formatCodeContextWithColumn(
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
 * Truncate long lines in code context
 *
 * @param code - Full code string
 * @param errorLine - 1-based line number
 * @param errorColumn - 1-based column number (optional)
 * @param maxLineLength - Maximum line length (default: 80)
 * @param contextLines - Number of lines before/after
 * @returns Code context with truncated lines
 */
export function extractTruncatedCodeContext(
  code: string,
  errorLine: number,
  errorColumn?: number,
  maxLineLength: number = 80,
  contextLines: number = 5,
): CodeContext {
  const lines = code.split('\n');
  const errorIndex = errorLine - 1;

  const startIndex = Math.max(0, errorIndex - contextLines);
  const endIndex = Math.min(lines.length, errorIndex + contextLines + 1);

  const contextLinesData = [];
  for (let i = startIndex; i < endIndex; i++) {
    let content = lines[i] || '';

    // Truncate long lines
    if (content.length > maxLineLength) {
      if (i === errorIndex && (errorColumn !== null && errorColumn !== undefined && errorColumn !== 0)) {
        // For error line, show context around error column
        const start = Math.max(0, errorColumn - Math.floor(maxLineLength / 2));
        const end = Math.min(content.length, start + maxLineLength);
        content = (start > 0 ? '...' : '') + content.slice(start, end) + (end < content.length ? '...' : '');
      }
      else {
        // For other lines, truncate from start
        content = `${content.slice(0, maxLineLength)}...`;
      }
    }

    contextLinesData.push({
      lineNumber: i + 1,
      content,
      isError: i === errorIndex,
    });
  }

  const formatted = (errorColumn !== null && errorColumn !== undefined && errorColumn !== 0)
    ? formatCodeContextWithColumn(contextLinesData, errorColumn)
    : formatCodeContext(contextLinesData);

  return {
    lines: contextLinesData,
    formatted,
    errorLineIndex: errorIndex - startIndex,
  };
}

/**
 * Add code context to a ConversionError
 *
 * @param error - Error object to enhance
 * @param code - Full code string
 * @returns Enhanced error with code context in metadata
 */
export function addCodeContextToError<T extends { metadata?: { line?: number; column?: number; codeContext?: string } }>(
  error: T,
  code: string,
): T {
  if (error.metadata?.line === null || error.metadata?.line === undefined || error.metadata?.line === 0) {
    return error;
  }

  const context = (error.metadata.column !== null && error.metadata.column !== undefined && error.metadata.column !== 0)
    ? extractCodeContextWithColumn(code, error.metadata.line, error.metadata.column)
    : extractCodeContext(code, error.metadata.line);

  return {
    ...error,
    metadata: {
      ...error.metadata,
      codeContext: context.formatted,
    },
  };
}
