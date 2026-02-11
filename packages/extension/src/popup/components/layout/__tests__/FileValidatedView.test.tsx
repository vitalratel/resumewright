// ABOUTME: Tests for FileValidatedView component with Solid contexts and popupStore.
// ABOUTME: Tests rendering, export button, settings summary, and handler passing.

import { fireEvent, render, screen } from '@solidjs/testing-library';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppContextValue } from '../../../context/AppContext';
import type { ConversionHandlers } from '../../../context/ConversionContext';
import type { QuickSettingsContextValue } from '../../../context/QuickSettingsContext';
import { popupStore } from '../../../store';
import { FileValidatedView } from '../FileValidatedView';
import {
  createMockAppContext,
  createMockConversionContext,
  createMockQuickSettingsContext,
  TEST_FILE,
  TEST_SETTINGS,
} from './testHelpers';

// Mock contexts
const mockUseAppContext = vi.fn();
const mockUseConversion = vi.fn();
const mockUseQuickSettings = vi.fn();

vi.mock('../../../context/AppContext', () => ({
  useAppContext: () => mockUseAppContext() as AppContextValue,
}));

vi.mock('../../../context/ConversionContext', () => ({
  useConversion: () => mockUseConversion() as ConversionHandlers,
}));

vi.mock('../../../context/QuickSettingsContext', () => ({
  useQuickSettings: () => mockUseQuickSettings() as QuickSettingsContextValue,
}));

// Mock FileImport component
vi.mock('../../FileImport', () => ({
  FileImport: (props: { importedFile?: { name: string } | null }) => (
    <div data-testid="file-import">
      FileImport Mock
      {props.importedFile && <div>File: {props.importedFile.name}</div>}
    </div>
  ),
}));

// Mock getMarginPreset utility
vi.mock('../../../utils/marginPresets', () => ({
  getMarginPreset: vi.fn((margin: { top: number }) => {
    // Simple preset detection for testing
    if (margin.top === 0.5) return 'narrow';
    if (margin.top === 1.0) return 'wide';
    return 'normal';
  }),
}));

// Create mock instances using shared factories
const mockAppContext = createMockAppContext();
const mockConversionContext = createMockConversionContext();
const mockQuickSettingsContext = createMockQuickSettingsContext();

