// ABOUTME: Keyboard shortcuts help modal with search functionality.
// ABOUTME: Displays shortcuts organized by category (General, Actions, Help) for power users.

import { createSignal, For, Show } from 'solid-js';
import type { ShortcutConfig } from '../reactivity/keyboard';
import { formatShortcut } from '../reactivity/keyboard';
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
  for (const s of shortcuts.filter((s) => s.enabled !== false)) {
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
  }

  // Convert to array and remove empty categories
  return Object.entries(categories)
    .filter(([_, items]) => items.length > 0)
    .map(([title, shortcuts]) => ({ title, shortcuts }));
}

/**
 * Keyboard Shortcuts Help Modal
 */
export function KeyboardShortcutsModal(props: KeyboardShortcutsModalProps) {
  let searchInputRef: HTMLInputElement | undefined;
  const [searchQuery, setSearchQuery] = createSignal('');

  const handleSearchChange = (e: Event) => {
    setSearchQuery((e.target as HTMLInputElement).value);
  };

  // Filter shortcuts based on search query (derived computation)
  const filteredShortcuts = () =>
    props.shortcuts.filter((s) => {
      if (!searchQuery()) return s.enabled !== false;

      const query = searchQuery().toLowerCase();
      const matchesDescription = s.description.toLowerCase().includes(query);
      const matchesKey = formatShortcut(s).toLowerCase().includes(query);

      return s.enabled !== false && (matchesDescription || matchesKey);
    });

  const categories = () => categorizeShortcuts(filteredShortcuts());
  const hasResults = () => categories().length > 0;

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      ariaLabelledBy="shortcuts-modal-title"
      maxWidth="max-w-md"
      class="max-h-[80vh] overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div class="flex items-center justify-between p-4 border-b border-border">
        <h2 id="shortcuts-modal-title" class="text-lg font-semibold text-foreground">
          Keyboard Shortcuts
        </h2>
        <button
          type="button"
          onClick={props.onClose}
          class="text-muted-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background rounded-md transition-all duration-300"
          aria-label="Close shortcuts help"
        >
          <svg
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Search/Filter Input */}
      <div class="p-4 border-b border-border">
        <label for="shortcut-search" class="sr-only">
          Search shortcuts
        </label>
        <input
          ref={searchInputRef}
          id="shortcut-search"
          type="text"
          value={searchQuery()}
          onInput={handleSearchChange}
          placeholder="Search shortcuts..."
          class="w-full px-3 py-2 text-sm border border-border rounded-md text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-300"
          aria-describedby="search-description"
        />
        <p id="search-description" class="sr-only">
          Filter shortcuts by description or key combination
        </p>
      </div>

      {/* Content - Scrollable */}
      <div class="p-4 space-y-4 overflow-y-auto flex-1">
        <Show
          when={hasResults()}
          fallback={
            <div class="text-center py-8">
              <p class="text-sm text-muted-foreground">
                No shortcuts match &quot;
                {searchQuery()}
                &quot;
              </p>
            </div>
          }
        >
          <For each={categories()}>
            {(category) => (
              <div>
                <h3 class="text-sm font-medium text-muted-foreground mb-2">{category.title}</h3>
                <dl class="space-y-2">
                  <For each={category.shortcuts}>
                    {(item) => (
                      <div class="flex items-center justify-between">
                        <dt class="text-sm text-foreground">{item.description}</dt>
                        <dd class="ml-4">
                          <kbd class="px-2 py-1 font-mono text-xs font-semibold text-foreground bg-muted rounded-md shadow-sm dark:shadow-none">
                            {item.shortcut}
                          </kbd>
                        </dd>
                      </div>
                    )}
                  </For>
                </dl>
              </div>
            )}
          </For>
        </Show>
      </div>

      {/* Footer */}
      <div class="p-4 border-t border-border bg-muted">
        <p class="text-xs text-muted-foreground text-center">
          Press <kbd class="px-1 py-0.5 text-xs font-semibold bg-muted rounded-md">Esc</kbd> to
          close
        </p>
      </div>
    </Modal>
  );
}
