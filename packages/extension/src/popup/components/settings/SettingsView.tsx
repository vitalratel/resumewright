// ABOUTME: Settings view with tabbed navigation for Page and General settings.
// ABOUTME: Uses tabs to eliminate scrolling and improve keyboard accessibility.

import type { Tab } from '../common';
import type { UserSettings } from '@/shared/types/settings';
import { ArrowLeftIcon, CheckIcon } from '@heroicons/react/24/outline';
import React, { useCallback, useState } from 'react';
import { tokens } from '../../styles/tokens';
import { Alert, PDF, SkeletonSettings, TabGroup } from '../common';
import { RangeSlider } from '../common/RangeSlider';
import { MarginPreview } from '../MarginPreview';
import { ThemeSelector } from './ThemeSelector';

const SETTINGS_TABS: Tab[] = [
  { id: 'page', label: 'Page' },
  { id: 'general', label: 'General' },
];

interface SettingsViewProps {
  settings: UserSettings | null;
  isDirty: boolean;
  saving: boolean;
  showSuccess: boolean;
  lastSaved: Date | null;
  errors: Record<string, string>;
  onBack: () => void;
  onPageSizeChange: (pageSize: 'Letter' | 'A4' | 'Legal') => void;
  onMarginChange: (side: 'top' | 'right' | 'bottom' | 'left', value: number) => void;
  onResetClick: () => void;
}

