/**
 * Settings Component
 *
 * Full settings panel with all export configuration options and auto-save.
 * Manages settings state, validation, and persistence to browser storage.
 *
 * Settings categories:
 * - Page layout (size, orientation, margins)
 * - Margin adjustments (sliders with preview)
 * - Reset to defaults
 * - Unsaved changes protection
 *
 * Features:
 * - Auto-save with debounce (timing constant)
 * - Unsaved changes modal on navigation
 * - Reset confirmation with preview
 * - Real-time validation
 * - Success feedback
 * - Last saved timestamp
 * - Container/presentational pattern
 *
 * @example
 * ```tsx
 * <Settings
 *   onBack={() => navigateToMain()}
 * />
 * ```
 *
 * @see {@link SettingsView} for presentational component
 * @see {@link QuickSettings} for inline quick access
 * @see {@link UnsavedChangesModal} for navigation protection
 */

import type { UserSettings } from '@/shared/types/settings';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { settingsStore } from '@/shared/infrastructure/settings/SettingsStore';
import { DEBOUNCE_DELAYS, UI_DELAYS } from '../../constants/timings';
import { useUnsavedChanges } from '../../hooks';
import { useBeforeUnload } from '../../hooks/core';
import { debounce } from '../../utils';
import { ResetConfirmationModal } from '../ResetConfirmationModal';
import { SettingsView } from './SettingsView';

interface SettingsProps {
  onBack: () => void;
}

export const Settings = React.memo(({ onBack }: SettingsProps) => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [originalSettings, setOriginalSettings] = useState<UserSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showResetModal, setShowResetModal] = useState(false);

  // Track pending saves to prevent race conditions
  const pendingSavesRef = useRef<Promise<void>[]>([]);

  // Use extracted hook for unsaved changes tracking
  const { isDirty } = useUnsavedChanges(settings, originalSettings);

  // Prevent window close/refresh when there are unsaved changes
  useBeforeUnload(isDirty || saving, 'You have unsaved changes. Are you sure you want to leave?');

  useEffect(() => {
    // Load settings on mount
    void (async () => {
      const loaded = await settingsStore.loadSettings();
      setSettings(loaded);
      setOriginalSettings(JSON.parse(JSON.stringify(loaded)) as UserSettings); // Deep copy
    })();
  }, []);

  // Save immediately (non-debounced) and track promises
  const saveImmediate = useCallback(async (newSettings: UserSettings): Promise<boolean> => {
    const savePromise = (async () => {
      setSaving(true);
      setErrors({});

      try {
        await settingsStore.saveSettings(newSettings);
        setOriginalSettings(JSON.parse(JSON.stringify(newSettings)) as UserSettings); // Update baseline
        setLastSaved(new Date());
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), UI_DELAYS.SUCCESS_MESSAGE);
        return true; // Success
      } catch {
        // User-friendly error message
        const errorMessage = 'Unable to save settings. Please try again or reload the extension.';
        setErrors({ general: errorMessage });
        return false; // Failure
      } finally {
        setSaving(false);
      }
    })();

    pendingSavesRef.current.push(savePromise.then(() => {})); // Track as void promise
    const result = await savePromise;
    pendingSavesRef.current = pendingSavesRef.current.filter(
      (p) => p !== savePromise.then(() => {})
    );
    return result;
  }, []);

  // Debounced auto-save function (500ms delay)
  // Use ref to stabilize debounced function and prevent callback recreations
  const debouncedAutoSaveRef = useRef(debounce(saveImmediate, DEBOUNCE_DELAYS.SETTINGS_AUTOSAVE));

  // Update ref when saveImmediate changes (shouldn't happen, but stay defensive)
  useEffect(() => {
    debouncedAutoSaveRef.current = debounce(saveImmediate, DEBOUNCE_DELAYS.SETTINGS_AUTOSAVE);
  }, [saveImmediate]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedAutoSaveRef.current.cancel();
    };
  }, []);

  // Last-ditch save attempt on browser close/refresh (race condition fix)
  // Note: handleBack() handles save on navigation, this is for window close/refresh only
  useEffect(() => {
    const handleWindowUnload = () => {
      // Cancel debounce to prevent any pending saves from firing
      debouncedAutoSaveRef.current.cancel();

      // Wait for all pending saves to complete first
      void Promise.all(pendingSavesRef.current);

      // Then save current changes if dirty
      if (isDirty && settings) {
        void saveImmediate(settings);
      }
    };

    window.addEventListener('beforeunload', handleWindowUnload);
    return () => window.removeEventListener('beforeunload', handleWindowUnload);
  }, [isDirty, settings, saveImmediate]);

  // Memoize callbacks for stable references + auto-save
  // No dependencies needed - debouncedAutoSaveRef is stable
  const handlePageSizeChange = useCallback((pageSize: 'Letter' | 'A4' | 'Legal') => {
    setSettings((prev) => {
      if (!prev) return prev;
      const newSettings = {
        ...prev,
        defaultConfig: { ...prev.defaultConfig, pageSize },
      };
      // Trigger auto-save
      debouncedAutoSaveRef.current(newSettings);
      return newSettings;
    });
  }, []);

  const handleMarginChange = useCallback(
    (side: 'top' | 'right' | 'bottom' | 'left', value: number) => {
      setSettings((prev) => {
        if (!prev) return prev;
        const newSettings = {
          ...prev,
          defaultConfig: {
            ...prev.defaultConfig,
            margin: { ...prev.defaultConfig.margin, [side]: value },
          },
        };
        // Trigger auto-save
        debouncedAutoSaveRef.current(newSettings);
        return newSettings;
      });
    },
    []
  );

  // Show confirmation modal instead of native confirm
  const handleResetClick = useCallback(() => {
    setShowResetModal(true);
  }, []);

  const handleResetConfirm = useCallback(() => {
    void (async () => {
      setShowResetModal(false);
      await settingsStore.resetSettings();
      const defaults = await settingsStore.loadSettings();
      setSettings(defaults);
      await saveImmediate(defaults);
    })();
  }, [saveImmediate]);

  const handleResetCancel = useCallback(() => {
    setShowResetModal(false);
  }, []);

  // Auto-save immediately on navigation if dirty
  const handleBack = useCallback(() => {
    void (async () => {
      if (isDirty && settings) {
        // Cancel debounced save and save immediately
        debouncedAutoSaveRef.current.cancel();
        const success = await saveImmediate(settings);
        // Only navigate if save succeeds
        if (success) {
          onBack();
        }
        // If save fails, stay on page - error already shown by saveImmediate
      } else {
        // No changes, safe to navigate
        onBack();
      }
    })();
  }, [isDirty, settings, saveImmediate, onBack]);

  return (
    <>
      {/* Delegate presentation to SettingsView */}
      {/* Auto-save with debounce - no onSave prop */}
      <SettingsView
        settings={settings}
        isDirty={isDirty}
        saving={saving}
        showSuccess={showSuccess}
        lastSaved={lastSaved}
        errors={errors}
        onBack={handleBack}
        onPageSizeChange={handlePageSizeChange}
        onMarginChange={handleMarginChange}
        onResetClick={handleResetClick}
      />

      {/* Reset Confirmation Modal with Preview */}
      {showResetModal && settings && (
        <ResetConfirmationModal
          currentSettings={settings}
          onConfirm={handleResetConfirm}
          onCancel={handleResetCancel}
        />
      )}
    </>
  );
});
