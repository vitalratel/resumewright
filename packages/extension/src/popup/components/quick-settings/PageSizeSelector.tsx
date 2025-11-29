/**
 * PageSizeSelector Component
 *
 * Quick Settings Panel - Page Size Toggle
 *
 * Provides a toggle button group for selecting page size (A4, Letter, Legal).
 * Used in QuickSettings panel for quick access to common page size options.
 */

import { memo } from 'react';
import { tokens } from '../../styles/tokens';

type PageSize = 'A4' | 'Letter' | 'Legal';

interface PageSizeSelectorProps {
  /** Currently selected page size */
  value: PageSize;

  /** Callback when page size changes */
  onChange: (size: PageSize) => void;
}

/**
 * PageSizeSelector - Toggle button group for page size selection
 *
 * Provides accessible radio group pattern with visual toggle button styling.
 * Supports keyboard navigation and screen readers.
 */
export const PageSizeSelector = memo(({
  value,
  onChange,
}: PageSizeSelectorProps) => {
  const options: ReadonlyArray<{ value: PageSize; label: string }> = [
    { value: 'A4', label: 'A4' },
    { value: 'Letter', label: 'Letter' },
    { value: 'Legal', label: 'Legal' },
  ];

  // Add arrow key navigation for better keyboard accessibility
  const handleKeyDown = (event: React.KeyboardEvent, currentIndex: number) => {
    let newIndex: number | undefined;

    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        newIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
        break;
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        newIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        newIndex = options.length - 1;
        break;
    }

    if (newIndex !== undefined) {
      onChange(options[newIndex].value);
      // Focus the newly selected button
      const buttons = event.currentTarget.parentElement?.querySelectorAll('button');
      if (buttons?.[newIndex]) {
        (buttons[newIndex]).focus();
      }
    }
  };

  return (
    <div>
      <label
        id="page-size-label"
        className={`${tokens.typography.xs} ${tokens.typography.semibold} ${tokens.colors.neutral.text} mb-2 block`}
      >
        Page Size
      </label>
      <div className={`flex ${tokens.spacing.gapSmall}`} role="group" aria-labelledby="page-size-label">
        {options.map(({ value: optionValue, label }, index) => (
          <button
            type="button"
            key={optionValue}
            onClick={() => onChange(optionValue)}
            onKeyDown={e => handleKeyDown(e, index)}
            aria-pressed={value === optionValue}
            tabIndex={value === optionValue ? 0 : -1}
            className={`flex-1 ${tokens.buttons.compact.primary} ${tokens.borders.rounded} ${tokens.typography.small} ${tokens.typography.medium} ${tokens.transitions.default} ${tokens.effects.focusRing} ${
              value === optionValue
                ? `${tokens.colors.primary.bg} text-white`
                : `${tokens.colors.neutral.bgWhite} ${tokens.borders.default} ${tokens.colors.neutral.text} ${tokens.colors.neutral.hover}`
            }`.trim().replace(/\s+/g, ' ')}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
});
