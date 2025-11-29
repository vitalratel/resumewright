/**
 * Keyboard Shortcuts Help Modal
 *
 * Displays all available keyboard shortcuts organized by category with search/filter functionality.
 * Enhances accessibility and usability for power users.
 */

import type { ShortcutConfig } from '../hooks/ui/useKeyboardShortcuts';
import { useCallback, useRef, useState } from 'react';
import { formatShortcut } from '../hooks/ui/useKeyboardShortcuts';
import { tokens } from '../styles/tokens';
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
    .filter(s => s.enabled !== false)
    .forEach((s) => {
      const formatted = {
        shortcut: formatShortcut(s),
        description: s.description,
      };

      // Categorize based on description keywords
      const desc = s.description.toLowerCase();
      if (desc.includes('help') || desc.includes('shortcuts')) {
        categories.Help.push(formatted);
      }
      else if (desc.includes('settings') || desc.includes('close') || desc.includes('back')) {
        categories.General.push(formatted);
      }
      else {
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

  // P1-REACT-PERF: Memoize search handler
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  // Filter shortcuts based on search query
  const filteredShortcuts = shortcuts.filter((s) => {
    if (!searchQuery)
      return s.enabled !== false;

    const query = searchQuery.toLowerCase();
    const matchesDescription = s.description.toLowerCase().includes(query);
    const matchesKey = formatShortcut(s).toLowerCase().includes(query);

    return (s.enabled !== false) && (matchesDescription || matchesKey);
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
      <div className={`flex items-center justify-between p-4 border-b ${tokens.borders.default}`}>
        <h2
          id="shortcuts-modal-title"
          className={`${tokens.typography.large} ${tokens.typography.semibold} ${tokens.colors.neutral.text}`}
        >
          Keyboard Shortcuts
        </h2>
        <button
          type="button"
          onClick={onClose}
          className={`${tokens.colors.neutral.textMuted} ${tokens.colors.neutral.hover} ${tokens.effects.focusRing} ${tokens.borders.rounded} ${tokens.transitions.default}`.trim().replace(/\s+/g, ' ')}
          aria-label="Close shortcuts help"
        >
          <svg
            className={tokens.icons.sm}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
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
      <div className={`p-4 border-b ${tokens.colors.borders.default}`}>
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
          className={`w-full px-3 py-2 ${tokens.typography.small} ${tokens.borders.default} ${tokens.borders.rounded} ${tokens.colors.neutral.text} ${tokens.colors.neutral.bgWhite} focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 ${tokens.transitions.default}`.trim().replace(/\s+/g, ' ')}
          aria-describedby="search-description"
        />
        <p id="search-description" className="sr-only">
          Filter shortcuts by description or key combination
        </p>
      </div>

      {/* Content - Scrollable */}
      <div className={`p-4 ${tokens.spacing.sectionGap} overflow-y-auto flex-1`}>
        {hasResults
          ? (
              categories.map(category => (
                <div key={category.title}>
                  <h3 className={`${tokens.typography.small} ${tokens.typography.medium} ${tokens.colors.neutral.textMuted} ${tokens.spacing.marginSmall}`}>
                    {category.title}
                  </h3>
                  <dl className={tokens.spacing.gapSmall}>
                    {category.shortcuts.map((item) => (
                      <div
                        key={item.shortcut}
                        className="flex items-center justify-between"
                      >
                        <dt className={`${tokens.typography.small} ${tokens.colors.neutral.text}`}>
                          {item.description}
                        </dt>
                        <dd className="ml-4">
                          <kbd className={`${tokens.code.kbd} ${tokens.typography.semibold} ${tokens.colors.neutral.text} ${tokens.colors.neutral.bg} ${tokens.effects.shadow}`.trim().replace(/\s+/g, ' ')}>
                            {item.shortcut}
                          </kbd>
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))
            )
          : (
              <div className="text-center py-8">
                <p className={`${tokens.typography.small} ${tokens.colors.neutral.textMuted}`}>
                  No shortcuts match &quot;
                  {searchQuery}
                  &quot;
                </p>
              </div>
            )}
      </div>

      {/* Footer */}
      <div className={`p-4 border-t ${tokens.borders.default} ${tokens.colors.neutral.bg}`}>
        <p className={`${tokens.typography.xs} ${tokens.colors.neutral.textMuted} text-center`}>
          Press
          {' '}
          <kbd className={`px-1 py-0.5 ${tokens.typography.xs} ${tokens.typography.semibold} ${tokens.colors.neutral.bg} ${tokens.borders.rounded}`}>Esc</kbd>
          {' '}
          to close
        </p>
      </div>
    </Modal>
  );
}
