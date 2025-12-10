// ABOUTME: Keyboard shortcuts help modal with search functionality.
// ABOUTME: Displays shortcuts organized by category (General, Actions, Help) for power users.

import { useRef, useState } from 'react';
import { useEvent } from '../hooks/core/useEvent';
import type { ShortcutConfig } from '../hooks/ui/useKeyboardShortcuts';
import { formatShortcut } from '../hooks/ui/useKeyboardShortcuts';
import { Modal } from './common/Modal';

interface KeyboardShortcutsModalProps {
  /** Whether the modal is open */
  isOpen: boolean;

  /** Callback to close the modal */
  onClose: () => void;

  /** All registered shortcuts */
  shortcuts: ShortcutConfig[];
}

interface ShortcutCategory {
  title: string;
  shortcuts: Array<{
    shortcut: string;
    description: string;
  }>;
}

/**
 * Group shortcuts by category based on their description
 */
function categorizeShortcuts(shortcuts: ShortcutConfig[]): ShortcutCategory[] {
  const categories: Record<string, Array<{ shortcut: string; description: string }>> = {
    General: [],
    Actions: [],
    Help: [],
  };

  // Filter enabled shortcuts and categorize them
  shortcuts
    .filter((s) => s.enabled !== false)
    .forEach((s) => {
      const formatted = {
        shortcut: formatShortcut(s),
        description: s.description,
      };

      // Categorize based on description keywords
      const desc = s.description.toLowerCase();
      if (desc.includes('help') || desc.includes('shortcuts')) {
        categories.Help.push(formatted);
      } else if (desc.includes('settings') || desc.includes('close') || desc.includes('back')) {
        categories.General.push(formatted);
      } else {
        categories.Actions.push(formatted);
      }
    });

  // Convert to array and remove empty categories
  return Object.entries(categories)
    .filter(([_, items]) => items.length > 0)
    .map(([title, shortcuts]) => ({ title, shortcuts }));
}

/**
 * Keyboard Shortcuts Help Modal
 */
export function KeyboardShortcutsModal({
  isOpen,
  onClose,
  shortcuts,
}: KeyboardShortcutsModalProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = useEvent((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  });

  // Filter shortcuts based on search query
  const filteredShortcuts = shortcuts.filter((s) => {
    if (!searchQuery) return s.enabled !== false;

    const query = searchQuery.toLowerCase();
    const matchesDescription = s.description.toLowerCase().includes(query);
    const matchesKey = formatShortcut(s).toLowerCase().includes(query);

    return s.enabled !== false && (matchesDescription || matchesKey);
  });

  const categories = categorizeShortcuts(filteredShortcuts);
  const hasResults = categories.length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      ariaLabelledBy="shortcuts-modal-title"
      maxWidth="max-w-md"
      className="max-h-[80vh] overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 id="shortcuts-modal-title" className="text-lg font-semibold text-foreground">
          Keyboard Shortcuts
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background rounded-md transition-all duration-300"
          aria-label="Close shortcuts help"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Search/Filter Input */}
      <div className="p-4 border-b border-border">
        <label htmlFor="shortcut-search" className="sr-only">
          Search shortcuts
        </label>
        <input
          ref={searchInputRef}
          id="shortcut-search"
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search shortcuts..."
          className="w-full px-3 py-2 text-sm border border-border rounded-md text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-300"
          aria-describedby="search-description"
        />
        <p id="search-description" className="sr-only">
          Filter shortcuts by description or key combination
        </p>
      </div>

      {/* Content - Scrollable */}
      <div className="p-4 space-y-4 overflow-y-auto flex-1">
        {hasResults ? (
          categories.map((category) => (
            <div key={category.title}>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">{category.title}</h3>
              <dl className="space-y-2">
                {category.shortcuts.map((item) => (
                  <div key={item.shortcut} className="flex items-center justify-between">
                    <dt className="text-sm text-foreground">{item.description}</dt>
                    <dd className="ml-4">
                      <kbd className="px-2 py-1 font-mono text-xs font-semibold text-foreground bg-muted rounded-md shadow-sm dark:shadow-none">
                        {item.shortcut}
                      </kbd>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              No shortcuts match &quot;
              {searchQuery}
              &quot;
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border bg-muted">
        <p className="text-xs text-muted-foreground text-center">
          Press <kbd className="px-1 py-0.5 text-xs font-semibold bg-muted rounded-md">Esc</kbd> to
          close
        </p>
      </div>
    </Modal>
  );
}
