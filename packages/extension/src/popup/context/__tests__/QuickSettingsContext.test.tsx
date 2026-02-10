/**
 * ABOUTME: Tests for QuickSettingsContext provider and consumer.
 * ABOUTME: Validates settings/handler provision, value access, and error on missing provider.
 */

import { render } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vitest';
import type { UserSettings } from '@/shared/types/settings';
import type { QuickSettingsContextValue } from '../QuickSettingsContext';
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

  const mockContextValue: QuickSettingsContextValue = {
    settings: mockSettings,
    handlers: mockHandlers,
  };

  describe('QuickSettingsProvider', () => {
    it('should render children', () => {
      const { container } = render(() => (
        <QuickSettingsProvider value={mockContextValue}>
          <div data-testid="child">Test Child</div>
        </QuickSettingsProvider>
      ));

      expect(container.querySelector('[data-testid="child"]')).toBeTruthy();
    });

    it('should provide context value to children', () => {
      const TestComponent = () => {
        const { settings } = useQuickSettings();
        return <div data-testid="page-size">{settings?.defaultConfig.pageSize}</div>;
      };

      const { getByTestId } = render(() => (
        <QuickSettingsProvider value={mockContextValue}>
          <TestComponent />
        </QuickSettingsProvider>
      ));

      expect(getByTestId('page-size')).toHaveTextContent('Letter');
    });
  });

  describe('useQuickSettings', () => {
    it('should return context value when used within provider', () => {
      let captured: QuickSettingsContextValue | undefined;

      render(() => (
        <QuickSettingsProvider value={mockContextValue}>
          {(() => {
            captured = useQuickSettings();
            return <div />;
          })()}
        </QuickSettingsProvider>
      ));

      expect(captured).toEqual(mockContextValue);
      expect(captured!.settings).toEqual(mockSettings);
      expect(captured!.handlers).toEqual(mockHandlers);
    });

    it('should throw error when used outside provider', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(() => {
          useQuickSettings();
          return <div />;
        });
      }).toThrow('useQuickSettings must be used within QuickSettingsProvider');

      errorSpy.mockRestore();
    });

    it('should provide access to all handler functions', () => {
      let captured: QuickSettingsContextValue | undefined;

      render(() => (
        <QuickSettingsProvider value={mockContextValue}>
          {(() => {
            captured = useQuickSettings();
            return <div />;
          })()}
        </QuickSettingsProvider>
      ));

      expect(typeof captured!.handlers.handlePageSizeChange).toBe('function');
      expect(typeof captured!.handlers.handleMarginsChange).toBe('function');
      expect(typeof captured!.handlers.handleCustomMarginChange).toBe('function');
    });

    it('should allow calling handlers', async () => {
      let captured: QuickSettingsContextValue | undefined;

      render(() => (
        <QuickSettingsProvider value={mockContextValue}>
          {(() => {
            captured = useQuickSettings();
            return <div />;
          })()}
        </QuickSettingsProvider>
      ));

      await captured!.handlers.handlePageSizeChange('A4');
      expect(mockHandlers.handlePageSizeChange).toHaveBeenCalledWith('A4');

      await captured!.handlers.handleMarginsChange('compact');
      expect(mockHandlers.handleMarginsChange).toHaveBeenCalledWith('compact');

      await captured!.handlers.handleCustomMarginChange('top', 1.0);
      expect(mockHandlers.handleCustomMarginChange).toHaveBeenCalledWith('top', 1.0);
    });

    it('should support null settings', () => {
      const contextWithNullSettings: QuickSettingsContextValue = {
        settings: null,
        handlers: mockHandlers,
      };

      let captured: QuickSettingsContextValue | undefined;

      render(() => (
        <QuickSettingsProvider value={contextWithNullSettings}>
          {(() => {
            captured = useQuickSettings();
            return <div />;
          })()}
        </QuickSettingsProvider>
      ));

      expect(captured!.settings).toBeNull();
      expect(captured!.handlers).toEqual(mockHandlers);
    });
  });
});
