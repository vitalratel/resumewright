/**
 * CV Detected State Component
 *
 * Displays a success state when a CV is detected from Claude.ai,
 * showing CV name, role, and export options.
 *
 * Design: docs/design/design-system.md State 2
 */

import { CheckCircleIcon } from '@heroicons/react/24/outline';
import React from 'react';
import { CV_DEFAULTS } from '../../constants/app';
import { tokens } from '../../styles/tokens';
import { Button } from '../common/Button';

interface CVDetectedProps {
  cvName?: string;
  cvRole?: string;
  onExport: () => void;
  onOpenSettings?: () => void;
}

// Use constants instead of hardcoded defaults
export const CVDetected = React.memo(({ cvName = CV_DEFAULTS.name, cvRole = CV_DEFAULTS.role, onExport, onOpenSettings }: CVDetectedProps) => {
  return (
    <div className={`w-full h-full ${tokens.colors.neutral.bgWhite} p-6 flex flex-col items-center justify-center space-y-4`}>
      {/* Success Checkmark Icon - 48px green-500 */}
      {/* Consistent icon sizing using tokens */}
      <CheckCircleIcon className={`${tokens.icons.hero} ${tokens.colors.success.icon}`} aria-hidden="true" />

      {/* Heading - H1 style */}
      <h1 className={`${tokens.typography.large} ${tokens.typography.bold} tracking-tight ${tokens.colors.neutral.text} text-center`}>
        CV Detected!
      </h1>

      {/* CV Preview - Body style, truncated to 2 lines */}
      <p
        className={`${tokens.typography.small} ${tokens.colors.neutral.textMuted} text-center max-w-xs line-clamp-2`}
        data-testid="cv-preview"
      >
        {cvName} - {cvRole}
      </p>

      {/* Primary Action Button */}
      <Button
        onClick={onExport}
        aria-label="Export CV to PDF"
        data-testid="export-button"
      >
        Export to PDF
      </Button>

      {/* Secondary Link - P1-INTERACT-013, Use Button component with link variant */}
      <Button
        onClick={onOpenSettings}
        variant="link"
        aria-label="Customize settings"
      >
        Customize settings
      </Button>
    </div>
  );
});