export const SettingsView = React.memo(
  ({
    settings,
    isDirty,
    saving,
    showSuccess,
    lastSaved: _lastSaved,
    errors,
    onBack,
    onPageSizeChange,
    onMarginChange,
    onResetClick,
  }: SettingsViewProps) => {
    const [activeTab, setActiveTab] = useState('page');

    // Memoize page size handlers to prevent recreation
    const handlePageSizeLetter = useCallback(() => onPageSizeChange('Letter'), [onPageSizeChange]);
    const handlePageSizeA4 = useCallback(() => onPageSizeChange('A4'), [onPageSizeChange]);
    const handlePageSizeLegal = useCallback(() => onPageSizeChange('Legal'), [onPageSizeChange]);

    const pageSizeHandlers = {
      Letter: handlePageSizeLetter,
      A4: handlePageSizeA4,
      Legal: handlePageSizeLegal,
    } as const;

    // Memoize margin handlers to prevent recreation
    const handleMarginTop = useCallback(
      (value: number) => onMarginChange('top', value),
      [onMarginChange]
    );
    const handleMarginBottom = useCallback(
      (value: number) => onMarginChange('bottom', value),
      [onMarginChange]
    );
    const handleMarginLeft = useCallback(
      (value: number) => onMarginChange('left', value),
      [onMarginChange]
    );
    const handleMarginRight = useCallback(
      (value: number) => onMarginChange('right', value),
      [onMarginChange]
    );

    const marginHandlers = {
      top: handleMarginTop,
      bottom: handleMarginBottom,
      left: handleMarginLeft,
      right: handleMarginRight,
    } as const;

    // Loading state with skeleton
    if (!settings) {
      return (
        <div className="w-[360px] min-h-[200px] p-4" aria-busy="true" aria-live="polite">
          {/* Header skeleton */}
          <div className={`flex items-center ${tokens.spacing.marginMedium}`}>
            <div className={`flex items-center ${tokens.spacing.gapSmall}`}>
              <div
                className={`w-5 h-5 ${tokens.colors.neutral.bg} ${tokens.borders.rounded} animate-pulse`}
              ></div>
              <div
                className={`w-12 h-5 ${tokens.colors.neutral.bg} ${tokens.borders.rounded} animate-pulse`}
              ></div>
            </div>
            <div
              className={`ml-2 w-16 h-5 ${tokens.colors.neutral.bg} ${tokens.borders.rounded} animate-pulse`}
            ></div>
          </div>

          <p
            className={`${tokens.typography.base} ${tokens.colors.neutral.textMuted} ${tokens.spacing.marginMedium}`}
          >
            Loading settings...
          </p>

          <SkeletonSettings />
        </div>
      );
    }

    return (
      <div className={`w-[360px] min-h-[200px] p-4 ${tokens.colors.neutral.bgWhite}`}>
        {/* Header */}
        <div className={`flex items-center justify-between ${tokens.spacing.marginMedium}`}>
          <button
            type="button"
            onClick={onBack}
            className={`${tokens.colors.neutral.textMuted} ${tokens.colors.neutral.hover} ${tokens.buttons.variants.iconActive} ${tokens.effects.hoverScale} p-1 ${tokens.borders.rounded} relative flex items-center ${tokens.spacing.gapSmall} ${tokens.transitions.default} ${tokens.effects.focusRing}`}
            aria-label="Back to main screen"
          >
            <ArrowLeftIcon className={tokens.icons.sm} aria-hidden="true" />
            <span
              className={`${tokens.typography.small} ${tokens.typography.medium} ${tokens.colors.neutral.textMuted}`}
            >
              Back
            </span>
            {isDirty && (
              <>
                <span
                  className={`absolute -top-1 -right-1 w-2 h-2 ${tokens.colors.warning.icon} rounded-full`}
                  aria-label="Unsaved changes"
                  title="You have unsaved changes"
                />
                <span className="sr-only">Unsaved changes</span>
                <span className="sr-only">- Your changes have not been saved yet</span>
              </>
            )}
          </button>
          <h1
            className={`flex-1 flex items-center justify-center text-center ${tokens.typography.large} ${tokens.typography.semibold} ${tokens.colors.neutral.text}`}
          >
            Settings
          </h1>
          <div className="w-18"></div>
        </div>

        {/* Visual dirty indicator banner */}
        {isDirty && !saving && (
          <div
            className={`flex items-center ${tokens.spacing.gapSmall} ${tokens.colors.info.text} ${tokens.typography.small} px-4 py-2 ${tokens.colors.info.bg} border ${tokens.colors.info.border} ${tokens.borders.roundedLg} ${tokens.spacing.marginMedium}`}
            role="status"
            aria-live="polite"
          >
            <svg
              className={`animate-spin ${tokens.icons.xs} ${tokens.colors.primary.text} shrink-0`}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Unsaved changes (saving automatically...)</span>
          </div>
        )}

        {/* Tab Navigation */}
        <TabGroup
          tabs={SETTINGS_TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          aria-label="Settings sections"
        />

        {/* Error Messages */}
        {errors.general && (
          <Alert variant="error" className={tokens.spacing.marginMedium}>
            {errors.general}
          </Alert>
        )}

        {/* Auto-save status indicator - visible from all tabs */}
        {(saving || showSuccess) && (
          <div
            role="status"
            aria-live="polite"
            className={`${tokens.spacing.marginMedium} px-4 py-3 ${tokens.borders.roundedLg} border-2 ${
              showSuccess && !saving
                ? `${tokens.colors.success.bg} ${tokens.colors.success.borderStrong}`
                : `${tokens.colors.info.bg} ${tokens.colors.info.border}`
            } transition-all duration-300`}
          >
            <div className={`flex items-center ${tokens.spacing.gapSmall}`}>
              {showSuccess && !saving ? (
                <CheckIcon
                  className={`${tokens.icons.sm} ${tokens.colors.success.icon} shrink-0`}
                  aria-hidden="true"
                />
              ) : (
                <svg
                  className={`animate-spin h-5 w-5 ${tokens.colors.primary.text} shrink-0`}
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              )}
              <span
                className={`${tokens.typography.small} ${tokens.typography.medium} ${
                  showSuccess && !saving
                    ? tokens.colors.success.textStrong
                    : tokens.colors.info.textStrong
                }`}
              >
                {saving ? 'Saving changes...' : 'Settings saved!'}
              </span>
            </div>
          </div>
        )}

        {/* Page Tab Content */}
        {activeTab === 'page' && (
          <div role="tabpanel" id="tabpanel-page" aria-labelledby="tab-page" tabIndex={0}>
            {/* Page Size Selection */}
            <div
              className={tokens.spacing.marginMedium}
              role="group"
              aria-labelledby="page-size-label"
            >
              <label
                id="page-size-label"
                className={`block ${tokens.typography.small} ${tokens.typography.medium} ${tokens.colors.neutral.text} ${tokens.spacing.marginSmall}`}
              >
                Page Size
              </label>
              <p
                className={`${tokens.typography.xs} ${tokens.colors.neutral.textMuted} ${tokens.spacing.marginSmall}`}
              >
                Control <PDF /> page dimensions
              </p>
              <div className={tokens.spacing.gapSmall}>
                {(['Letter', 'A4', 'Legal'] as const).map((size) => (
                  <button
                    type="button"
                    key={size}
                    onClick={pageSizeHandlers[size]}
                    role="radio"
                    aria-checked={settings.defaultConfig.pageSize === size}
                    aria-label={`Select ${size} page size`}
                    className={`w-full text-left ${tokens.colors.neutral.text} p-3 rounded-md border-2 ${tokens.transitions.default} ${
                      settings.defaultConfig.pageSize === size
                        ? `${tokens.colors.borders.success} ${tokens.colors.success.bg} ${tokens.effects.shadow}`
                        : `${tokens.borders.default} ${tokens.colors.neutral.hover} ${tokens.effects.hoverBorder} ${tokens.effects.shadowInteractive} ${tokens.effects.hoverScale}`
                    } ${tokens.effects.focusRing}`}
                  >
                    <div className="flex items-center">
                      <div
                        className={`w-4 h-4 ${tokens.borders.full} border-2 ${tokens.spacing.marginSmall} ${
                          settings.defaultConfig.pageSize === size
                            ? `${tokens.colors.borders.success} ${tokens.colors.success.bg}`
                            : tokens.colors.borders.default
                        }`}
                      />
                      <span>
                        {size === 'Letter' && 'Letter (8.5" x 11")'}
                        {size === 'A4' && 'A4 (210mm x 297mm)'}
                        {size === 'Legal' && 'Legal (8.5" x 14")'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Margin Controls */}
            <div className={tokens.spacing.marginMedium}>
              <label
                className={`block ${tokens.typography.small} ${tokens.typography.medium} ${tokens.colors.neutral.text} ${tokens.spacing.marginSmall}`}
                id="margins-label"
              >
                Margins
              </label>
              <p
                className={`${tokens.typography.xs} ${tokens.colors.neutral.textMuted} ${tokens.spacing.marginSmall}`}
                id="margins-help"
              >
                In inches (0.25 - 1.5). Use arrow keys to adjust.
              </p>
              <div
                className={tokens.spacing.sectionGapCompact}
                role="group"
                aria-labelledby="margins-label"
                aria-describedby="margins-help"
              >
                {(['top', 'bottom', 'left', 'right'] as const).map((side) => (
                  <RangeSlider
                    key={side}
                    id={`margin-${side}`}
                    label={side}
                    value={settings.defaultConfig.margin[side]}
                    min={0.25}
                    max={1.5}
                    step={0.05}
                    onChange={marginHandlers[side]}
                    unit='"'
                  />
                ))}
              </div>

              {/* Visual Margin Preview */}
              <div className={tokens.spacing.marginMedium}>
                <MarginPreview
                  pageSize={settings.defaultConfig.pageSize}
                  margins={settings.defaultConfig.margin}
                />
              </div>
            </div>
          </div>
        )}

        {/* General Tab Content */}
        {activeTab === 'general' && (
          <div role="tabpanel" id="tabpanel-general" aria-labelledby="tab-general" tabIndex={0}>
            {/* Appearance Section */}
            <div className={tokens.spacing.marginMedium}>
              <ThemeSelector />
            </div>

            {/* Reset Button */}
            <button
              type="button"
              onClick={onResetClick}
              aria-label="Reset settings to default values"
              className={`w-full ${tokens.colors.neutral.text} border ${tokens.colors.borders.default} ${tokens.colors.neutral.hover} ${tokens.effects.hoverBorder} ${tokens.effects.shadowInteractive} ${tokens.buttons.variants.iconActive} ${tokens.effects.hoverScale} px-4 py-2 ${tokens.borders.roundedLg} ${tokens.typography.small} ${tokens.effects.focusRing} ${tokens.transitions.default}`}
            >
              Reset to Defaults
            </button>
          </div>
        )}
      </div>
    );
  }
);
