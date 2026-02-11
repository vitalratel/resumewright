// ABOUTME: Displays line/column information for parse errors or file size for memory errors.
// ABOUTME: Extracted from ErrorState for better component organization.

import { Show } from 'solid-js';
import { formatFileSize } from '../../utils/formatting';

interface ErrorLocationInfoProps {
  /** Line number where error occurred */
  line?: number;

  /** Column number where error occurred */
  column?: number;

  /** File size (for memory errors) */
  fileSize?: number;

  /** Maximum allowed file size */
  maxSize?: number;
}

/**
 * Displays contextual information about where an error occurred:
 * - For parse errors: line and column numbers
 * - For memory errors: file size vs maximum size
 */
export function ErrorLocationInfo(props: ErrorLocationInfoProps) {
  return (
    <Show when={props.line !== undefined || props.fileSize !== undefined}>
      <div class="w-full max-w-md text-sm text-muted-foreground bg-info/10 p-3 rounded-lg border border-info/20">
        <Show when={props.line !== undefined}>
          <p class="font-mono" data-testid="error-location">
            Line {props.line}
            <Show when={props.column !== undefined}>, Column {props.column}</Show>
          </p>
        </Show>

        <Show when={props.fileSize !== undefined && props.maxSize !== undefined}>
          <p data-testid="error-size">
            File size: <span class="font-semibold">{formatFileSize(props.fileSize!)}</span>
            {' / '}
            <span class="text-muted-foreground">
              max:
              {formatFileSize(props.maxSize!)}
            </span>
          </p>
        </Show>
      </div>
    </Show>
  );
}
