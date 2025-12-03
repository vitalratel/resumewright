/**
 * QuickSettingsContext Tests
 * Tests for QuickSettingsProvider and useQuickSettings hook
 */

import { render, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { UserSettings } from '@/shared/types/settings';
import { QuickSettingsProvider, useQuickSettings } from '../QuickSettingsContext';

describe('QuickSettingsContext', () => {
  const mockSettings: UserSettings = {
    theme: 'auto',
    defaultConfig: {
      margin: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
      fontSize: 12,
      fontFamily: 'Arial',
      pageSize: 'Letter',
      filename: 'resume.pdf',
      compress: true,
      atsOptimization: true,
      includeMetadata: true,
    },
    autoDetectCV: true,
    showConvertButtons: true,
    telemetryEnabled: false,
    retentionDays: 30,
    settingsVersion: 1,
    lastUpdated: Date.now(),
  };

  const mockHandlers = {
    handlePageSizeChange: vi.fn(),
    handleMarginsChange: vi.fn(),
    handleCustomMarginChange: vi.fn(),
  };

  const mockContextValue = {
    settings: mockSettings,
    handlers: mockHandlers,
  };

  describe('QuickSettingsProvider', () => {
    it('should render children', () => {
      const { container } = render(
        <QuickSettingsProvider value={mockContextValue}>
          <div data-testid="child">Test Child</div>
        </QuickSettingsProvider>,
      );

      expect(container.querySelector('[data-testid="child"]')).toBeInTheDocument();
    });

    it('should provide context value to children', () => {
      const TestComponent = () => {
        const { settings } = useQuickSettings();
        return <div data-testid="page-size">{settings?.defaultConfig.pageSize}</div>;
      };

      const { getByTestId } = render(
        <QuickSettingsProvider value={mockContextValue}>
          <TestComponent />
        </QuickSettingsProvider>,
      );

      expect(getByTestId('page-size')).toHaveTextContent('Letter');
    });
  });

  describe('useQuickSettings', () => {
    it('should return context value when used within provider', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QuickSettingsProvider value={mockContextValue}>{children}</QuickSettingsProvider>
      );

      const { result } = renderHook(() => useQuickSettings(), { wrapper });

      expect(result.current).toEqual(mockContextValue);
      expect(result.current.settings).toEqual(mockSettings);
      expect(result.current.handlers).toEqual(mockHandlers);
    });

    it('should throw error when used outside provider', () => {
      // Test error handler at line 37
      // Suppress console.error for this test since we expect an error
      const originalError = console.error;
      console.error = vi.fn();

      expect(() => {
        renderHook(() => useQuickSettings());
      }).toThrow('useQuickSettings must be used within QuickSettingsProvider');

      // Restore console.error
      console.error = originalError;
    });

    it('should provide access to all handler functions', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QuickSettingsProvider value={mockContextValue}>{children}</QuickSettingsProvider>
      );

      const { result } = renderHook(() => useQuickSettings(), { wrapper });

      // Verify all handlers are accessible and are functions
      expect(typeof result.current.handlers.handlePageSizeChange).toBe('function');
      expect(typeof result.current.handlers.handleMarginsChange).toBe('function');
      expect(typeof result.current.handlers.handleCustomMarginChange).toBe('function');
    });

    it('should allow calling handlers', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QuickSettingsProvider value={mockContextValue}>{children}</QuickSettingsProvider>
      );

      const { result } = renderHook(() => useQuickSettings(), { wrapper });

      await result.current.handlers.handlePageSizeChange('A4');
      expect(mockHandlers.handlePageSizeChange).toHaveBeenCalledWith('A4');

      await result.current.handlers.handleMarginsChange('compact');
      expect(mockHandlers.handleMarginsChange).toHaveBeenCalledWith('compact');

      await result.current.handlers.handleCustomMarginChange('top', 1.0);
      expect(mockHandlers.handleCustomMarginChange).toHaveBeenCalledWith('top', 1.0);
    });

    it('should support null settings', () => {
      const contextWithNullSettings = {
        settings: null,
        handlers: mockHandlers,
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QuickSettingsProvider value={contextWithNullSettings}>{children}</QuickSettingsProvider>
      );

      const { result } = renderHook(() => useQuickSettings(), { wrapper });

      expect(result.current.settings).toBeNull();
      expect(result.current.handlers).toEqual(mockHandlers);
    });
  });
});
