/**
 * ABOUTME: Tests for Button component with variants, loading/pending states, and accessibility.
 * ABOUTME: Validates click handling, double-click prevention, spinner delay, and icon support.
 */

import { fireEvent, render, screen } from '@solidjs/testing-library';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Button } from '../Button';

function MockIcon(props: { class?: string; 'aria-hidden'?: string }) {
  return (
    <svg
      data-testid="mock-icon"
      aria-hidden={props['aria-hidden']}
      class={props.class}
      role="img"
      aria-label="Mock icon"
    >
      <path d="M0 0h24v24H0z" />
    </svg>
  );
}

describe('Button', () => {
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('renders with children text', () => {
      render(() => <Button>Click me</Button>);
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });

    it('renders as full width by default', () => {
      const { container } = render(() => <Button>Test</Button>);
      const button = container.querySelector('button');
      expect(button).toHaveClass('w-full');
    });

    it('renders as auto width when fullWidth is false', () => {
      const { container } = render(() => <Button fullWidth={false}>Test</Button>);
      const button = container.querySelector('button');
      expect(button).not.toHaveClass('w-full');
    });

    it('applies custom class', () => {
      const { container } = render(() => <Button class="custom-class">Test</Button>);
      const button = container.querySelector('button');
      expect(button).toHaveClass('custom-class');
    });

    it.each([
      ['primary', 'bg-primary'],
      ['secondary', 'border-2'],
      ['tertiary', 'bg-muted'],
      ['danger', 'bg-danger-action'],
      ['ghost', 'bg-transparent'],
      ['link', 'hover:underline'],
    ] as const)('renders %s variant with correct styling', (variant, expectedClass) => {
      const { container } = render(() => <Button variant={variant}>Test</Button>);
      const button = container.querySelector('button');
      expect(button).toHaveClass(expectedClass);
    });
  });

  describe('Click Handling', () => {
    it('calls onClick when clicked', () => {
      const onClick = vi.fn();

      render(() => <Button onClick={onClick}>Click</Button>);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', () => {
      const onClick = vi.fn();

      render(() => (
        <Button onClick={onClick} disabled>
          Click
        </Button>
      ));

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(onClick).not.toHaveBeenCalled();
    });

    it('does not call onClick when loading', () => {
      const onClick = vi.fn();

      render(() => (
        <Button onClick={onClick} loading>
          Click
        </Button>
      ));

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(onClick).not.toHaveBeenCalled();
    });

    it('prevents double-clicks with pending state', () => {
      vi.useFakeTimers();
      const onClick = vi.fn();

      render(() => <Button onClick={onClick}>Click</Button>);

      const button = screen.getByRole('button');

      // First click succeeds
      fireEvent.click(button);
      expect(onClick).toHaveBeenCalledTimes(1);

      // Second click immediately after is blocked (pending state)
      fireEvent.click(button);
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('allows clicking again after pending state clears', () => {
      vi.useFakeTimers();
      const onClick = vi.fn();

      render(() => <Button onClick={onClick}>Click</Button>);

      const button = screen.getByRole('button');

      // First click
      fireEvent.click(button);
      expect(onClick).toHaveBeenCalledTimes(1);

      // Advance past pending timeout (100ms)
      vi.advanceTimersByTime(150);

      // Second click should work
      fireEvent.click(button);
      expect(onClick).toHaveBeenCalledTimes(2);
    });
  });

  describe('Loading State', () => {
    it('shows spinner after delay when loading', () => {
      vi.useFakeTimers();

      const { container } = render(() => <Button loading>Loading</Button>);

      // Spinner should NOT be visible yet (300ms delay)
      expect(container.querySelector('svg.animate-spin')).not.toBeInTheDocument();

      // Advance past spinner delay
      vi.advanceTimersByTime(300);

      expect(container.querySelector('svg.animate-spin')).toBeInTheDocument();
    });

    it('sets aria-busy when loading', () => {
      render(() => <Button loading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('disables button when loading', () => {
      render(() => <Button loading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('hides custom icon when loading', () => {
      render(() => (
        <Button icon={MockIcon} loading>
          Loading
        </Button>
      ));

      expect(screen.queryByTestId('mock-icon')).not.toBeInTheDocument();
    });
  });

  describe('Success State', () => {
    it('shows checkmark when success', () => {
      const { container } = render(() => <Button success>Success</Button>);

      const checkmark = container.querySelector('svg path[fill-rule="evenodd"]');
      expect(checkmark).toBeInTheDocument();
    });

    it('sets aria-live when success', () => {
      render(() => <Button success>Success</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-live', 'polite');
    });

    it('hides custom icon when success', () => {
      render(() => (
        <Button icon={MockIcon} success>
          Success
        </Button>
      ));

      expect(screen.queryByTestId('mock-icon')).not.toBeInTheDocument();
    });

    it('does not show spinner when success', () => {
      const { container } = render(() => <Button success>Success</Button>);

      const spinner = container.querySelector('svg.animate-spin');
      expect(spinner).not.toBeInTheDocument();
    });
  });

  describe('Icon Support', () => {
    it('renders custom icon when provided', () => {
      render(() => <Button icon={MockIcon}>With Icon</Button>);

      expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
    });

    it('does not render icon when loading', () => {
      render(() => (
        <Button icon={MockIcon} loading>
          Loading
        </Button>
      ));

      expect(screen.queryByTestId('mock-icon')).not.toBeInTheDocument();
    });

    it('does not render icon when success', () => {
      render(() => (
        <Button icon={MockIcon} success>
          Success
        </Button>
      ));

      expect(screen.queryByTestId('mock-icon')).not.toBeInTheDocument();
    });

    it('icon has aria-hidden attribute', () => {
      render(() => <Button icon={MockIcon}>With Icon</Button>);

      const icon = screen.getByTestId('mock-icon');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Disabled State', () => {
    it('disables button when disabled prop is true', () => {
      render(() => <Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('does not call onClick when disabled', () => {
      const onClick = vi.fn();

      render(() => (
        <Button onClick={onClick} disabled>
          Disabled
        </Button>
      ));

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has button role', () => {
      render(() => <Button>Test</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('is keyboard accessible', () => {
      const onClick = vi.fn();

      render(() => <Button onClick={onClick}>Test</Button>);

      const button = screen.getByRole('button');
      button.focus();

      expect(button).toHaveFocus();

      fireEvent.keyDown(button, { key: 'Enter' });
      // Note: native button handles Enter key via click event
    });

    it('forwards ref correctly', () => {
      let buttonRef: HTMLButtonElement | undefined;

      render(() => (
        <Button
          ref={(el) => {
            buttonRef = el;
          }}
        >
          Test
        </Button>
      ));

      expect(buttonRef).toBeInstanceOf(HTMLButtonElement);
      expect(buttonRef).toHaveTextContent('Test');
    });

    it('spinner has aria-hidden attribute', () => {
      vi.useFakeTimers();

      const { container } = render(() => <Button loading>Loading</Button>);
      vi.advanceTimersByTime(300);

      const spinner = container.querySelector('svg.animate-spin');
      expect(spinner).toHaveAttribute('aria-hidden', 'true');
    });

    it('checkmark has aria-hidden attribute', () => {
      const { container } = render(() => <Button success>Success</Button>);

      const checkmark = container.querySelector('svg');
      expect(checkmark).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('HTML Button Attributes', () => {
    it('forwards type attribute', () => {
      render(() => <Button type="submit">Submit</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('forwards aria-label attribute', () => {
      render(() => <Button aria-label="Custom label">Test</Button>);
      const button = screen.getByRole('button', { name: 'Custom label' });
      expect(button).toBeInTheDocument();
    });

    it('forwards data attributes', () => {
      render(() => <Button data-testid="custom-test-id">Test</Button>);
      expect(screen.getByTestId('custom-test-id')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles missing onClick gracefully', () => {
      render(() => <Button>No onClick</Button>);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Should not throw error
      expect(button).toBeInTheDocument();
    });

    it('handles loading and disabled simultaneously', () => {
      render(() => (
        <Button loading disabled>
          Both
        </Button>
      ));
      const button = screen.getByRole('button');

      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('handles success and loading simultaneously (loading takes precedence)', () => {
      vi.useFakeTimers();

      const { container } = render(() => (
        <Button loading success>
          Both
        </Button>
      ));

      vi.advanceTimersByTime(300);

      // Should show spinner, not checkmark
      const spinner = container.querySelector('svg.animate-spin');
      expect(spinner).toBeInTheDocument();

      const checkmark = container.querySelector('svg path[fill-rule="evenodd"]');
      expect(checkmark).not.toBeInTheDocument();
    });

    it('handles empty children', () => {
      render(() => <Button>{''}</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('handles complex children', () => {
      render(() => (
        <Button>
          <span>Complex</span>
          <strong>Children</strong>
        </Button>
      ));

      expect(screen.getByText('Complex')).toBeInTheDocument();
      expect(screen.getByText('Children')).toBeInTheDocument();
    });
  });

  describe('Variant-Specific Behavior', () => {
    it('primary variant has correct colors', () => {
      const { container } = render(() => <Button variant="primary">Primary</Button>);
      const button = container.querySelector('button');
      expect(button).toHaveClass('bg-primary');
      expect(button).toHaveClass('text-primary-foreground');
    });

    it('danger variant has correct colors', () => {
      const { container } = render(() => <Button variant="danger">Danger</Button>);
      const button = container.querySelector('button');
      expect(button).toHaveClass('bg-danger-action');
      expect(button).toHaveClass('text-white');
    });

    it('ghost variant has transparent background', () => {
      const { container } = render(() => <Button variant="ghost">Ghost</Button>);
      const button = container.querySelector('button');
      expect(button).toHaveClass('bg-transparent');
    });

    it('link variant has hover underline', () => {
      const { container } = render(() => <Button variant="link">Link</Button>);
      const button = container.querySelector('button');
      expect(button).toHaveClass('hover:underline');
    });
  });
});
