/**
 * MainContent Component Tests
 *
 * Tests MainContent state machine renderer for correct view display
 * based on UI state and proper prop passing to child components.
 */

import type { AppContextValue } from '../../../context/AppContext';
import type { ConversionHandlers } from '../../../hooks/conversion/useConversionHandlers';
import { render, screen } from '@testing-library/react';

import { beforeEach, describe, expect, vi } from 'vitest';
import { ErrorCode } from '@/shared/errors/codes';
import { generateFilename } from '../../../../shared/utils/filenameSanitization';
import { Success } from '../../conversion';
import { ErrorState } from '../../conversion/ErrorState';
import { ErrorBoundary } from '../../ErrorBoundary';
import { FileImport } from '../../FileImport';
import { MainContent } from '../MainContent';

// Mock child components
vi.mock('../../FileImport', () => ({
  FileImport: vi.fn(() => <div data-testid="file-import">FileImport Mock</div>),
}));

vi.mock('../FileValidatedView', () => ({
  FileValidatedView: vi.fn(() => (
    <div data-testid="file-validated-view">FileValidatedView Mock</div>
  )),
}));

vi.mock('../../conversion/ConvertingState', () => ({
  ConvertingState: vi.fn(() => <div data-testid="converting-state">ConvertingState Mock</div>),
}));

vi.mock('../../conversion/Success', () => ({
  Success: vi.fn(({ filename, onExportAnother }) => (
    <div data-testid="success">
      <div>Success Mock</div>
      <div>
        Filename:
        {filename}
      </div>
      <button type="button" onClick={onExportAnother}>
        Export Another
      </button>
    </div>
  )),
}));

vi.mock('../../conversion/ErrorState', () => ({
  ErrorState: vi.fn(({ error, onRetry, onDismiss, onReportIssue, onImportDifferent }) => (
    <div data-testid="error-state">
      <div>ErrorState Mock</div>
      <div>
        Error:
        {error.message}
      </div>
      <button type="button" onClick={onRetry}>
        Retry
      </button>
      <button type="button" onClick={onDismiss}>
        Dismiss
      </button>
      <button type="button" onClick={onReportIssue}>
        Report Issue
      </button>
      <button type="button" onClick={onImportDifferent}>
        Import Different
      </button>
    </div>
  )),
}));

vi.mock('../../ErrorBoundary', () => ({
  ErrorBoundary: vi.fn(({ children }) => <div data-testid="error-boundary">{children}</div>),
  SectionErrorBoundary: vi.fn(({ children }) => (
    <div data-testid="section-error-boundary">{children}</div>
  )),
}));

vi.mock('../../../../shared/utils/filenameSanitization', () => ({
  generateFilename: vi.fn(() => 'generated-resume.pdf'),
}));

// Mock Context hooks
const mockUseAppContext = vi.fn<() => AppContextValue>();
const mockUseConversion = vi.fn<() => ConversionHandlers>();

vi.mock('../../../context/AppContext', () => ({
  useAppContext: () => mockUseAppContext(),
}));

vi.mock('../../../context/ConversionContext', () => ({
  useConversion: () => mockUseConversion(),
}));

// Mock Context providers
const mockAppContext: AppContextValue = {
  appState: {
    // UI State
    uiState: 'waiting_for_import' as const,
    validationError: null,
    isValidating: false,
    lastError: null,
    lastFilename: null,
    // Persisted Data
    importedFile: null,
    // Progress
    getProgress: vi.fn(() => undefined),
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
  },
  currentJobId: '',
  successRef: { current: null },
  errorRef: { current: null },
  onOpenSettings: vi.fn(),
};

const mockConversionContext: ConversionHandlers = {
  handleFileValidated: vi.fn(),
  handleExportClick: vi.fn(),
  handleCancelConversion: vi.fn(),
  handleRetry: vi.fn(),
  handleDismissError: vi.fn(),
  handleImportDifferent: vi.fn(),
  handleReportIssue: vi.fn(),
};

// Test constants
const UI_STATES = {
  WAITING: 'waiting_for_import' as const,
  VALIDATED: 'file_validated' as const,
  VALIDATION_ERROR: 'validation_error' as const,
  CONVERTING: 'converting' as const,
  SUCCESS: 'success' as const,
  ERROR: 'error' as const,
} as const;

const TEST_ERROR = {
  stage: 'generating-pdf' as const,
  code: ErrorCode.PDF_GENERATION_FAILED,
  message: 'Conversion failed',
  technicalDetails: 'Test error details',
  recoverable: true,
  suggestions: ['Try again', 'Check your file'],
  timestamp: Date.now(),
  errorId: 'test-error-id',
};

