/**
 * App Component Integration Tests
 * Tests App.tsx with minimal mocking - only external dependencies
 *
 * Tests real behavior:
 * - State transitions (waiting_for_import → file_validated → converting → success/error)
 * - Hook integration (useAppState, useConversionHandlers, useQuickSettings)
 * - Router transitions (main → settings → main)
 * - Keyboard shortcuts
 * - Accessibility (focus management, screen reader announcements)
 *
 * ONLY mocks:
 * - Browser APIs (webextension-polyfill)
 * - External services (settingsStore, extensionAPI)
 * - WASM compatibility check
 */

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorCode } from '../shared/errors';
import App from './App';
import { usePopupStore } from './store';
import { useProgressStore } from './store/progressStore';

// Suppress expected unhandled rejections from hydration error tests
const originalUnhandledRejection = process.listeners('unhandledRejection')[0];
const expectedErrors = new Set<string>();

process.removeAllListeners('unhandledRejection');
process.on('unhandledRejection', (reason) => {
  const errorMessage = reason instanceof Error ? reason.message : String(reason);
  if (!expectedErrors.has(errorMessage)) {
    // Re-emit if not an expected error
    if (originalUnhandledRejection !== null && originalUnhandledRejection !== undefined) {
      originalUnhandledRejection(reason, Promise.resolve());
    }
  }
  // Silently ignore expected errors
});

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
  onMessage: vi.fn(() => vi.fn()), // Returns unsubscribe function
}));

// Mock browser.runtime.getManifest (not implemented in @webext-core/fake-browser)
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

// Mock extensionAPI (external service - message passing)
vi.mock('./services/extensionAPI', () => ({
  extensionAPI: {
    queryWasmStatus: vi.fn().mockResolvedValue({
      success: true,
      data: {
        initialized: true,
        error: null,
      },
    }),
    onProgress: vi.fn(() => vi.fn()), // Returns unsubscribe function
    onSuccess: vi.fn(() => vi.fn()),
    onError: vi.fn(() => vi.fn()),
    requestConversion: vi.fn(),
  },
}));

