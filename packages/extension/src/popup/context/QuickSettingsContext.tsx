/**
 * QuickSettings Context
 * Context provider for QuickSettings to avoid prop drilling
 * 
 * Provides quick settings state and handlers to all components
 */

import type { UserSettings } from '@/shared/types/settings';
import React, { createContext, use } from 'react';

export interface QuickSettingsHandlers {
  handlePageSizeChange: (pageSize: 'A4' | 'Letter' | 'Legal') => Promise<void>;
  handleMarginsChange: (preset: 'compact' | 'narrow' | 'normal' | 'wide' | 'spacious') => Promise<void>;
  handleCustomMarginChange: (side: 'top' | 'right' | 'bottom' | 'left', value: number) => Promise<void>;
}

export interface QuickSettingsContextValue {
  settings: UserSettings | null;
  handlers: QuickSettingsHandlers;
}

const QuickSettingsContext = createContext<QuickSettingsContextValue | null>(null);

export function QuickSettingsProvider({ 
  children, 
  value 
}: { 
  children: React.ReactNode; 
  value: QuickSettingsContextValue;
}) {
  return <QuickSettingsContext value={value}>{children}</QuickSettingsContext>;
}

// eslint-disable-next-line react-refresh/only-export-components -- Hook must be co-located with context
export function useQuickSettings(): QuickSettingsContextValue {
  const context = use(QuickSettingsContext);
  if (!context) {
    throw new Error('useQuickSettings must be used within QuickSettingsProvider');
  }
  return context;
}
