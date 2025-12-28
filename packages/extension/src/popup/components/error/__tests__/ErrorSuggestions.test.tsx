/**
 * ErrorSuggestions Component Tests
 *
 * Tests ErrorSuggestions component for proper rendering of:
 * - Prioritized suggestions with "Most likely" badges
 * - Help links and resources
 * - Size reduction tips
 * - Retry warnings
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, vi } from 'vitest';
import { ErrorCode } from '../../../../shared/errors/codes';
import { ErrorSuggestions } from '../ErrorSuggestions';
import { createError } from './testHelpers';

// Mock help resources utilities
vi.mock('@/shared/errors/helpResources', () => ({
  getHelpLinkForSuggestion: vi.fn((text: string) => {
    if (text.includes('file size')) {
      return {
        text: 'Learn about file limits',
        url: 'https://example.com/limits',
        type: 'external' as const,
      };
    }
    return null;
  }),
  getHelpResourcesForError: vi.fn((code: string) => {
    if (code === ErrorCode.MEMORY_LIMIT_EXCEEDED) {
      return [
        {
          text: 'Memory troubleshooting',
          url: 'https://example.com/memory',
          type: 'external' as const,
        },
      ];
    }
    return [];
  }),
}));

describe('ErrorSuggestions', () => {
  describe('Main Suggestions', () => {
    it('renders suggestions list when provided', () => {
      const error = createError();
      const suggestions = [
        { text: 'Try reducing file size', mostLikely: true },
        { text: 'Restart your browser' },
        { text: 'Contact support' },
      ];

      render(
        <ErrorSuggestions
          error={error}
          retryAttempt={0}
          prioritizedSuggestions={suggestions}
          isSizeError={false}
          sizeReductionTips={[]}
        />,
      );

      expect(screen.getByTestId('error-suggestions')).toBeInTheDocument();
      expect(screen.getByText('What you can try:')).toBeInTheDocument();
      expect(screen.getByText('Try reducing file size')).toBeInTheDocument();
      expect(screen.getByText('Restart your browser')).toBeInTheDocument();
      expect(screen.getByText('Contact support')).toBeInTheDocument();
    });

    it('does not render suggestions section when empty', () => {
      const error = createError();

      render(
        <ErrorSuggestions
          error={error}
          retryAttempt={0}
          prioritizedSuggestions={[]}
          isSizeError={false}
          sizeReductionTips={[]}
        />,
      );

      expect(screen.queryByTestId('error-suggestions')).not.toBeInTheDocument();
    });

    it('shows "Most likely" badge for top suggestions', () => {
      const error = createError();
      const suggestions = [
        { text: 'Top suggestion', mostLikely: true },
        { text: 'Other suggestion' },
      ];

      render(
        <ErrorSuggestions
          error={error}
          retryAttempt={0}
          prioritizedSuggestions={suggestions}
          isSizeError={false}
          sizeReductionTips={[]}
        />,
      );

      const badge = screen.getByText('Most likely');
      expect(badge).toBeInTheDocument();
      // Badge is styled with success colors to indicate high likelihood
      expect(badge).toHaveClass('bg-success/10');
    });

    it('does not show badge for suggestions without mostLikely flag', () => {
      const error = createError();
      const suggestions = [{ text: 'Regular suggestion' }];

      render(
        <ErrorSuggestions
          error={error}
          retryAttempt={0}
          prioritizedSuggestions={suggestions}
          isSizeError={false}
          sizeReductionTips={[]}
        />,
      );

      expect(screen.queryByText('Most likely')).not.toBeInTheDocument();
    });

    it('displays rationale when provided', () => {
      const error = createError();
      const suggestions = [
        {
          text: 'Try this solution',
          rationale: 'This often fixes the issue because...',
        },
      ];

      render(
        <ErrorSuggestions
          error={error}
          retryAttempt={0}
          prioritizedSuggestions={suggestions}
          isSizeError={false}
          sizeReductionTips={[]}
        />,
      );

      expect(screen.getByText(/Why:/)).toBeInTheDocument();
      expect(screen.getByText(/This often fixes the issue because/)).toBeInTheDocument();
    });

    it('numbers suggestions sequentially', () => {
      const error = createError();
      const suggestions = [
        { text: 'First suggestion' },
        { text: 'Second suggestion' },
        { text: 'Third suggestion' },
      ];

      render(
        <ErrorSuggestions
          error={error}
          retryAttempt={0}
          prioritizedSuggestions={suggestions}
          isSizeError={false}
          sizeReductionTips={[]}
        />,
      );

      expect(screen.getByText('1.')).toBeInTheDocument();
      expect(screen.getByText('2.')).toBeInTheDocument();
      expect(screen.getByText('3.')).toBeInTheDocument();
    });
  });

  describe('Help Links', () => {
    it('renders help link for suggestions with matching resources', () => {
      const error = createError();
      const suggestions = [{ text: 'Reduce file size to continue' }];

      render(
        <ErrorSuggestions
          error={error}
          retryAttempt={0}
          prioritizedSuggestions={suggestions}
          isSizeError={false}
          sizeReductionTips={[]}
        />,
      );

      const link = screen.getByText('Learn about file limits');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', 'https://example.com/limits');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('does not render help link when no match found', () => {
      const error = createError();
      const suggestions = [{ text: 'Some other suggestion' }];

      render(
        <ErrorSuggestions
          error={error}
          retryAttempt={0}
          prioritizedSuggestions={suggestions}
          isSizeError={false}
          sizeReductionTips={[]}
        />,
      );

      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    it('external links have proper aria-label', () => {
      const error = createError();
      const suggestions = [{ text: 'Reduce file size' }];

      render(
        <ErrorSuggestions
          error={error}
          retryAttempt={0}
          prioritizedSuggestions={suggestions}
          isSizeError={false}
          sizeReductionTips={[]}
        />,
      );

      const link = screen.getByLabelText('Learn more: Learn about file limits');
      expect(link).toBeInTheDocument();
    });
  });

  describe('Help Resources', () => {
    it('renders additional resources section for errors with help resources', () => {
      const error = createError({ code: ErrorCode.MEMORY_LIMIT_EXCEEDED });
      const suggestions = [{ text: 'Some suggestion' }];

      render(
        <ErrorSuggestions
          error={error}
          retryAttempt={0}
          prioritizedSuggestions={suggestions}
          isSizeError={false}
          sizeReductionTips={[]}
        />,
      );

      expect(screen.getByText('Additional resources:')).toBeInTheDocument();
      expect(screen.getByText('Memory troubleshooting')).toBeInTheDocument();
    });

    it('does not render resources section when no resources available', () => {
      const error = createError({ code: ErrorCode.WASM_EXECUTION_ERROR });
      const suggestions = [{ text: 'Some suggestion' }];

      render(
        <ErrorSuggestions
          error={error}
          retryAttempt={0}
          prioritizedSuggestions={suggestions}
          isSizeError={false}
          sizeReductionTips={[]}
        />,
      );

      expect(screen.queryByText('Additional resources:')).not.toBeInTheDocument();
    });
  });

  describe('Size Reduction Tips', () => {
    it('renders size reduction section when isSizeError is true', () => {
      const error = createError();
      const tips = [
        'Remove unnecessary images',
        'Compress large files',
        'Simplify complex content',
      ];

      render(
        <ErrorSuggestions
          error={error}
          retryAttempt={0}
          prioritizedSuggestions={[]}
          isSizeError={true}
          sizeReductionTips={tips}
        />,
      );

      expect(screen.getByText('How to reduce your CV size:')).toBeInTheDocument();
      expect(screen.getByText('Remove unnecessary images')).toBeInTheDocument();
      expect(screen.getByText('Compress large files')).toBeInTheDocument();
      expect(screen.getByText('Simplify complex content')).toBeInTheDocument();
    });

    it('does not render size section when isSizeError is false', () => {
      const error = createError();
      const tips = ['Some tip'];

      render(
        <ErrorSuggestions
          error={error}
          retryAttempt={0}
          prioritizedSuggestions={[]}
          isSizeError={false}
          sizeReductionTips={tips}
        />,
      );

      expect(screen.queryByText('How to reduce your CV size:')).not.toBeInTheDocument();
    });

    it('does not render size section when tips array is empty', () => {
      const error = createError();

      render(
        <ErrorSuggestions
          error={error}
          retryAttempt={0}
          prioritizedSuggestions={[]}
          isSizeError={true}
          sizeReductionTips={[]}
        />,
      );

      expect(screen.queryByText('How to reduce your CV size:')).not.toBeInTheDocument();
    });
  });

  describe('Retry Warning', () => {
    it('shows retry warning when retryAttempt >= 3', () => {
      const error = createError({ recoverable: true });

      render(
        <ErrorSuggestions
          error={error}
          retryAttempt={3}
          prioritizedSuggestions={[]}
          isSizeError={false}
          sizeReductionTips={[]}
        />,
      );

      expect(screen.getByText('Multiple retry attempts detected')).toBeInTheDocument();
      expect(screen.getByText(/You've tried 3 times/)).toBeInTheDocument();
    });

    it('does not show retry warning when retryAttempt < 3', () => {
      const error = createError({ recoverable: true });

      render(
        <ErrorSuggestions
          error={error}
          retryAttempt={2}
          prioritizedSuggestions={[]}
          isSizeError={false}
          sizeReductionTips={[]}
        />,
      );

      expect(screen.queryByText('Multiple retry attempts detected')).not.toBeInTheDocument();
    });

    it('does not show retry warning when error is not recoverable', () => {
      const error = createError({ recoverable: false });

      render(
        <ErrorSuggestions
          error={error}
          retryAttempt={5}
          prioritizedSuggestions={[]}
          isSizeError={false}
          sizeReductionTips={[]}
        />,
      );

      expect(screen.queryByText('Multiple retry attempts detected')).not.toBeInTheDocument();
    });

    it('displays retry attempt count in warning', () => {
      const error = createError({ recoverable: true });

      render(
        <ErrorSuggestions
          error={error}
          retryAttempt={7}
          prioritizedSuggestions={[]}
          isSizeError={false}
          sizeReductionTips={[]}
        />,
      );

      expect(screen.getByText(/You've tried 7 times/)).toBeInTheDocument();
    });
  });

  describe('Previous Error Context', () => {
    it('shows previous error when lastError is provided and retryAttempt > 0', () => {
      const error = createError();

      render(
        <ErrorSuggestions
          error={error}
          retryAttempt={2}
          lastError="Previous error: WASM execution failed"
          prioritizedSuggestions={[]}
          isSizeError={false}
          sizeReductionTips={[]}
        />,
      );

      expect(screen.getByText('Previous attempt (#2):')).toBeInTheDocument();
      expect(screen.getByText('Previous error: WASM execution failed')).toBeInTheDocument();
    });

    it('does not show previous error when retryAttempt is 0', () => {
      const error = createError();

      render(
        <ErrorSuggestions
          error={error}
          retryAttempt={0}
          lastError="Some error"
          prioritizedSuggestions={[]}
          isSizeError={false}
          sizeReductionTips={[]}
        />,
      );

      expect(screen.queryByText('Previous attempt')).not.toBeInTheDocument();
    });

    it('does not show previous error when lastError is undefined', () => {
      const error = createError();

      render(
        <ErrorSuggestions
          error={error}
          retryAttempt={2}
          prioritizedSuggestions={[]}
          isSizeError={false}
          sizeReductionTips={[]}
        />,
      );

      expect(screen.queryByText('Previous attempt')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty suggestions array gracefully', () => {
      const error = createError();

      render(
        <ErrorSuggestions
          error={error}
          retryAttempt={0}
          prioritizedSuggestions={[]}
          isSizeError={false}
          sizeReductionTips={[]}
        />,
      );

      // Should render without crashing
      expect(screen.queryByTestId('error-suggestions')).not.toBeInTheDocument();
    });

    it('handles all sections visible simultaneously', () => {
      const error = createError({ code: ErrorCode.MEMORY_LIMIT_EXCEEDED, recoverable: true });
      const suggestions = [
        { text: 'Reduce file size', mostLikely: true, rationale: 'Files over 1MB cause issues' },
      ];
      const tips = ['Remove images', 'Compress content'];

      render(
        <ErrorSuggestions
          error={error}
          retryAttempt={5}
          lastError="Previous error message"
          prioritizedSuggestions={suggestions}
          isSizeError={true}
          sizeReductionTips={tips}
        />,
      );

      // All sections should be present
      expect(screen.getByText('What you can try:')).toBeInTheDocument();
      expect(screen.getByText('How to reduce your CV size:')).toBeInTheDocument();
      expect(screen.getByText('Multiple retry attempts detected')).toBeInTheDocument();
      expect(screen.getByText('Previous attempt (#5):')).toBeInTheDocument();
      expect(screen.getByText('Additional resources:')).toBeInTheDocument();
    });

    it('handles suggestion without text gracefully', () => {
      const error = createError();
      const suggestions = [{ text: '' }];

      render(
        <ErrorSuggestions
          error={error}
          retryAttempt={0}
          prioritizedSuggestions={suggestions}
          isSizeError={false}
          sizeReductionTips={[]}
        />,
      );

      // Should not crash
      expect(screen.getByTestId('error-suggestions')).toBeInTheDocument();
    });

    it('handles very long suggestion text', () => {
      const error = createError();
      const suggestions = [
        {
          text: 'This is a very long suggestion that contains a lot of text and might wrap across multiple lines in the UI which we need to handle gracefully without breaking the layout or causing accessibility issues',
        },
      ];

      render(
        <ErrorSuggestions
          error={error}
          retryAttempt={0}
          prioritizedSuggestions={suggestions}
          isSizeError={false}
          sizeReductionTips={[]}
        />,
      );

      expect(screen.getByText(/This is a very long suggestion/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('suggestions list uses semantic ol element', () => {
      const error = createError();
      const suggestions = [{ text: 'First' }, { text: 'Second' }];

      const { container } = render(
        <ErrorSuggestions
          error={error}
          retryAttempt={0}
          prioritizedSuggestions={suggestions}
          isSizeError={false}
          sizeReductionTips={[]}
        />,
      );

      const ol = container.querySelector('ol');
      expect(ol).toBeInTheDocument();
    });

    it('size reduction tips use semantic ul element', () => {
      const error = createError();
      const tips = ['Tip 1', 'Tip 2'];

      const { container } = render(
        <ErrorSuggestions
          error={error}
          retryAttempt={0}
          prioritizedSuggestions={[]}
          isSizeError={true}
          sizeReductionTips={tips}
        />,
      );

      const ul = container.querySelector('ul.list-disc');
      expect(ul).toBeInTheDocument();
    });

    it('warning icon has aria-hidden', () => {
      const error = createError({ recoverable: true });

      const { container } = render(
        <ErrorSuggestions
          error={error}
          retryAttempt={5}
          prioritizedSuggestions={[]}
          isSizeError={false}
          sizeReductionTips={[]}
        />,
      );

      const svg = container.querySelector('svg[aria-hidden="true"]');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Link Accessibility', () => {
    it('help links should have default underline for WCAG 1.4.1', () => {
      const error = createError({
        code: ErrorCode.MEMORY_LIMIT_EXCEEDED,
        suggestions: [],
      });

      render(
        <ErrorSuggestions
          error={error}
          retryAttempt={0}
          prioritizedSuggestions={[]}
          isSizeError={false}
          sizeReductionTips={[]}
        />,
      );

      // Find all links (from help resources)
      const links = screen.queryAllByRole('link');

      if (links.length > 0) {
        // All links should have underline class (not just hover:underline)
        links.forEach((link) => {
          expect(link.className).toMatch(/underline/);
        });
      }
    });

    it('external help links should have proper aria-labels', () => {
      const error = createError({
        code: ErrorCode.MEMORY_LIMIT_EXCEEDED,
        suggestions: [],
      });

      render(
        <ErrorSuggestions
          error={error}
          retryAttempt={0}
          prioritizedSuggestions={[]}
          isSizeError={false}
          sizeReductionTips={[]}
        />,
      );

      const links = screen.queryAllByRole('link');

      if (links.length > 0) {
        // External links should have descriptive aria-labels
        links.forEach((link) => {
          const ariaLabel = link.getAttribute('aria-label');
          if (ariaLabel != null && ariaLabel !== '') {
            expect(ariaLabel).toMatch(/Learn more:/);
          }
        });
      }
    });
  });
});
