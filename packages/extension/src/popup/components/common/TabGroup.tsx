// ABOUTME: Reusable tab navigation component for settings and other views.
// ABOUTME: Follows NN/g and Material Design best practices for tab UX.

import React from 'react';
import { tokens } from '../../styles/tokens';

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

export const TabGroup = React.memo(({
  tabs,
  activeTab,
  onTabChange,
  'aria-label': ariaLabel = 'Settings tabs',
}: TabGroupProps) => {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`flex ${tokens.spacing.gapSmall} ${tokens.spacing.marginMedium}`}
    >
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
            className={`
              flex-1 px-4 py-2 ${tokens.typography.small} ${tokens.typography.medium}
              ${tokens.borders.roundedLg} ${tokens.transitions.default}
              ${tokens.effects.focusRing}
              ${
                isActive
                  ? `${tokens.colors.primary.bg} text-white`
                  : `${tokens.colors.neutral.bg} ${tokens.colors.neutral.text} ${tokens.colors.neutral.hover}`
              }
            `
              .trim()
              .replace(/\s+/g, ' ')}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
});
