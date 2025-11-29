/**
 * Error Code Context Component
 *
 * Displays code context for parse errors with line numbers.
 * Extracted from ErrorState for better component organization .
 */

import { tokens } from '../../styles/tokens';

interface ErrorCodeContextProps {
  /** Code context to display */
  codeContext: string;

  /** Line number where error occurred */
  line?: number;
}

/**
 * ErrorCodeContext Component
 *
 * Displays the code snippet where a parse error occurred,
 * with syntax highlighting and line number context.
 */
export function ErrorCodeContext({ codeContext, line }: ErrorCodeContextProps) {
  return (
    <div
      className={`w-full max-w-md ${tokens.colors.tooltip.bg} ${tokens.colors.neutral.text} ${tokens.spacing.card} ${tokens.borders.roundedLg} font-mono ${tokens.typography.small} overflow-x-auto focus:outline-none focus:ring-2 focus:ring-blue-500`}
      tabIndex={0}
      role="region"
      aria-label="Error code context"
    >
      {line !== undefined && (
        <div className={`${tokens.colors.neutral.textMuted} ${tokens.typography.small} ${tokens.spacing.marginSmall}`}>
          Error on line
          {' '}
          {line}
          :
        </div>
      )}
      <pre className={`${tokens.typography.small} leading-relaxed whitespace-pre-wrap`}>
        {codeContext}
      </pre>
    </div>
  );
}
