/**
 * QuickSettings Component
 *
 * Collapsible panel for frequently used export settings with auto-save.
 * Changes persist to browser storage without explicit save action.
 *
 * Settings available:
 * - Page size (A4, Letter, Legal)
 * - Margin presets (Compact, Narrow, Normal, Wide, Spacious)
 * - Custom margins (advanced sliders)
 * - Margin preview visualization
 * - Undo recent changes
 *
 * Features:
 * - Auto-save with debounce (500ms)
 * - Collapsible with remembered preference
 * - Auto-collapse after first 3 uses
 * - Visual margin preview
 * - Undo button for quick reversals
 * - Link to full settings page
 *
 * @example
 * ```tsx
 * <QuickSettings
 *   pageSize="Letter"
 *   margins="normal"
 *   marginValues={{ top: 1, right: 1, bottom: 1, left: 1 }}
 *   onPageSizeChange={(size) => updateConfig({ pageSize: size })}
 *   onMarginsChange={(preset) => applyPreset(preset)}
 *   onCustomMarginChange={(side, value) => updateMargin(side, value)}
 *   onOpenFullSettings={() => navigateToSettings()}
 * />
 * ```
 *
 * @see {@link Settings} for advanced configuration
 * @see {@link MarginPreview} for visual preview
 */

import { ArrowRightIcon, ChevronDownIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useLocalStorage } from '../../hooks/integration/useLocalStorage';
import { useQuickSettingsUndo } from '../../hooks/settings/useQuickSettingsUndo';
import { tokens } from '../../styles/tokens';
import { LocalStorageKeys } from '../../utils/localStorage';
import { MarginPreview } from '../MarginPreview';
import { CustomMarginInputs } from './CustomMarginInputs';
import { MarginPresetsRadio } from './MarginPresetsRadio';
import { PageSizeSelector } from './PageSizeSelector';

import { UndoButton } from './UndoButton';

interface QuickSettingsProps {
  /** Current page size */
  pageSize: 'A4' | 'Letter' | 'Legal';

  /** Current margin preset (derived from ConversionConfig.margin) */
  margins: 'compact' | 'narrow' | 'normal' | 'wide' | 'spacious' | 'custom';

  /** Actual margin values in inches (for preview) */
  marginValues: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };

  /** Callback when page size changes */
  onPageSizeChange: (size: 'A4' | 'Letter' | 'Legal') => void;

  /** Callback when margin preset changes */
  onMarginsChange: (preset: 'compact' | 'narrow' | 'normal' | 'wide' | 'spacious') => void;

  /** Callback when custom margin value changes  */
  onCustomMarginChange: (side: 'top' | 'right' | 'bottom' | 'left', value: number) => void;

  /** Callback to open full settings panel */
  onOpenFullSettings: () => void;
}

/**
 * QuickSettings Component
 *
 * Collapsible panel showing most frequently adjusted export settings.
 * Uses extracted sub-components for better maintainability and token efficiency.
 */
