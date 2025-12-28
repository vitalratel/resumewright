// ABOUTME: Collapsible instructions card for getting TSX files from Claude.ai.
// ABOUTME: Auto-minimizes after 3 launches using localStorage tracking.

import { ChevronDownIcon, ChevronUpIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { useEffect, useRef } from 'react';
import { useLocalStorage } from '../../hooks/integration/useLocalStorage';
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
  const [infoCardMinimized, setInfoCardMinimized] = useLocalStorage(
    LocalStorageKeys.INFO_CARD_MINIMIZED,
    false,
  );
  const [launchCount, setLaunchCount] = useLocalStorage(LocalStorageKeys.LAUNCH_COUNT, 0);

  // Capture initial values in refs to satisfy exhaustive-deps while running once
  const initialValuesRef = useRef({ launchCount, infoCardMinimized });
  const hasAutoMinimized = useRef(false);

  // Increment launch count and auto-minimize on mount only
  useEffect(() => {
    if (hasAutoMinimized.current) return;
    hasAutoMinimized.current = true;

    const { launchCount: initialCount, infoCardMinimized: wasMinimized } = initialValuesRef.current;
    const newCount = initialCount + 1;
    setLaunchCount(newCount);

    if (newCount >= AUTO_MINIMIZE_AFTER_LAUNCHES && !wasMinimized) {
      setInfoCardMinimized(true);
    }
  }, [setLaunchCount, setInfoCardMinimized]);

  if (infoCardMinimized) {
    return (
      <div className="px-4">
        <button
          type="button"
          onClick={() => setInfoCardMinimized(false)}
          className="flex items-center gap-2 text-sm text-link hover:text-link-hover hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-md transition-all duration-300"
          aria-label="Show instructions for getting TSX file from Claude.ai"
        >
          <InformationCircleIcon className="w-4 h-4" aria-hidden="true" />
          <span>
            Get
            <TSX /> from Claude.ai
          </span>
          <ChevronDownIcon className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-muted border border-border rounded-md px-3 py-1.5">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-2 flex-1">
          <InformationCircleIcon
            className="w-4 h-4 text-muted-foreground shrink-0"
            aria-hidden="true"
          />
          <div className="flex-1">
            <h2 className="text-sm font-medium text-foreground mb-2">
              Get <TSX /> from Claude.ai
            </h2>
            <ol className="text-xs text-muted-foreground space-y-2 list-decimal list-inside">
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
          className="text-link hover:text-link-hover hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-md mb-2 shrink-0"
          aria-label="Hide instructions for getting TSX file from Claude.ai"
        >
          <ChevronUpIcon className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
