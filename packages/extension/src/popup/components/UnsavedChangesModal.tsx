// ABOUTME: Warning modal shown when user tries to navigate away with unsaved changes.
// ABOUTME: Provides Save, Discard, and Cancel options for settings protection.

import { HiOutlineExclamationTriangle } from 'solid-icons/hi';
import { Modal } from './common/Modal';

interface UnsavedChangesModalProps {
  /** Save changes and continue navigation */
  onSave: () => void;

  /** Discard changes and continue navigation */
  onDiscard: () => void;

  /** Cancel navigation and stay on settings */
  onCancel: () => void;
}

export function UnsavedChangesModal(props: UnsavedChangesModalProps) {
  return (
    <Modal
      isOpen={true}
      onClose={props.onCancel}
      ariaLabelledBy="unsaved-modal-title"
      ariaDescribedBy="unsaved-modal-description"
    >
      <div class="p-6 space-y-4">
        {/* Icon and Title */}
        <div class="flex items-start gap-3">
          <div class="shrink-0 w-12 h-12 bg-warning rounded-full flex items-center justify-center">
            <HiOutlineExclamationTriangle
              class="w-8 h-8 text-warning-foreground"
              aria-hidden="true"
            />
          </div>
          <div class="flex-1 pt-1">
            <h2 id="unsaved-modal-title" class="text-base font-semibold text-foreground">
              You have unsaved changes
            </h2>
            <p id="unsaved-modal-description" class="mb-3 text-sm text-muted-foreground">
              Do you want to save your settings before leaving?
            </p>
          </div>
        </div>

        {/* Actions */}
        <div class="gap-2 flex flex-col pt-2">
          {/* Primary: Save & Continue */}
          <button
            type="button"
            onClick={props.onSave}
            class="w-full bg-success hover:bg-success/90 active:bg-success/80 text-success-foreground px-4 py-2.5 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background"
            aria-label="Save changes and go back"
          >
            Save & Continue
          </button>

          {/* Secondary: Discard Changes */}
          <button
            type="button"
            onClick={props.onDiscard}
            class="w-full bg-background border border-border hover:bg-muted text-muted-foreground px-4 py-2.5 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background"
            aria-label="Discard changes and go back"
          >
            Discard Changes
          </button>

          {/* Tertiary: Cancel */}
          <button
            type="button"
            onClick={props.onCancel}
            class="w-full text-muted-foreground hover:text-foreground px-4 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background rounded-md"
            aria-label="Cancel and stay on settings"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}
