/**
 * ImportInfoCard Component
 * Extracted from FileImport for single responsibility
 *
 * Displays collapsible instructions for getting TSX file from Claude.ai.
 * Auto-minimizes after 3 launches using localStorage.
 */

import { ChevronDownIcon, ChevronUpIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import React, { useEffect } from 'react';
import { useLocalStorage } from '../../hooks';
import { tokens } from '../../styles/tokens';
import { LocalStorageKeys } from '../../utils/localStorage';
import { TSX } from '../common';

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
export const ImportInfoCard = React.memo(() => {
  // Info card minimize functionality
  // Namespaced localStorage keys to prevent conflicts
  const [infoCardMinimized, setInfoCardMinimized] = useLocalStorage(
    LocalStorageKeys.INFO_CARD_MINIMIZED,
    false,
  );
  const [, setLaunchCount] = useLocalStorage(LocalStorageKeys.LAUNCH_COUNT, 0);

  // Auto-minimize after 3 launches
  // Combined into single useEffect
  useEffect(() => {
    // Increment launch count
    setLaunchCount((count) => {
      const newCount = count + 1;

      // Auto-minimize if reached threshold
      if (newCount >= AUTO_MINIMIZE_AFTER_LAUNCHES && !infoCardMinimized) {
        setInfoCardMinimized(true);
      }

      return newCount;
    });
  }, [setLaunchCount, infoCardMinimized, setInfoCardMinimized]);

  if (infoCardMinimized) {
    return (
      <div className={tokens.spacing.paddingX}>
        <button
          type="button"
          onClick={() => setInfoCardMinimized(false)}
          className={`flex items-center ${tokens.spacing.gapSmall} ${tokens.typography.small} ${tokens.colors.primary.text} ${tokens.colors.primary.hover.replace('hover:bg-', 'hover:text-')} ${tokens.effects.focusRing} ${tokens.borders.rounded} ${tokens.transitions.default}`}
          aria-label="Show instructions for getting TSX file from Claude.ai"
        >
          <InformationCircleIcon className={tokens.icons.sm} aria-hidden="true" />
          <span>
            Get
            <TSX />
            {' '}
            from Claude.ai
          </span>
          <ChevronDownIcon className={tokens.icons.sm} aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-gray-50 border-gray-200 ${tokens.borders.default} ${tokens.borders.rounded} ${tokens.spacing.alert}`}>
      <div className="flex items-start justify-between">
        <div className={`flex items-start ${tokens.spacing.gapSmall} flex-1`}>
          <InformationCircleIcon className={`${tokens.icons.sm} ${tokens.colors.neutral.textMuted} flex-shrink-0`} aria-hidden="true" />
          <div className="flex-1">
            <h3 className={`${tokens.typography.small} ${tokens.typography.medium} ${tokens.colors.neutral.text} ${tokens.spacing.marginSmall}`}>
              Get
              {' '}
              <TSX />
              {' '}
              from Claude.ai
            </h3>
            <ol className={`${tokens.typography.xs} ${tokens.colors.neutral.textMuted} ${tokens.spacing.gapSmall} list-decimal list-inside`}>
              <li>
                Ask Claude to create your CV in
                <TSX />
                {' '}
                format
              </li>
              <li>
                Copy the
                <TSX />
                {' '}
                code from Claude&apos;s response
              </li>
              <li>Save it as a .tsx file on your computer</li>
              <li>Import that file here to convert to PDF</li>
            </ol>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setInfoCardMinimized(true)}
          className={`${tokens.colors.primary.text} ${tokens.colors.primary.hover.replace('hover:bg-', 'hover:text-')} ${tokens.effects.focusRing} ${tokens.borders.rounded} ${tokens.spacing.marginSmall} flex-shrink-0`}
          aria-label="Hide instructions for getting TSX file from Claude.ai"
        >
          <ChevronUpIcon className={tokens.icons.sm} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
});