export function QuickSettings({
  pageSize,
  margins,
  marginValues,
  onPageSizeChange,
  onMarginsChange,
  onCustomMarginChange,
  onOpenFullSettings,
}: QuickSettingsProps) {
  // Default to collapsed, remember user preference
  // Namespaced localStorage keys to prevent conflicts
  const [isExpanded, setIsExpanded] = useLocalStorage(
    LocalStorageKeys.QUICK_SETTINGS_EXPANDED,
    false,
  );

  // Removed unused save feedback feature (dead code removal)

  // Focus management - focus first input when expanded
  const firstInputRef = useRef<HTMLDivElement>(null);

  // P1-REACT-PERF: Memoize toggle handler to prevent recreation on every render
  const handleToggleExpanded = useCallback(() => {
    setIsExpanded(!isExpanded);
  }, [isExpanded, setIsExpanded]);

  useEffect(() => {
    if (isExpanded && firstInputRef.current) {
      // Focus the first focusable element (button) in PageSizeSelector
      const firstButton = firstInputRef.current.querySelector('button');
      if (firstButton instanceof HTMLElement) {
        firstButton.focus();
      }
    }
  }, [isExpanded]);

  // Undo functionality
  const { canUndo, undo, handlePageSizeChange, handleMarginsChange, undoDescription } = useQuickSettingsUndo({
    pageSize,
    margins,
    onPageSizeChange,
    onMarginsChange,
  });

  // Removed unused save feedback useEffect (dead code removal)

  // Format margin display text
  const marginDisplayText = useMemo(() => {
    if (margins === 'custom') {
      return `Custom (T:${marginValues.top}" R:${marginValues.right}" B:${marginValues.bottom}" L:${marginValues.left}")`;
    }
    return margins.charAt(0).toUpperCase() + margins.slice(1);
  }, [margins, marginValues]);

  return (
    <div className={`${tokens.colors.neutral.bg} ${tokens.borders.default} ${tokens.borders.roundedLg} overflow-hidden`}>
      {/* Header (always visible) */}
      <button
        type="button"
        onClick={handleToggleExpanded}
        className={`w-full px-4 py-3 flex items-center justify-between text-left ${tokens.colors.neutral.hover} ${tokens.transitions.default} ${tokens.effects.focusRing}`}
        aria-expanded={isExpanded}
        aria-controls="quick-settings-content"
        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} quick settings panel`}
      >
        <div className={`flex items-center ${tokens.spacing.gapSmall}`}>
          {/* Consistent icon sizing using tokens */}
          <Cog6ToothIcon className={`${tokens.icons.sm} ${tokens.colors.neutral.icon}`} aria-hidden="true" />
          <span className={`${tokens.typography.small} ${tokens.typography.medium} ${tokens.colors.neutral.text}`}>Quick Settings</span>
          <span className={`${tokens.typography.xs} ${tokens.colors.neutral.textMuted}`}>
            (
            {pageSize}
            ,
            {' '}
            {marginDisplayText}
            )
          </span>
        </div>
        <ChevronDownIcon
          className={`w-4 h-4 ${tokens.colors.neutral.textMuted} ${tokens.transitions.default} ${
            isExpanded ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {/* Expandable content */}
      {isExpanded && (
        <div
          id="quick-settings-content"
          className={`px-4 pb-4 ${tokens.spacing.heroSpacing}`}
          role="region"
          aria-label="Quick settings options"
        >
          {/* Page Size Toggle */}
          <div ref={firstInputRef}>
            <PageSizeSelector
              value={pageSize}
              onChange={handlePageSizeChange}
            />
          </div>

          {/* Margins */}
          <MarginPresetsRadio
            value={margins}
            onChange={handleMarginsChange}
          />

          {/* Custom Margin Inputs - */}
          {margins === 'custom' && (
            <CustomMarginInputs
              values={marginValues}
              onChange={onCustomMarginChange}
              pageSize={pageSize}
            />
          )}

          {/* Undo button (Always shown, disabled when no changes) */}
          <UndoButton onUndo={undo} description={undoDescription} disabled={!canUndo} />

          {/* MarginPreview now inside CustomMarginInputs for real-time updates */}
          {margins !== 'custom' && (
            <div className={`pt-3 border-t ${tokens.colors.borders.light}`}>
              <MarginPreview
                pageSize={pageSize}
                margins={marginValues}
                className="mx-auto"
              />
            </div>
          )}

          {/* Enhanced auto-save feedback visibility */}
          <div className={`${tokens.typography.xs} text-center`}>
            <p className={`${tokens.colors.neutral.text} italic flex items-center justify-center ${tokens.spacing.gapSmall}`}>
              <svg className={`${tokens.icons.xs} ${tokens.colors.success.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Changes save automatically</span>
            </p>
          </div>

          {/* Link to Full Settings */}
          <div className={`pt-3 border-t ${tokens.colors.borders.light}`}>
            <button
              type="button"
              onClick={onOpenFullSettings}
              className={`w-full flex items-center justify-center ${tokens.spacing.gapSmall} ${tokens.typography.small} ${tokens.colors.link.text} ${tokens.colors.link.hover} ${tokens.colors.link.hoverUnderline} ${tokens.effects.focusRing} ${tokens.transitions.default} py-1`}
              aria-label="Open full settings page with advanced export options"
            >
              <span>All Settings</span>
              {/* Consistent icon sizing using tokens */}
              <ArrowRightIcon className={tokens.icons.xs} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
