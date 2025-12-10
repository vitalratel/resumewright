/**
 * Reset Confirmation Modal Component
 * Show current values before reset
 *
 * Displays a confirmation dialog when user attempts to reset settings,
 * showing the current values that will be lost.
 */

import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useRef } from 'react';
import type { UserSettings } from '@/shared/types/settings';
import { Modal } from './common/Modal';

interface ResetConfirmationModalProps {
  currentSettings: UserSettings;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ResetConfirmationModal = React.memo(
  ({ currentSettings, onConfirm, onCancel }: ResetConfirmationModalProps) => {
    const cancelButtonRef = useRef<HTMLButtonElement>(null);
    const { pageSize, margin } = currentSettings.defaultConfig;

    // Focus Cancel button when modal opens (safe default for destructive action)
    useEffect(() => {
      cancelButtonRef.current?.focus();
    }, []);

    // Compare current values with defaults to highlight only changes
    const defaultPageSize = 'Letter';
    const defaultMargin = { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 };

    const pageSizeChanged = pageSize !== defaultPageSize;
    const marginTopChanged = margin.top !== defaultMargin.top;
    const marginBottomChanged = margin.bottom !== defaultMargin.bottom;
    const marginLeftChanged = margin.left !== defaultMargin.left;
    const marginRightChanged = margin.right !== defaultMargin.right;
    const anyMarginChanged =
      marginTopChanged || marginBottomChanged || marginLeftChanged || marginRightChanged;

    return (
      <Modal
        isOpen={true}
        onClose={onCancel}
        ariaLabelledBy="reset-modal-title"
        ariaDescribedBy="reset-modal-description"
      >
        <div className="p-6 space-y-4">
          {/* Header with warning icon */}
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon
              className="w-6 h-6 text-icon-warning shrink-0 mt-1"
              aria-hidden="true"
            />
            <div className="flex-1">
              <h2 id="reset-modal-title" className="text-lg font-semibold text-foreground">
                Reset Settings to Defaults?
              </h2>
              <p id="reset-modal-description" className="text-base text-muted-foreground mb-3">
                This will discard your current settings and restore defaults.
              </p>
            </div>
          </div>

          {/* Current values preview - Only show changed values */}
          <div className="bg-muted border border-border rounded-md p-4 gap-3 flex flex-col">
            <p className="text-sm font-medium text-foreground">
              {pageSizeChanged || anyMarginChanged
                ? 'Settings that will change:'
                : 'No custom settings to reset'}
            </p>

            {(pageSizeChanged || anyMarginChanged) && (
              <div className="gap-2 text-sm flex flex-col">
                {pageSizeChanged && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Page Size:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-warning-foreground font-semibold">
                        {pageSize}
                      </span>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-medium text-foreground">{defaultPageSize}</span>
                    </div>
                  </div>
                )}

                {anyMarginChanged && (
                  <div className="gap-2">
                    <span className="text-muted-foreground block">Margins:</span>
                    <div className="ml-4 gap-2">
                      {marginTopChanged && (
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Top:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-warning-foreground font-semibold font-mono">
                              {margin.top}
                              &quot;
                            </span>
                            <span className="text-muted-foreground">→</span>
                            <span className="font-medium text-foreground font-mono">
                              {defaultMargin.top}
                              &quot;
                            </span>
                          </div>
                        </div>
                      )}
                      {marginBottomChanged && (
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Bottom:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-warning-foreground font-semibold font-mono">
                              {margin.bottom}
                              &quot;
                            </span>
                            <span className="text-muted-foreground">→</span>
                            <span className="font-medium text-foreground font-mono">
                              {defaultMargin.bottom}
                              &quot;
                            </span>
                          </div>
                        </div>
                      )}
                      {marginLeftChanged && (
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Left:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-warning-foreground font-semibold font-mono">
                              {margin.left}
                              &quot;
                            </span>
                            <span className="text-muted-foreground">→</span>
                            <span className="font-medium text-foreground font-mono">
                              {defaultMargin.left}
                              &quot;
                            </span>
                          </div>
                        </div>
                      )}
                      {marginRightChanged && (
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Right:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-warning-foreground font-semibold font-mono">
                              {margin.right}
                              &quot;
                            </span>
                            <span className="text-muted-foreground">→</span>
                            <span className="font-medium text-foreground font-mono">
                              {defaultMargin.right}
                              &quot;
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <button
              ref={cancelButtonRef}
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-md hover:bg-muted hover:border-border-hover focus:outline-none focus:ring-2 focus:ring-ring-focus focus:ring-offset-2 ring-offset-ring-offset transition-all duration-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-warning-action hover:bg-warning-action-hover active:bg-warning-action-active rounded-md focus:outline-none focus:ring-2 focus:ring-ring-focus-warning focus:ring-offset-2 ring-offset-ring-offset transition-all duration-300"
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      </Modal>
    );
  },
);
