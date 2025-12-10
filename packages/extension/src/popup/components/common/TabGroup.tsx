// ABOUTME: Reusable tab navigation component for settings and other views.
// ABOUTME: Follows NN/g and Material Design best practices for tab UX.

import React from 'react';

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

export const TabGroup = React.memo(
  ({ tabs, activeTab, onTabChange, 'aria-label': ariaLabel = 'Settings tabs' }: TabGroupProps) => {
    return (
      <div role="tablist" aria-label={ariaLabel} className="flex gap-2 mb-4">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              id={`tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onTabChange(tab.id)}
              onKeyDown={(e) => {
                const currentIndex = tabs.findIndex((t) => t.id === activeTab);
                if (e.key === 'ArrowRight') {
                  e.preventDefault();
                  const nextIndex = (currentIndex + 1) % tabs.length;
                  onTabChange(tabs[nextIndex].id);
                } else if (e.key === 'ArrowLeft') {
                  e.preventDefault();
                  const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
                  onTabChange(tabs[prevIndex].id);
                }
              }}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300
                focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background
                ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-muted/80'}`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    );
  },
);
