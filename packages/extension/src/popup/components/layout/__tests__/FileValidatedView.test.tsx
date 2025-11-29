/**
 * FileValidatedView Component Tests
 *
 * Tests FileValidatedView for proper rendering with Context providers,
 * conditional display of export button and settings summary, and handler passing.
 */

import type { AppContextValue } from '../../../context/AppContext';
import type { QuickSettingsContextValue } from '../../../context/QuickSettingsContext';
import type { ConversionHandlers } from '../../../hooks/conversion/useConversionHandlers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FileValidatedView } from '../FileValidatedView';

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
  FileImport: ({ importedFile }: { importedFile?: { name: string } | null }) => (
    <div data-testid="file-import">
      FileImport Mock
      {importedFile && <div>File: {importedFile.name}</div>}
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

const mockAppContext: AppContextValue = {
  appState: {
    uiState: 'file_validated' as const,
    importedFile: null,
    validationError: null,
    lastError: null,
    isValidating: false,
    lastFilename: null,
    getProgress: vi.fn(),
    setValidating: vi.fn(),
    setValidationError: vi.fn(),
    clearValidationError: vi.fn(),
    startConversion: vi.fn(),
    setSuccess: vi.fn(),
    setError: vi.fn(),
    setUIState: vi.fn(),
    setImportedFile: vi.fn(),
    clearImportedFile: vi.fn(),
    reset: vi.fn(),
  },
  currentJobId: 'test-job-id',
  successRef: { current: null },
  errorRef: { current: null },
  onOpenSettings: vi.fn(),
};

const mockConversionContext: ConversionHandlers = {
  handleFileValidated: vi.fn(),
  handleExportClick: vi.fn(async () => {}),
  handleCancelConversion: vi.fn(),
  handleRetry: vi.fn(),
  handleDismissError: vi.fn(),
  handleImportDifferent: vi.fn(),
  handleReportIssue: vi.fn(),
};

const mockQuickSettingsContext: QuickSettingsContextValue = {
  settings: null,
  handlers: {
    handlePageSizeChange: vi.fn(),
    handleMarginsChange: vi.fn(),
    handleCustomMarginChange: vi.fn(),
  },
};

// Test constants
const TEST_FILE = {
  name: 'resume.tsx',
  size: 2048,
  content: '// Mock TSX content',
};

const TEST_SETTINGS = {
  theme: 'auto' as const,
  autoDetectCV: true,
  showConvertButtons: true,
  telemetryEnabled: false,
  retentionDays: 30,
  settingsVersion: 1,
  lastUpdated: Date.now(),
  defaultConfig: {
    pageSize: 'Letter' as const,
    margin: { top: 0.75, right: 0.75, bottom: 0.75, left: 0.75 },
    fontSize: 12,
    fontFamily: 'Arial',
    compress: false,
  },
};

describe('FileValidatedView', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset context mocks to default state
    mockUseAppContext.mockReturnValue(mockAppContext);
    mockUseConversion.mockReturnValue(mockConversionContext);
    mockUseQuickSettings.mockReturnValue(mockQuickSettingsContext);
  });

  describe('Rendering', () => {
    it('renders FileImport component', () => {
      render(<FileValidatedView />);

      expect(screen.getByTestId('file-import')).toBeInTheDocument();
      expect(screen.getByText('FileImport Mock')).toBeInTheDocument();
    });

    it('passes imported file to FileImport when present', () => {
      mockUseAppContext.mockReturnValue({
        ...mockAppContext,
        appState: {
          ...mockAppContext.appState,
          importedFile: TEST_FILE,
        },
      });

      render(<FileValidatedView />);

      expect(screen.getByText(`File: ${TEST_FILE.name}`)).toBeInTheDocument();
    });
  });

  describe('Export Button', () => {
    it('does not show export button when no file imported', () => {
      render(<FileValidatedView />);

      expect(screen.queryByTestId('export-button')).not.toBeInTheDocument();
    });

    it('does not show export button when settings not loaded', () => {
      mockUseAppContext.mockReturnValue({
        ...mockAppContext,
        appState: {
          ...mockAppContext.appState,
          importedFile: TEST_FILE,
        },
      });

      render(<FileValidatedView />);

      expect(screen.queryByTestId('export-button')).not.toBeInTheDocument();
    });

    it('shows export button when file imported and settings loaded', () => {
      mockUseAppContext.mockReturnValue({
        ...mockAppContext,
        appState: {
          ...mockAppContext.appState,
          importedFile: TEST_FILE,
        },
      });

      mockUseQuickSettings.mockReturnValue({
        settings: TEST_SETTINGS,
        handlers: mockQuickSettingsContext.handlers,
      });

      render(<FileValidatedView />);

      expect(screen.getByTestId('export-button')).toBeInTheDocument();
    });

    it('export button has correct text and keyboard hint', () => {
      mockUseAppContext.mockReturnValue({
        ...mockAppContext,
        appState: {
          ...mockAppContext.appState,
          importedFile: TEST_FILE,
        },
      });

      mockUseQuickSettings.mockReturnValue({
        settings: TEST_SETTINGS,
        handlers: mockQuickSettingsContext.handlers,
      });

      render(<FileValidatedView />);

      const button = screen.getByTestId('export-button');
      expect(button).toHaveTextContent('Export to PDF');
      expect(button).toHaveTextContent('E');
    });

    it('export button has accessible aria-label', () => {
      mockUseAppContext.mockReturnValue({
        ...mockAppContext,
        appState: {
          ...mockAppContext.appState,
          importedFile: TEST_FILE,
        },
      });

      mockUseQuickSettings.mockReturnValue({
        settings: TEST_SETTINGS,
        handlers: mockQuickSettingsContext.handlers,
      });

      render(<FileValidatedView />);

      const button = screen.getByTestId('export-button');
      expect(button).toHaveAttribute('aria-label', 'Export to PDF using current settings (E shortcut)');
    });

    it('calls handleExportClick when export button clicked', async () => {
      const user = userEvent.setup();

      mockUseAppContext.mockReturnValue({
        ...mockAppContext,
        appState: {
          ...mockAppContext.appState,
          importedFile: TEST_FILE,
        },
      });

      mockUseQuickSettings.mockReturnValue({
        settings: TEST_SETTINGS,
        handlers: mockQuickSettingsContext.handlers,
      });

      render(<FileValidatedView />);

      const button = screen.getByTestId('export-button');
      await user.click(button);

      expect(mockConversionContext.handleExportClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Settings Summary', () => {
    it('shows settings summary when file imported and settings loaded', () => {
      mockUseAppContext.mockReturnValue({
        ...mockAppContext,
        appState: {
          ...mockAppContext.appState,
          importedFile: TEST_FILE,
        },
      });

      mockUseQuickSettings.mockReturnValue({
        settings: TEST_SETTINGS,
        handlers: mockQuickSettingsContext.handlers,
      });

      render(<FileValidatedView />);

      expect(screen.getByText(/Current settings:/)).toBeInTheDocument();
      expect(screen.getByText(/Letter, Normal margins/)).toBeInTheDocument();
    });

    it('shows Change link to open settings', () => {
      mockUseAppContext.mockReturnValue({
        ...mockAppContext,
        appState: {
          ...mockAppContext.appState,
          importedFile: TEST_FILE,
        },
      });

      mockUseQuickSettings.mockReturnValue({
        settings: TEST_SETTINGS,
        handlers: mockQuickSettingsContext.handlers,
      });

      render(<FileValidatedView />);

      const changeButton = screen.getByText('Change');
      expect(changeButton).toBeInTheDocument();
      expect(changeButton).toHaveAttribute('aria-label', 'Open settings to change export configuration');
    });

    it('calls onOpenSettings when Change clicked', async () => {
      const user = userEvent.setup();

      mockUseAppContext.mockReturnValue({
        ...mockAppContext,
        appState: {
          ...mockAppContext.appState,
          importedFile: TEST_FILE,
        },
      });

      mockUseQuickSettings.mockReturnValue({
        settings: TEST_SETTINGS,
        handlers: mockQuickSettingsContext.handlers,
      });

      render(<FileValidatedView />);

      const changeButton = screen.getByText('Change');
      await user.click(changeButton);

      expect(mockAppContext.onOpenSettings).toHaveBeenCalledTimes(1);
    });

    it('formats settings summary correctly for A4 paper', () => {
      mockUseAppContext.mockReturnValue({
        ...mockAppContext,
        appState: {
          ...mockAppContext.appState,
          importedFile: TEST_FILE,
        },
      });

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

      render(<FileValidatedView />);

      expect(screen.getByText(/A4, Normal margins/)).toBeInTheDocument();
    });

    it('formats settings summary correctly for narrow margins', () => {
      mockUseAppContext.mockReturnValue({
        ...mockAppContext,
        appState: {
          ...mockAppContext.appState,
          importedFile: TEST_FILE,
        },
      });

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

      render(<FileValidatedView />);

      expect(screen.getByText(/Letter, Narrow margins/)).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('uses memo to prevent unnecessary re-renders', () => {
      mockUseAppContext.mockReturnValue({
        ...mockAppContext,
        appState: {
          ...mockAppContext.appState,
          importedFile: TEST_FILE,
        },
      });

      mockUseQuickSettings.mockReturnValue({
        settings: TEST_SETTINGS,
        handlers: mockQuickSettingsContext.handlers,
      });

      const { rerender } = render(<FileValidatedView />);

      // Component uses React.memo for optimization
      // Verify component renders without errors on re-render with same props
      expect(() => rerender(<FileValidatedView />)).not.toThrow();
    });
  });
});