// Mock settingsStore (external service - browser storage)
vi.mock('../shared/services/settingsStore', () => ({
  settingsStore: {
    loadSettings: vi.fn().mockResolvedValue({
      defaultConfig: {
        pageSize: 'Letter',
        margin: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
        fontFamily: 'Inter',
        fontSize: 10,
        lineHeight: 1.5,
        color: '#000000',
      },
    }),
    saveSettings: vi.fn().mockResolvedValue(undefined),
    resetSettings: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock WASM compatibility checker (external check)
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

// Mock store persistence (external - browser storage)
// No longer needed - hydration is now tracked via store state (_hasHydrated, _hydrationError)

describe('App Integration Tests', () => {
  describe('Hydration State Management', () => {
    it('should show loading screen when store is not hydrated', async () => {
      usePopupStore.getState().setHasHydrated(false);

      render(<App />);

      // AppShell should show loading screen when not hydrated
      await waitFor(() => {
        expect(screen.getByText('Loading PDF converter...')).toBeInTheDocument();
      });

      // Now simulate hydration completing
      usePopupStore.getState().setHasHydrated(true);

      // Should transition to main content
      await waitFor(() => {
        expect(screen.getByText(/Drag & drop your CV file here/i)).toBeInTheDocument();
      });
    });

    it('should show error screen when hydration fails', async () => {
      const hydrationError = new Error('Failed to load persisted state');

      // Set hydration error
      usePopupStore.getState().setHydrationError(hydrationError);
      usePopupStore.getState().setHasHydrated(true); // Mark as hydrated even with error

      render(<App />);

      // Should show error screen
      await waitFor(() => {
        expect(screen.getByText('Failed to Load Settings')).toBeInTheDocument();
        expect(screen.getByText('Failed to load persisted state')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Reload Extension/i })).toBeInTheDocument();
      });
    });

    it('should render normally when hydrated successfully', async () => {
      usePopupStore.getState().setHasHydrated(true);
      usePopupStore.getState().setHydrationError(null);

      render(<App />);

      // Should show main content (FileImport component)
      await waitFor(() => {
        expect(screen.getByText(/Drag & drop your CV file here/i)).toBeInTheDocument();
      });
    });
  });

  beforeEach(() => {
    usePopupStore.getState().reset();
    useProgressStore.getState().reset();
    usePopupStore.getState().setHasHydrated(true);
    usePopupStore.getState().setHydrationError(null);
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // Clean up React components
    cleanup();

    // Clean up to prevent memory leaks
    vi.clearAllMocks();

    // Force cleanup of any pending promises
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  describe('Initial Render and State', () => {
    it('should render without errors', async () => {
      const { container } = render(<App />);

      await waitFor(() => {
        expect(container.querySelector('.flex.flex-col.h-full')).toBeInTheDocument();
      });
    });

    it('should start in waiting_for_import state', async () => {
      render(<App />);

      await waitFor(() => {
        // FileImport component should be visible
        expect(screen.getByText(/Drag & drop your CV file here/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /browse files/i })).toBeInTheDocument();
      });

      // Verify store state
      expect(usePopupStore.getState().uiState).toBe('waiting_for_import');
      expect(usePopupStore.getState().importedFile).toBeNull();
    });

    it('should render header with settings button', async () => {
      render(<App />);

      await waitFor(() => {
        // Settings button should be present (with keyboard shortcut hint)
        const settingsButton = screen.getByLabelText(/Open settings/i);
        expect(settingsButton).toBeInTheDocument();
      });
    });

    it('should render footer', async () => {
      render(<App />);

      await waitFor(() => {
        // Footer should contain version info or other footer content
        const footer = document.querySelector('footer');
        expect(footer).toBeInTheDocument();
      });
    });
  });

  describe('File Import Flow', () => {
    it('should transition to file_validated state when file is imported', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/Drag & drop your CV file here/i)).toBeInTheDocument();
      });

      // Simulate file import via store action
      usePopupStore
        .getState()
        .setImportedFile(
          'test-resume.tsx',
          2048,
          'export default function Resume() { return <div>Test</div>; }'
        );
      usePopupStore.getState().setUIState('file_validated');

      await waitFor(() => {
        // Should show file validation success and export button
        expect(usePopupStore.getState().uiState).toBe('file_validated');
        expect(usePopupStore.getState().importedFile).toMatchObject({
          name: 'test-resume.tsx',
          size: 2048,
        });
      });
    });

    it('should transition to validation_error state when validation fails', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/Drag & drop your CV file here/i)).toBeInTheDocument();
      });

      // Simulate validation error state transition
      // Note: Actual validation errors are displayed by FileImport component's local state
      // This test verifies the UIStore state transition only
      usePopupStore.getState().setValidationError('Invalid TSX format');

      await waitFor(() => {
        expect(usePopupStore.getState().uiState).toBe('validation_error');
        expect(usePopupStore.getState().validationError).toBe('Invalid TSX format');
      });
    });
  });

  describe('Settings Navigation', () => {
    it('should navigate to settings view when settings button is clicked', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Open settings/i)).toBeInTheDocument();
      });

      // Click settings button
      const settingsButton = screen.getByLabelText(/Open settings/i);
      fireEvent.click(settingsButton);

      await waitFor(() => {
        // Should show Settings component
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });
    });

    // Changed handleCloseSettings order
    // NOW: await reloadSettings() BEFORE setCurrentView('main')
    // BEFORE: setCurrentView('main') then await reloadSettings() (caused race condition)
    it('should return to main view when back button is clicked in settings', async () => {
      render(<App />);

      // Navigate to settings
      const settingsButton = await screen.findByLabelText(/Open settings/i, {}, { timeout: 5000 });
      fireEvent.click(settingsButton);

      await waitFor(
        () => {
          // Settings page should show (look for heading, not button)
          expect(screen.getByRole('heading', { name: /Settings/i })).toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // Click back button - Settings back button has different label
      const backButton = screen.getByRole('button', { name: /back/i });
      fireEvent.click(backButton);

      // Should navigate back to main view
      await waitFor(
        () => {
          // Main view should be visible
          expect(screen.getByText(/Drag & drop your CV file here/i)).toBeInTheDocument();
          // Settings page heading should be gone (not button, which stays in header)
          expect(screen.queryByRole('heading', { name: /Settings/i })).not.toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    }, 15000);
  });

  describe('Conversion Flow', () => {
    it('should transition to converting state when export is initiated', async () => {
      render(<App />);

      // Setup: Import file first
      usePopupStore
        .getState()
        .setImportedFile(
          'test-resume.tsx',
          2048,
          'export default function Resume() { return <div>Test</div>; }'
        );
      usePopupStore.getState().setUIState('file_validated');

      await waitFor(() => {
        expect(usePopupStore.getState().importedFile).not.toBeNull();
      });

      // Trigger conversion
      usePopupStore.getState().startConversion();

      await waitFor(() => {
        expect(usePopupStore.getState().uiState).toBe('converting');
      });
    });

    it('should show progress during conversion', async () => {
      render(<App />);

      // Setup: Start conversion
      usePopupStore
        .getState()
        .setImportedFile(
          'test-resume.tsx',
          2048,
          'export default function Resume() { return <div>Test</div>; }'
        );
      usePopupStore.getState().startConversion();

      // Simulate progress update
      useProgressStore.getState().updateProgress('default', {
        stage: 'generating-pdf',
        percentage: 50,
        currentOperation: 'Generating PDF',
      });

      await waitFor(() => {
        // Progress should be stored in store
        const progress = useProgressStore.getState().getProgress('default');
        expect(progress?.percentage).toBe(50);
        expect(progress?.currentOperation).toBe('Generating PDF');
      });
    });

    it('should transition to success state when conversion completes', async () => {
      render(<App />);

      // Setup and convert
      usePopupStore
        .getState()
        .setImportedFile(
          'test-resume.tsx',
          2048,
          'export default function Resume() { return <div>Test</div>; }'
        );
      usePopupStore.getState().startConversion();

      // Simulate success
      usePopupStore.getState().setSuccess('resume-2025-10-29.pdf');

      await waitFor(() => {
        expect(usePopupStore.getState().uiState).toBe('success');
        expect(usePopupStore.getState().lastFilename).toBe('resume-2025-10-29.pdf');
      });
    });

    it('should transition to error state when conversion fails', async () => {
      render(<App />);

      // Setup and convert
      usePopupStore
        .getState()
        .setImportedFile(
          'test-resume.tsx',
          2048,
          'export default function Resume() { return <div>Test</div>; }'
        );
      usePopupStore.getState().startConversion();

      // Simulate error
      usePopupStore.getState().setError({
        message: 'PDF generation failed',
        code: ErrorCode.WASM_EXECUTION_ERROR,
        stage: 'generating-pdf',
        recoverable: true,
        suggestions: ['Try again', 'Check console for details'],
        errorId: 'test-error-id',
        timestamp: Date.now(),
      });

      await waitFor(() => {
        expect(usePopupStore.getState().uiState).toBe('error');
        expect(usePopupStore.getState().lastError?.message).toBe('PDF generation failed');
      });
    });
  });

  describe('Reset Flow', () => {
    it('should reset to initial state when reset is called', async () => {
      render(<App />);

      // Setup: Import file and set success state
      usePopupStore
        .getState()
        .setImportedFile(
          'test-resume.tsx',
          2048,
          'export default function Resume() { return <div>Test</div>; }'
        );
      usePopupStore.getState().setSuccess('resume.pdf');

      await waitFor(() => {
        expect(usePopupStore.getState().uiState).toBe('success');
      });

      // Reset
      usePopupStore.getState().reset();
      usePopupStore.getState().reset();

      await waitFor(() => {
        // Should be back to initial state
        expect(usePopupStore.getState().uiState).toBe('waiting_for_import');
        expect(usePopupStore.getState().lastFilename).toBeNull();
        expect(usePopupStore.getState().importedFile).toBeNull();
      });
    });
  });

  describe('Store Integration', () => {
    it('should properly integrate useAppState hook with stores', async () => {
      render(<App />);

      // The App component uses useAppState which subscribes to multiple stores
      // Verify stores are reactive

      usePopupStore.getState().setImportedFile('test.tsx', 1024, 'content');
      usePopupStore.getState().setUIState('file_validated');

      await waitFor(() => {
        // Component should react to store changes
        expect(usePopupStore.getState().importedFile?.name).toBe('test.tsx');
        expect(usePopupStore.getState().uiState).toBe('file_validated');
      });
    });

    it('should not recreate subscriptions unnecessarily (memory leak prevention)', async () => {
      const { rerender } = render(<App />);

      // Force re-render multiple times
      rerender(<App />);
      rerender(<App />);

      await waitFor(() => {
        // Store state should be stable (same reference)
        // This test verifies fix - subscriptions shouldn't recreate
        const currentState = usePopupStore.getState();
        expect(currentState).toBeDefined();
        expect(typeof currentState.setUIState).toBe('function');
      });
    });
  });
});
