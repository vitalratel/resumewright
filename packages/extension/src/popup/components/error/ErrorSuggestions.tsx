// ABOUTME: Displays prioritized error recovery suggestions with help links.
// ABOUTME: Shows success likelihood badges, rationales, and retry warnings.

import { ArrowTopRightOnSquareIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { getHelpLinkForSuggestion, getHelpResourcesForError } from '@/shared/errors/helpResources';
import type { ConversionError } from '@/shared/types/models';

interface ErrorSuggestionsProps {
  /** Conversion error with suggestions */
  error: ConversionError;

  /** Number of retry attempts (for intelligent retry warnings) */
  retryAttempt: number;

  /** Previous error message if retrying */
  lastError?: string;

  /** Prioritized suggestions (already processed) */
  prioritizedSuggestions: Array<{
    text: string;
    mostLikely?: boolean;
    rationale?: string;
  }>;

  /** Whether this is a size-related error */
  isSizeError: boolean;

  /** Size reduction tips for MEMORY_LIMIT_EXCEEDED errors */
  sizeReductionTips: string[];
}

/**
 * ErrorSuggestions displays actionable recovery suggestions with priority
 */
export function ErrorSuggestions({
  error,
  retryAttempt,
  lastError,
  prioritizedSuggestions,
  isSizeError,
  sizeReductionTips,
}: ErrorSuggestionsProps) {
  // Get help resources for this error
  const helpResources = getHelpResourcesForError(error.code);

  return (
    <>
      {/* Main Suggestions */}
      {prioritizedSuggestions.length > 0 && (
        <div
          className="w-full max-w-md bg-info/10 border border-info/20 rounded-lg p-4"
          data-testid="error-suggestions"
        >
          <h2 className="text-sm font-semibold text-info-foreground mb-3 flex items-center">
            <svg
              className="w-5 h-5 mr-1.5 shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            What you can try:
          </h2>
          <ol className="space-y-4 md:space-y-6 text-sm">
            {prioritizedSuggestions.map((suggestion, idx) => (
              <li key={suggestion.text} className="flex items-start">
                <span className="text-info mb-3 mt-0.5 shrink-0 font-semibold">{idx + 1}.</span>
                <div className="flex-1">
                  <div className="flex items-start gap-2">
                    <span className="leading-snug text-foreground">{suggestion.text}</span>
                    {/* Most likely badge */}
                    {suggestion.mostLikely && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-sm font-semibold bg-success/10 text-success border border-success/20 shrink-0">
                        Most likely
                      </span>
                    )}
                  </div>
                  {/* Help link for suggestion */}
                  {(() => {
                    const helpLink = getHelpLinkForSuggestion(suggestion.text);
                    if (helpLink) {
                      return (
                        <a
                          href={helpLink.url}
                          target={helpLink.type === 'external' ? '_blank' : '_self'}
                          rel={helpLink.type === 'external' ? 'noopener noreferrer' : undefined}
                          className="inline-flex items-center gap-1 mb-3 text-sm text-primary hover:text-primary/80 underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background rounded-md px-1 transition-colors"
                          aria-label={`Learn more: ${helpLink.text}`}
                        >
                          {helpLink.text}
                          {helpLink.type === 'external' && (
                            <ArrowTopRightOnSquareIcon className="w-5 h-5" aria-hidden="true" />
                          )}
                          {helpLink.type === 'internal' && <span aria-hidden="true">→</span>}
                        </a>
                      );
                    }
                    return null;
                  })()}
                  {/* Show rationale if available */}
                  {suggestion.rationale !== null &&
                    suggestion.rationale !== undefined &&
                    suggestion.rationale !== '' && (
                      <div className="mb-3 text-sm text-info italic">
                        Why: {suggestion.rationale}
                      </div>
                    )}
                </div>
              </li>
            ))}
          </ol>
          {/* General help resources for this error */}
          {helpResources.length > 0 && (
            <div className="mt-4 pt-3 border-t border-info/20">
              <p className="text-sm font-medium text-foreground mb-3">Additional resources:</p>
              <div className="flex flex-wrap gap-2">
                {helpResources.map((resource) => (
                  <a
                    key={resource.url}
                    href={resource.url}
                    target={resource.type === 'external' ? '_blank' : '_self'}
                    rel={resource.type === 'external' ? 'noopener noreferrer' : undefined}
                    className="inline-flex items-center gap-2 px-2 py-1 text-sm bg-card border border-info/20 rounded-md hover:bg-muted hover:border-border focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background transition-colors"
                  >
                    {resource.text}
                    {resource.type === 'external' && (
                      <ArrowTopRightOnSquareIcon className="w-4 h-4" aria-hidden="true" />
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Size-specific reduction guidance */}
      {isSizeError && sizeReductionTips.length > 0 && (
        <div className="w-full max-w-md bg-info/10 border border-info/20 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <svg
              className="w-6 h-6 text-info shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-foreground mb-3">
                How to reduce your CV size:
              </h3>
              <ul className="gap-2 text-sm text-info list-disc list-inside">
                {sizeReductionTips.map((tip) => (
                  <li key={tip} className="leading-relaxed">
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Intelligent Retry Warning */}
      {retryAttempt >= 3 && error.recoverable && (
        <div className="w-full max-w-md bg-warning/10 border border-warning/20 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <ExclamationTriangleIcon
              className="w-6 h-6 text-warning shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-warning-foreground mb-3">
                Multiple retry attempts detected
              </h3>
              <p className="text-sm text-warning leading-relaxed">
                You&apos;ve tried {retryAttempt} times with the same error. Before retrying again,
                please:
              </p>
              <ul className="mb-3 gap-2 text-sm text-warning list-disc list-inside">
                <li>Make a change to your CV or settings</li>
                <li>Try a different suggestion from the list above</li>
                <li>Consider reporting this issue if suggestions don&apos;t help</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Previous Error Context */}
      {retryAttempt > 0 && lastError !== null && lastError !== undefined && lastError !== '' && (
        <div className="w-full max-w-md bg-muted border border-border rounded-lg p-3">
          <div className="flex items-start gap-2">
            <svg
              className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground mb-3">
                Previous attempt (#
                {retryAttempt}
                ):
              </p>
              <p className="text-sm text-muted-foreground">{lastError}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
