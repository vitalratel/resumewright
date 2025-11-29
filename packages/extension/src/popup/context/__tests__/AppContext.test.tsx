/**
 * AppContext Tests
 * Tests for AppProvider and useAppContext hook
 */

import type { AppState } from '../../hooks/integration/useAppState';
import { render, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppProvider, useAppContext } from '../AppContext';

describe('AppContext', () => {
  const mockAppState: AppState = {
    // UI State
    uiState: 'waiting_for_import',
    validationError: null,
    isValidating: false,
    lastError: null,
    lastFilename: null,

    // Persisted Data
    importedFile: null,

    // Progress
    getProgress: vi.fn(),

    // UI Actions
    setValidating: vi.fn(),
    setValidationError: vi.fn(),
    clearValidationError: vi.fn(),
    startConversion: vi.fn(),
    setSuccess: vi.fn(),
    setError: vi.fn(),
    setUIState: vi.fn(),

    // Persisted Actions
    setImportedFile: vi.fn(),
    clearImportedFile: vi.fn(),

    // Combined Actions
    reset: vi.fn(),
  };

  const mockContextValue = {
    appState: mockAppState,
    currentJobId: 'test-job-id',
    successRef: { current: null },
    errorRef: { current: null },
    onOpenSettings: vi.fn(),
  };

  describe('AppProvider', () => {
    it('should render children', () => {
      const { container } = render(
        <AppProvider value={mockContextValue}>
          <div data-testid="child">Test Child</div>
        </AppProvider>,
      );

      expect(container.querySelector('[data-testid="child"]')).toBeInTheDocument();
    });

    it('should provide context value to children', () => {
      const TestComponent = () => {
        const context = useAppContext();
        return <div data-testid="job-id">{context.currentJobId}</div>;
      };

      const { getByTestId } = render(
        <AppProvider value={mockContextValue}>
          <TestComponent />
        </AppProvider>,
      );

      expect(getByTestId('job-id')).toHaveTextContent('test-job-id');
    });
  });

  describe('useAppContext', () => {
    it('should return context value when used within provider', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AppProvider value={mockContextValue}>{children}</AppProvider>
      );

      const { result } = renderHook(() => useAppContext(), { wrapper });

      expect(result.current).toEqual(mockContextValue);
      expect(result.current.currentJobId).toBe('test-job-id');
      expect(result.current.appState).toEqual(mockAppState);
    });

    it('should throw error when used outside provider', () => {
      // Test error handler at line 34
      // Suppress console.error for this test since we expect an error
      const originalError = console.error;
      console.error = vi.fn();

      expect(() => {
        renderHook(() => useAppContext());
      }).toThrow('useAppContext must be used within AppProvider');

      // Restore console.error
      console.error = originalError;
    });

    it('should provide access to onOpenSettings callback', () => {
      const mockOnOpenSettings = vi.fn();
      const customContextValue = {
        ...mockContextValue,
        onOpenSettings: mockOnOpenSettings,
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AppProvider value={customContextValue}>{children}</AppProvider>
      );

      const { result } = renderHook(() => useAppContext(), { wrapper });

      result.current.onOpenSettings();
      expect(mockOnOpenSettings).toHaveBeenCalledOnce();
    });

    it('should provide access to refs', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AppProvider value={mockContextValue}>{children}</AppProvider>
      );

      const { result } = renderHook(() => useAppContext(), { wrapper });

      expect(result.current.successRef).toBe(mockContextValue.successRef);
      expect(result.current.errorRef).toBe(mockContextValue.errorRef);
    });
  });
});
