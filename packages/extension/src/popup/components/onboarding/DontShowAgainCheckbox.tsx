/**
 * Don't Show Again Checkbox
 * Checkbox for onboarding completion preference
 */

import { memo } from 'react';
import { tokens } from '../../styles/tokens';

interface DontShowAgainCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const DontShowAgainCheckbox = memo(({
  checked,
  onChange,
}: DontShowAgainCheckboxProps) => {
  return (
    <div className="flex items-center justify-center">
      <label className={`flex items-center ${tokens.spacing.gapSmall} cursor-pointer ${tokens.typography.small} ${tokens.colors.neutral.textMuted} ${tokens.colors.link.hover}`}>
        <input
          type="checkbox"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
          className={`${tokens.icons.xs} ${tokens.colors.success.icon} ${tokens.colors.borders.default} ${tokens.borders.rounded} ${tokens.effects.focusRing}`}
        />
        <span>Don&apos;t show this again</span>
      </label>
    </div>
  );
});
