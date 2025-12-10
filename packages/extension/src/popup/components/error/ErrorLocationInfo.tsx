// ABOUTME: Displays line/column information for parse errors or file size for memory errors.
// ABOUTME: Extracted from ErrorState for better component organization.

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
 * ErrorLocationInfo Component
 *
 * Displays contextual information about where an error occurred:
 * - For parse errors: line and column numbers
 * - For memory errors: file size vs maximum size
 */
export function ErrorLocationInfo({ line, column, fileSize, maxSize }: ErrorLocationInfoProps) {
  // Don't render if no location info available
  if (line === undefined && fileSize === undefined) {
    return null;
  }

  return (
    <div className="w-full max-w-md text-sm text-muted-foreground bg-info/10 p-3 rounded-lg border border-info/20">
      {/* Parse error line/column */}
      {line !== undefined && (
        <p className="font-mono" data-testid="error-location">
          Line {line}
          {column !== undefined && `, Column ${column}`}
        </p>
      )}

      {/* File size information */}
      {fileSize !== undefined && maxSize !== undefined && (
        <p data-testid="error-size">
          File size: <span className="font-semibold">{formatFileSize(fileSize)}</span>
          {' / '}
          <span className="text-muted-foreground">
            max:
            {formatFileSize(maxSize)}
          </span>
        </p>
      )}
    </div>
  );
}
