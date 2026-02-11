// ABOUTME: Displays code context for parse errors with line numbers.
// ABOUTME: Shows syntax-highlighted code snippet where error occurred.

import { Show } from 'solid-js';

interface ErrorCodeContextProps {
  /** Code context to display */
  codeContext: string;

  /** Line number where error occurred */
  line?: number;
}

/**
 * Displays the code snippet where a parse error occurred,
 * with syntax highlighting and line number context.
 */
export function ErrorCodeContext(props: ErrorCodeContextProps) {
  return (
    <section
      class="w-full max-w-md bg-popover text-popover-foreground p-4 rounded-lg font-mono text-sm overflow-x-auto focus:outline-none focus:ring-2 focus:ring-ring"
      // biome-ignore lint/a11y/noNoninteractiveTabindex: Scrollable content needs tabIndex for keyboard accessibility
      tabIndex={0}
      aria-label="Error code context"
    >
      <Show when={props.line !== undefined}>
        <div class="text-muted-foreground text-sm mb-3">Error on line {props.line}:</div>
      </Show>
      <pre class="text-sm leading-relaxed whitespace-pre-wrap">{props.codeContext}</pre>
    </section>
  );
}
