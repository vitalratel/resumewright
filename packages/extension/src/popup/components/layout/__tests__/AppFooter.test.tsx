/**
 * AppFooter Component Tests
 *
 * Tests AppFooter for proper rendering of privacy message,
 * help link, version display, and browser API interaction.
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { fakeBrowser } from '@webext-core/fake-browser';
import { beforeEach, describe, expect, vi } from 'vitest';
import { browser } from 'wxt/browser';
import { EXTERNAL_LINKS } from '../../../../shared/config/externalLinks';
import { AppFooter } from '../AppFooter';

// Note: wxt/browser is mocked globally in vitest.setup.ts with fakeBrowser
// We spy on fakeBrowser methods to control behavior

// Test constants matching component text
const FOOTER_TEXT = {
  HELP_BUTTON: 'Help & FAQ',
  HELP_ARIA_LABEL: 'Open help center in new tab',
  PRIVACY_MESSAGE: 'Privacy-first',
  DEFAULT_VERSION: '1.2.3',
  BETA_VERSION: '2.0.0-beta.1',
} as const;

describe('AppFooter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock getManifest since fakeBrowser doesn't implement it
    vi.spyOn(fakeBrowser.runtime, 'getManifest').mockReturnValue({
      manifest_version: 3,
      name: 'Test Extension',
      version: '1.2.3',
    });
    // Spy on tabs.create so we can verify it was called
    vi.spyOn(fakeBrowser.tabs, 'create');
  });

  describe('Rendering', () => {
    it('renders as footer element', () => {
      const { container } = render(<AppFooter />);
      const footer = container.querySelector('footer');
      expect(footer).toBeInTheDocument();
    });

    it('renders help button', () => {
      render(<AppFooter />);
      const helpButton = screen.getByRole('button', { name: /open help center/i });
      expect(helpButton).toBeInTheDocument();
    });

    it('renders privacy message', () => {
      render(<AppFooter />);
      expect(screen.getByText(FOOTER_TEXT.PRIVACY_MESSAGE)).toBeInTheDocument();
    });

    it('renders version number', () => {
      render(<AppFooter />);
      expect(screen.getByText(`v${FOOTER_TEXT.DEFAULT_VERSION}`)).toBeInTheDocument();
    });
  });

  describe('Help Button', () => {
    it('has correct text and icon', () => {
      render(<AppFooter />);
      const helpButton = screen.getByRole('button', { name: /open help center/i });

      expect(helpButton).toHaveTextContent(FOOTER_TEXT.HELP_BUTTON);
      expect(helpButton.querySelector('svg')).toBeInTheDocument(); // QuestionMarkCircleIcon
    });

    it('has accessible aria-label', () => {
      render(<AppFooter />);
      const helpButton = screen.getByRole('button', { name: /open help center/i });
      expect(helpButton).toHaveAttribute('aria-label', FOOTER_TEXT.HELP_ARIA_LABEL);
    });

    it('icon has aria-hidden', () => {
      render(<AppFooter />);
      const helpButton = screen.getByRole('button', { name: /open help center/i });
      const icon = helpButton.querySelector('svg');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('opens help URL in new tab when clicked', async () => {
      const user = userEvent.setup();
      render(<AppFooter />);

      const helpButton = screen.getByRole('button', { name: /open help center/i });
      await user.click(helpButton);

      expect(browser.tabs.create).toHaveBeenCalledTimes(1);
      expect(browser.tabs.create).toHaveBeenCalledWith({
        url: EXTERNAL_LINKS.HELP_URL, // Import from central config
      });
    });

    it('is keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<AppFooter />);

      const helpButton = screen.getByRole('button', { name: /open help center/i });
      helpButton.focus();
      expect(helpButton).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(browser.tabs.create).toHaveBeenCalled();
    });
  });

  describe('Privacy Message', () => {
    it('has success icon', () => {
      render(<AppFooter />);
      const privacyText = screen.getByText(FOOTER_TEXT.PRIVACY_MESSAGE);
      const icon = privacyText.closest('div')?.querySelector('svg');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('icon has success color', () => {
      render(<AppFooter />);
      const privacyDiv = screen.getByText(FOOTER_TEXT.PRIVACY_MESSAGE).closest('div');
      const icon = privacyDiv?.querySelector('svg');
      expect(icon).toHaveClass('text-green-600', 'dark:text-green-400');
    });

    it('displays privacy message text', () => {
      render(<AppFooter />);
      expect(screen.getByText(FOOTER_TEXT.PRIVACY_MESSAGE)).toBeInTheDocument();
    });
  });

  describe('Version Display', () => {
    it('displays version from manifest', () => {
      render(<AppFooter />);
      expect(screen.getByText(`v${FOOTER_TEXT.DEFAULT_VERSION}`)).toBeInTheDocument();
    });

    it('calls getManifest on render', () => {
      render(<AppFooter />);
      expect(browser.runtime.getManifest).toHaveBeenCalled();
    });

    it('handles different version formats', () => {
      vi.mocked(browser.runtime.getManifest).mockReturnValue({
        manifest_version: 3,
        name: 'Test Extension',
        version: FOOTER_TEXT.BETA_VERSION,
      });

      render(<AppFooter />);
      expect(screen.getByText(`v${FOOTER_TEXT.BETA_VERSION}`)).toBeInTheDocument();
    });

    it('version has muted text color', () => {
      render(<AppFooter />);
      const versionText = screen.getByText(/^v\d+\.\d+\.\d+/);
      expect(versionText).toHaveClass('text-gray-600', 'dark:text-gray-400');
    });
  });

  describe('Layout', () => {
    it('uses flexbox for horizontal layout', () => {
      const { container } = render(<AppFooter />);
      const innerDiv = container.querySelector('footer > div');
      expect(innerDiv).toHaveClass('flex', 'items-center', 'justify-between');
    });

    it('has border on top', () => {
      const { container } = render(<AppFooter />);
      const footer = container.querySelector('footer');
      expect(footer).toHaveClass('border-t');
    });

    it('has white background', () => {
      const { container } = render(<AppFooter />);
      const footer = container.querySelector('footer');
      expect(footer).toHaveClass('bg-white', 'dark:bg-gray-850');
    });

    it('has padding', () => {
      const { container } = render(<AppFooter />);
      const footer = container.querySelector('footer');
      expect(footer).toHaveClass('px-4', 'py-3');
    });

    it('uses extra small text size', () => {
      const { container } = render(<AppFooter />);
      const innerDiv = container.querySelector('footer > div');
      expect(innerDiv).toHaveClass('text-xs');
    });
  });

  describe('Element Order', () => {
    it('help button appears first (left)', () => {
      const { container } = render(<AppFooter />);
      const children = Array.from(container.querySelector('footer > div')?.children || []);

      const helpButton = children[0];
      expect(helpButton).toHaveTextContent(FOOTER_TEXT.HELP_BUTTON);
    });

    it('privacy message appears in middle', () => {
      const { container } = render(<AppFooter />);
      const children = Array.from(container.querySelector('footer > div')?.children || []);

      const privacyDiv = children[1];
      expect(privacyDiv).toHaveTextContent(FOOTER_TEXT.PRIVACY_MESSAGE);
    });

    it('version appears last (right)', () => {
      const { container } = render(<AppFooter />);
      const children = Array.from(container.querySelector('footer > div')?.children || []);

      const versionSpan = children[2];
      expect(versionSpan.textContent).toMatch(/^v\d+\.\d+/);
    });
  });

  describe('Accessibility', () => {
    it('help button has focus ring on focus', () => {
      render(<AppFooter />);
      const helpButton = screen.getByRole('button', { name: /open help center/i });
      expect(helpButton).toHaveClass('focus:outline-none', 'focus:ring-2');
    });

    it('all icons are decorative (aria-hidden)', () => {
      const { container } = render(<AppFooter />);
      const icons = container.querySelectorAll('svg');

      icons.forEach((icon) => {
        expect(icon).toHaveAttribute('aria-hidden', 'true');
      });
    });

    it('help button has descriptive aria-label', () => {
      render(<AppFooter />);
      const helpButton = screen.getByRole('button', { name: /open help center/i });
      expect(helpButton).toHaveAttribute('aria-label', FOOTER_TEXT.HELP_ARIA_LABEL);
    });
  });

  describe('Styling and Transitions', () => {
    it('help button has hover effects', () => {
      render(<AppFooter />);
      const helpButton = screen.getByRole('button', { name: /open help center/i });
      expect(helpButton).toHaveClass('hover:text-blue-700', 'dark:hover:text-blue-300');
    });

    it('help button has transition classes', () => {
      render(<AppFooter />);
      const helpButton = screen.getByRole('button', { name: /open help center/i });
      expect(helpButton).toHaveClass('transition-all', 'duration-300');
    });

    it('help button has rounded corners', () => {
      render(<AppFooter />);
      const helpButton = screen.getByRole('button', { name: /open help center/i });
      expect(helpButton).toHaveClass('rounded-md');
    });
  });
});
