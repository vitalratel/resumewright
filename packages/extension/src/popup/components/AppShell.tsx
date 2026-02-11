// ABOUTME: Outer shell managing initialization before rendering app content.
// ABOUTME: Handles dark mode, WASM compatibility checking, and store hydration.

import { type JSX, Match, Switch } from 'solid-js';
import { getContainerClass } from '../constants/app';
import { createDarkMode } from '../reactivity/theme';
import { createWasmCompatibility } from '../reactivity/wasm';
import { popupStore } from '../store';
import { WasmFallback } from './conversion/WasmFallback';
import { LoadingScreen } from './layout/LoadingScreen';

interface AppShellProps {
  children: JSX.Element;
}

export function AppShell(props: AppShellProps) {
  // Initialize dark mode (applies theme class to <html>)
  createDarkMode();

  // Check WASM compatibility
  const { wasmInitialized, wasmReport } = createWasmCompatibility();

  return (
    <Switch fallback={props.children}>
      {/* WASM failed — show compatibility fallback */}
      <Match when={wasmInitialized() === false ? wasmReport() : undefined}>
        {(report) => (
          <div class={getContainerClass()}>
            <WasmFallback report={report()} />
          </div>
        )}
      </Match>

      {/* Still initializing or store not hydrated — show loading */}
      <Match when={wasmInitialized() === null || !popupStore.state.hasHydrated}>
        <div class={getContainerClass()}>
          <LoadingScreen />
        </div>
      </Match>
    </Switch>
  );
}
