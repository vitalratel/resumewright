/**
 * ABOUTME: Tests for AppContext provider and consumer.
 * ABOUTME: Validates context provision, value access, and error on missing provider.
 */

import { render } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vitest';
import type { AppContextValue } from '../AppContext';
import { AppProvider, useAppContext } from '../AppContext';

describe('AppContext', () => {
  const mockContextValue: AppContextValue = {
    currentJobId: 'test-job-id',
    onOpenSettings: vi.fn(),
  };

  describe('AppProvider', () => {
    it('should render children', () => {
      const { container } = render(() => (
        <AppProvider value={mockContextValue}>
          <div data-testid="child">Test Child</div>
        </AppProvider>
      ));

      expect(container.querySelector('[data-testid="child"]')).toBeTruthy();
    });

    it('should provide context value to children', () => {
      const TestComponent = () => {
        const context = useAppContext();
        return <div data-testid="job-id">{context.currentJobId}</div>;
      };

      const { getByTestId } = render(() => (
        <AppProvider value={mockContextValue}>
          <TestComponent />
        </AppProvider>
      ));

      expect(getByTestId('job-id')).toHaveTextContent('test-job-id');
    });
  });

  describe('useAppContext', () => {
    it('should return context value when used within provider', () => {
      let captured: AppContextValue | undefined;

      render(() => (
        <AppProvider value={mockContextValue}>
          {(() => {
            captured = useAppContext();
            return <div />;
          })()}
        </AppProvider>
      ));

      expect(captured).toEqual(mockContextValue);
      expect(captured!.currentJobId).toBe('test-job-id');
    });

    it('should throw error when used outside provider', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(() => {
          useAppContext();
          return <div />;
        });
      }).toThrow('useAppContext must be used within AppProvider');

      errorSpy.mockRestore();
    });

    it('should provide access to onOpenSettings callback', () => {
      const mockOnOpenSettings = vi.fn();
      const customValue = { ...mockContextValue, onOpenSettings: mockOnOpenSettings };

      let captured: AppContextValue | undefined;

      render(() => (
        <AppProvider value={customValue}>
          {(() => {
            captured = useAppContext();
            return <div />;
          })()}
        </AppProvider>
      ));

      captured!.onOpenSettings();
      expect(mockOnOpenSettings).toHaveBeenCalledOnce();
    });
  });
});
