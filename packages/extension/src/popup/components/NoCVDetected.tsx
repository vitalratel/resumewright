/**
 * No CV Detected State Component
 *
 * Displays a placeholder state when no CV is detected on Claude.ai.
 * Provides guidance to users on how to create a CV.
 *
 * Design: docs/design/design-system.md State 1
 */

import { DocumentTextIcon } from '@heroicons/react/24/outline';
import React from 'react';
import { tokens } from '../styles/tokens';

export const NoCVDetected = React.memo(() => {
  return (
    <div className={`w-full h-full ${tokens.colors.neutral.bg} ${tokens.spacing.card} flex flex-col items-center justify-center ${tokens.spacing.heroSpacing}`}>
      {/* Document Icon - 64px gray-400 */}
      {/* Use custom size for large hero icons, not in standard token set */}
      <DocumentTextIcon className={`${tokens.icons.xxl} ${tokens.colors.neutral.icon}`} aria-hidden="true" />

      {/* Heading - H1 style */}
      <h1 className={`${tokens.typography.heroHeading} ${tokens.colors.neutral.text} text-center`}>
        No CV Detected
      </h1>

      {/* Description - Body style */}
      <p className={`${tokens.typography.base} ${tokens.colors.neutral.textMuted} text-center max-w-xs`}>
        Visit claude.ai and generate a CV to get started.
      </p>

      {/* Help Link - Text link style */}
      <a
        href="https://claude.ai"
        target="_blank"
        rel="noopener noreferrer"
        className={`${tokens.typography.small} ${tokens.colors.link.text} ${tokens.colors.link.hover} ${tokens.colors.link.hoverUnderline} ${tokens.effects.focusRing}`}
      >
        How to create a CV with Claude
      </a>
    </div>
  );
});