const TEST_FILENAME = 'my-resume.pdf';

describe('MainContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset context mocks to default state
    mockUseAppContext.mockReturnValue(mockAppContext);
    mockUseConversion.mockReturnValue(mockConversionContext);
  });

  describe('Semantic HTML', () => {
    it('renders as main element with correct attributes', () => {
      const { container } = render(<MainContent />);

      const main = container.querySelector('main');
      expect(main).toBeInTheDocument();
      expect(main).toHaveAttribute('id', 'main-content');
      expect(main).toHaveAttribute('role', 'main');
    });

    it('applies correct layout classes', () => {
      const { container } = render(<MainContent />);

      const main = container.querySelector('main');
      expect(main).toHaveClass('flex-1', 'overflow-y-auto');
    });
  });

  describe('State: waiting_for_import', () => {
    it('renders FileImport component', () => {
      render(<MainContent />);

      expect(screen.getByTestId('file-import')).toBeInTheDocument();
    });

    it('passes correct props to FileImport', () => {
      render(<MainContent />);

      const calls = vi.mocked(FileImport).mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      const firstCall = calls[0][0];
      expect(firstCall).toMatchObject({
        onClearFile: mockAppContext.appState.clearImportedFile,
        importedFile: mockAppContext.appState.importedFile,
      });
      expect(firstCall.onFileValidated).toBeDefined();
    });

    it('does not render other views', () => {
      render(<MainContent />);

      expect(screen.queryByTestId('file-validated-view')).not.toBeInTheDocument();
      expect(screen.queryByTestId('converting-state')).not.toBeInTheDocument();
      expect(screen.queryByTestId('success')).not.toBeInTheDocument();
      expect(screen.queryByTestId('error-state')).not.toBeInTheDocument();
    });
  });

  describe('State: file_validated', () => {
    it('renders FileValidatedView component', () => {
      mockUseAppContext.mockReturnValue({
        ...mockAppContext,
        appState: {
          ...mockAppContext.appState,
          uiState: UI_STATES.VALIDATED,
        },
      });

      render(<MainContent />);

      expect(screen.getByTestId('file-validated-view')).toBeInTheDocument();
    });

    it('does not render other views', () => {
      mockUseAppContext.mockReturnValue({
        ...mockAppContext,
        appState: {
          ...mockAppContext.appState,
          uiState: UI_STATES.VALIDATED,
        },
      });

      render(<MainContent />);

      expect(screen.queryByTestId('file-import')).not.toBeInTheDocument();
      expect(screen.queryByTestId('converting-state')).not.toBeInTheDocument();
      expect(screen.queryByTestId('success')).not.toBeInTheDocument();
      expect(screen.queryByTestId('error-state')).not.toBeInTheDocument();
    });
  });

  describe('State: validation_error', () => {
    it('renders FileValidatedView component', () => {
      mockUseAppContext.mockReturnValue({
        ...mockAppContext,
        appState: {
          ...mockAppContext.appState,
          uiState: UI_STATES.VALIDATION_ERROR,
        },
      });

      render(<MainContent />);

      expect(screen.getByTestId('file-validated-view')).toBeInTheDocument();
    });

    it('does not render other views', () => {
      mockUseAppContext.mockReturnValue({
        ...mockAppContext,
        appState: {
          ...mockAppContext.appState,
          uiState: UI_STATES.VALIDATION_ERROR,
        },
      });

      render(<MainContent />);

      expect(screen.queryByTestId('file-import')).not.toBeInTheDocument();
      expect(screen.queryByTestId('converting-state')).not.toBeInTheDocument();
      expect(screen.queryByTestId('success')).not.toBeInTheDocument();
      expect(screen.queryByTestId('error-state')).not.toBeInTheDocument();
    });
  });

  describe('State: converting', () => {
    it('renders ConvertingState component', () => {
      mockUseAppContext.mockReturnValue({
        ...mockAppContext,
        appState: {
          ...mockAppContext.appState,
          uiState: UI_STATES.CONVERTING,
        },
      });

      render(<MainContent />);

      expect(screen.getByTestId('converting-state')).toBeInTheDocument();
    });

    it('does not render other views', () => {
      mockUseAppContext.mockReturnValue({
        ...mockAppContext,
        appState: {
          ...mockAppContext.appState,
          uiState: UI_STATES.CONVERTING,
        },
      });

      render(<MainContent />);

      expect(screen.queryByTestId('file-import')).not.toBeInTheDocument();
      expect(screen.queryByTestId('file-validated-view')).not.toBeInTheDocument();
      expect(screen.queryByTestId('success')).not.toBeInTheDocument();
      expect(screen.queryByTestId('error-state')).not.toBeInTheDocument();
    });
  });

  describe('State: success', () => {
    it('renders Success component with ErrorBoundary', () => {
      mockUseAppContext.mockReturnValue({
        ...mockAppContext,
        appState: {
          ...mockAppContext.appState,
          uiState: UI_STATES.SUCCESS,
          lastFilename: TEST_FILENAME,
        },
      });

      render(<MainContent />);

      expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
      expect(screen.getByTestId('success')).toBeInTheDocument();
    });

    it('passes correct filename to Success', () => {
      mockUseAppContext.mockReturnValue({
        ...mockAppContext,
        appState: {
          ...mockAppContext.appState,
          uiState: UI_STATES.SUCCESS,
          lastFilename: TEST_FILENAME,
        },
      });

      render(<MainContent />);

      expect(
        screen.getByText((_content, element) => {
          return (
            element?.textContent === `Filename: ${TEST_FILENAME}` ||
            element?.textContent === `Filename:${TEST_FILENAME}`
          );
        })
      ).toBeInTheDocument();
    });

    it('generates filename when lastFilename is null', () => {
      mockUseAppContext.mockReturnValue({
        ...mockAppContext,
        appState: {
          ...mockAppContext.appState,
          uiState: UI_STATES.SUCCESS,
          lastFilename: null,
        },
      });

      render(<MainContent />);

      expect(generateFilename).toHaveBeenCalledWith(undefined);
      expect(
        screen.getByText((_content, element) => {
          return (
            element?.textContent === 'Filename: generated-resume.pdf' ||
            element?.textContent === 'Filename:generated-resume.pdf'
          );
        })
      ).toBeInTheDocument();
    });

    it('passes reset handler to Success', () => {
      mockUseAppContext.mockReturnValue({
        ...mockAppContext,
        appState: {
          ...mockAppContext.appState,
          uiState: UI_STATES.SUCCESS,
          lastFilename: TEST_FILENAME,
        },
      });

      render(<MainContent />);

      const calls = vi.mocked(Success).mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      const firstCall = calls[0][0];
      expect(firstCall).toMatchObject({
        onExportAnother: mockAppContext.appState.reset,
        filename: TEST_FILENAME,
      });
    });

    it('uses success ref', () => {
      const successRef = { current: null };

      mockUseAppContext.mockReturnValue({
        ...mockAppContext,
        successRef,
        appState: {
          ...mockAppContext.appState,
          uiState: UI_STATES.SUCCESS,
          lastFilename: TEST_FILENAME,
        },
      });

      const { container } = render(<MainContent />);

      // Find the div with fade-in animation that contains success
      const successDiv = container.querySelector('[data-testid="error-boundary"]')?.parentElement;
      expect(successDiv).toBe(successRef.current);
    });

    it('wraps Success in ErrorBoundary', () => {
      mockUseAppContext.mockReturnValue({
        ...mockAppContext,
        appState: {
          ...mockAppContext.appState,
          uiState: UI_STATES.SUCCESS,
          lastFilename: TEST_FILENAME,
        },
      });

      render(<MainContent />);

      // Verify ErrorBoundary wraps Success component
      expect(ErrorBoundary).toHaveBeenCalled();
      const errorBoundaryProps = vi.mocked(ErrorBoundary).mock.calls[0][0];
      expect(errorBoundaryProps.children).toBeDefined();
    });

    it('does not render other views', () => {
      mockUseAppContext.mockReturnValue({
        ...mockAppContext,
        appState: {
          ...mockAppContext.appState,
          uiState: UI_STATES.SUCCESS,
          lastFilename: TEST_FILENAME,
        },
      });

      render(<MainContent />);

      expect(screen.queryByTestId('file-import')).not.toBeInTheDocument();
      expect(screen.queryByTestId('file-validated-view')).not.toBeInTheDocument();
      expect(screen.queryByTestId('converting-state')).not.toBeInTheDocument();
      expect(screen.queryByTestId('error-state')).not.toBeInTheDocument();
    });
  });

  describe('State: error', () => {
    it('renders ErrorState component when error present', () => {
      mockUseAppContext.mockReturnValue({
        ...mockAppContext,
        appState: {
          ...mockAppContext.appState,
          uiState: UI_STATES.ERROR,
          lastError: TEST_ERROR,
        },
      });

      render(<MainContent />);

      expect(screen.getByTestId('error-state')).toBeInTheDocument();
      expect(
        screen.getByText((_content, element) => {
          return (
            element?.textContent === `Error: ${TEST_ERROR.message}` ||
            element?.textContent === `Error:${TEST_ERROR.message}`
          );
        })
      ).toBeInTheDocument();
    });

    it('does not render ErrorState when error is null', () => {
      mockUseAppContext.mockReturnValue({
        ...mockAppContext,
        appState: {
          ...mockAppContext.appState,
          uiState: UI_STATES.ERROR,
          lastError: null,
        },
      });

      render(<MainContent />);

      expect(screen.queryByTestId('error-state')).not.toBeInTheDocument();
    });

    it('passes correct props to ErrorState', () => {
      mockUseAppContext.mockReturnValue({
        ...mockAppContext,
        appState: {
          ...mockAppContext.appState,
          uiState: UI_STATES.ERROR,
          lastError: TEST_ERROR,
        },
      });

      render(<MainContent />);

      const calls = vi.mocked(ErrorState).mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      const firstCall = calls[0][0];
      expect(firstCall).toMatchObject({
        error: TEST_ERROR,
        onRetry: mockConversionContext.handleRetry,
        onDismiss: mockConversionContext.handleDismissError,
        onReportIssue: mockConversionContext.handleReportIssue,
        onImportDifferent: mockConversionContext.handleImportDifferent,
      });
    });

    it('uses error ref', () => {
      const errorRef = { current: null };

      mockUseAppContext.mockReturnValue({
        ...mockAppContext,
        errorRef,
        appState: {
          ...mockAppContext.appState,
          uiState: UI_STATES.ERROR,
          lastError: TEST_ERROR,
        },
      });

      const { container } = render(<MainContent />);

      const errorDiv = container.querySelector('[data-testid="error-state"]')?.parentElement;
      expect(errorDiv).toBe(errorRef.current);
    });

    it('does not render other views', () => {
      mockUseAppContext.mockReturnValue({
        ...mockAppContext,
        appState: {
          ...mockAppContext.appState,
          uiState: UI_STATES.ERROR,
          lastError: TEST_ERROR,
        },
      });

      render(<MainContent />);

      expect(screen.queryByTestId('file-import')).not.toBeInTheDocument();
      expect(screen.queryByTestId('file-validated-view')).not.toBeInTheDocument();
      expect(screen.queryByTestId('converting-state')).not.toBeInTheDocument();
      expect(screen.queryByTestId('success')).not.toBeInTheDocument();
    });
  });

  describe('Animations', () => {
    it('applies fade-in animation to waiting_for_import view', () => {
      render(<MainContent />);

      // FileImport is now wrapped in SectionErrorBoundary, so fade-in is on grandparent
      const sectionBoundary = screen.getByTestId('file-import').parentElement;
      const wrapper = sectionBoundary?.parentElement;
      expect(wrapper?.className).toMatch(/fade.*in/i);
    });

    it('applies fade-in animation to converting view', () => {
      mockUseAppContext.mockReturnValue({
        ...mockAppContext,
        appState: {
          ...mockAppContext.appState,
          uiState: UI_STATES.CONVERTING,
        },
      });

      render(<MainContent />);

      const wrapper = screen.getByTestId('converting-state').parentElement;
      expect(wrapper?.className).toMatch(/fade.*in/i);
    });

    it('applies fade-in animation to success view', () => {
      mockUseAppContext.mockReturnValue({
        ...mockAppContext,
        appState: {
          ...mockAppContext.appState,
          uiState: UI_STATES.SUCCESS,
          lastFilename: TEST_FILENAME,
        },
      });

      render(<MainContent />);

      const wrapper = screen.getByTestId('error-boundary').parentElement;
      expect(wrapper?.className).toMatch(/fade.*in/i);
    });

    it('applies fade-in animation to error view', () => {
      mockUseAppContext.mockReturnValue({
        ...mockAppContext,
        appState: {
          ...mockAppContext.appState,
          uiState: UI_STATES.ERROR,
          lastError: TEST_ERROR,
        },
      });

      render(<MainContent />);

      const wrapper = screen.getByTestId('error-state').parentElement;
      expect(wrapper?.className).toMatch(/fade.*in/i);
    });
  });
});
