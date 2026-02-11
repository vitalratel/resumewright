// ABOUTME: Collapsible instructions card for getting TSX files from Claude.ai.
// ABOUTME: Auto-minimizes after 3 launches using localStorage tracking.

import {
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineInformationCircle,
} from 'solid-icons/hi';
import { Show } from 'solid-js';
import { createLocalStorage } from '../../reactivity/storage';
import { LocalStorageKeys } from '../../utils/localStorage';
import { TSX } from '../common/TechTerm';

const AUTO_MINIMIZE_AFTER_LAUNCHES = 3;

/**
 * ImportInfoCard - Instructions for getting TSX file from Claude.ai
 *
 * Features:
 * - Collapsible card with minimize/expand
 * - Auto-minimize after 3 launches
 * - Launch count tracking in localStorage
 * - Accessible labels and ARIA
 */
export function ImportInfoCard() {
  // Info card minimize functionality
  // Namespaced localStorage keys to prevent conflicts
  const { value: infoCardMinimized, setValue: setInfoCardMinimized } = createLocalStorage(
    LocalStorageKeys.INFO_CARD_MINIMIZED,
    false,
  );
  const { value: launchCount, setValue: setLaunchCount } = createLocalStorage(
    LocalStorageKeys.LAUNCH_COUNT,
    0,
  );

  // Increment launch count and auto-minimize on construction (runs once)
  const initialCount = launchCount();
  const wasMinimized = infoCardMinimized();
  const newCount = initialCount + 1;
  setLaunchCount(newCount);

  if (newCount >= AUTO_MINIMIZE_AFTER_LAUNCHES && !wasMinimized) {
    setInfoCardMinimized(true);
  }

  return (
    <Show
      when={!infoCardMinimized()}
      fallback={
        <div class="px-4">
          <button
            type="button"
            onClick={() => setInfoCardMinimized(false)}
            class="flex items-center gap-2 text-sm text-link hover:text-link-hover hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-md transition-all duration-300"
            aria-label="Show instructions for getting TSX file from Claude.ai"
          >
            <HiOutlineInformationCircle class="w-4 h-4" aria-hidden="true" />
            <span>
              Get
              <TSX /> from Claude.ai
            </span>
            <HiOutlineChevronDown class="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      }
    >
      <div class="bg-muted border border-border rounded-md px-3 py-1.5">
        <div class="flex items-start justify-between">
          <div class="flex items-start gap-2 flex-1">
            <HiOutlineInformationCircle
              class="w-4 h-4 text-muted-foreground shrink-0"
              aria-hidden="true"
            />
            <div class="flex-1">
              <h2 class="text-sm font-medium text-foreground mb-2">
                Get <TSX /> from Claude.ai
              </h2>
              <ol class="text-xs text-muted-foreground space-y-2 list-decimal list-inside">
                <li>
                  Ask Claude to create your CV in
                  <TSX /> format
                </li>
                <li>
                  Copy the
                  <TSX /> code from Claude&apos;s response
                </li>
                <li>Save it as a .tsx file on your computer</li>
                <li>Import that file here to convert to PDF</li>
              </ol>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setInfoCardMinimized(true)}
            class="text-link hover:text-link-hover hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-md mb-2 shrink-0"
            aria-label="Hide instructions for getting TSX file from Claude.ai"
          >
            <HiOutlineChevronUp class="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </Show>
  );
}
