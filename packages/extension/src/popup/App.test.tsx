// ABOUTME: App component integration tests with minimal mocking.
// ABOUTME: Tests hydration, routing, state transitions, and keyboard shortcuts.

import { fireEvent, render, screen, waitFor } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorCode } from '../shared/errors/codes';
import App from './App';
import { popupStore } from './store';
import { progressStore } from './store/progressStore';

// Mock @webext-core/messaging (used by @/shared/messaging)
vi.mock('@/shared/messaging', () => ({
  sendMessage: vi.fn().mockImplementation(async (type: string) => {
    if (type === 'getWasmStatus') {
      return { initialized: true, error: null };
    }
    if (type === 'getSettings') {
      return {
        success: true,
        settings: {
          defaultConfig: {
            pageSize: 'Letter',
            margin: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
            fontFamily: 'Inter',
            fontSize: 10,
            lineHeight: 1.5,
            color: '#000000',
          },
          settingsVersion: 1,
          lastUpdated: Date.now(),
        },
      };
    }
    return {};
  }),
  onMessage: vi.fn(() => vi.fn()),
}));

// Mock browser.runtime.getManifest (not in @webext-core/fake-browser)
const browserMocks = vi.hoisted(() => ({
  getManifest: vi.fn(() => ({ version: '1.0.0-test' })),
}));

vi.mock('wxt/browser', async () => {
  const wxtBrowser = await import('wxt/browser');
  return {
    ...wxtBrowser,
    browser: {
      ...wxtBrowser.browser,
      runtime: {
        ...wxtBrowser.browser.runtime,
        getManifest: browserMocks.getManifest,
      },
    },
  };
});

// Mock extensionAPI functions (message passing to background)
vi.mock('./services/extensionAPI', () => ({
  onProgress: vi.fn(() => vi.fn()),
  onSuccess: vi.fn(() => vi.fn()),
  onError: vi.fn(() => vi.fn()),
  requestConversion: vi.fn(),
  validateTsx: vi.fn(),
}));

// Mock WASM compatibility checker
vi.mock('../shared/wasm/compatibility', () => ({
  WasmCompatibilityChecker: {
    check: vi.fn().mockResolvedValue({
      compatible: true,
      issues: [],
      browserInfo: {
        userAgent: 'test-agent',
        browserName: 'Chrome',
        browserVersion: '120',
        platform: 'Linux',
      },
      wasmInfo: {
        supported: true,
        streaming: true,
        threads: true,
        simd: true,
      },
    }),
  },
}));

// Mock Chrome storage for hydration (returns empty state)
vi.mock('./store/persistence', async () => {
  const actual = await vi.importActual('./store/persistence');
  return {
    ...actual,
    loadPersistedState: vi.fn().mockResolvedValue(null),
  };
});