describe('FileValidatedView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    popupStore.reset();

    // Reset context mocks to default state
    mockUseAppContext.mockReturnValue(mockAppContext);
    mockUseConversion.mockReturnValue(mockConversionContext);
    mockUseQuickSettings.mockReturnValue(mockQuickSettingsContext);
  });

  /** Helper to set imported file on popupStore */
  const setImportedFile = () => {
    popupStore.setImportedFile(TEST_FILE.name, TEST_FILE.size, TEST_FILE.content);
  };

  describe('Rendering', () => {
    it('renders FileImport component', () => {
      render(() => <FileValidatedView />);

      expect(screen.getByTestId('file-import')).toBeInTheDocument();
      expect(screen.getByText('FileImport Mock')).toBeInTheDocument();
    });

    it('passes imported file to FileImport when present', () => {
      setImportedFile();

      render(() => <FileValidatedView />);

      expect(screen.getByText(`File: ${TEST_FILE.name}`)).toBeInTheDocument();
    });
  });

  describe('Export Button', () => {
    it('does not show export button when no file imported', () => {
      render(() => <FileValidatedView />);

      expect(screen.queryByTestId('export-button')).not.toBeInTheDocument();
    });

    it('does not show export button when settings not loaded', () => {
      setImportedFile();

      render(() => <FileValidatedView />);

      expect(screen.queryByTestId('export-button')).not.toBeInTheDocument();
    });

    it('shows export button when file imported and settings loaded', () => {
      setImportedFile();
      mockUseQuickSettings.mockReturnValue({
        settings: TEST_SETTINGS,
        handlers: mockQuickSettingsContext.handlers,
      });

      render(() => <FileValidatedView />);

      expect(screen.getByTestId('export-button')).toBeInTheDocument();
    });

    it('export button has correct text and keyboard hint', () => {
      setImportedFile();
      mockUseQuickSettings.mockReturnValue({
        settings: TEST_SETTINGS,
        handlers: mockQuickSettingsContext.handlers,
      });

      render(() => <FileValidatedView />);

      const button = screen.getByTestId('export-button');
      expect(button).toHaveTextContent('Export to PDF');
      // Keyboard hint shows CtrlE on non-Mac platforms, ⌘E on Mac
      expect(button).toHaveTextContent(/CtrlE|⌘E/);
    });

    it('export button has accessible aria-label and aria-keyshortcuts', () => {
      setImportedFile();
      mockUseQuickSettings.mockReturnValue({
        settings: TEST_SETTINGS,
        handlers: mockQuickSettingsContext.handlers,
      });

      render(() => <FileValidatedView />);

      const button = screen.getByTestId('export-button');
      expect(button).toHaveAttribute('aria-label', 'Export to PDF');
      expect(button).toHaveAttribute('aria-keyshortcuts', 'Control+e');
    });

    it('calls handleExportClick when export button clicked', () => {
      setImportedFile();
      mockUseQuickSettings.mockReturnValue({
        settings: TEST_SETTINGS,
        handlers: mockQuickSettingsContext.handlers,
      });

      render(() => <FileValidatedView />);

      const button = screen.getByTestId('export-button');
      fireEvent.click(button);

      expect(mockConversionContext.handleExportClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Settings Summary', () => {
    it('shows settings summary when file imported and settings loaded', () => {
      setImportedFile();
      mockUseQuickSettings.mockReturnValue({
        settings: TEST_SETTINGS,
        handlers: mockQuickSettingsContext.handlers,
      });

      render(() => <FileValidatedView />);

      expect(screen.getByText(/Current settings:/)).toBeInTheDocument();
      expect(screen.getByText(/Letter, Normal margins/)).toBeInTheDocument();
    });

    it('shows Change link to open settings', () => {
      setImportedFile();
      mockUseQuickSettings.mockReturnValue({
        settings: TEST_SETTINGS,
        handlers: mockQuickSettingsContext.handlers,
      });

      render(() => <FileValidatedView />);

      const changeButton = screen.getByText('Change');
      expect(changeButton).toBeInTheDocument();
      expect(changeButton).toHaveAttribute(
        'aria-label',
        'Open settings to change export configuration',
      );
    });

    it('calls onOpenSettings when Change clicked', () => {
      setImportedFile();
      mockUseQuickSettings.mockReturnValue({
        settings: TEST_SETTINGS,
        handlers: mockQuickSettingsContext.handlers,
      });

      render(() => <FileValidatedView />);

      const changeButton = screen.getByText('Change');
      fireEvent.click(changeButton);

      expect(mockAppContext.onOpenSettings).toHaveBeenCalledTimes(1);
    });

    it('formats settings summary correctly for A4 paper', () => {
      setImportedFile();
      mockUseQuickSettings.mockReturnValue({
        settings: {
          ...TEST_SETTINGS,
          defaultConfig: {
            ...TEST_SETTINGS.defaultConfig,
            pageSize: 'A4',
          },
        },
        handlers: mockQuickSettingsContext.handlers,
      });

      render(() => <FileValidatedView />);

      expect(screen.getByText(/A4, Normal margins/)).toBeInTheDocument();
    });

    it('formats settings summary correctly for narrow margins', () => {
      setImportedFile();
      mockUseQuickSettings.mockReturnValue({
        settings: {
          ...TEST_SETTINGS,
          defaultConfig: {
            ...TEST_SETTINGS.defaultConfig,
            margin: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
          },
        },
        handlers: mockQuickSettingsContext.handlers,
      });

      render(() => <FileValidatedView />);

      expect(screen.getByText(/Letter, Narrow margins/)).toBeInTheDocument();
    });
  });

  describe('Rendering Stability', () => {
    it('renders without errors with all data present', () => {
      setImportedFile();
      mockUseQuickSettings.mockReturnValue({
        settings: TEST_SETTINGS,
        handlers: mockQuickSettingsContext.handlers,
      });

      expect(() => render(() => <FileValidatedView />)).not.toThrow();
    });
  });
});
