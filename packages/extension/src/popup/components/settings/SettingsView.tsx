// ABOUTME: Settings view with tabbed navigation for Page and General settings.
// ABOUTME: Uses tabs to eliminate scrolling and improve keyboard accessibility.

import { ArrowLeftIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import type { UserSettings } from '@/shared/types/settings';
import { Alert } from '../common/Alert';
import { RangeSlider } from '../common/RangeSlider';
import { SkeletonSettings } from '../common/Skeleton';
import type { Tab } from '../common/TabGroup';
import { TabGroup } from '../common/TabGroup';
import { PDF } from '../common/TechTerm';
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

export function SettingsView({
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
}: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState('page');

  // Loading state with skeleton
  if (!settings) {
    return (
      <div className="w-[360px] min-h-[200px] p-4" aria-busy="true" aria-live="polite">
        {/* Header skeleton */}
        <div className="flex items-center mb-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-muted rounded-md animate-pulse"></div>
            <div className="w-12 h-5 bg-muted rounded-md animate-pulse"></div>
          </div>
          <div className="ml-2 w-16 h-5 bg-muted rounded-md animate-pulse"></div>
        </div>

        <p className="text-base text-muted-foreground mb-4">Loading settings...</p>

        <SkeletonSettings />
      </div>
    );
  }

  return (
    <div className="w-[360px] min-h-[200px] p-4 bg-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={onBack}
          className="text-muted-foreground hover:bg-muted active:bg-muted hover:scale-105 active:scale-95 p-1 rounded-md relative flex items-center gap-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background"
          aria-label="Back to main screen"
        >
          <ArrowLeftIcon className="w-5 h-5" aria-hidden="true" />
          <span className="text-sm font-medium text-muted-foreground">Back</span>
          {isDirty && (
            <>
              <span
                className="absolute -top-1 -right-1 w-2 h-2 bg-warning rounded-full"
                aria-hidden="true"
                title="You have unsaved changes"
              />
              <span className="sr-only">
                Unsaved changes - Your changes have not been saved yet
              </span>
            </>
          )}
        </button>
        <h1 className="flex-1 flex items-center justify-center text-center text-lg font-semibold text-foreground">
          Settings
        </h1>
        <div className="w-18"></div>
      </div>

      {/* Visual dirty indicator banner */}
      {isDirty && !saving && (
        <output
          className="flex items-center gap-2 text-info text-sm px-4 py-2 bg-info/10 border border-info/20 rounded-lg mb-4"
          aria-live="polite"
        >
          <svg
            className="animate-spin w-4 h-4 text-primary shrink-0"
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
        </output>
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
        <Alert variant="error" className="mb-4">
          {errors.general}
        </Alert>
      )}

      {/* Auto-save status indicator - visible from all tabs */}
      {(saving || showSuccess) && (
        <output
          aria-live="polite"
          className={`block mb-4 px-4 py-3 rounded-lg border-2 ${
            showSuccess && !saving ? 'bg-success/10 border-success' : 'bg-info/10 border-info/20'
          } transition-all duration-300`}
        >
          <div className="flex items-center gap-2">
            {showSuccess && !saving ? (
              <CheckIcon className="w-5 h-5 text-success shrink-0" aria-hidden="true" />
            ) : (
              <svg
                className="animate-spin h-5 w-5 text-primary shrink-0"
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
              className={`text-sm font-medium ${
                showSuccess && !saving ? 'text-success' : 'text-info'
              }`}
            >
              {saving ? 'Saving changes...' : 'Settings saved!'}
            </span>
          </div>
        </output>
      )}

      {/* Page Tab Content */}
      {activeTab === 'page' && (
        // biome-ignore lint/a11y/noNoninteractiveTabindex: tabIndex={0} is required per WAI-ARIA tabpanel pattern for keyboard navigation
        <div role="tabpanel" id="tabpanel-page" aria-labelledby="tab-page" tabIndex={0}>
          {/* Page Size Selection */}
          <fieldset className="mb-4 border-0 p-0 m-0">
            <legend className="block text-sm font-medium text-foreground mb-3">Page Size</legend>
            <p className="text-xs text-muted-foreground mb-3">
              Control <PDF /> page dimensions
            </p>
            <div className="gap-2">
              {(['Letter', 'A4', 'Legal'] as const).map((size) => (
                <label
                  key={size}
                  className={`w-full text-left text-foreground p-3 rounded-md border-2 transition-colors cursor-pointer block ${
                    settings.defaultConfig.pageSize === size
                      ? 'border-success bg-success/10 shadow-sm dark:shadow-none'
                      : 'border-border hover:bg-muted hover:border-border shadow-sm hover:shadow-md hover:scale-105'
                  } has-focus-visible:ring-2 has-focus-visible:ring-ring has-focus-visible:ring-offset-2`}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="pageSize"
                      value={size}
                      checked={settings.defaultConfig.pageSize === size}
                      onChange={() => onPageSizeChange(size)}
                      className="sr-only"
                    />
                    <div
                      className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center shrink-0 ${
                        settings.defaultConfig.pageSize === size
                          ? 'border-success bg-success/10'
                          : 'border-border'
                      }`}
                      aria-hidden="true"
                    >
                      {settings.defaultConfig.pageSize === size && (
                        <div className="w-2 h-2 rounded-full bg-success/10" />
                      )}
                    </div>
                    <span>
                      {size === 'Letter' && 'Letter (8.5" x 11")'}
                      {size === 'A4' && 'A4 (210mm x 297mm)'}
                      {size === 'Legal' && 'Legal (8.5" x 14")'}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Margin Controls */}
          <fieldset className="mb-4 border-0 p-0 m-0">
            <legend className="block text-sm font-medium text-foreground mb-3">Margins</legend>
            <p className="text-xs text-muted-foreground mb-3" id="margins-help">
              In inches (0 - 1.5). Use arrow keys to adjust.
            </p>
            <div className="space-y-4 md:space-y-6" aria-describedby="margins-help">
              {(['top', 'bottom', 'left', 'right'] as const).map((side) => (
                <RangeSlider
                  key={side}
                  id={`margin-${side}`}
                  label={side}
                  value={settings.defaultConfig.margin[side]}
                  min={0}
                  max={1.5}
                  step={0.05}
                  onChange={(value) => onMarginChange(side, value)}
                  unit='"'
                />
              ))}
            </div>

            {/* Visual Margin Preview */}
            <div className="mt-4">
              <MarginPreview
                pageSize={settings.defaultConfig.pageSize}
                margins={settings.defaultConfig.margin}
              />
            </div>
          </fieldset>
        </div>
      )}

      {/* General Tab Content */}
      {activeTab === 'general' && (
        // biome-ignore lint/a11y/noNoninteractiveTabindex: tabIndex={0} is required per WAI-ARIA tabpanel pattern for keyboard navigation
        <div role="tabpanel" id="tabpanel-general" aria-labelledby="tab-general" tabIndex={0}>
          {/* Appearance Section */}
          <div className="mb-4">
            <ThemeSelector />
          </div>

          {/* Reset Button */}
          <button
            type="button"
            onClick={onResetClick}
            aria-label="Reset settings to default values"
            className="w-full text-foreground border border-border hover:bg-muted hover:border-border shadow-sm hover:shadow-md active:bg-muted hover:scale-105 active:scale-95 px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background transition-all duration-300"
          >
            Reset to Defaults
          </button>
        </div>
      )}
    </div>
  );
}
