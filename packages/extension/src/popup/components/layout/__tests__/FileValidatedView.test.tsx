// ABOUTME: Tests for FileValidatedView component with real context providers.
// ABOUTME: Tests rendering, export button, settings summary, and handler passing.

import { fireEvent, render, screen } from '@solidjs/testing-library';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MARGIN_PRESETS } from '../../../constants/margins';
import { AppProvider } from '../../../context/AppContext';
import { type ConversionHandlers, ConversionProvider } from '../../../context/ConversionContext';
import {
  type QuickSettingsContextValue,
  QuickSettingsProvider,
} from '../../../context/QuickSettingsContext';
import { popupStore } from '../../../store';
import { FileValidatedView } from '../FileValidatedView';

// FileImport is a complex component with drag-and-drop — mock it
vi.mock('../../FileImport', () => ({
  FileImport: (props: { importedFile?: { name: string } | null }) => (
    <div data-testid="file-import">
      FileImport Mock
      {props.importedFile && <div>File: {props.importedFile.name}</div>}
    </div>
  ),
}));

// Test fixtures
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
    margin: MARGIN_PRESETS.normal,
    fontSize: 12,
    fontFamily: 'Arial',
    compress: false,
  },
};

function createTestHandlers() {
  return {
    app: {
      currentJobId: '',
      onOpenSettings: vi.fn(),
    },
    conversion: {
      handleFileValidated: vi.fn(),
      handleExportClick: vi.fn(async () => {}),
      handleCancelConversion: vi.fn(),
      handleRetry: vi.fn(),
      handleDismissError: vi.fn(),
      handleImportDifferent: vi.fn(),
      handleReportIssue: vi.fn(),
    } satisfies ConversionHandlers,
    quickSettings: {
      settings: null,
      handlers: {
        handlePageSizeChange: vi.fn(),
        handleMarginsChange: vi.fn(),
        handleCustomMarginChange: vi.fn(),
      },
    } satisfies QuickSettingsContextValue,
  };
}

function renderWithProviders(handlers: ReturnType<typeof createTestHandlers>) {
  return render(() => (
    <AppProvider value={handlers.app}>
      <ConversionProvider value={handlers.conversion}>
        <QuickSettingsProvider value={handlers.quickSettings}>
          <FileValidatedView />
        </QuickSettingsProvider>
      </ConversionProvider>
    </AppProvider>
  ));
}

describe('FileValidatedView', () => {
  let handlers: ReturnType<typeof createTestHandlers>;

  beforeEach(() => {
    vi.clearAllMocks();
    popupStore.reset();
    handlers = createTestHandlers();
  });

  const setImportedFile = () => {
    popupStore.setImportedFile(TEST_FILE.name, TEST_FILE.size, TEST_FILE.content);
  };

  describe('Rendering', () => {
    it('renders FileImport component', () => {
      renderWithProviders(handlers);

      expect(screen.getByTestId('file-import')).toBeInTheDocument();
      expect(screen.getByText('FileImport Mock')).toBeInTheDocument();
    });

    it('passes imported file to FileImport when present', () => {
      setImportedFile();

      renderWithProviders(handlers);

      expect(screen.getByText(`File: ${TEST_FILE.name}`)).toBeInTheDocument();
    });
  });

  describe('Export Button', () => {
    it('does not show export button when no file imported', () => {
      renderWithProviders(handlers);

      expect(screen.queryByTestId('export-button')).not.toBeInTheDocument();
    });

    it('does not show export button when settings not loaded', () => {
      setImportedFile();

      renderWithProviders(handlers);

      expect(screen.queryByTestId('export-button')).not.toBeInTheDocument();
    });

    it('shows export button when file imported and settings loaded', () => {
      setImportedFile();
      handlers.quickSettings.settings = TEST_SETTINGS;

      renderWithProviders(handlers);

      expect(screen.getByTestId('export-button')).toBeInTheDocument();
    });

    it('export button has correct text and keyboard hint', () => {
      setImportedFile();
      handlers.quickSettings.settings = TEST_SETTINGS;

      renderWithProviders(handlers);

      const button = screen.getByTestId('export-button');
      expect(button).toHaveTextContent('Export to PDF');
      expect(button).toHaveTextContent(/CtrlE|⌘E/);
    });

    it('export button has accessible aria-label and aria-keyshortcuts', () => {
      setImportedFile();
      handlers.quickSettings.settings = TEST_SETTINGS;

      renderWithProviders(handlers);

      const button = screen.getByTestId('export-button');
      expect(button).toHaveAttribute('aria-label', 'Export to PDF');
      expect(button).toHaveAttribute('aria-keyshortcuts', 'Control+e');
    });

    it('calls handleExportClick when export button clicked', () => {
      setImportedFile();
      handlers.quickSettings.settings = TEST_SETTINGS;

      renderWithProviders(handlers);

      const button = screen.getByTestId('export-button');
      fireEvent.click(button);

      expect(handlers.conversion.handleExportClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Settings Summary', () => {
    it('shows settings summary when file imported and settings loaded', () => {
      setImportedFile();
      handlers.quickSettings.settings = TEST_SETTINGS;

      renderWithProviders(handlers);

      expect(screen.getByText(/Current settings:/)).toBeInTheDocument();
      expect(screen.getByText(/Letter, Normal margins/)).toBeInTheDocument();
    });

    it('shows Change link to open settings', () => {
      setImportedFile();
      handlers.quickSettings.settings = TEST_SETTINGS;

      renderWithProviders(handlers);

      const changeButton = screen.getByText('Change');
      expect(changeButton).toBeInTheDocument();
      expect(changeButton).toHaveAttribute(
        'aria-label',
        'Open settings to change export configuration',
      );
    });

    it('calls onOpenSettings when Change clicked', () => {
      setImportedFile();
      handlers.quickSettings.settings = TEST_SETTINGS;

      renderWithProviders(handlers);

      const changeButton = screen.getByText('Change');
      fireEvent.click(changeButton);

      expect(handlers.app.onOpenSettings).toHaveBeenCalledTimes(1);
    });

    it('formats settings summary correctly for A4 paper', () => {
      setImportedFile();
      handlers.quickSettings.settings = {
        ...TEST_SETTINGS,
        defaultConfig: {
          ...TEST_SETTINGS.defaultConfig,
          pageSize: 'A4',
        },
      };

      renderWithProviders(handlers);

      expect(screen.getByText(/A4, Normal margins/)).toBeInTheDocument();
    });

    it('formats settings summary correctly for compact margins', () => {
      setImportedFile();
      handlers.quickSettings.settings = {
        ...TEST_SETTINGS,
        defaultConfig: {
          ...TEST_SETTINGS.defaultConfig,
          margin: MARGIN_PRESETS.compact,
        },
      };

      renderWithProviders(handlers);

      expect(screen.getByText(/Letter, Compact margins/)).toBeInTheDocument();
    });
  });

  describe('Rendering Stability', () => {
    it('renders without errors with all data present', () => {
      setImportedFile();
      handlers.quickSettings.settings = TEST_SETTINGS;

      expect(() => renderWithProviders(handlers)).not.toThrow();
    });
  });
});
