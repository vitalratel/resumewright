/**
 * ABOUTME: Tests for ConversionContext provider and consumer.
 * ABOUTME: Validates handler provision, value access, and error on missing provider.
 */

import { render } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vitest';
import type { ConversionHandlers } from '../ConversionContext';
import { ConversionProvider, useConversion } from '../ConversionContext';

describe('ConversionContext', () => {
  const mockHandlers: ConversionHandlers = {
    handleFileValidated: vi.fn(),
    handleExportClick: vi.fn(),
    handleCancelConversion: vi.fn(),
    handleRetry: vi.fn(),
    handleDismissError: vi.fn(),
    handleImportDifferent: vi.fn(),
    handleReportIssue: vi.fn(),
  };

  describe('ConversionProvider', () => {
    it('should render children', () => {
      const { container } = render(() => (
        <ConversionProvider value={mockHandlers}>
          <div data-testid="child">Test Child</div>
        </ConversionProvider>
      ));

      expect(container.querySelector('[data-testid="child"]')).toBeTruthy();
    });

    it('should provide handlers to children', () => {
      const TestComponent = () => {
        const handlers = useConversion();
        return (
          <button type="button" onClick={() => handlers.handleRetry()}>
            Retry
          </button>
        );
      };

      const { getByText } = render(() => (
        <ConversionProvider value={mockHandlers}>
          <TestComponent />
        </ConversionProvider>
      ));

      const button = getByText('Retry');
      button.click();

      expect(mockHandlers.handleRetry).toHaveBeenCalledOnce();
    });
  });

  describe('useConversion', () => {
    it('should return handlers when used within provider', () => {
      let captured: ConversionHandlers | undefined;

      render(() => (
        <ConversionProvider value={mockHandlers}>
          {(() => {
            captured = useConversion();
            return <div />;
          })()}
        </ConversionProvider>
      ));

      expect(captured).toEqual(mockHandlers);
      expect(captured!.handleFileValidated).toBe(mockHandlers.handleFileValidated);
      expect(captured!.handleExportClick).toBe(mockHandlers.handleExportClick);
    });

    it('should throw error when used outside provider', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(() => {
          useConversion();
          return <div />;
        });
      }).toThrow('useConversion must be used within ConversionProvider');

      errorSpy.mockRestore();
    });

    it('should provide access to all handler functions', () => {
      let captured: ConversionHandlers | undefined;

      render(() => (
        <ConversionProvider value={mockHandlers}>
          {(() => {
            captured = useConversion();
            return <div />;
          })()}
        </ConversionProvider>
      ));

      expect(typeof captured!.handleFileValidated).toBe('function');
      expect(typeof captured!.handleExportClick).toBe('function');
      expect(typeof captured!.handleCancelConversion).toBe('function');
      expect(typeof captured!.handleRetry).toBe('function');
      expect(typeof captured!.handleDismissError).toBe('function');
      expect(typeof captured!.handleImportDifferent).toBe('function');
      expect(typeof captured!.handleReportIssue).toBe('function');
    });

    it('should support optional handleCancelConversion', () => {
      const handlersWithoutCancel: ConversionHandlers = {
        ...mockHandlers,
        handleCancelConversion: undefined,
      };

      let captured: ConversionHandlers | undefined;

      render(() => (
        <ConversionProvider value={handlersWithoutCancel}>
          {(() => {
            captured = useConversion();
            return <div />;
          })()}
        </ConversionProvider>
      ));

      expect(captured!.handleCancelConversion).toBeUndefined();
    });
  });
});
