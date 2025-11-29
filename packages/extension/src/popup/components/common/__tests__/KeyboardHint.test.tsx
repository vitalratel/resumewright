/**
 * KeyboardHint Component Tests
 *
 * Tests KeyboardHint component for proper keyboard shortcut display,
 * platform-specific modifier keys (Cmd vs Ctrl), and accessibility.
 */

import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, vi } from 'vitest';
import { getModifierKey } from '../../../hooks/ui/useKeyboardShortcuts';

import { getShortcutDisplay } from '../../../utils/shortcuts';
import { KeyboardHint } from '../KeyboardHint';

// Mock the useKeyboardShortcuts hook
vi.mock('../../../hooks/ui/useKeyboardShortcuts', () => ({
  getModifierKey: vi.fn(() => '⌘'), // Default to Mac
}));

describe('KeyboardHint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders keyboard hint text', () => {
      const { container } = render(<KeyboardHint keys="E" />);
      expect(container.textContent).toBe('E');
    });

    it('renders with single key', () => {
      const { getByText } = render(<KeyboardHint keys="Esc" />);
      expect(getByText('Esc')).toBeInTheDocument();
    });

    it('renders with multiple keys', () => {
      const { getByText } = render(<KeyboardHint keys="⌘K" />);
      expect(getByText('⌘K')).toBeInTheDocument();
    });

    it('renders with comma shortcut', () => {
      const { getByText } = render(<KeyboardHint keys="," />);
      expect(getByText(',')).toBeInTheDocument();
    });

    it('applies default styles', () => {
      const { container } = render(<KeyboardHint keys="E" />);
      const span = container.querySelector('span');

      expect(span).toHaveClass('ml-2'); // left margin
      expect(span).toHaveClass('text-xs'); // extra small text
      expect(span).toHaveClass('opacity-60'); // muted appearance
      expect(span).toHaveClass('font-mono'); // monospace font
    });
  });

  describe('Custom ClassName', () => {
    it('applies additional custom classes', () => {
      const { container } = render(<KeyboardHint keys="E" className="custom-class" />);
      const span = container.querySelector('span');
      expect(span).toHaveClass('custom-class');
    });

    it('preserves default classes with custom ones', () => {
      const { container } = render(<KeyboardHint keys="E" className="text-blue-500" />);
      const span = container.querySelector('span');
      expect(span).toHaveClass('ml-2', 'opacity-60', 'font-mono', 'text-blue-500');
    });

    it('handles empty className', () => {
      const { container } = render(<KeyboardHint keys="E" className="" />);
      const span = container.querySelector('span');
      expect(span).toBeInTheDocument();
      expect(span).toHaveClass('ml-2'); // Still has defaults
    });
  });

  describe('Accessibility', () => {
    it('is hidden from screen readers', () => {
      const { container } = render(<KeyboardHint keys="E" />);
      const span = container.querySelector('span');
      expect(span).toHaveAttribute('aria-hidden', 'true');
    });

    it('aria-hidden is always true regardless of keys', () => {
      const { container: container1 } = render(<KeyboardHint keys="⌘E" />);
      const { container: container2 } = render(<KeyboardHint keys="Esc" />);

      expect(container1.querySelector('span')).toHaveAttribute('aria-hidden', 'true');
      expect(container2.querySelector('span')).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Display Name', () => {
    it('has displayName for React DevTools', () => {
      expect(KeyboardHint.displayName).toBe('KeyboardHint');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty keys string', () => {
      const { container } = render(<KeyboardHint keys="" />);
      expect(container.querySelector('span')).toBeInTheDocument();
      expect(container.textContent).toBe('');
    });

    it('handles special characters', () => {
      const { getByText } = render(<KeyboardHint keys="→" />);
      expect(getByText('→')).toBeInTheDocument();
    });

    it('handles unicode characters', () => {
      const { getByText } = render(<KeyboardHint keys="⌘⇧K" />);
      expect(getByText('⌘⇧K')).toBeInTheDocument();
    });

    it('handles long key combinations', () => {
      const { getByText } = render(<KeyboardHint keys="Ctrl+Shift+Alt+F" />);
      expect(getByText('Ctrl+Shift+Alt+F')).toBeInTheDocument();
    });

    it('handles whitespace in keys', () => {
      const { getByText } = render(<KeyboardHint keys="Ctrl E" />);
      expect(getByText('Ctrl E')).toBeInTheDocument();
    });
  });
});

