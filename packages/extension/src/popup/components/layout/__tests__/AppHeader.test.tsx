/**
 * ABOUTME: Tests for AppHeader branding, settings, help, and shortcuts buttons.
 * ABOUTME: Validates accessibility, keyboard interaction, button order, and styling.
 */

import { fireEvent, render, screen } from '@solidjs/testing-library';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppHeader } from '../AppHeader';

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
      render(() => <AppHeader onOpenSettings={defaultProps.onOpenSettings} />);
      const logo = screen.getByAltText(HEADER_TEXT.LOGO_ALT);
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('src', HEADER_TEXT.LOGO_SRC);
    });

    it('renders ResumeWright heading', () => {
      render(() => <AppHeader onOpenSettings={defaultProps.onOpenSettings} />);
      const heading = screen.getByRole('heading', { name: HEADER_TEXT.HEADING });
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe('H1');
    });

    it('logo has correct dimensions', () => {
      render(() => <AppHeader onOpenSettings={defaultProps.onOpenSettings} />);
      const logo = screen.getByAltText(HEADER_TEXT.LOGO_ALT);
      expect(logo).toHaveClass('w-6', 'h-6');
    });
  });

  describe('Settings Button', () => {
    it('renders settings button', () => {
      render(() => <AppHeader onOpenSettings={defaultProps.onOpenSettings} />);
      const button = screen.getByRole('button', { name: /settings/i });
      expect(button).toBeInTheDocument();
    });

    it('settings button has text and icon', () => {
      const { container } = render(() => (
        <AppHeader onOpenSettings={defaultProps.onOpenSettings} />
      ));
      const button = screen.getByRole('button', { name: /settings/i });
      expect(button).toHaveTextContent(HEADER_TEXT.SETTINGS_BUTTON);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('calls onOpenSettings when clicked', () => {
      const onOpenSettings = vi.fn();

      render(() => <AppHeader onOpenSettings={onOpenSettings} />);

      const button = screen.getByRole('button', { name: /settings/i });
      fireEvent.click(button);

      expect(onOpenSettings).toHaveBeenCalledTimes(1);
    });

    it('settings button has correct aria-label', () => {
      render(() => <AppHeader onOpenSettings={defaultProps.onOpenSettings} />);
      const button = screen.getByRole('button', { name: /settings/i });
      expect(button).toHaveAttribute('aria-label', HEADER_TEXT.SETTINGS_ARIA_LABEL);
    });
  });

  describe('Help Button', () => {
    it('renders help button when onShowHelp provided', () => {
      const onShowHelp = vi.fn();
      render(() => (
        <AppHeader onOpenSettings={defaultProps.onOpenSettings} onShowHelp={onShowHelp} />
      ));

      const button = screen.getByRole('button', { name: /help/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent(HEADER_TEXT.HELP_BUTTON);
    });

    it('does not render help button when onShowHelp not provided', () => {
      render(() => <AppHeader onOpenSettings={defaultProps.onOpenSettings} />);

      const helpButton = screen.queryByRole('button', { name: /open help documentation/i });
      expect(helpButton).not.toBeInTheDocument();
    });

    it('calls onShowHelp when clicked', () => {
      const onShowHelp = vi.fn();

      render(() => (
        <AppHeader onOpenSettings={defaultProps.onOpenSettings} onShowHelp={onShowHelp} />
      ));

      const button = screen.getByRole('button', { name: /help/i });
      fireEvent.click(button);

      expect(onShowHelp).toHaveBeenCalledTimes(1);
    });

    it('help button has correct aria-label', () => {
      const onShowHelp = vi.fn();
      render(() => (
        <AppHeader onOpenSettings={defaultProps.onOpenSettings} onShowHelp={onShowHelp} />
      ));

      const button = screen.getByRole('button', { name: /help/i });
      expect(button).toHaveAttribute('aria-label', HEADER_TEXT.HELP_ARIA_LABEL);
      expect(button).toHaveAttribute('title', HEADER_TEXT.HELP_TITLE);
    });

    it('help button has LifebuoyIcon', () => {
      const onShowHelp = vi.fn();
      render(() => (
        <AppHeader onOpenSettings={defaultProps.onOpenSettings} onShowHelp={onShowHelp} />
      ));

      const button = screen.getByRole('button', { name: /help/i });
      const icon = button.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Keyboard Shortcuts Button', () => {
    it('renders shortcuts button when onShowKeyboardShortcuts provided', () => {
      const onShowKeyboardShortcuts = vi.fn();
      render(() => (
        <AppHeader
          onOpenSettings={defaultProps.onOpenSettings}
          onShowKeyboardShortcuts={onShowKeyboardShortcuts}
        />
      ));

      const button = screen.getByRole('button', { name: /shortcuts/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent(HEADER_TEXT.SHORTCUTS_BUTTON);
    });

    it('does not render shortcuts button when onShowKeyboardShortcuts not provided', () => {
      render(() => <AppHeader onOpenSettings={defaultProps.onOpenSettings} />);

      const shortcutsButton = screen.queryByRole('button', { name: /keyboard shortcuts/i });
      expect(shortcutsButton).not.toBeInTheDocument();
    });

    it('calls onShowKeyboardShortcuts when clicked', () => {
      const onShowKeyboardShortcuts = vi.fn();

      render(() => (
        <AppHeader
          onOpenSettings={defaultProps.onOpenSettings}
          onShowKeyboardShortcuts={onShowKeyboardShortcuts}
        />
      ));

      const button = screen.getByRole('button', { name: /shortcuts/i });
      fireEvent.click(button);

      expect(onShowKeyboardShortcuts).toHaveBeenCalledTimes(1);
    });

    it('shortcuts button has correct aria-label and title', () => {
      const onShowKeyboardShortcuts = vi.fn();
      render(() => (
        <AppHeader
          onOpenSettings={defaultProps.onOpenSettings}
          onShowKeyboardShortcuts={onShowKeyboardShortcuts}
        />
      ));

      const button = screen.getByRole('button', { name: /shortcuts/i });
      expect(button).toHaveAttribute('aria-label', HEADER_TEXT.SHORTCUTS_ARIA_LABEL);
      expect(button).toHaveAttribute('title', HEADER_TEXT.SHORTCUTS_TITLE);
    });

    it('shortcuts button has QuestionMarkCircleIcon', () => {
      const onShowKeyboardShortcuts = vi.fn();
      render(() => (
        <AppHeader
          onOpenSettings={defaultProps.onOpenSettings}
          onShowKeyboardShortcuts={onShowKeyboardShortcuts}
        />
      ));

      const button = screen.getByRole('button', { name: /shortcuts/i });
      const icon = button.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('renders as header element', () => {
      const { container } = render(() => (
        <AppHeader onOpenSettings={defaultProps.onOpenSettings} />
      ));
      const header = container.querySelector('header');
      expect(header).toBeInTheDocument();
    });

    it('includes skip to main content link', () => {
      render(() => <AppHeader onOpenSettings={defaultProps.onOpenSettings} />);
      const skipLink = screen.getByText(HEADER_TEXT.SKIP_LINK);
      expect(skipLink).toBeInTheDocument();
      expect(skipLink).toHaveAttribute('href', HEADER_TEXT.SKIP_LINK_HREF);
    });

    it('skip link is sr-only by default', () => {
      render(() => <AppHeader onOpenSettings={defaultProps.onOpenSettings} />);
      const skipLink = screen.getByText(HEADER_TEXT.SKIP_LINK);
      expect(skipLink).toHaveClass('sr-only');
    });

    it('skip link becomes visible on focus', () => {
      render(() => <AppHeader onOpenSettings={defaultProps.onOpenSettings} />);
      const skipLink = screen.getByText(HEADER_TEXT.SKIP_LINK);
      expect(skipLink).toHaveClass('focus:not-sr-only');
    });

    it('all buttons are keyboard accessible', () => {
      const onOpenSettings = vi.fn();
      const onShowHelp = vi.fn();
      const onShowKeyboardShortcuts = vi.fn();

      render(() => (
        <AppHeader
          onOpenSettings={onOpenSettings}
          onShowHelp={onShowHelp}
          onShowKeyboardShortcuts={onShowKeyboardShortcuts}
        />
      ));

      const helpButton = screen.getByRole('button', { name: /help/i });
      helpButton.focus();
      fireEvent.click(helpButton);
      expect(onShowHelp).toHaveBeenCalled();

      const shortcutsButton = screen.getByRole('button', { name: /shortcuts/i });
      shortcutsButton.focus();
      fireEvent.click(shortcutsButton);
      expect(onShowKeyboardShortcuts).toHaveBeenCalled();

      const settingsButton = screen.getByRole('button', { name: /settings/i });
      settingsButton.focus();
      fireEvent.click(settingsButton);
      expect(onOpenSettings).toHaveBeenCalled();
    });
  });

  describe('Button Order and Layout', () => {
    it('buttons appear in correct order: Help, Shortcuts, Settings', () => {
      const onShowHelp = vi.fn();
      const onShowKeyboardShortcuts = vi.fn();

      render(() => (
        <AppHeader
          onOpenSettings={defaultProps.onOpenSettings}
          onShowHelp={onShowHelp}
          onShowKeyboardShortcuts={onShowKeyboardShortcuts}
        />
      ));

      const buttons = screen.getAllByRole('button');
      expect(buttons[0]).toHaveTextContent(HEADER_TEXT.HELP_BUTTON);
      expect(buttons[1]).toHaveTextContent(HEADER_TEXT.SHORTCUTS_BUTTON);
      expect(buttons[2]).toHaveTextContent(HEADER_TEXT.SETTINGS_BUTTON);
    });

    it('settings button always present', () => {
      render(() => <AppHeader onOpenSettings={defaultProps.onOpenSettings} />);
      expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
    });

    it('optional buttons render conditionally', () => {
      // Without optional buttons - only settings
      render(() => <AppHeader onOpenSettings={defaultProps.onOpenSettings} />);
      expect(screen.queryByRole('button', { name: /help/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /shortcuts/i })).not.toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('applies primary background color', () => {
      const { container } = render(() => (
        <AppHeader onOpenSettings={defaultProps.onOpenSettings} />
      ));
      const header = container.querySelector('header');
      expect(header).toHaveClass('bg-primary');
    });

    it('applies primary-foreground text color', () => {
      const { container } = render(() => (
        <AppHeader onOpenSettings={defaultProps.onOpenSettings} />
      ));
      const header = container.querySelector('header');
      expect(header).toHaveClass('text-primary-foreground');
    });

    it('has border and shadow', () => {
      const { container } = render(() => (
        <AppHeader onOpenSettings={defaultProps.onOpenSettings} />
      ));
      const header = container.querySelector('header');
      expect(header).toHaveClass('shadow-md', 'border-b-2');
    });

    it('uses flexbox for layout', () => {
      const { container } = render(() => (
        <AppHeader onOpenSettings={defaultProps.onOpenSettings} />
      ));
      const header = container.querySelector('header');
      expect(header).toHaveClass('flex', 'items-center', 'justify-between');
    });
  });
});
