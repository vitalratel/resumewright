// ABOUTME: Displays prioritized error recovery suggestions with help links.
// ABOUTME: Shows success likelihood badges, rationales, and retry warnings.

import { HiOutlineArrowTopRightOnSquare, HiOutlineExclamationTriangle } from 'solid-icons/hi';
import { For, Show } from 'solid-js';
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
 * Displays actionable recovery suggestions with priority
 */
export function ErrorSuggestions(props: ErrorSuggestionsProps) {
  const helpResources = () => getHelpResourcesForError(props.error.code);

  return (
    <>
      {/* Main Suggestions */}
      <Show when={props.prioritizedSuggestions.length > 0}>
        <div
          class="w-full max-w-md bg-info/10 border border-info/20 rounded-lg p-4"
          data-testid="error-suggestions"
        >
          <h2 class="text-sm font-semibold text-info-foreground mb-3 flex items-center">
            <svg
              class="w-5 h-5 mr-1.5 shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clip-rule="evenodd"
              />
            </svg>
            What you can try:
          </h2>
          <ol class="space-y-4 md:space-y-6 text-sm">
            <For each={props.prioritizedSuggestions}>
              {(suggestion, idx) => {
                const helpLink = () => getHelpLinkForSuggestion(suggestion.text);
                return (
                  <li class="flex items-start">
                    <span class="text-info mb-3 mt-0.5 shrink-0 font-semibold">{idx() + 1}.</span>
                    <div class="flex-1">
                      <div class="flex items-start gap-2">
                        <span class="leading-snug text-foreground">{suggestion.text}</span>
                        <Show when={suggestion.mostLikely}>
                          <span class="inline-flex items-center px-2 py-0.5 rounded-md text-sm font-semibold bg-success/10 text-success border border-success/20 shrink-0">
                            Most likely
                          </span>
                        </Show>
                      </div>
                      <Show when={helpLink()}>
                        {(link) => (
                          <a
                            href={link().url}
                            target={link().type === 'external' ? '_blank' : '_self'}
                            rel={link().type === 'external' ? 'noopener noreferrer' : undefined}
                            class="inline-flex items-center gap-1 mb-3 text-sm text-primary hover:text-primary/80 underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background rounded-md px-1 transition-colors"
                            aria-label={`Learn more: ${link().text}`}
                          >
                            {link().text}
                            <Show when={link().type === 'external'}>
                              <HiOutlineArrowTopRightOnSquare class="w-5 h-5" aria-hidden="true" />
                            </Show>
                            <Show when={link().type === 'internal'}>
                              <span aria-hidden="true">→</span>
                            </Show>
                          </a>
                        )}
                      </Show>
                      <Show when={suggestion.rationale}>
                        <div class="mb-3 text-sm text-info italic">Why: {suggestion.rationale}</div>
                      </Show>
                    </div>
                  </li>
                );
              }}
            </For>
          </ol>
          <Show when={helpResources().length > 0}>
            <div class="mt-4 pt-3 border-t border-info/20">
              <p class="text-sm font-medium text-foreground mb-3">Additional resources:</p>
              <div class="flex flex-wrap gap-2">
                <For each={helpResources()}>
                  {(resource) => (
                    <a
                      href={resource.url}
                      target={resource.type === 'external' ? '_blank' : '_self'}
                      rel={resource.type === 'external' ? 'noopener noreferrer' : undefined}
                      class="inline-flex items-center gap-2 px-2 py-1 text-sm bg-card border border-info/20 rounded-md hover:bg-muted hover:border-border focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background transition-colors"
                    >
                      {resource.text}
                      <Show when={resource.type === 'external'}>
                        <HiOutlineArrowTopRightOnSquare class="w-4 h-4" aria-hidden="true" />
                      </Show>
                    </a>
                  )}
                </For>
              </div>
            </div>
          </Show>
        </div>
      </Show>

      {/* Size-specific reduction guidance */}
      <Show when={props.isSizeError && props.sizeReductionTips.length > 0}>
        <div class="w-full max-w-md bg-info/10 border border-info/20 rounded-lg p-4">
          <div class="flex items-start gap-2">
            <svg
              class="w-6 h-6 text-info shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clip-rule="evenodd"
              />
            </svg>
            <div class="flex-1">
              <h3 class="text-sm font-semibold text-foreground mb-3">
                How to reduce your CV size:
              </h3>
              <ul class="gap-2 text-sm text-info list-disc list-inside">
                <For each={props.sizeReductionTips}>
                  {(tip) => <li class="leading-relaxed">{tip}</li>}
                </For>
              </ul>
            </div>
          </div>
        </div>
      </Show>

      {/* Intelligent Retry Warning */}
      <Show when={props.retryAttempt >= 3 && props.error.recoverable}>
        <div class="w-full max-w-md bg-warning/10 border border-warning/20 rounded-lg p-4">
          <div class="flex items-start gap-2">
            <HiOutlineExclamationTriangle
              class="w-6 h-6 text-warning shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div class="flex-1">
              <h3 class="text-sm font-semibold text-warning-foreground mb-3">
                Multiple retry attempts detected
              </h3>
              <p class="text-sm text-warning leading-relaxed">
                You&apos;ve tried {props.retryAttempt} times with the same error. Before retrying
                again, please:
              </p>
              <ul class="mb-3 gap-2 text-sm text-warning list-disc list-inside">
                <li>Make a change to your CV or settings</li>
                <li>Try a different suggestion from the list above</li>
                <li>Consider reporting this issue if suggestions don&apos;t help</li>
              </ul>
            </div>
          </div>
        </div>
      </Show>

      {/* Previous Error Context */}
      <Show when={props.retryAttempt > 0 && props.lastError}>
        <div class="w-full max-w-md bg-muted border border-border rounded-lg p-3">
          <div class="flex items-start gap-2">
            <svg
              class="w-5 h-5 text-muted-foreground shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clip-rule="evenodd"
              />
            </svg>
            <div class="flex-1">
              <p class="text-sm font-medium text-muted-foreground mb-3">
                Previous attempt (#{props.retryAttempt}):
              </p>
              <p class="text-sm text-muted-foreground">{props.lastError}</p>
            </div>
          </div>
        </div>
      </Show>
    </>
  );
}
