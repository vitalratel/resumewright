/**
 * Alert Component Tests
 *
 * Tests Alert component for proper rendering, accessibility,
 * dismissible functionality, and variant behavior.
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, vi } from 'vitest';
import { Alert } from '../Alert';

describe('Alert', () => {
  describe('Rendering', () => {
    it.each([
      { variant: 'error' as const, expectedRole: 'alert', expectedAriaLive: 'assertive' },
      { variant: 'success' as const, expectedRole: 'status', expectedAriaLive: 'polite' },
      { variant: 'info' as const, expectedRole: 'status', expectedAriaLive: 'polite' },
      { variant: 'warning' as const, expectedRole: 'status', expectedAriaLive: 'polite' },
    ])('renders $variant variant with correct ARIA attributes', ({ variant, expectedRole, expectedAriaLive }) => {
      render(
        <Alert variant={variant}>
          <p>Test message</p>
        </Alert>,
      );

      const alert = screen.getByRole(expectedRole);
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveAttribute('aria-live', expectedAriaLive);
    });

    it('renders children content', () => {
      render(
        <Alert variant="info">
          <p>This is an info message</p>
          <span>Additional content</span>
        </Alert>,
      );

      expect(screen.getByText('This is an info message')).toBeInTheDocument();
      expect(screen.getByText('Additional content')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <Alert variant="info" className="custom-class">
          <p>Message</p>
        </Alert>,
      );

      const alert = container.firstChild as HTMLElement;
      expect(alert).toHaveClass('custom-class');
    });

    it('uses assertive announcement by default for error variant', () => {
      render(
        <Alert variant="error">
          <p>Error message</p>
        </Alert>,
      );

      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'assertive');
    });

    it('uses polite announcement by default for non-error variants', () => {
      render(
        <Alert variant="success">
          <p>Success message</p>
        </Alert>,
      );

      const alert = screen.getByRole('status');
      expect(alert).toHaveAttribute('aria-live', 'polite');
    });

    it('overrides default assertive behavior when explicitly set', () => {
      render(
        <Alert variant="error" assertive={false}>
          <p>Error message</p>
        </Alert>,
      );

      const alert = screen.getByRole('status');
      expect(alert).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Dismissible Functionality', () => {
    it('does not render dismiss button by default', () => {
      render(
        <Alert variant="info">
          <p>Message</p>
        </Alert>,
      );

      expect(screen.queryByRole('button', { name: /dismiss/i })).not.toBeInTheDocument();
    });

    it('renders dismiss button when dismissible is true and onDismiss is provided', () => {
      const onDismiss = vi.fn();

      render(
        <Alert variant="info" dismissible onDismiss={onDismiss}>
          <p>Message</p>
        </Alert>,
      );

      expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument();
    });

    it('does not render dismiss button when dismissible is true but onDismiss is not provided', () => {
      render(
        <Alert variant="info" dismissible>
          <p>Message</p>
        </Alert>,
      );

      expect(screen.queryByRole('button', { name: /dismiss/i })).not.toBeInTheDocument();
    });

    it('calls onDismiss when dismiss button is clicked', async () => {
      const user = userEvent.setup();
      const onDismiss = vi.fn();

      render(
        <Alert variant="info" dismissible onDismiss={onDismiss}>
          <p>Message</p>
        </Alert>,
      );

      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      await user.click(dismissButton);

      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('dismiss button is keyboard accessible', async () => {
      const user = userEvent.setup();
      const onDismiss = vi.fn();

      render(
        <Alert variant="info" dismissible onDismiss={onDismiss}>
          <p>Message</p>
        </Alert>,
      );

      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      dismissButton.focus();

      expect(dismissButton).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('dismiss button has correct type attribute', () => {
      const onDismiss = vi.fn();

      render(
        <Alert variant="info" dismissible onDismiss={onDismiss}>
          <p>Message</p>
        </Alert>,
      );

      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      expect(dismissButton).toHaveAttribute('type', 'button');
    });

    it('dismiss button icon has aria-hidden attribute', () => {
      const onDismiss = vi.fn();

      render(
        <Alert variant="info" dismissible onDismiss={onDismiss}>
          <p>Message</p>
        </Alert>,
      );

      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      const icon = dismissButton.querySelector('svg');

      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Development Warnings', () => {
    let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleWarnSpy.mockRestore();
    });

    it('warns in development when dismissible is true but onDismiss is not provided', () => {
      // Mock import.meta.env.MODE to development (default in tests)
      vi.stubEnv('MODE', 'development');

      render(
        <Alert variant="info" dismissible>
          <p>Message</p>
        </Alert>,
      );

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[ResumeWright] [Alert] [WARN] dismissible=true but onDismiss is not provided. Button will not render.',
      );

      vi.unstubAllEnvs();
    });

    it('does not warn when dismissible is true and onDismiss is provided', () => {
      vi.stubEnv('MODE', 'development');

      render(
        <Alert variant="info" dismissible onDismiss={() => {}}>
          <p>Message</p>
        </Alert>,
      );

      expect(consoleWarnSpy).not.toHaveBeenCalled();

      vi.unstubAllEnvs();
    });

    it('does not warn when dismissible is false', () => {
      vi.stubEnv('MODE', 'development');

      render(
        <Alert variant="info" dismissible={false}>
          <p>Message</p>
        </Alert>,
      );

      expect(consoleWarnSpy).not.toHaveBeenCalled();

      vi.unstubAllEnvs();
    });

    it('does not warn in production build', () => {
      // Mock import.meta.env.MODE to production
      vi.stubEnv('MODE', 'production');

      render(
        <Alert variant="info" dismissible>
          <p>Message</p>
        </Alert>,
      );

      expect(consoleWarnSpy).not.toHaveBeenCalled();

      // Clean up is handled by vi.unstubAllEnvs() in afterEach
      vi.unstubAllEnvs();
    });
  });

  describe('Variant Styling', () => {
    it.each([
      'error',
      'success',
      'info',
      'warning',
    ] as const)('renders %s variant with appropriate styling classes', (variant) => {
      const { container } = render(
        <Alert variant={variant}>
          <p>Message</p>
        </Alert>,
      );

      const alert = container.firstChild as HTMLElement;

      // All variants should have common styling
      expect(alert.className).toContain('rounded');
      expect(alert.className).toContain('border');

      // Variants have specific colors (we don't need to test exact Tailwind classes)
      expect(alert).toBeInTheDocument();
    });
  });

  describe('Layout', () => {
    it('uses flex layout when dismissible', () => {
      const onDismiss = vi.fn();

      const { container } = render(
        <Alert variant="info" dismissible onDismiss={onDismiss}>
          <p>Message</p>
        </Alert>,
      );

      const alert = container.firstChild as HTMLElement;
      expect(alert.className).toContain('flex');
      expect(alert.className).toContain('items-start');
      expect(alert.className).toContain('justify-between');
    });

    it('does not use flex layout when not dismissible', () => {
      const { container } = render(
        <Alert variant="info">
          <p>Message</p>
        </Alert>,
      );

      const alert = container.firstChild as HTMLElement;
      // Should not have flex classes when not dismissible
      expect(alert.className).not.toContain('flex items-start justify-between');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA role for error alerts', () => {
      render(
        <Alert variant="error">
          <p>Error occurred</p>
        </Alert>,
      );

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    it('has proper ARIA role for non-error alerts', () => {
      render(
        <Alert variant="success">
          <p>Success message</p>
        </Alert>,
      );

      const alert = screen.getByRole('status');
      expect(alert).toBeInTheDocument();
    });

    it('dismiss button has accessible label', () => {
      const onDismiss = vi.fn();

      render(
        <Alert variant="info" dismissible onDismiss={onDismiss}>
          <p>Message</p>
        </Alert>,
      );

      const dismissButton = screen.getByRole('button', { name: 'Dismiss alert' });
      expect(dismissButton).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty children gracefully', () => {
      render(
        <Alert variant="info">
          {''}
        </Alert>,
      );

      const alert = screen.getByRole('status');
      expect(alert).toBeInTheDocument();
    });

    it('handles complex children structure', () => {
      render(
        <Alert variant="warning">
          <div>
            <h3>Warning Title</h3>
            <p>Warning message</p>
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
            </ul>
          </div>
        </Alert>,
      );

      expect(screen.getByText('Warning Title')).toBeInTheDocument();
      expect(screen.getByText('Warning message')).toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });

    it('handles multiple onDismiss calls correctly', async () => {
      const user = userEvent.setup();
      const onDismiss = vi.fn();

      render(
        <Alert variant="info" dismissible onDismiss={onDismiss}>
          <p>Message</p>
        </Alert>,
      );

      const dismissButton = screen.getByRole('button', { name: /dismiss/i });

      await user.click(dismissButton);
      await user.click(dismissButton);
      await user.click(dismissButton);

      expect(onDismiss).toHaveBeenCalledTimes(3);
    });
  });
});
