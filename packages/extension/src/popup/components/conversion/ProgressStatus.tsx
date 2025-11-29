/**
 * ProgressStatus Component
 *
 * Displays current conversion stage with icon, operation text, and ETA.
 * Includes support for multi-page progress tracking and debounced ETA updates.
 */

import type { ConversionStatus } from '../../../shared/types/models';
import React, { useMemo } from 'react';
import { formatTimeRemaining, getStageDisplayName, getStageIcon } from '../../../shared/utils/progressCalculations';
import { useDebounce } from '../../hooks/core';
import { tokens } from '../../styles/tokens';

interface ProgressStatusProps {
  /** Current conversion stage */
  stage: ConversionStatus;

  /** Human-readable description of current operation */
  currentOperation: string;

  /** Estimated time remaining in seconds (optional) */
  eta?: number;

  /** Pages processed (optional, for multi-page support) */
  pagesProcessed?: number;

  /** Total pages (optional, for multi-page support) */
  totalPages?: number;
}

export const ProgressStatus = React.memo(({
  stage,
  currentOperation,
  eta,
  pagesProcessed,
  totalPages,
}: ProgressStatusProps) => {
  // Memoize stage calculations to prevent unnecessary lookups on every render
  const stageIcon = useMemo(() => getStageIcon(stage), [stage]);
  const stageDisplay = useMemo(() => getStageDisplayName(stage), [stage]);

  // Debounce ETA to prevent jumping when updates are rapid
  // Use standard useDebounce hook instead of custom implementation
  const debouncedEta = useDebounce(eta, 500);

  return (
    <div className={`w-full ${tokens.spacing.gapSmall} flex flex-col text-center`} data-testid="progress-status" data-stage={stage}>
      {/* Stage icon and display name */}
      <div className="flex items-center justify-center space-x-2">
        <span className="text-2xl" role="img" aria-label={stageDisplay}>
          {stageIcon}
        </span>
        <p className={`${tokens.typography.small} ${tokens.typography.medium} ${tokens.colors.neutral.text}`}>{stageDisplay}</p>
      </div>

      {/* Current operation */}
      <p className={`${tokens.typography.base} ${tokens.colors.neutral.textMuted}`}>{currentOperation}</p>

      {/* ETA display (debounced) */}
      {debouncedEta !== undefined && debouncedEta > 0
        ? (
            <p className={`${tokens.typography.xs} ${tokens.colors.neutral.textMuted}`}>
              {formatTimeRemaining(debouncedEta)}
              {' '}
              remaining
            </p>
          )
        : stage !== 'completed' && stage !== 'failed' && stage !== 'cancelled'
          ? (
              <p className={`${tokens.typography.xs} ${tokens.colors.neutral.textMuted}`}>
                Usually completes in 3-5 seconds
              </p>
            )
          : null}

      {/* Page progress (multi-page support) */}
      {pagesProcessed !== undefined && totalPages !== undefined && totalPages > 1 && (
        <p className={`${tokens.typography.xs} ${tokens.colors.neutral.textMuted}`}>
          Page
          {' '}
          {pagesProcessed}
          {' '}
          of
          {' '}
          {totalPages}
        </p>
      )}
    </div>
  );
});
