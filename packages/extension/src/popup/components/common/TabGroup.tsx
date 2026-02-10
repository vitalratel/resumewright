// ABOUTME: Reusable tab navigation component for settings and other views.
// ABOUTME: Follows NN/g and Material Design best practices for tab UX.

import { For } from 'solid-js';

export interface Tab {
  id: string;
  label: string;
}

interface TabGroupProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  'aria-label'?: string;
}

export function TabGroup(props: TabGroupProps) {
  const ariaLabel = () => props['aria-label'] ?? 'Settings tabs';

  return (
    <div role="tablist" aria-label={ariaLabel()} class="flex gap-2 mb-4">
      <For each={props.tabs}>
        {(tab) => {
          const isActive = () => tab.id === props.activeTab;
          return (
            <button
              role="tab"
              type="button"
              id={`tab-${tab.id}`}
              aria-selected={isActive()}
              aria-controls={`tabpanel-${tab.id}`}
              tabIndex={isActive() ? 0 : -1}
              onClick={() => props.onTabChange(tab.id)}
              onKeyDown={(e) => {
                const currentIndex = props.tabs.findIndex((t) => t.id === props.activeTab);
                if (e.key === 'ArrowRight') {
                  e.preventDefault();
                  const nextIndex = (currentIndex + 1) % props.tabs.length;
                  props.onTabChange(props.tabs[nextIndex].id);
                } else if (e.key === 'ArrowLeft') {
                  e.preventDefault();
                  const prevIndex = (currentIndex - 1 + props.tabs.length) % props.tabs.length;
                  props.onTabChange(props.tabs[prevIndex].id);
                }
              }}
              class={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300
                focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background
                ${isActive() ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-muted/80'}`}
            >
              {tab.label}
            </button>
          );
        }}
      </For>
    </div>
  );
}
