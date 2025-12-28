// ABOUTME: Displays current conversion stage with icon, operation text, and ETA.
// ABOUTME: Supports multi-page progress tracking with debounced ETA updates.

import { useMemo } from 'react';
import { useDebounce } from 'use-debounce';
import type { ConversionStatus } from '../../../shared/types/models';
import {
  formatTimeRemaining,
  getStageDisplayName,
  getStageIcon,
} from '../../../shared/utils/progressCalculations';

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

export function ProgressStatus({
  stage,
  currentOperation,
  eta,
  pagesProcessed,
  totalPages,
}: ProgressStatusProps) {
  // Memoize stage calculations to prevent unnecessary lookups on every render
  const stageIcon = useMemo(() => getStageIcon(stage), [stage]);
  const stageDisplay = useMemo(() => getStageDisplayName(stage), [stage]);

  // Debounce ETA to prevent jumping when updates are rapid
  const [debouncedEta] = useDebounce(eta, 500);

  return (
    <div
      className="w-full gap-2 flex flex-col text-center"
      data-testid="progress-status"
      data-stage={stage}
    >
      <div className="flex items-center justify-center space-x-2">
        <span className="text-2xl" role="img" aria-label={stageDisplay}>
          {stageIcon}
        </span>
        <p className="text-sm font-medium text-foreground">{stageDisplay}</p>
      </div>

      <p className="text-base text-muted-foreground">{currentOperation}</p>

      {debouncedEta !== undefined && debouncedEta > 0 ? (
        <p className="text-xs text-muted-foreground">
          {formatTimeRemaining(debouncedEta)} remaining
        </p>
      ) : stage !== 'completed' && stage !== 'failed' && stage !== 'cancelled' ? (
        <p className="text-xs text-muted-foreground">Usually completes in 3-5 seconds</p>
      ) : null}

      {pagesProcessed !== undefined && totalPages !== undefined && totalPages > 1 && (
        <p className="text-xs text-muted-foreground">
          Page {pagesProcessed} of {totalPages}
        </p>
      )}
    </div>
  );
}
