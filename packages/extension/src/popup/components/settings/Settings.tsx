// ABOUTME: Settings container with auto-save, validation, and persistence.
// ABOUTME: Manages settings state and delegates presentation to SettingsView.

import { createSignal, onCleanup, onMount, Show } from 'solid-js';
import {
  loadSettings,
  resetSettings,
  saveSettings,
} from '@/shared/infrastructure/settings/SettingsStore';
import type { UserSettings } from '@/shared/types/settings';
import { debounce } from '@/shared/utils/debounce';
import { DEBOUNCE_DELAYS, UI_DELAYS } from '../../constants/timings';
import { createUnsavedChanges } from '../../reactivity/settings';
import { ResetConfirmationModal } from '../ResetConfirmationModal';
import { SettingsView } from './SettingsView';

interface SettingsProps {
  onBack: () => void;
}

export function Settings(props: SettingsProps) {
  const [settings, setSettings] = createSignal<UserSettings | null>(null);
  const [originalSettings, setOriginalSettings] = createSignal<UserSettings | null>(null);
  const [saving, setSaving] = createSignal(false);
  const [showSuccess, setShowSuccess] = createSignal(false);
  const [lastSaved, setLastSaved] = createSignal<Date | null>(null);
  const [errors, setErrors] = createSignal<Record<string, string>>({});
  const [showResetModal, setShowResetModal] = createSignal(false);

  // Use extracted reactive function for unsaved changes tracking
  const { isDirty } = createUnsavedChanges(settings, originalSettings);

  // Prevent window close/refresh when there are unsaved changes
  const beforeUnloadHandler = (e: BeforeUnloadEvent) => {
    if (!isDirty() && !saving()) return;
    e.preventDefault();
    return 'You have unsaved changes. Are you sure you want to leave?';
  };

  onMount(() => {
    window.addEventListener('beforeunload', beforeUnloadHandler);
  });

  onCleanup(() => {
    window.removeEventListener('beforeunload', beforeUnloadHandler);
  });

  // Load settings on mount
  onMount(() => {
    void (async () => {
      const loaded = await loadSettings();
      setSettings(loaded);
      setOriginalSettings(JSON.parse(JSON.stringify(loaded)) as UserSettings);
    })();
  });

  // Save immediately (non-debounced)
  const saveImmediate = async (newSettings: UserSettings): Promise<boolean> => {
    setSaving(true);
    setErrors({});

    const result = await saveSettings(newSettings);

    const success = result.match(
      () => {
        setOriginalSettings(JSON.parse(JSON.stringify(newSettings)) as UserSettings);
        setLastSaved(new Date());
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), UI_DELAYS.SUCCESS_MESSAGE);
        return true;
      },
      () => {
        const errorMessage = 'Unable to save settings. Please try again or reload the extension.';
        setErrors({ general: errorMessage });
        return false;
      },
    );

    setSaving(false);
    return success;
  };

  // Debounced auto-save function (500ms delay)
  const debouncedAutoSave = debounce((newSettings: UserSettings) => {
    void saveImmediate(newSettings);
  }, DEBOUNCE_DELAYS.SETTINGS_AUTOSAVE);

  onCleanup(() => {
    debouncedAutoSave.cancel();
  });

  // Last-ditch save attempt on browser close/refresh
  const windowUnloadHandler = () => {
    debouncedAutoSave.cancel();
    const currentSettings = settings();
    if (isDirty() && currentSettings) {
      void saveImmediate(currentSettings);
    }
  };

  onMount(() => {
    window.addEventListener('beforeunload', windowUnloadHandler);
  });

  onCleanup(() => {
    window.removeEventListener('beforeunload', windowUnloadHandler);
  });

  const handlePageSizeChange = (pageSize: 'Letter' | 'A4' | 'Legal') => {
    const prev = settings();
    if (!prev) return;
    const newSettings = {
      ...prev,
      defaultConfig: { ...prev.defaultConfig, pageSize },
    };
    setSettings(newSettings);
    debouncedAutoSave(newSettings);
  };

  const handleMarginChange = (side: 'top' | 'right' | 'bottom' | 'left', value: number) => {
    const prev = settings();
    if (!prev) return;
    const newSettings = {
      ...prev,
      defaultConfig: {
        ...prev.defaultConfig,
        margin: { ...prev.defaultConfig.margin, [side]: value },
      },
    };
    setSettings(newSettings);
    debouncedAutoSave(newSettings);
  };

  // Show confirmation modal instead of native confirm
  const handleResetClick = () => {
    setShowResetModal(true);
  };

  const handleResetConfirm = () => {
    void (async () => {
      setShowResetModal(false);
      await resetSettings();
      const defaults = await loadSettings();
      setSettings(defaults);
      await saveImmediate(defaults);
    })();
  };

  const handleResetCancel = () => {
    setShowResetModal(false);
  };

  // Auto-save immediately on navigation if dirty
  const handleBack = () => {
    void (async () => {
      const currentSettings = settings();
      if (isDirty() && currentSettings) {
        // Cancel debounced save and save immediately
        debouncedAutoSave.cancel();
        const success = await saveImmediate(currentSettings);
        // Only navigate if save succeeds
        if (success) {
          props.onBack();
        }
        // If save fails, stay on page - error already shown by saveImmediate
      } else {
        // No changes, safe to navigate
        props.onBack();
      }
    })();
  };

  return (
    <>
      {/* Delegate presentation to SettingsView */}
      <SettingsView
        settings={settings()}
        isDirty={isDirty()}
        saving={saving()}
        showSuccess={showSuccess()}
        lastSaved={lastSaved()}
        errors={errors()}
        onBack={handleBack}
        onPageSizeChange={handlePageSizeChange}
        onMarginChange={handleMarginChange}
        onResetClick={handleResetClick}
      />

      {/* Reset Confirmation Modal with Preview */}
      <Show when={showResetModal() ? settings() : undefined}>
        {(currentSettings) => (
          <ResetConfirmationModal
            currentSettings={currentSettings()}
            onConfirm={handleResetConfirm}
            onCancel={handleResetCancel}
          />
        )}
      </Show>
    </>
  );
}
