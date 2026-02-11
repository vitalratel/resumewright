// ABOUTME: Tests for MainContent state machine renderer.
// ABOUTME: Tests correct view display based on UI state and proper handler passing.

import { fireEvent, render, screen } from '@solidjs/testing-library';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorCode } from '@/shared/errors/codes';
import { generateFilename } from '../../../../shared/utils/filenameSanitization';
import type { ConversionHandlers } from '../../../context/ConversionContext';
import { popupStore } from '../../../store';
import { MainContent } from '../MainContent';
import { createMockConversionContext } from './testHelpers';

// Mock child components
vi.mock('../../FileImport', () => ({
  FileImport: vi.fn((props: { importedFile?: { name: string } | null }) => (
    <div data-testid="file-import">
      FileImport Mock
      {props.importedFile && <div>File: {props.importedFile.name}</div>}
    </div>
  )),
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
  Success: vi.fn((props: { filename: string; onExportAnother: () => void }) => (
    <div data-testid="success">
      <div>Success Mock</div>
      <div>Filename: {props.filename}</div>
      <button type="button" onClick={props.onExportAnother}>
        Export Another
      </button>
    </div>
  )),
}));

vi.mock('../../conversion/ErrorState', () => ({
  ErrorState: vi.fn(
    (props: {
      error: { message: string };
      onRetry: () => void;
      onDismiss: () => void;
      onReportIssue: () => void;
      onImportDifferent: () => void;
    }) => (
      <div data-testid="error-state">
        <div>ErrorState Mock</div>
        <div>Error: {props.error.message}</div>
        <button type="button" onClick={props.onRetry}>
          Retry
        </button>
        <button type="button" onClick={props.onDismiss}>
          Dismiss
        </button>
        <button type="button" onClick={props.onReportIssue}>
          Report Issue
        </button>
        <button type="button" onClick={props.onImportDifferent}>
          Import Different
        </button>
      </div>
    ),
  ),
}));

vi.mock('../../ErrorBoundary', () => ({
  ErrorBoundary: vi.fn((props: { children: unknown }) => (
    <div data-testid="error-boundary">{props.children}</div>
  )),
  SectionErrorBoundary: vi.fn((props: { children: unknown }) => (
    <div data-testid="section-error-boundary">{props.children}</div>
  )),
}));

vi.mock('../../../../shared/utils/filenameSanitization', () => ({
  generateFilename: vi.fn(() => 'generated-resume.pdf'),
}));

// Mock ConversionContext hook
const mockUseConversion = vi.fn<() => ConversionHandlers>();

vi.mock('../../../context/ConversionContext', () => ({
  useConversion: () => mockUseConversion(),
}));