describe('getShortcutDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Mac Platform (⌘)', () => {
    beforeEach(() => {
      vi.mocked(getModifierKey).mockReturnValue('⌘');
    });

    it('returns key with ⌘ modifier on Mac', () => {
      const result = getShortcutDisplay('E');
      expect(result).toBe('⌘E');
    });

    it('returns key without modifier when withModifier is false', () => {
      const result = getShortcutDisplay('E', false);
      expect(result).toBe('E');
    });

    it('works with special keys', () => {
      expect(getShortcutDisplay('Esc')).toBe('⌘Esc');
      expect(getShortcutDisplay('Tab')).toBe('⌘Tab');
      expect(getShortcutDisplay('Enter')).toBe('⌘Enter');
    });

    it('works with single letters', () => {
      expect(getShortcutDisplay('K')).toBe('⌘K');
      expect(getShortcutDisplay('S')).toBe('⌘S');
      expect(getShortcutDisplay('P')).toBe('⌘P');
    });

    it('works with symbols', () => {
      expect(getShortcutDisplay(',')).toBe('⌘,');
      expect(getShortcutDisplay('/')).toBe('⌘/');
    });
  });

  describe('Windows/Linux Platform (Ctrl)', () => {
    beforeEach(() => {
      vi.mocked(getModifierKey).mockReturnValue('Ctrl');
    });

    it('returns key with Ctrl modifier on Windows/Linux', () => {
      const result = getShortcutDisplay('E');
      expect(result).toBe('CtrlE');
    });

    it('returns key without modifier when withModifier is false', () => {
      const result = getShortcutDisplay('E', false);
      expect(result).toBe('E');
    });

    it('works with special keys', () => {
      expect(getShortcutDisplay('Esc')).toBe('CtrlEsc');
      expect(getShortcutDisplay('Tab')).toBe('CtrlTab');
      expect(getShortcutDisplay('Enter')).toBe('CtrlEnter');
    });

    it('works with single letters', () => {
      expect(getShortcutDisplay('K')).toBe('CtrlK');
      expect(getShortcutDisplay('S')).toBe('CtrlS');
      expect(getShortcutDisplay('P')).toBe('CtrlP');
    });

    it('works with symbols', () => {
      expect(getShortcutDisplay(',')).toBe('Ctrl,');
      expect(getShortcutDisplay('/')).toBe('Ctrl/');
    });
  });

  describe('withModifier Parameter', () => {
    it('includes modifier by default', () => {
      vi.mocked(getModifierKey).mockReturnValue('⌘');
      expect(getShortcutDisplay('E')).toBe('⌘E');
    });

    it('includes modifier when explicitly true', () => {
      vi.mocked(getModifierKey).mockReturnValue('⌘');
      expect(getShortcutDisplay('E', true)).toBe('⌘E');
    });

    it('excludes modifier when false', () => {
      vi.mocked(getModifierKey).mockReturnValue('⌘');
      expect(getShortcutDisplay('E', false)).toBe('E');
    });

    it('withModifier works across platforms', () => {
      vi.mocked(getModifierKey).mockReturnValue('Ctrl');
      expect(getShortcutDisplay('K', true)).toBe('CtrlK');
      expect(getShortcutDisplay('K', false)).toBe('K');

      vi.mocked(getModifierKey).mockReturnValue('⌘');
      expect(getShortcutDisplay('K', true)).toBe('⌘K');
      expect(getShortcutDisplay('K', false)).toBe('K');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty key string', () => {
      vi.mocked(getModifierKey).mockReturnValue('⌘');
      expect(getShortcutDisplay('')).toBe('⌘');
      expect(getShortcutDisplay('', false)).toBe('');
    });

    it('handles numeric keys', () => {
      vi.mocked(getModifierKey).mockReturnValue('⌘');
      expect(getShortcutDisplay('1')).toBe('⌘1');
      expect(getShortcutDisplay('0')).toBe('⌘0');
    });

    it('handles function keys', () => {
      vi.mocked(getModifierKey).mockReturnValue('Ctrl');
      expect(getShortcutDisplay('F1')).toBe('CtrlF1');
      expect(getShortcutDisplay('F12')).toBe('CtrlF12');
    });

    it('handles multi-character keys', () => {
      vi.mocked(getModifierKey).mockReturnValue('⌘');
      expect(getShortcutDisplay('Space')).toBe('⌘Space');
      expect(getShortcutDisplay('Delete')).toBe('⌘Delete');
    });

    it('getModifierKey is called once per invocation with modifier', () => {
      vi.mocked(getModifierKey).mockReturnValue('⌘');
      getShortcutDisplay('E', true);
      expect(getModifierKey).toHaveBeenCalledTimes(1);
    });

    it('getModifierKey is not called when withModifier is false', () => {
      vi.mocked(getModifierKey).mockReturnValue('⌘');
      getShortcutDisplay('E', false);
      expect(getModifierKey).not.toHaveBeenCalled();
    });
  });
});
