/**
 * ConversionContext Tests
 * Tests for ConversionProvider and useConversion hook
 */

import type { ConversionHandlers } from '../../hooks/conversion/useConversionHandlers';
import { render, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
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
      const { container } = render(
        <ConversionProvider value={mockHandlers}>
          <div data-testid="child">Test Child</div>
        </ConversionProvider>,
      );

      expect(container.querySelector('[data-testid="child"]')).toBeInTheDocument();
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

      const { getByText } = render(
        <ConversionProvider value={mockHandlers}>
          <TestComponent />
        </ConversionProvider>,
      );

      const button = getByText('Retry');
      button.click();

      expect(mockHandlers.handleRetry).toHaveBeenCalledOnce();
    });
  });

  describe('useConversion', () => {
    it('should return handlers when used within provider', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ConversionProvider value={mockHandlers}>{children}</ConversionProvider>
      );

      const { result } = renderHook(() => useConversion(), { wrapper });

      expect(result.current).toEqual(mockHandlers);
      expect(result.current.handleFileValidated).toBe(mockHandlers.handleFileValidated);
      expect(result.current.handleExportClick).toBe(mockHandlers.handleExportClick);
    });

    it('should throw error when used outside provider', () => {
      // Test error handler at line 26
      // Suppress console.error for this test since we expect an error
      const originalError = console.error;
      console.error = vi.fn();

      expect(() => {
        renderHook(() => useConversion());
      }).toThrow('useConversion must be used within ConversionProvider');

      // Restore console.error
      console.error = originalError;
    });

    it('should provide access to all handler functions', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ConversionProvider value={mockHandlers}>{children}</ConversionProvider>
      );

      const { result } = renderHook(() => useConversion(), { wrapper });

      // Verify all handlers are accessible
      expect(typeof result.current.handleFileValidated).toBe('function');
      expect(typeof result.current.handleExportClick).toBe('function');
      expect(typeof result.current.handleCancelConversion).toBe('function');
      expect(typeof result.current.handleRetry).toBe('function');
      expect(typeof result.current.handleDismissError).toBe('function');
      expect(typeof result.current.handleImportDifferent).toBe('function');
      expect(typeof result.current.handleReportIssue).toBe('function');
    });

    it('should support optional handleCancelConversion', () => {
      const handlersWithoutCancel: ConversionHandlers = {
        ...mockHandlers,
        handleCancelConversion: undefined,
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ConversionProvider value={handlersWithoutCancel}>{children}</ConversionProvider>
      );

      const { result } = renderHook(() => useConversion(), { wrapper });

      expect(result.current.handleCancelConversion).toBeUndefined();
    });
  });
});
