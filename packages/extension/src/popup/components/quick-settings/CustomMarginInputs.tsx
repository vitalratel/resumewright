/**
 * CustomMarginInputs Component
 *
 * Custom margin input controls
 *
 * Provides number inputs for custom margin values with validation.
 * Automatically clamps values to 0-2" range in 0.05" increments on blur.
 */

import type { PageSize } from '../../../shared/domain/pdf/constants';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { DEBOUNCE_DELAYS } from '../../constants/timings';
import { useDebounce } from '../../hooks/core/useDebounce';
import { tokens } from '../../styles/tokens';
import { MarginPreview } from '../MarginPreview';

type MarginSide = 'top' | 'right' | 'bottom' | 'left';

interface MarginValues {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface CustomMarginInputsProps {
  /** Current margin values in inches */
  values: MarginValues;

  /** Callback when a margin value changes */
  onChange: (side: MarginSide, value: number) => void;

  /** Page size for preview  */
  pageSize: PageSize;
}

/**
 * CustomMarginInputs - Number inputs for custom margin values
 *
 * Features:
 * - 4 inputs (top, right, bottom, left)
 * - Auto-rounding to 0.05" increments on blur
 * - Auto-clamping to 0-2" range
 * - Accessible labels and hints
 */
export const CustomMarginInputs = memo(({
  values,
  onChange,
  pageSize,
}: CustomMarginInputsProps) => {
  // Local state for immediate UI updates, debounced for storage
  // Using timing constant instead of magic number
  const [localValues, setLocalValues] = useState<MarginValues>(values);
  const debouncedValues = useDebounce(localValues, DEBOUNCE_DELAYS.MARGIN_INPUTS);

  // Track current input values for blur validation
  const currentValues = useRef<Record<MarginSide, number>>(values);

  // Track validation correction messages
  const [correctionMessage, setCorrectionMessage] = useState<string | null>(null);

  // Only call onChange after debounce, reducing chrome.storage writes
  useEffect(() => {
    const hasChanges = (Object.keys(debouncedValues) as MarginSide[]).some(
      side => debouncedValues[side] !== values[side],
    );
    if (hasChanges) {
      (Object.keys(debouncedValues) as MarginSide[]).forEach((side) => {
        if (debouncedValues[side] !== values[side]) {
          onChange(side, debouncedValues[side]);
        }
      });
    }
  }, [debouncedValues, onChange, values]);

  // Sync local state when external values change (outside of user input)
  // Queue state update asynchronously to avoid cascading renders
  const prevValuesRef = useRef(values);
  useEffect(() => {
    const externalChange = (Object.keys(values) as MarginSide[]).some(
      side => values[side] !== prevValuesRef.current[side],
    );
    if (externalChange) {
      // Queue update asynchronously to avoid synchronous setState in effect
      queueMicrotask(() => {
        setLocalValues(values);
      });
      prevValuesRef.current = values;
    }
  }, [values]);

  /**
   * Handle change event - update local state immediately for responsive UI
   * Show real-time feedback when value exceeds limits
   */
  const handleChange = useCallback(
    (side: MarginSide, value: number) => {
      currentValues.current[side] = value;
      setLocalValues(prev => ({ ...prev, [side]: value }));

      // Show immediate feedback if out of range
      if (value < 0 || value > 2) {
        const clamped = Math.max(0, Math.min(2, value));
        setCorrectionMessage(
          `Margin must be between 0-2". Value will be adjusted to ${clamped.toFixed(2)}" on blur.`,
        );
        // Clear message after 3s
        setTimeout(() => setCorrectionMessage(null), 3000);
      }
      else {
        // Clear any existing message when back in valid range
        setCorrectionMessage(null);
      }
    },
    [],
  );

  /**
   * Handle blur event - validate and clamp value
   * Rounds to nearest 0.05" increment and clamps to 0-2" range
   * Show feedback when value is corrected
   * Update local state, onChange will be called via debounce
   */
  const handleBlur = useCallback(
    (side: MarginSide) => {
      const value = currentValues.current[side];
      const rounded = Math.round(value / 0.05) * 0.05;
      const clamped = Math.max(0, Math.min(2, rounded));

      // Show feedback if value was corrected
      if (value !== clamped) {
        setCorrectionMessage(
          `Margin adjusted to ${clamped.toFixed(2)}" (range: 0-2", steps: 0.05")`,
        );
        setTimeout(() => setCorrectionMessage(null), 3000);

        // Update local state immediately, debounced onChange will handle persistence
        setLocalValues(prev => ({ ...prev, [side]: clamped }));
        currentValues.current[side] = clamped;
      }
    },
    [],
  );

  const sides: ReadonlyArray<{ key: MarginSide; label: string }> = [
    { key: 'top', label: 'Top' },
    { key: 'right', label: 'Right' },
    { key: 'bottom', label: 'Bottom' },
    { key: 'left', label: 'Left' },
  ];

  // Help text ID for aria-describedby
  const helpTextId = 'custom-margins-help';
  // P2-A11Y-002: Correction message ID for screen readers
  const correctionMessageId = 'custom-margins-correction';

  return (
    <div className={`mt-3 ${tokens.spacing.alert} ${tokens.colors.neutral.bg} ${tokens.borders.rounded} ${tokens.borders.default} ${tokens.colors.neutral.border} ${tokens.spacing.gapSmall}`}>
      {/* Validation feedback message */}
      {/* P2-A11Y-002: ID for aria-describedby to announce corrections to screen readers */}
      {(correctionMessage !== null && correctionMessage !== undefined && correctionMessage !== '') && (
        <div
          id={correctionMessageId}
          role="status"
          className={`${tokens.typography.xs} ${tokens.colors.info.text} ${tokens.colors.info.bg} px-2 py-1 ${tokens.borders.rounded} border ${tokens.colors.info.border}`}
        >
          {correctionMessage}
        </div>
      )}

      <div className={`grid grid-cols-2 ${tokens.spacing.gapSmall}`}>
        {sides.map(({ key, label }) => (
          <div key={key}>
            <label
              htmlFor={`margin-${key}`}
              className={`${tokens.typography.xs} ${tokens.colors.neutral.textMuted} block mb-1`}
            >
              {label}
              {' '}
              (in)
            </label>
            <input
              id={`margin-${key}`}
              type="number"
              min="0"
              max="2"
              step="0.05"
              value={localValues[key]}
              onChange={e => handleChange(key, Number.parseFloat(e.target.value) || 0)}
              onBlur={() => handleBlur(key)}
              aria-describedby={(correctionMessage !== null && correctionMessage !== undefined && correctionMessage !== '') ? `${helpTextId} ${correctionMessageId}` : helpTextId}
              aria-invalid={(correctionMessage !== null && correctionMessage !== undefined && correctionMessage !== '')}
              className={`w-full px-2 py-1.5 ${tokens.typography.small} ${tokens.borders.default} ${tokens.colors.neutral.border} ${tokens.borders.rounded} ${tokens.effects.focusRing}`}
            />
          </div>
        ))}
      </div>

      {/* Real-time margin preview using localValues */}
      <MarginPreview
        pageSize={pageSize}
        margins={localValues}
        className="mx-auto mt-3"
      />

      <p id={helpTextId} className={`${tokens.typography.xs} ${tokens.colors.neutral.textMuted} italic`}>
        Valid range: 0-2&quot; in 0.05&quot; increments
      </p>
    </div>
  );
});
