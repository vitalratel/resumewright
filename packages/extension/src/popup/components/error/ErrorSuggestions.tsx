/**
 * ErrorSuggestions Component
 *
 * Displays prioritized suggestions for error recovery with:
 * - Success likelihood prioritization
 * - "Most likely" badges for top suggestions
 * - Rationales explaining why each suggestion helps
 * - Clickable help links to relevant resources
 * - Intelligent retry warnings after multiple attempts
 */

import { ArrowTopRightOnSquareIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { memo } from 'react';
import { getHelpLinkForSuggestion, getHelpResourcesForError } from '@/shared/errors/helpResources';
import type { ConversionError } from '@/shared/types/models';
import { tokens } from '../../styles/tokens';

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
export const ErrorSuggestions = memo(
  ({
    error,
    retryAttempt,
    lastError,
    prioritizedSuggestions,
    isSizeError,
    sizeReductionTips,
  }: ErrorSuggestionsProps) => {
    // Get help resources for this error
    const helpResources = getHelpResourcesForError(error.code);

    return (
      <>
        {/* Main Suggestions - HOW TO FIX (P0-FLOW-005, P1-ERROR-008) */}
        {prioritizedSuggestions.length > 0 && (
          <div
            className={`w-full max-w-md ${tokens.colors.info.bg} ${tokens.colors.info.border} ${tokens.borders.roundedLg} p-4`}
            data-testid="error-suggestions"
          >
            <h2
              className={`${tokens.typography.small} ${tokens.typography.semibold} ${tokens.colors.info.textStrong} ${tokens.spacing.marginSmall} flex items-center`}
            >
              <svg
                className={`${tokens.icons.sm} mr-1.5 shrink-0`}
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
            <ol className={`${tokens.spacing.sectionGapCompact} ${tokens.typography.small}`}>
              {prioritizedSuggestions.map((suggestion, idx) => (
                <li key={suggestion.text} className="flex items-start">
                  <span
                    className={`${tokens.colors.info.text} ${tokens.spacing.marginSmall} mt-0.5 shrink-0 ${tokens.typography.semibold}`}
                  >
                    {idx + 1}.
                  </span>
                  <div className="flex-1">
                    <div className={`flex items-start ${tokens.spacing.gapSmall}`}>
                      <span className={`leading-snug ${tokens.colors.info.textStrong}`}>
                        {suggestion.text}
                      </span>
                      {/* Most likely badge */}
                      {suggestion.mostLikely && (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 ${tokens.borders.rounded} ${tokens.typography.small} ${tokens.typography.semibold} ${tokens.colors.success.bg} ${tokens.colors.success.textStrong} ${tokens.colors.success.border} shrink-0`
                            .trim()
                            .replace(/\s+/g, ' ')}
                        >
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
                            className={`inline-flex items-center gap-1 ${tokens.spacing.marginSmall} ${tokens.typography.small} ${tokens.colors.link.text} ${tokens.colors.link.hover} ${tokens.colors.link.underline} ${tokens.effects.focusRing} ${tokens.borders.rounded} px-1 ${tokens.transitions.default}`}
                            aria-label={`Learn more: ${helpLink.text}`}
                          >
                            {helpLink.text}
                            {helpLink.type === 'external' && (
                              <ArrowTopRightOnSquareIcon
                                className={tokens.icons.sm}
                                aria-hidden="true"
                              />
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
                        <div
                          className={`${tokens.spacing.marginSmall} ${tokens.typography.small} ${tokens.colors.info.text} italic`}
                        >
                          Why: {suggestion.rationale}
                        </div>
                      )}
                  </div>
                </li>
              ))}
            </ol>
            {/* General help resources for this error */}
            {helpResources.length > 0 && (
              <div
                className={`${tokens.spacing.marginMedium} pt-3 border-t ${tokens.colors.info.border}`}
              >
                <p
                  className={`${tokens.typography.small} ${tokens.typography.medium} ${tokens.colors.info.textStrong} ${tokens.spacing.marginSmall}`}
                >
                  Additional resources:
                </p>
                <div className={`flex flex-wrap ${tokens.spacing.gapSmall}`}>
                  {helpResources.map((resource) => (
                    <a
                      key={resource.url}
                      href={resource.url}
                      target={resource.type === 'external' ? '_blank' : '_self'}
                      rel={resource.type === 'external' ? 'noopener noreferrer' : undefined}
                      className={`inline-flex items-center ${tokens.spacing.gapSmall} px-2 py-1 ${tokens.typography.small} ${tokens.colors.neutral.bgWhite} ${tokens.colors.info.border} ${tokens.borders.rounded} ${tokens.colors.info.hover} ${tokens.effects.hoverBorder} ${tokens.effects.focusRing} ${tokens.transitions.default}`
                        .trim()
                        .replace(/\s+/g, ' ')}
                    >
                      {resource.text}
                      {resource.type === 'external' && (
                        <ArrowTopRightOnSquareIcon className={tokens.icons.xs} aria-hidden="true" />
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
          <div
            className={`w-full max-w-md ${tokens.colors.info.bg} ${tokens.colors.info.border} ${tokens.borders.roundedLg} p-4`}
          >
            <div className={`flex items-start ${tokens.spacing.gapSmall}`}>
              <svg
                className={`${tokens.icons.md} ${tokens.colors.info.icon} shrink-0 mt-0.5`}
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
                <h3
                  className={`${tokens.typography.small} ${tokens.typography.semibold} ${tokens.colors.info.textStrong} ${tokens.spacing.marginSmall}`}
                >
                  How to reduce your CV size:
                </h3>
                <ul
                  className={`${tokens.spacing.gapSmall} ${tokens.typography.small} ${tokens.colors.info.text} list-disc list-inside`}
                >
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
          <div
            className={`w-full max-w-md ${tokens.colors.warning.bg} ${tokens.colors.warning.border} ${tokens.borders.roundedLg} p-4`}
          >
            <div className={`flex items-start ${tokens.spacing.gapSmall}`}>
              <ExclamationTriangleIcon
                className={`${tokens.icons.md} ${tokens.colors.warning.icon} shrink-0 mt-0.5`}
                aria-hidden="true"
              />
              <div className="flex-1">
                <h3
                  className={`${tokens.typography.small} ${tokens.typography.semibold} ${tokens.colors.warning.textStrong} ${tokens.spacing.marginSmall}`}
                >
                  Multiple retry attempts detected
                </h3>
                <p
                  className={`${tokens.typography.small} ${tokens.colors.warning.text} leading-relaxed`}
                >
                  You&apos;ve tried {retryAttempt} times with the same error. Before retrying again,
                  please:
                </p>
                <ul
                  className={`${tokens.spacing.marginSmall} ${tokens.spacing.gapSmall} ${tokens.typography.small} ${tokens.colors.warning.text} list-disc list-inside`}
                >
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
          <div
            className={`w-full max-w-md ${tokens.colors.neutral.bg} ${tokens.borders.default} ${tokens.borders.roundedLg} p-3`}
          >
            <div className={`flex items-start ${tokens.spacing.gapSmall}`}>
              <svg
                className={`${tokens.icons.sm} ${tokens.colors.neutral.textMuted} shrink-0 mt-0.5`}
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
                <p
                  className={`${tokens.typography.small} ${tokens.typography.medium} ${tokens.colors.neutral.textMuted} ${tokens.spacing.marginSmall}`}
                >
                  Previous attempt (#
                  {retryAttempt}
                  ):
                </p>
                <p className={`${tokens.typography.small} ${tokens.colors.neutral.textMuted}`}>
                  {lastError}
                </p>
              </div>
            </div>
          </div>
        )}
      </>
    );
  },
);
