// ABOUTME: Settings view with tabbed navigation for Page and General settings.
// ABOUTME: Uses tabs to eliminate scrolling and improve keyboard accessibility.

import { HiOutlineArrowLeft, HiOutlineCheck } from 'solid-icons/hi';
import { createSignal, For, Show } from 'solid-js';
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

export function SettingsView(props: SettingsViewProps) {
  const [activeTab, setActiveTab] = createSignal('page');

  return (
    <Show
      when={props.settings}
      fallback={
        <div class="w-[360px] min-h-[200px] p-4" aria-busy="true" aria-live="polite">
          {/* Header skeleton */}
          <div class="flex items-center mb-4">
            <div class="flex items-center gap-2">
              <div class="w-5 h-5 bg-muted rounded-md animate-pulse" />
              <div class="w-12 h-5 bg-muted rounded-md animate-pulse" />
            </div>
            <div class="ml-2 w-16 h-5 bg-muted rounded-md animate-pulse" />
          </div>

          <p class="text-base text-muted-foreground mb-4">Loading settings...</p>

          <SkeletonSettings />
        </div>
      }
    >
      {(settings) => (
        <div class="w-[360px] min-h-[200px] p-4 bg-card">
          {/* Header */}
          <div class="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={props.onBack}
              class="text-muted-foreground hover:bg-muted active:bg-muted hover:scale-105 active:scale-95 p-1 rounded-md relative flex items-center gap-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background"
              aria-label="Back to main screen"
            >
              <HiOutlineArrowLeft class="w-5 h-5" aria-hidden="true" />
              <span class="text-sm font-medium text-muted-foreground">Back</span>
              <Show when={props.isDirty}>
                <span
                  class="absolute -top-1 -right-1 w-2 h-2 bg-warning rounded-full"
                  aria-hidden="true"
                  title="You have unsaved changes"
                />
                <span class="sr-only">Unsaved changes - Your changes have not been saved yet</span>
              </Show>
            </button>
            <h1 class="flex-1 flex items-center justify-center text-center text-lg font-semibold text-foreground">
              Settings
            </h1>
            <div class="w-18" />
          </div>

          {/* Visual dirty indicator banner */}
          <Show when={props.isDirty && !props.saving}>
            <output
              class="flex items-center gap-2 text-info text-sm px-4 py-2 bg-info/10 border border-info/20 rounded-lg mb-4"
              aria-live="polite"
            >
              <svg
                class="animate-spin w-4 h-4 text-primary shrink-0"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                  fill="none"
                />
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Unsaved changes (saving automatically...)</span>
            </output>
          </Show>

          {/* Tab Navigation */}
          <TabGroup
            tabs={SETTINGS_TABS}
            activeTab={activeTab()}
            onTabChange={setActiveTab}
            aria-label="Settings sections"
          />

          {/* Error Messages */}
          <Show when={props.errors.general}>
            <Alert variant="error" class="mb-4">
              {props.errors.general}
            </Alert>
          </Show>

          {/* Auto-save status indicator - visible from all tabs */}
          <Show when={props.saving || props.showSuccess}>
            <output
              aria-live="polite"
              class={`block mb-4 px-4 py-3 rounded-lg border-2 ${
                props.showSuccess && !props.saving
                  ? 'bg-success/10 border-success'
                  : 'bg-info/10 border-info/20'
              } transition-all duration-300`}
            >
              <div class="flex items-center gap-2">
                <Show
                  when={props.showSuccess && !props.saving}
                  fallback={
                    <svg
                      class="animate-spin h-5 w-5 text-primary shrink-0"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle
                        class="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        stroke-width="4"
                        fill="none"
                      />
                      <path
                        class="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  }
                >
                  <HiOutlineCheck class="w-5 h-5 text-success shrink-0" aria-hidden="true" />
                </Show>
                <span
                  class={`text-sm font-medium ${
                    props.showSuccess && !props.saving ? 'text-success' : 'text-info'
                  }`}
                >
                  {props.saving ? 'Saving changes...' : 'Settings saved!'}
                </span>
              </div>
            </output>
          </Show>

          {/* Page Tab Content */}
          <Show when={activeTab() === 'page'}>
            {/* biome-ignore lint/a11y/noNoninteractiveTabindex: tabIndex={0} is required per WAI-ARIA tabpanel pattern for keyboard navigation */}
            <div role="tabpanel" id="tabpanel-page" aria-labelledby="tab-page" tabIndex={0}>
              {/* Page Size Selection */}
              <fieldset class="mb-4 border-0 p-0 m-0">
                <legend class="block text-sm font-medium text-foreground mb-3">Page Size</legend>
                <p class="text-xs text-muted-foreground mb-3">
                  Control <PDF /> page dimensions
                </p>
                <div class="gap-2">
                  <For each={['Letter', 'A4', 'Legal'] as const}>
                    {(size) => (
                      <label
                        class={`w-full text-left text-foreground p-3 rounded-md border-2 transition-colors cursor-pointer block ${
                          settings().defaultConfig.pageSize === size
                            ? 'border-success bg-success/10 shadow-sm dark:shadow-none'
                            : 'border-border hover:bg-muted hover:border-border shadow-sm hover:shadow-md hover:scale-105'
                        } has-focus-visible:ring-2 has-focus-visible:ring-ring has-focus-visible:ring-offset-2`}
                      >
                        <div class="flex items-center">
                          <input
                            type="radio"
                            name="pageSize"
                            value={size}
                            checked={settings().defaultConfig.pageSize === size}
                            onChange={() => props.onPageSizeChange(size)}
                            class="sr-only"
                          />
                          <div
                            class={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center shrink-0 ${
                              settings().defaultConfig.pageSize === size
                                ? 'border-success bg-success/10'
                                : 'border-border'
                            }`}
                            aria-hidden="true"
                          >
                            <Show when={settings().defaultConfig.pageSize === size}>
                              <div class="w-2 h-2 rounded-full bg-success/10" />
                            </Show>
                          </div>
                          <span>
                            {size === 'Letter' && 'Letter (8.5" x 11")'}
                            {size === 'A4' && 'A4 (210mm x 297mm)'}
                            {size === 'Legal' && 'Legal (8.5" x 14")'}
                          </span>
                        </div>
                      </label>
                    )}
                  </For>
                </div>
              </fieldset>

              {/* Margin Controls */}
              <fieldset class="mb-4 border-0 p-0 m-0">
                <legend class="block text-sm font-medium text-foreground mb-3">Margins</legend>
                <p class="text-xs text-muted-foreground mb-3" id="margins-help">
                  In inches (0 - 1.5). Use arrow keys to adjust.
                </p>
                <div class="space-y-4 md:space-y-6" aria-describedby="margins-help">
                  <For each={['top', 'bottom', 'left', 'right'] as const}>
                    {(side) => (
                      <RangeSlider
                        id={`margin-${side}`}
                        label={side}
                        value={settings().defaultConfig.margin[side]}
                        min={0}
                        max={1.5}
                        step={0.05}
                        onChange={(value) => props.onMarginChange(side, value)}
                        unit='"'
                      />
                    )}
                  </For>
                </div>

                {/* Visual Margin Preview */}
                <div class="mt-4">
                  <MarginPreview
                    pageSize={settings().defaultConfig.pageSize}
                    margins={settings().defaultConfig.margin}
                  />
                </div>
              </fieldset>
            </div>
          </Show>

          {/* General Tab Content */}
          <Show when={activeTab() === 'general'}>
            {/* biome-ignore lint/a11y/noNoninteractiveTabindex: tabIndex={0} is required per WAI-ARIA tabpanel pattern for keyboard navigation */}
            <div role="tabpanel" id="tabpanel-general" aria-labelledby="tab-general" tabIndex={0}>
              {/* Appearance Section */}
              <div class="mb-4">
                <ThemeSelector />
              </div>

              {/* Reset Button */}
              <button
                type="button"
                onClick={props.onResetClick}
                aria-label="Reset settings to default values"
                class="w-full text-foreground border border-border hover:bg-muted hover:border-border shadow-sm hover:shadow-md active:bg-muted hover:scale-105 active:scale-95 px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background transition-all duration-300"
              >
                Reset to Defaults
              </button>
            </div>
          </Show>
        </div>
      )}
    </Show>
  );
}
