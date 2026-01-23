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

import { useCallback, useEffect, useRef, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import {
  loadSettings,
  resetSettings,
  saveSettings,
} from '@/shared/infrastructure/settings/SettingsStore';
import type { UserSettings } from '@/shared/types/settings';
import { DEBOUNCE_DELAYS, UI_DELAYS } from '../../constants/timings';
import { useEvent } from '../../hooks/core/useEvent';
import { useUnsavedChanges } from '../../hooks/settings/useUnsavedChanges';
import { ResetConfirmationModal } from '../ResetConfirmationModal';
import { SettingsView } from './SettingsView';

interface SettingsProps {
  onBack: () => void;
}

export function Settings({ onBack }: SettingsProps) {
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

  // Prevent window close/refresh when there are unsaved changes (inlined from useBeforeUnload)
  useEffect(() => {
    if (!isDirty && !saving) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      return 'You have unsaved changes. Are you sure you want to leave?';
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty, saving]);

  useEffect(() => {
    // Load settings on mount
    void (async () => {
      const loaded = await loadSettings();
      setSettings(loaded);
      setOriginalSettings(JSON.parse(JSON.stringify(loaded)) as UserSettings); // Deep copy
    })();
  }, []);

  // Save immediately (non-debounced) and track promises
  const saveImmediate = useCallback(async (newSettings: UserSettings): Promise<boolean> => {
    const savePromise = (async () => {
      setSaving(true);
      setErrors({});

      const result = await saveSettings(newSettings);

      return result.match(
        () => {
          setOriginalSettings(JSON.parse(JSON.stringify(newSettings)) as UserSettings); // Update baseline
          setLastSaved(new Date());
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), UI_DELAYS.SUCCESS_MESSAGE);
          return true; // Success
        },
        () => {
          // User-friendly error message
          const errorMessage = 'Unable to save settings. Please try again or reload the extension.';
          setErrors({ general: errorMessage });
          return false; // Failure
        },
      );
    })();

    pendingSavesRef.current.push(savePromise.then(() => {})); // Track as void promise
    const success = await savePromise;
    pendingSavesRef.current = pendingSavesRef.current.filter(
      (p) => p !== savePromise.then(() => {}),
    );
    setSaving(false);
    return success;
  }, []);

  // Debounced auto-save function (500ms delay)
  // useDebouncedCallback provides stable reference and auto-cleanup on unmount
  const debouncedAutoSave = useDebouncedCallback(saveImmediate, DEBOUNCE_DELAYS.SETTINGS_AUTOSAVE);

  // Last-ditch save attempt on browser close/refresh (race condition fix)
  // Note: handleBack() handles save on navigation, this is for window close/refresh only
  useEffect(() => {
    const handleWindowUnload = () => {
      // Cancel debounce to prevent any pending saves from firing
      debouncedAutoSave.cancel();

      // Wait for all pending saves to complete first
      void Promise.all(pendingSavesRef.current);

      // Then save current changes if dirty
      if (isDirty && settings) {
        void saveImmediate(settings);
      }
    };

    window.addEventListener('beforeunload', handleWindowUnload);
    return () => window.removeEventListener('beforeunload', handleWindowUnload);
  }, [isDirty, settings, saveImmediate, debouncedAutoSave]);

  const handlePageSizeChange = useEvent((pageSize: 'Letter' | 'A4' | 'Legal') => {
    setSettings((prev) => {
      if (!prev) return prev;
      const newSettings = {
        ...prev,
        defaultConfig: { ...prev.defaultConfig, pageSize },
      };
      // Trigger auto-save
      void debouncedAutoSave(newSettings);
      return newSettings;
    });
  });

  const handleMarginChange = useEvent(
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
        void debouncedAutoSave(newSettings);
        return newSettings;
      });
    },
  );

  // Show confirmation modal instead of native confirm
  const handleResetClick = useEvent(() => {
    setShowResetModal(true);
  });

  const handleResetConfirm = useEvent(() => {
    void (async () => {
      setShowResetModal(false);
      await resetSettings();
      const defaults = await loadSettings();
      setSettings(defaults);
      await saveImmediate(defaults);
    })();
  });

  const handleResetCancel = useEvent(() => {
    setShowResetModal(false);
  });

  // Auto-save immediately on navigation if dirty
  const handleBack = useEvent(() => {
    void (async () => {
      if (isDirty && settings) {
        // Cancel debounced save and save immediately
        debouncedAutoSave.cancel();
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
  });

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
}