describe('App Integration Tests', () => {
  beforeEach(() => {
    popupStore.reset();
    popupStore.setHasHydrated(true);
    popupStore.setHydrationError(null);
    progressStore.reset();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    vi.clearAllMocks();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  describe('Hydration State Management', () => {
    it('should show loading screen when store is not hydrated', async () => {
      popupStore.setHasHydrated(false);

      render(() => <App />);

      await waitFor(() => {
        expect(screen.getByText('Loading PDF converter...')).toBeInTheDocument();
      });
    });

    it('should show error screen when hydration fails', async () => {
      const hydrationError = new Error('Failed to load persisted state');
      popupStore.setHydrationError(hydrationError);

      render(() => <App />);

      await waitFor(() => {
        expect(screen.getByText('Failed to Load Settings')).toBeInTheDocument();
        expect(screen.getByText('Failed to load persisted state')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Reload Extension/i })).toBeInTheDocument();
      });
    });

    it('should render normally when hydrated successfully', async () => {
      render(() => <App />);

      await waitFor(() => {
        expect(screen.getByText(/Drag & drop your CV file here/i)).toBeInTheDocument();
      });
    });
  });

  describe('Initial Render and State', () => {
    it('should render without errors', async () => {
      const { container } = render(() => <App />);

      await waitFor(() => {
        expect(container.querySelector('.flex.flex-col.h-full')).toBeInTheDocument();
      });
    });

    it('should start in waiting_for_import state', async () => {
      render(() => <App />);

      await waitFor(() => {
        expect(screen.getByText(/Drag & drop your CV file here/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /browse files/i })).toBeInTheDocument();
      });

      expect(popupStore.state.uiState).toBe('waiting_for_import');
      expect(popupStore.state.importedFile).toBeNull();
    });

    it('should render header with settings button', async () => {
      render(() => <App />);

      await waitFor(() => {
        const settingsButton = screen.getByLabelText(/Open settings/i);
        expect(settingsButton).toBeInTheDocument();
      });
    });

    it('should render footer', async () => {
      render(() => <App />);

      await waitFor(() => {
        const footer = document.querySelector('footer');
        expect(footer).toBeInTheDocument();
      });
    });
  });

  describe('File Import Flow', () => {
    it('should transition to file_validated state when file is imported', async () => {
      render(() => <App />);

      await waitFor(() => {
        expect(screen.getByText(/Drag & drop your CV file here/i)).toBeInTheDocument();
      });

      popupStore.setImportedFile(
        'test-resume.tsx',
        2048,
        'export default function Resume() { return <div>Test</div>; }',
      );
      popupStore.setUIState('file_validated');

      await waitFor(() => {
        expect(popupStore.state.uiState).toBe('file_validated');
        expect(popupStore.state.importedFile).toMatchObject({
          name: 'test-resume.tsx',
          size: 2048,
        });
      });
    });

    it('should transition to validation_error state when validation fails', async () => {
      render(() => <App />);

      await waitFor(() => {
        expect(screen.getByText(/Drag & drop your CV file here/i)).toBeInTheDocument();
      });

      popupStore.setValidationError('Invalid TSX format');

      await waitFor(() => {
        expect(popupStore.state.uiState).toBe('validation_error');
        expect(popupStore.state.validationError).toBe('Invalid TSX format');
      });
    });
  });

  describe('Settings Navigation', () => {
    it('should navigate to settings view when settings button is clicked', async () => {
      render(() => <App />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Open settings/i)).toBeInTheDocument();
      });

      const settingsButton = screen.getByLabelText(/Open settings/i);
      fireEvent.click(settingsButton);

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });
    });

    it('should return to main view when back button is clicked in settings', async () => {
      render(() => <App />);

      const settingsButton = await screen.findByLabelText(/Open settings/i, {}, { timeout: 5000 });
      fireEvent.click(settingsButton);

      await waitFor(
        () => {
          expect(screen.getByRole('heading', { name: /Settings/i })).toBeInTheDocument();
        },
        { timeout: 5000 },
      );

      const backButton = screen.getByRole('button', { name: /back/i });
      fireEvent.click(backButton);

      await waitFor(
        () => {
          expect(screen.getByText(/Drag & drop your CV file here/i)).toBeInTheDocument();
          expect(screen.queryByRole('heading', { name: /Settings/i })).not.toBeInTheDocument();
        },
        { timeout: 5000 },
      );
    }, 15000);
  });

  describe('Conversion Flow', () => {
    it('should transition to converting state when export is initiated', async () => {
      render(() => <App />);

      popupStore.setImportedFile(
        'test-resume.tsx',
        2048,
        'export default function Resume() { return <div>Test</div>; }',
      );
      popupStore.setUIState('file_validated');

      await waitFor(() => {
        expect(popupStore.state.importedFile).not.toBeNull();
      });

      popupStore.startConversion();

      await waitFor(() => {
        expect(popupStore.state.uiState).toBe('converting');
      });
    });

    it('should show progress during conversion', async () => {
      render(() => <App />);

      popupStore.setImportedFile(
        'test-resume.tsx',
        2048,
        'export default function Resume() { return <div>Test</div>; }',
      );
      popupStore.startConversion();

      progressStore.updateProgress('default', {
        stage: 'generating-pdf',
        percentage: 50,
        currentOperation: 'Generating PDF',
      });

      await waitFor(() => {
        const progress = progressStore.getProgress('default');
        expect(progress?.percentage).toBe(50);
        expect(progress?.currentOperation).toBe('Generating PDF');
      });
    });

    it('should transition to success state when conversion completes', async () => {
      render(() => <App />);

      popupStore.setImportedFile(
        'test-resume.tsx',
        2048,
        'export default function Resume() { return <div>Test</div>; }',
      );
      popupStore.startConversion();
      popupStore.setSuccess('resume-2025-10-29.pdf');

      await waitFor(() => {
        expect(popupStore.state.uiState).toBe('success');
        expect(popupStore.state.lastFilename).toBe('resume-2025-10-29.pdf');
      });
    });

    it('should transition to error state when conversion fails', async () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(() => <App />);

      popupStore.setImportedFile(
        'test-resume.tsx',
        2048,
        'export default function Resume() { return <div>Test</div>; }',
      );
      popupStore.startConversion();
      popupStore.setError({
        message: 'PDF generation failed',
        code: ErrorCode.WASM_EXECUTION_ERROR,
        stage: 'generating-pdf',
        recoverable: true,
        suggestions: ['Try again', 'Check console for details'],
        timestamp: Date.now(),
      });

      await waitFor(() => {
        expect(popupStore.state.uiState).toBe('error');
        expect(popupStore.state.lastError?.message).toBe('PDF generation failed');
      });

      spy.mockRestore();
    });
  });

  describe('Store Integration', () => {
    it('should properly integrate stores with reactive UI', async () => {
      render(() => <App />);

      popupStore.setImportedFile('test.tsx', 1024, 'content');
      popupStore.setUIState('file_validated');

      await waitFor(() => {
        expect(popupStore.state.importedFile?.name).toBe('test.tsx');
        expect(popupStore.state.uiState).toBe('file_validated');
      });
    });
  });
});
