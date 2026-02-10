/**
 * ABOUTME: App-level context for dependency injection of shared state and callbacks.
 * ABOUTME: Provides currentJobId and onOpenSettings to descendant components.
 */

import { createContext, type JSX, useContext } from 'solid-js';

export interface AppContextValue {
  currentJobId: string;
  onOpenSettings: () => void;
}

const AppContext = createContext<AppContextValue>();

export function AppProvider(props: { value: AppContextValue; children: JSX.Element }) {
  return <AppContext.Provider value={props.value}>{props.children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}
