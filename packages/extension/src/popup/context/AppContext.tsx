/**
 * App Context
 * Context provider for AppState to avoid prop drilling
 * 
 * Provides app-level state and actions to all components
 */

import type { AppState } from '../hooks/integration/useAppState';
import React, { createContext, use } from 'react';

export interface AppContextValue {
  appState: AppState;
  currentJobId: string;
  successRef: React.RefObject<HTMLDivElement | null>;
  errorRef: React.RefObject<HTMLDivElement | null>;
  onOpenSettings: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ 
  children, 
  value 
}: { 
  children: React.ReactNode; 
  value: AppContextValue;
}) {
  return <AppContext value={value}>{children}</AppContext>;
}

// eslint-disable-next-line react-refresh/only-export-components -- Hook must be co-located with context
export function useAppContext(): AppContextValue {
  const context = use(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}
