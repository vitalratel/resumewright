/**
 * ABOUTME: Context for dependency injection of quick settings state and handlers.
 * ABOUTME: Provides page size, margin, and custom margin change handlers.
 */

import { createContext, type JSX, useContext } from 'solid-js';
import type { UserSettings } from '@/shared/types/settings';

interface QuickSettingsHandlers {
  handlePageSizeChange: (pageSize: 'A4' | 'Letter' | 'Legal') => Promise<void>;
  handleMarginsChange: (
    preset: 'compact' | 'narrow' | 'normal' | 'wide' | 'spacious',
  ) => Promise<void>;
  handleCustomMarginChange: (
    side: 'top' | 'right' | 'bottom' | 'left',
    value: number,
  ) => Promise<void>;
}

export interface QuickSettingsContextValue {
  settings: UserSettings | null;
  handlers: QuickSettingsHandlers;
}

const QuickSettingsContext = createContext<QuickSettingsContextValue>();

export function QuickSettingsProvider(props: {
  value: QuickSettingsContextValue;
  children: JSX.Element;
}) {
  return (
    <QuickSettingsContext.Provider value={props.value}>
      {props.children}
    </QuickSettingsContext.Provider>
  );
}

export function useQuickSettings(): QuickSettingsContextValue {
  const context = useContext(QuickSettingsContext);
  if (!context) {
    throw new Error('useQuickSettings must be used within QuickSettingsProvider');
  }
  return context;
}
