/**
 * Hook for error suggestions and size reduction tips
 * Extracted from ErrorState component for reusability
 */

import type { PrioritizedSuggestion } from '@/shared/errors/presentation/suggestions';
import type { ConversionError } from '@/shared/types/models';
import { useMemo } from 'react';
import { getSizeReductionTips, prioritizeSuggestions } from '@/shared/errors/presentation/suggestions';
import { ErrorCode } from '@/shared/types/errors/';
import { isLocationErrorMetadata, isRetryErrorMetadata, isSizeErrorMetadata } from '@/shared/types/models/conversion';

interface ErrorSuggestionsData {
  prioritizedSuggestions: PrioritizedSuggestion[];
  sizeReductionTips: string[];
  retryAttempt: number;
  lastError: string | undefined;
  isSizeError: boolean;
}

/**
 * Calculate prioritized suggestions and size reduction tips
 *
 * Prioritize suggestions by success likelihood
 * Track retry attempts from metadata
 * Size-specific reduction tips
 */
export function useErrorSuggestions(error: ConversionError): ErrorSuggestionsData {
  // Extract retry metadata
  const retryAttempt = isRetryErrorMetadata(error.metadata) ? error.metadata.retryAttempt : 0;
  const lastError = isRetryErrorMetadata(error.metadata) ? error.metadata.lastError : undefined;

  // Check if this is a size error
  const isSizeError = error.code === ErrorCode.MEMORY_LIMIT_EXCEEDED;

  // Memoize expensive prioritization calculation
  const prioritizedSuggestions = useMemo(
    () => prioritizeSuggestions(
      error.code,
      error.suggestions,
      retryAttempt,
    ),
    [error.code, error.suggestions, retryAttempt],
  );

  // Memoize size reduction tips calculation
  const sizeReductionTips = useMemo(
    () => {
      if (!isSizeError)
        return [];
      const metadata = isSizeErrorMetadata(error.metadata) || isLocationErrorMetadata(error.metadata)
        ? error.metadata
        : undefined;
      return getSizeReductionTips(metadata?.fileSize, metadata?.maxSize);
    },
    [isSizeError, error.metadata],
  );

  return {
    prioritizedSuggestions,
    sizeReductionTips,
    retryAttempt,
    lastError,
    isSizeError,
  };
}
