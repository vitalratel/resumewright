/**
 * MarginPresetsRadio Component
 *
 * Quick Settings Panel - Margin Presets
 * Added compact and spacious presets
 *
 * Provides radio button group for selecting margin presets.
 * Used in QuickSettings panel for quick access to common margin configurations.
 */

import { memo } from 'react';
import { tokens } from '../../styles/tokens';

type MarginPreset = 'compact' | 'narrow' | 'normal' | 'wide' | 'spacious' | 'custom';
type MarginPresetExcludingCustom = Exclude<MarginPreset, 'custom'>;

interface MarginPresetsRadioProps {
  /** Currently selected margin preset */
  value: MarginPreset;

  /** Callback when margin preset changes (excludes 'custom' since it's set via CustomMarginInputs) */
  onChange: (preset: MarginPresetExcludingCustom) => void;
}

/**
 * MarginPresetsRadio - Radio button group for margin preset selection
 *
 * Provides accessible radio group with descriptions for each preset.
 * Includes custom option that is checked but non-interactive (managed by parent).
 */
export const MarginPresetsRadio = memo(({
  value,
  onChange,
}: MarginPresetsRadioProps) => {
  const presets: ReadonlyArray<{
    value: MarginPresetExcludingCustom;
    label: string;
    description: string;
  }> = [
    { value: 'compact', label: 'Compact', description: '(0.5" all sides)' },
    { value: 'narrow', label: 'Narrow', description: '(0.5" top/bottom, 0.625" sides)' },
    { value: 'normal', label: 'Normal', description: '(0.75" all sides)' },
    { value: 'wide', label: 'Wide', description: '(1.0" all sides)' },
    { value: 'spacious', label: 'Spacious', description: '(1.25" all sides)' },
  ];

  return (
    <fieldset aria-label="Margin presets">
      <legend className={`${tokens.typography.xs} ${tokens.typography.semibold} ${tokens.colors.neutral.text} ${tokens.spacing.marginSmall} block`}>
        Margins
      </legend>
      <div className={tokens.spacing.gapSmall}>
        {presets.map(({ value: presetValue, label, description }) => (
          <label
            key={presetValue}
            className={`flex items-center ${tokens.spacing.gapSmall} cursor-pointer ${tokens.colors.neutral.hover} p-1.5 ${tokens.borders.rounded} ${tokens.transitions.default}`}
          >
            {/* Enhanced radio button focus visibility */}
            <input
              type="radio"
              name="margin-preset"
              value={presetValue}
              checked={value === presetValue}
              onChange={() => onChange(presetValue)}
              className={`${tokens.icons.xs} ${tokens.colors.primary.text} ${tokens.effects.focusRingEnhanced} cursor-pointer`}
            />
            <span className={`${tokens.typography.small} ${tokens.colors.neutral.text} flex-1`}>
              {label}
              {' '}
              <span className={tokens.colors.neutral.textMuted}>{description}</span>
            </span>
          </label>
        ))}

        {/* Custom preset radio - checked when value is 'custom' but not interactive */}
        <label className={`flex items-center ${tokens.spacing.gapSmall} cursor-pointer ${tokens.colors.neutral.hover} p-1.5 ${tokens.borders.rounded} ${tokens.transitions.default}`}>
          {/* Enhanced radio button focus visibility */}
          <input
            type="radio"
            name="margin-preset"
            value="custom"
            checked={value === 'custom'}
            onChange={() => {}}
            className={`${tokens.icons.xs} ${tokens.colors.primary.text} ${tokens.effects.focusRingEnhanced} cursor-pointer`}
          />
          <span className={`${tokens.typography.small} ${tokens.colors.neutral.text} flex-1`}>Custom</span>
        </label>
      </div>
    </fieldset>
  );
});
