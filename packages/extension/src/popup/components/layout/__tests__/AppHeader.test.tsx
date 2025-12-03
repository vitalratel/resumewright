/**
 * AppHeader Component Tests
 *
 * Tests AppHeader for proper rendering of branding, settings button,
 * help button, keyboard shortcuts button, and accessibility features.
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, vi } from 'vitest';
import { AppHeader } from '../AppHeader';

// Test constants matching component text
const HEADER_TEXT = {
  LOGO_ALT: 'ResumeWright Logo',
  HEADING: 'ResumeWright',
  SKIP_LINK: 'Skip to main content',
  SETTINGS_BUTTON: 'Settings',
  HELP_BUTTON: 'Help',
  SHORTCUTS_BUTTON: 'Shortcuts',
  SETTINGS_ARIA_LABEL: 'Open settings',
  HELP_ARIA_LABEL: 'Open help documentation',
  HELP_TITLE: 'Help (F1)',
  SHORTCUTS_ARIA_LABEL: 'View keyboard shortcuts',
  SHORTCUTS_TITLE: 'Keyboard Shortcuts (Ctrl+K or ?)',
  LOGO_SRC: '/icons/icon-48.svg',
  SKIP_LINK_HREF: '#main-content',
} as const;

describe('AppHeader', () => {
  const defaultProps = {
    onOpenSettings: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Branding', () => {
    it('renders ResumeWright logo', () => {
      render(<AppHeader {...defaultProps} />);
      const logo = screen.getByAltText(HEADER_TEXT.LOGO_ALT);
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('src', HEADER_TEXT.LOGO_SRC);
    });

    it('renders ResumeWright heading', () => {
      render(<AppHeader {...defaultProps} />);
      const heading = screen.getByRole('heading', { name: HEADER_TEXT.HEADING });
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe('H1');
    });

    it('logo has correct dimensions', () => {
      render(<AppHeader {...defaultProps} />);
      const logo = screen.getByAltText(HEADER_TEXT.LOGO_ALT);
      expect(logo).toHaveClass('w-6', 'h-6');
    });
  });

  describe('Settings Button', () => {
    it('renders settings button', () => {
      render(<AppHeader {...defaultProps} />);
      const button = screen.getByRole('button', { name: /settings/i });
      expect(button).toBeInTheDocument();
    });

    it('settings button has text and icon', () => {
      const { container } = render(<AppHeader {...defaultProps} />);
      const button = screen.getByRole('button', { name: /settings/i });
      expect(button).toHaveTextContent(HEADER_TEXT.SETTINGS_BUTTON);
      expect(container.querySelector('svg')).toBeInTheDocument(); // Cog6ToothIcon
    });

    it('calls onOpenSettings when clicked', async () => {
      const user = userEvent.setup();
      const onOpenSettings = vi.fn();

      render(<AppHeader onOpenSettings={onOpenSettings} />);

      const button = screen.getByRole('button', { name: /settings/i });
      await user.click(button);

      expect(onOpenSettings).toHaveBeenCalledTimes(1);
    });

    it('settings button has correct aria-label', () => {
      render(<AppHeader {...defaultProps} />);
      const button = screen.getByRole('button', { name: /settings/i });
      expect(button).toHaveAttribute('aria-label', HEADER_TEXT.SETTINGS_ARIA_LABEL);
    });
  });

  describe('Help Button', () => {
    it('renders help button when onShowHelp provided', () => {
      const onShowHelp = vi.fn();
      render(<AppHeader {...defaultProps} onShowHelp={onShowHelp} />);

      const button = screen.getByRole('button', { name: /help/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent(HEADER_TEXT.HELP_BUTTON);
    });

    it('does not render help button when onShowHelp not provided', () => {
      render(<AppHeader {...defaultProps} />);

      const helpButton = screen.queryByRole('button', { name: /open help documentation/i });
      expect(helpButton).not.toBeInTheDocument();
    });

    it('calls onShowHelp when clicked', async () => {
      const user = userEvent.setup();
      const onShowHelp = vi.fn();

      render(<AppHeader {...defaultProps} onShowHelp={onShowHelp} />);

      const button = screen.getByRole('button', { name: /help/i });
      await user.click(button);

      expect(onShowHelp).toHaveBeenCalledTimes(1);
    });

    it('help button has correct aria-label', () => {
      const onShowHelp = vi.fn();
      render(<AppHeader {...defaultProps} onShowHelp={onShowHelp} />);

      const button = screen.getByRole('button', { name: /help/i });
      expect(button).toHaveAttribute('aria-label', HEADER_TEXT.HELP_ARIA_LABEL);
      expect(button).toHaveAttribute('title', HEADER_TEXT.HELP_TITLE);
    });

    it('help button has LifebuoyIcon', () => {
      const onShowHelp = vi.fn();
      render(<AppHeader {...defaultProps} onShowHelp={onShowHelp} />);

      const button = screen.getByRole('button', { name: /help/i });
      const icon = button.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Keyboard Shortcuts Button', () => {
    it('renders shortcuts button when onShowKeyboardShortcuts provided', () => {
      const onShowKeyboardShortcuts = vi.fn();
      render(<AppHeader {...defaultProps} onShowKeyboardShortcuts={onShowKeyboardShortcuts} />);

      const button = screen.getByRole('button', { name: /shortcuts/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent(HEADER_TEXT.SHORTCUTS_BUTTON);
    });

    it('does not render shortcuts button when onShowKeyboardShortcuts not provided', () => {
      render(<AppHeader {...defaultProps} />);

      const shortcutsButton = screen.queryByRole('button', { name: /keyboard shortcuts/i });
      expect(shortcutsButton).not.toBeInTheDocument();
    });

    it('calls onShowKeyboardShortcuts when clicked', async () => {
      const user = userEvent.setup();
      const onShowKeyboardShortcuts = vi.fn();

      render(<AppHeader {...defaultProps} onShowKeyboardShortcuts={onShowKeyboardShortcuts} />);

      const button = screen.getByRole('button', { name: /shortcuts/i });
      await user.click(button);

      expect(onShowKeyboardShortcuts).toHaveBeenCalledTimes(1);
    });

    it('shortcuts button has correct aria-label and title', () => {
      const onShowKeyboardShortcuts = vi.fn();
      render(<AppHeader {...defaultProps} onShowKeyboardShortcuts={onShowKeyboardShortcuts} />);

      const button = screen.getByRole('button', { name: /shortcuts/i });
      expect(button).toHaveAttribute('aria-label', HEADER_TEXT.SHORTCUTS_ARIA_LABEL);
      expect(button).toHaveAttribute('title', HEADER_TEXT.SHORTCUTS_TITLE);
    });

    it('shortcuts button has QuestionMarkCircleIcon', () => {
      const onShowKeyboardShortcuts = vi.fn();
      render(<AppHeader {...defaultProps} onShowKeyboardShortcuts={onShowKeyboardShortcuts} />);

      const button = screen.getByRole('button', { name: /shortcuts/i });
      const icon = button.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('renders as header element', () => {
      const { container } = render(<AppHeader {...defaultProps} />);
      const header = container.querySelector('header');
      expect(header).toBeInTheDocument();
    });

    it('includes skip to main content link', () => {
      render(<AppHeader {...defaultProps} />);
      const skipLink = screen.getByText(HEADER_TEXT.SKIP_LINK);
      expect(skipLink).toBeInTheDocument();
      expect(skipLink).toHaveAttribute('href', HEADER_TEXT.SKIP_LINK_HREF);
    });

    it('skip link is sr-only by default', () => {
      render(<AppHeader {...defaultProps} />);
      const skipLink = screen.getByText(HEADER_TEXT.SKIP_LINK);
      expect(skipLink).toHaveClass('sr-only');
    });

    it('skip link becomes visible on focus', () => {
      render(<AppHeader {...defaultProps} />);
      const skipLink = screen.getByText(HEADER_TEXT.SKIP_LINK);
      expect(skipLink).toHaveClass('focus:not-sr-only');
    });

    it('all buttons are keyboard accessible', async () => {
      const user = userEvent.setup();
      const onOpenSettings = vi.fn();
      const onShowHelp = vi.fn();
      const onShowKeyboardShortcuts = vi.fn();

      render(
        <AppHeader
          onOpenSettings={onOpenSettings}
          onShowHelp={onShowHelp}
          onShowKeyboardShortcuts={onShowKeyboardShortcuts}
        />,
      );

      // Tab through buttons and press Enter
      const helpButton = screen.getByRole('button', { name: /help/i });
      helpButton.focus();
      await user.keyboard('{Enter}');
      expect(onShowHelp).toHaveBeenCalled();

      const shortcutsButton = screen.getByRole('button', { name: /shortcuts/i });
      shortcutsButton.focus();
      await user.keyboard('{Enter}');
      expect(onShowKeyboardShortcuts).toHaveBeenCalled();

      const settingsButton = screen.getByRole('button', { name: /settings/i });
      settingsButton.focus();
      await user.keyboard('{Enter}');
      expect(onOpenSettings).toHaveBeenCalled();
    });
  });

  describe('Button Order and Layout', () => {
    it('buttons appear in correct order: Help, Shortcuts, Settings', () => {
      const onShowHelp = vi.fn();
      const onShowKeyboardShortcuts = vi.fn();

      render(
        <AppHeader
          {...defaultProps}
          onShowHelp={onShowHelp}
          onShowKeyboardShortcuts={onShowKeyboardShortcuts}
        />,
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons[0]).toHaveTextContent(HEADER_TEXT.HELP_BUTTON);
      expect(buttons[1]).toHaveTextContent(HEADER_TEXT.SHORTCUTS_BUTTON);
      expect(buttons[2]).toHaveTextContent(HEADER_TEXT.SETTINGS_BUTTON);
    });

    it('settings button always present', () => {
      render(<AppHeader {...defaultProps} />);
      expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
    });

    it('optional buttons render conditionally', () => {
      // Without optional buttons
      const { rerender } = render(<AppHeader {...defaultProps} />);
      expect(screen.queryByRole('button', { name: /help/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /shortcuts/i })).not.toBeInTheDocument();

      // With help button
      rerender(<AppHeader {...defaultProps} onShowHelp={vi.fn()} />);
      expect(screen.getByRole('button', { name: /help/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /shortcuts/i })).not.toBeInTheDocument();

      // With shortcuts button
      rerender(<AppHeader {...defaultProps} onShowKeyboardShortcuts={vi.fn()} />);
      expect(screen.queryByRole('button', { name: /help/i })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /shortcuts/i })).toBeInTheDocument();

      // With both optional buttons
      rerender(
        <AppHeader {...defaultProps} onShowHelp={vi.fn()} onShowKeyboardShortcuts={vi.fn()} />,
      );
      expect(screen.getByRole('button', { name: /help/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /shortcuts/i })).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('applies primary background color', () => {
      const { container } = render(<AppHeader {...defaultProps} />);
      const header = container.querySelector('header');
      expect(header).toHaveClass('bg-blue-600', 'dark:bg-blue-700');
    });

    it('applies white text color', () => {
      const { container } = render(<AppHeader {...defaultProps} />);
      const header = container.querySelector('header');
      expect(header).toHaveClass('text-white');
    });

    it('has border and shadow', () => {
      const { container } = render(<AppHeader {...defaultProps} />);
      const header = container.querySelector('header');
      expect(header).toHaveClass('shadow-md', 'border-b-2');
    });

    it('uses flexbox for layout', () => {
      const { container } = render(<AppHeader {...defaultProps} />);
      const header = container.querySelector('header');
      expect(header).toHaveClass('flex', 'items-center', 'justify-between');
    });
  });
});