// Create mock instances using shared factory
const mockConversionContext = createMockConversionContext();

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
    popupStore.reset();
    mockUseConversion.mockReturnValue(mockConversionContext);
  });

  describe('Semantic HTML', () => {
    it('renders as main element with correct attributes', () => {
      const { container } = render(() => <MainContent />);

      const main = container.querySelector('main');
      expect(main).toBeInTheDocument();
      expect(main).toHaveAttribute('id', 'main-content');
      expect(main?.tagName).toBe('MAIN');
    });

    it('applies correct layout classes', () => {
      const { container } = render(() => <MainContent />);

      const main = container.querySelector('main');
      expect(main).toHaveClass('flex-1', 'overflow-y-auto');
    });
  });

  describe('State: waiting_for_import', () => {
    it('renders FileImport component', () => {
      render(() => <MainContent />);

      expect(screen.getByTestId('file-import')).toBeInTheDocument();
    });

    it('does not render other views', () => {
      render(() => <MainContent />);

      expect(screen.queryByTestId('file-validated-view')).not.toBeInTheDocument();
      expect(screen.queryByTestId('converting-state')).not.toBeInTheDocument();
      expect(screen.queryByTestId('success')).not.toBeInTheDocument();
      expect(screen.queryByTestId('error-state')).not.toBeInTheDocument();
    });
  });

  describe('State: file_validated', () => {
    it('renders FileValidatedView component', () => {
      popupStore.setUIState(UI_STATES.VALIDATED);

      render(() => <MainContent />);

      expect(screen.getByTestId('file-validated-view')).toBeInTheDocument();
    });

    it('does not render other views', () => {
      popupStore.setUIState(UI_STATES.VALIDATED);

      render(() => <MainContent />);

      expect(screen.queryByTestId('file-import')).not.toBeInTheDocument();
      expect(screen.queryByTestId('converting-state')).not.toBeInTheDocument();
      expect(screen.queryByTestId('success')).not.toBeInTheDocument();
      expect(screen.queryByTestId('error-state')).not.toBeInTheDocument();
    });
  });

  describe('State: validation_error', () => {
    it('renders FileValidatedView component', () => {
      popupStore.setUIState(UI_STATES.VALIDATION_ERROR);

      render(() => <MainContent />);

      expect(screen.getByTestId('file-validated-view')).toBeInTheDocument();
    });

    it('does not render other views', () => {
      popupStore.setUIState(UI_STATES.VALIDATION_ERROR);

      render(() => <MainContent />);

      expect(screen.queryByTestId('file-import')).not.toBeInTheDocument();
      expect(screen.queryByTestId('converting-state')).not.toBeInTheDocument();
      expect(screen.queryByTestId('success')).not.toBeInTheDocument();
      expect(screen.queryByTestId('error-state')).not.toBeInTheDocument();
    });
  });

  describe('State: converting', () => {
    it('renders ConvertingState component', () => {
      popupStore.startConversion();

      render(() => <MainContent />);

      expect(screen.getByTestId('converting-state')).toBeInTheDocument();
    });

    it('does not render other views', () => {
      popupStore.startConversion();

      render(() => <MainContent />);

      expect(screen.queryByTestId('file-import')).not.toBeInTheDocument();
      expect(screen.queryByTestId('file-validated-view')).not.toBeInTheDocument();
      expect(screen.queryByTestId('success')).not.toBeInTheDocument();
      expect(screen.queryByTestId('error-state')).not.toBeInTheDocument();
    });
  });

  describe('State: success', () => {
    it('renders Success component with ErrorBoundary', () => {
      popupStore.setSuccess(TEST_FILENAME);

      render(() => <MainContent />);

      expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
      expect(screen.getByTestId('success')).toBeInTheDocument();
    });

    it('passes correct filename to Success', () => {
      popupStore.setSuccess(TEST_FILENAME);

      render(() => <MainContent />);

      expect(screen.getByText(`Filename: ${TEST_FILENAME}`)).toBeInTheDocument();
    });

    it('generates filename when lastFilename is null', () => {
      popupStore.setUIState(UI_STATES.SUCCESS);

      render(() => <MainContent />);

      expect(generateFilename).toHaveBeenCalledWith(undefined);
      expect(screen.getByText('Filename: generated-resume.pdf')).toBeInTheDocument();
    });

    it('resets state when Export Another clicked', () => {
      popupStore.setImportedFile('resume.tsx', 2048, '// content');
      popupStore.setSuccess(TEST_FILENAME);

      render(() => <MainContent />);

      const button = screen.getByText('Export Another');
      fireEvent.click(button);

      expect(popupStore.state.uiState).toBe('waiting_for_import');
      expect(popupStore.state.importedFile).toBeNull();
    });

    it('does not render other views', () => {
      popupStore.setSuccess(TEST_FILENAME);

      render(() => <MainContent />);

      expect(screen.queryByTestId('file-import')).not.toBeInTheDocument();
      expect(screen.queryByTestId('file-validated-view')).not.toBeInTheDocument();
      expect(screen.queryByTestId('converting-state')).not.toBeInTheDocument();
      expect(screen.queryByTestId('error-state')).not.toBeInTheDocument();
    });
  });

  describe('State: error', () => {
    it('renders ErrorState component when error present', () => {
      popupStore.setError(TEST_ERROR);

      render(() => <MainContent />);

      expect(screen.getByTestId('error-state')).toBeInTheDocument();
      expect(screen.getByText(`Error: ${TEST_ERROR.message}`)).toBeInTheDocument();
    });

    it('does not render ErrorState when error is null', () => {
      popupStore.setUIState(UI_STATES.ERROR);

      render(() => <MainContent />);

      expect(screen.queryByTestId('error-state')).not.toBeInTheDocument();
    });

    it('passes conversion handlers to ErrorState', () => {
      popupStore.setError(TEST_ERROR);

      render(() => <MainContent />);

      fireEvent.click(screen.getByText('Retry'));
      expect(mockConversionContext.handleRetry).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByText('Dismiss'));
      expect(mockConversionContext.handleDismissError).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByText('Import Different'));
      expect(mockConversionContext.handleImportDifferent).toHaveBeenCalledTimes(1);
    });

    it('does not render other views', () => {
      popupStore.setError(TEST_ERROR);

      render(() => <MainContent />);

      expect(screen.queryByTestId('file-import')).not.toBeInTheDocument();
      expect(screen.queryByTestId('file-validated-view')).not.toBeInTheDocument();
      expect(screen.queryByTestId('converting-state')).not.toBeInTheDocument();
      expect(screen.queryByTestId('success')).not.toBeInTheDocument();
    });
  });

  describe('Animations', () => {
    it('applies fade-in animation to waiting_for_import view', () => {
      render(() => <MainContent />);

      // FileImport is wrapped in SectionErrorBoundary, so fade-in is on grandparent
      const sectionBoundary = screen.getByTestId('file-import').parentElement;
      const wrapper = sectionBoundary?.parentElement;
      expect(wrapper?.className).toMatch(/fade.*in/i);
    });

    it('applies fade-in animation to converting view', () => {
      popupStore.startConversion();

      render(() => <MainContent />);

      const wrapper = screen.getByTestId('converting-state').parentElement;
      expect(wrapper?.className).toMatch(/fade.*in/i);
    });

    it('applies fade-in animation to success view', () => {
      popupStore.setSuccess(TEST_FILENAME);

      render(() => <MainContent />);

      const wrapper = screen.getByTestId('error-boundary').parentElement;
      expect(wrapper?.className).toMatch(/fade.*in/i);
    });

    it('applies fade-in animation to error view', () => {
      popupStore.setError(TEST_ERROR);

      render(() => <MainContent />);

      const wrapper = screen.getByTestId('error-state').parentElement;
      expect(wrapper?.className).toMatch(/fade.*in/i);
    });
  });
});
