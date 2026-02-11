// ABOUTME: Displays current conversion stage with icon, operation text, and ETA.
// ABOUTME: Supports multi-page progress tracking with debounced ETA updates.

import { createScheduled, debounce } from '@solid-primitives/scheduled';
import { createMemo, Show } from 'solid-js';
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

export function ProgressStatus(props: ProgressStatusProps) {
  const stageIcon = () => getStageIcon(props.stage);
  const stageDisplay = () => getStageDisplayName(props.stage);

  // Debounce ETA to prevent jumping when updates are rapid
  const scheduled = createScheduled((fn) => debounce(fn, 500));
  let initialized = false;
  const debouncedEta = createMemo<number | undefined>((prev) => {
    const value = props.eta;
    const ready = scheduled();
    if (!initialized) {
      initialized = true;
      return value;
    }
    return ready ? value : prev;
  });

  return (
    <div
      class="w-full gap-2 flex flex-col text-center"
      data-testid="progress-status"
      data-stage={props.stage}
    >
      <div class="flex items-center justify-center space-x-2">
        <span class="text-2xl" role="img" aria-label={stageDisplay()}>
          {stageIcon()}
        </span>
        <p class="text-sm font-medium text-foreground">{stageDisplay()}</p>
      </div>

      <p class="text-base text-muted-foreground">{props.currentOperation}</p>

      <Show
        when={debouncedEta() !== undefined && debouncedEta()! > 0}
        fallback={
          <Show
            when={
              props.stage !== 'completed' && props.stage !== 'failed' && props.stage !== 'cancelled'
            }
          >
            <p class="text-xs text-muted-foreground">Usually completes in 3-5 seconds</p>
          </Show>
        }
      >
        <p class="text-xs text-muted-foreground">
          {formatTimeRemaining(debouncedEta()!)} remaining
        </p>
      </Show>

      <Show
        when={
          props.pagesProcessed !== undefined &&
          props.totalPages !== undefined &&
          props.totalPages! > 1
        }
      >
        <p class="text-xs text-muted-foreground">
          Page {props.pagesProcessed} of {props.totalPages}
        </p>
      </Show>
    </div>
  );
}
