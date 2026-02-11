// ABOUTME: Confirmation dialog before resetting settings to defaults.
// ABOUTME: Shows current values that will change with before/after comparison.

import { HiOutlineExclamationTriangle } from 'solid-icons/hi';
import { onMount, Show } from 'solid-js';
import type { UserSettings } from '@/shared/types/settings';
import { Modal } from './common/Modal';

interface ResetConfirmationModalProps {
  currentSettings: UserSettings;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ResetConfirmationModal(props: ResetConfirmationModalProps) {
  let cancelButtonRef: HTMLButtonElement | undefined;

  const pageSize = () => props.currentSettings.defaultConfig.pageSize;
  const margin = () => props.currentSettings.defaultConfig.margin;

  // Focus Cancel button when modal opens (safe default for destructive action)
  onMount(() => {
    cancelButtonRef?.focus();
  });

  // Compare current values with defaults to highlight only changes
  const defaultPageSize = 'Letter';
  const defaultMargin = { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 };

  const pageSizeChanged = () => pageSize() !== defaultPageSize;
  const marginTopChanged = () => margin().top !== defaultMargin.top;
  const marginBottomChanged = () => margin().bottom !== defaultMargin.bottom;
  const marginLeftChanged = () => margin().left !== defaultMargin.left;
  const marginRightChanged = () => margin().right !== defaultMargin.right;
  const anyMarginChanged = () =>
    marginTopChanged() || marginBottomChanged() || marginLeftChanged() || marginRightChanged();

  return (
    <Modal
      isOpen={true}
      onClose={props.onCancel}
      ariaLabelledBy="reset-modal-title"
      ariaDescribedBy="reset-modal-description"
    >
      <div class="p-6 space-y-4">
        {/* Header with warning icon */}
        <div class="flex items-start gap-3">
          <HiOutlineExclamationTriangle
            class="w-6 h-6 text-icon-warning shrink-0 mt-1"
            aria-hidden="true"
          />
          <div class="flex-1">
            <h2 id="reset-modal-title" class="text-lg font-semibold text-foreground">
              Reset Settings to Defaults?
            </h2>
            <p id="reset-modal-description" class="text-base text-muted-foreground mb-3">
              This will discard your current settings and restore defaults.
            </p>
          </div>
        </div>

        {/* Current values preview - Only show changed values */}
        <div class="bg-muted border border-border rounded-md p-4 gap-3 flex flex-col">
          <p class="text-sm font-medium text-foreground">
            {pageSizeChanged() || anyMarginChanged()
              ? 'Settings that will change:'
              : 'No custom settings to reset'}
          </p>

          <Show when={pageSizeChanged() || anyMarginChanged()}>
            <div class="gap-2 text-sm flex flex-col">
              <Show when={pageSizeChanged()}>
                <div class="flex justify-between items-center">
                  <span class="text-muted-foreground">Page Size:</span>
                  <div class="flex items-center gap-2">
                    <span class="text-warning-foreground font-semibold">{pageSize()}</span>
                    <span class="text-muted-foreground">→</span>
                    <span class="font-medium text-foreground">{defaultPageSize}</span>
                  </div>
                </div>
              </Show>

              <Show when={anyMarginChanged()}>
                <div class="gap-2">
                  <span class="text-muted-foreground block">Margins:</span>
                  <div class="ml-4 gap-2">
                    <Show when={marginTopChanged()}>
                      <div class="flex justify-between items-center">
                        <span class="text-muted-foreground">Top:</span>
                        <div class="flex items-center gap-2">
                          <span class="text-warning-foreground font-semibold font-mono">
                            {margin().top}
                            &quot;
                          </span>
                          <span class="text-muted-foreground">→</span>
                          <span class="font-medium text-foreground font-mono">
                            {defaultMargin.top}
                            &quot;
                          </span>
                        </div>
                      </div>
                    </Show>
                    <Show when={marginBottomChanged()}>
                      <div class="flex justify-between items-center">
                        <span class="text-muted-foreground">Bottom:</span>
                        <div class="flex items-center gap-2">
                          <span class="text-warning-foreground font-semibold font-mono">
                            {margin().bottom}
                            &quot;
                          </span>
                          <span class="text-muted-foreground">→</span>
                          <span class="font-medium text-foreground font-mono">
                            {defaultMargin.bottom}
                            &quot;
                          </span>
                        </div>
                      </div>
                    </Show>
                    <Show when={marginLeftChanged()}>
                      <div class="flex justify-between items-center">
                        <span class="text-muted-foreground">Left:</span>
                        <div class="flex items-center gap-2">
                          <span class="text-warning-foreground font-semibold font-mono">
                            {margin().left}
                            &quot;
                          </span>
                          <span class="text-muted-foreground">→</span>
                          <span class="font-medium text-foreground font-mono">
                            {defaultMargin.left}
                            &quot;
                          </span>
                        </div>
                      </div>
                    </Show>
                    <Show when={marginRightChanged()}>
                      <div class="flex justify-between items-center">
                        <span class="text-muted-foreground">Right:</span>
                        <div class="flex items-center gap-2">
                          <span class="text-warning-foreground font-semibold font-mono">
                            {margin().right}
                            &quot;
                          </span>
                          <span class="text-muted-foreground">→</span>
                          <span class="font-medium text-foreground font-mono">
                            {defaultMargin.right}
                            &quot;
                          </span>
                        </div>
                      </div>
                    </Show>
                  </div>
                </div>
              </Show>
            </div>
          </Show>
        </div>

        {/* Action buttons */}
        <div class="flex gap-3 pt-2">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={() => props.onCancel()}
            class="flex-1 px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-md hover:bg-muted hover:border-border-hover focus:outline-none focus:ring-2 focus:ring-ring-focus focus:ring-offset-2 ring-offset-ring-offset transition-all duration-300"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => props.onConfirm()}
            class="flex-1 px-4 py-2 text-sm font-medium text-white bg-warning-action hover:bg-warning-action-hover active:bg-warning-action-active rounded-md focus:outline-none focus:ring-2 focus:ring-ring-focus-warning focus:ring-offset-2 ring-offset-ring-offset transition-all duration-300"
          >
            Reset to Defaults
          </button>
        </div>
      </div>
    </Modal>
  );
}
