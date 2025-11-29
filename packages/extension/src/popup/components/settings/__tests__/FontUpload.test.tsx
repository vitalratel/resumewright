/**
 * FontUpload Component Tests
 * Font file type and size validation
 *
 * Tests file validation, upload flow, and error handling
 */

import type { FontWeight } from '@/shared/domain/fonts/models/Font';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import userEvent from '@testing-library/user-event';
import { fakeBrowser } from '@webext-core/fake-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CUSTOM_FONT_LIMITS } from '@/shared/domain/fonts/models/Font';
import { MessageType } from '@/shared/types/messages';
import { FontUpload } from '../FontUpload';

// Mock webextension-polyfill BEFORE any other imports
vi.mock('webextension-polyfill', () => ({
  default: fakeBrowser,
}));

// Helper to create File with arrayBuffer support
function createMockFile(content: string, name: string, type: string): File {
  const bytes = new TextEncoder().encode(content);
  const file = new File([bytes], name, { type });
  // Add arrayBuffer method for test environment
  Object.defineProperty(file, 'arrayBuffer', {
    value: async () => bytes.buffer,
  });
  return file;
}

describe('FontUpload', () => {
  const mockOnUploadSuccess = vi.fn();
  const mockOnError = vi.fn();
  const mockStorageStats = { count: 0, totalSize: 0 };

  const mockCustomFont = {
    id: 'mock-font-id',
    family: 'Test Font',
    weight: 400 as FontWeight,
    style: 'normal' as const,
    format: 'ttf' as const,
    bytes: new Uint8Array(),
    uploadedAt: Date.now(),
    fileSize: 1024,
  };

  beforeEach(() => {
    // Reset fake browser state before each test
    fakeBrowser.reset();
    vi.clearAllMocks();

    // Setup message handlers using fakeBrowser's spy
    const sendMessageSpy = vi.spyOn(fakeBrowser.runtime, 'sendMessage');
    sendMessageSpy.mockImplementation(async (message: unknown) => {
      const msg = message as { type: string; payload?: unknown };

      if (msg.type === MessageType.UPLOAD_CUSTOM_FONT) {
        return Promise.resolve({
          font: mockCustomFont,
        });
      }
      return Promise.reject(new Error(`Unknown message type: ${msg.type}`));
    });
  });

  describe('Rendering', () => {
    it('renders upload form with all fields', () => {
      render(
        <FontUpload
          onUploadSuccess={mockOnUploadSuccess}
          onError={mockOnError}
          storageStats={mockStorageStats}
        />,
      );

      expect(screen.getByText('Upload Font')).toBeInTheDocument();
      expect(screen.getByLabelText('Font Family Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Weight')).toBeInTheDocument();
      expect(screen.getByLabelText('Style')).toBeInTheDocument();
      expect(screen.getByLabelText(/Font File/i)).toBeInTheDocument();
    });

    it('shows supported file types', () => {
      render(
        <FontUpload
          onUploadSuccess={mockOnUploadSuccess}
          onError={mockOnError}
          storageStats={mockStorageStats}
        />,
      );

      expect(screen.getByText(/Supports TrueType.*OpenType.*WOFF/i)).toBeInTheDocument();
    });

    it('shows max file size limit', () => {
      render(
        <FontUpload
          onUploadSuccess={mockOnUploadSuccess}
          onError={mockOnError}
          storageStats={mockStorageStats}
        />,
      );

      expect(screen.getByText(/Max 2\.0 MB per file/i)).toBeInTheDocument();
    });
  });

  describe('File Type Validation', () => {
    it('accepts .ttf files', async () => {
      render(
        <FontUpload
          onUploadSuccess={mockOnUploadSuccess}
          onError={mockOnError}
          storageStats={mockStorageStats}
        />,
      );

      const fontFamilyInput = screen.getByLabelText('Font Family Name');
      await userEvent.type(fontFamilyInput, 'My Font');

      const file = createMockFile('font content', 'myfont.ttf', 'font/ttf');
      const input = screen.getByLabelText(/Font File/i);
      await userEvent.upload(input, file);

      await waitFor(() => {
        expect(vi.mocked(fakeBrowser.runtime.sendMessage)).toHaveBeenCalledWith({
          type: MessageType.UPLOAD_CUSTOM_FONT,
          payload: expect.objectContaining({
            fileName: 'myfont.ttf',
            fileBytes: expect.any(Array),
            metadata: {
              family: 'My Font',
              weight: 400,
              style: 'normal',
            },
          }),
        });
      });

      // onError('') is called to clear previous errors
      expect(mockOnError).toHaveBeenCalledWith('');
    });

    it('accepts .otf files', async () => {
      render(
        <FontUpload
          onUploadSuccess={mockOnUploadSuccess}
          onError={mockOnError}
          storageStats={mockStorageStats}
        />,
      );

      const fontFamilyInput = screen.getByLabelText('Font Family Name');
      await userEvent.type(fontFamilyInput, 'My Font');

      const file = createMockFile('font content', 'myfont.otf', 'font/otf');
      const input = screen.getByLabelText(/Font File/i);
      await userEvent.upload(input, file);

      await waitFor(() => {
        expect(vi.mocked(fakeBrowser.runtime.sendMessage)).toHaveBeenCalledWith({
          type: MessageType.UPLOAD_CUSTOM_FONT,
          payload: expect.objectContaining({
            fileName: 'myfont.otf',
            fileBytes: expect.any(Array),
          }),
        });
      });
    });

    it('rejects invalid file types', async () => {
      render(
        <FontUpload
          onUploadSuccess={mockOnUploadSuccess}
          onError={mockOnError}
          storageStats={mockStorageStats}
        />,
      );

      // Fill font family name first (required for validation)
      const fontFamilyInput = screen.getByLabelText('Font Family Name');
      await userEvent.type(fontFamilyInput, 'My Font');

      const file = createMockFile('font content', 'myfont.pdf', 'application/pdf');
      const input = screen.getByLabelText(/Font File/i);

      // Use fireEvent instead of userEvent to bypass accept attribute
      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      });
      fireEvent.change(input);

      // Wait for error callback
      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalled();
      });

      // Should call onError with error message (not empty string)
      expect(mockOnError).toHaveBeenCalledWith(
        expect.stringMatching(/Invalid file type/i),
      );
      expect(vi.mocked(fakeBrowser.runtime.sendMessage)).not.toHaveBeenCalled();
    });

    it('is case-insensitive for file extensions', async () => {
      render(
        <FontUpload
          onUploadSuccess={mockOnUploadSuccess}
          onError={mockOnError}
          storageStats={mockStorageStats}
        />,
      );

      const fontFamilyInput = screen.getByLabelText('Font Family Name');
      await userEvent.type(fontFamilyInput, 'My Font');

      const file = createMockFile('font content', 'myfont.TTF', 'font/ttf');
      const input = screen.getByLabelText(/Font File/i);
      await userEvent.upload(input, file);

      await waitFor(() => {
        expect(vi.mocked(fakeBrowser.runtime.sendMessage)).toHaveBeenCalledWith({
          type: MessageType.UPLOAD_CUSTOM_FONT,
          payload: expect.objectContaining({
            fileName: 'myfont.TTF',
            fileBytes: expect.any(Array),
          }),
        });
      });

      // onError('') is called to clear previous errors
      expect(mockOnError).toHaveBeenCalledWith('');
    });
  });

  describe('File Size Validation', () => {
    it('accepts files under MAX_FILE_SIZE limit', async () => {
      render(
        <FontUpload
          onUploadSuccess={mockOnUploadSuccess}
          onError={mockOnError}
          storageStats={mockStorageStats}
        />,
      );

      const fontFamilyInput = screen.getByLabelText('Font Family Name');
      await userEvent.type(fontFamilyInput, 'My Font');

      // File under MAX_FILE_SIZE limit
      const content = Array.from({ length: CUSTOM_FONT_LIMITS.MAX_FILE_SIZE - 1024 }).fill('a').join('');
      const file = createMockFile(content, 'myfont.ttf', 'font/ttf');
      const input = screen.getByLabelText(/Font File/i);
      await userEvent.upload(input, file);

      await waitFor(() => {
        expect(vi.mocked(fakeBrowser.runtime.sendMessage)).toHaveBeenCalledWith({
          type: MessageType.UPLOAD_CUSTOM_FONT,
          payload: expect.objectContaining({
            fileName: 'myfont.ttf',
            fileBytes: expect.any(Array),
          }),
        });
      });

      // onError('') is called to clear previous errors
      expect(mockOnError).toHaveBeenCalledWith('');
    });

    it('rejects files over MAX_FILE_SIZE limit', async () => {
      render(
        <FontUpload
          onUploadSuccess={mockOnUploadSuccess}
          onError={mockOnError}
          storageStats={mockStorageStats}
        />,
      );

      // Fill font family name first (required for validation)
      const fontFamilyInput = screen.getByLabelText('Font Family Name');
      await userEvent.type(fontFamilyInput, 'My Font');

      // File exceeds MAX_FILE_SIZE limit
      const content = Array.from({ length: CUSTOM_FONT_LIMITS.MAX_FILE_SIZE + 1024 }).fill('a').join('');
      const file = createMockFile(content, 'myfont.ttf', 'font/ttf');
      const input = screen.getByLabelText(/Font File/i);
      await userEvent.upload(input, file);

      // Should call onError with error message (not empty string)
      expect(mockOnError).toHaveBeenCalledWith(
        expect.stringMatching(/too large/i),
      );
      expect(vi.mocked(fakeBrowser.runtime.sendMessage)).not.toHaveBeenCalled();
    });
  });

  describe('Font Metadata Validation', () => {
    it('requires font family name', async () => {
      render(
        <FontUpload
          onUploadSuccess={mockOnUploadSuccess}
          onError={mockOnError}
          storageStats={mockStorageStats}
        />,
      );

      // Try to upload without font family name
      const file = createMockFile('font content', 'myfont.ttf', 'font/ttf');
      const input = screen.getByLabelText(/Font File/i);
      await userEvent.upload(input, file);

      expect(screen.getByText(/Font family name is required/i)).toBeInTheDocument();
      expect(vi.mocked(fakeBrowser.runtime.sendMessage)).not.toHaveBeenCalled();
    });

    it('shows font family error on blur when empty', async () => {
      render(
        <FontUpload
          onUploadSuccess={mockOnUploadSuccess}
          onError={mockOnError}
          storageStats={mockStorageStats}
        />,
      );

      const fontFamilyInput = screen.getByLabelText('Font Family Name');
      fireEvent.focus(fontFamilyInput);
      fireEvent.blur(fontFamilyInput);

      expect(screen.getByText(/Font family name is required/i)).toBeInTheDocument();
    });

    it('clears error when font family is filled', async () => {
      render(
        <FontUpload
          onUploadSuccess={mockOnUploadSuccess}
          onError={mockOnError}
          storageStats={mockStorageStats}
        />,
      );

      const fontFamilyInput = screen.getByLabelText('Font Family Name');
      fireEvent.focus(fontFamilyInput);
      fireEvent.blur(fontFamilyInput);
      expect(screen.getByText(/Font family name is required/i)).toBeInTheDocument();

      await userEvent.type(fontFamilyInput, 'Arial');
      fireEvent.blur(fontFamilyInput);

      expect(screen.queryByText(/Font family name is required/i)).not.toBeInTheDocument();
    });
  });

  describe('Upload Flow', () => {
    it('calls uploadCustomFont with correct metadata', async () => {
      render(
        <FontUpload
          onUploadSuccess={mockOnUploadSuccess}
          onError={mockOnError}
          storageStats={mockStorageStats}
        />,
      );

      await userEvent.type(screen.getByLabelText('Font Family Name'), 'Arial');
      await userEvent.selectOptions(screen.getByLabelText('Weight'), '700');
      await userEvent.selectOptions(screen.getByLabelText('Style'), 'italic');

      const file = createMockFile('font', 'arial.ttf', 'font/ttf');
      await userEvent.upload(screen.getByLabelText(/Font File/i), file);

      await waitFor(() => {
        expect(vi.mocked(fakeBrowser.runtime.sendMessage)).toHaveBeenCalledWith({
          type: MessageType.UPLOAD_CUSTOM_FONT,
          payload: {
            fileName: 'arial.ttf',
            fileBytes: expect.any(Array),
            metadata: {
              family: 'Arial',
              weight: 700,
              style: 'italic',
            },
          },
        });
      });
    });

    it('calls onUploadSuccess after successful upload', async () => {
      render(
        <FontUpload
          onUploadSuccess={mockOnUploadSuccess}
          onError={mockOnError}
          storageStats={mockStorageStats}
        />,
      );

      await userEvent.type(screen.getByLabelText('Font Family Name'), 'Arial');
      const file = createMockFile('font', 'arial.ttf', 'font/ttf');
      await userEvent.upload(screen.getByLabelText(/Font File/i), file);

      await waitFor(() => {
        expect(mockOnUploadSuccess).toHaveBeenCalled();
      });
    });

    it('resets form after successful upload', async () => {
      render(
        <FontUpload
          onUploadSuccess={mockOnUploadSuccess}
          onError={mockOnError}
          storageStats={mockStorageStats}
        />,
      );

      const fontFamilyInput = screen.getByLabelText('Font Family Name');
      await userEvent.type(fontFamilyInput, 'Arial');

      const file = createMockFile('font', 'arial.ttf', 'font/ttf');
      await userEvent.upload(screen.getByLabelText(/Font File/i), file);

      await waitFor(() => {
        expect((fontFamilyInput as HTMLInputElement).value).toBe('');
      });
    });

    it('calls onError when upload fails', async () => {
      // Mock upload failure
      vi.mocked(fakeBrowser.runtime.sendMessage).mockImplementationOnce(async () => Promise.reject(new Error('Storage full')));

      render(
        <FontUpload
          onUploadSuccess={mockOnUploadSuccess}
          onError={mockOnError}
          storageStats={mockStorageStats}
        />,
      );

      await userEvent.type(screen.getByLabelText('Font Family Name'), 'Arial');
      const file = createMockFile('font', 'arial.ttf', 'font/ttf');
      await userEvent.upload(screen.getByLabelText(/Font File/i), file);

      // Enhanced error messages now include recovery guidance
      await waitFor(
        () => {
          expect(mockOnError).toHaveBeenCalled();
          const calls = mockOnError.mock.calls;
          // First call clears error with empty string, second call has the actual error
          expect(calls.length).toBeGreaterThanOrEqual(2);
          const errorMessage = calls[calls.length - 1][0];
          expect(errorMessage).toContain('Failed to upload font');
          expect(errorMessage).toContain('Storage full');
          expect(errorMessage).toContain('Try deleting unused fonts');
        },
        { timeout: 3000 },
      );
    });

    // Network failure error scenario
    it('calls onError when network failure occurs', async () => {
      // Mock network failure
      vi.mocked(fakeBrowser.runtime.sendMessage).mockImplementationOnce(async () => Promise.reject(new Error('Network request failed')));

      render(
        <FontUpload
          onUploadSuccess={mockOnUploadSuccess}
          onError={mockOnError}
          storageStats={mockStorageStats}
        />,
      );

      await userEvent.type(screen.getByLabelText('Font Family Name'), 'Roboto');
      const file = createMockFile('font', 'roboto.ttf', 'font/ttf');
      await userEvent.upload(screen.getByLabelText(/Font File/i), file);

      await waitFor(
        () => {
          expect(mockOnError).toHaveBeenCalled();
          const calls = mockOnError.mock.calls;
          expect(calls.length).toBeGreaterThanOrEqual(2);
          const errorMessage = calls[calls.length - 1][0];
          expect(errorMessage).toContain('Failed to upload font');
          expect(errorMessage).toContain('Network request failed');
        },
        { timeout: 3000 },
      );
    });

    // Decompression error scenario
    it('calls onError when font decompression fails', async () => {
      // Mock decompression failure
      vi.mocked(fakeBrowser.runtime.sendMessage).mockImplementationOnce(async () => Promise.reject(new Error('Failed to decompress font data')));

      render(
        <FontUpload
          onUploadSuccess={mockOnUploadSuccess}
          onError={mockOnError}
          storageStats={mockStorageStats}
        />,
      );

      await userEvent.type(screen.getByLabelText('Font Family Name'), 'Corrupted Font');
      const file = createMockFile('corrupted-data', 'corrupted.woff2', 'font/woff2');
      await userEvent.upload(screen.getByLabelText(/Font File/i), file);

      await waitFor(
        () => {
          expect(mockOnError).toHaveBeenCalled();
          const calls = mockOnError.mock.calls;
          expect(calls.length).toBeGreaterThanOrEqual(2);
          const errorMessage = calls[calls.length - 1][0];
          expect(errorMessage).toContain('Failed to upload font');
          expect(errorMessage).toContain('Failed to decompress font data');
        },
        { timeout: 3000 },
      );
    });
  });

  describe('Storage Limits', () => {
    it('disables upload when max font count reached', () => {
      render(
        <FontUpload
          onUploadSuccess={mockOnUploadSuccess}
          onError={mockOnError}
          storageStats={{ count: CUSTOM_FONT_LIMITS.MAX_FONT_COUNT, totalSize: 0 }}
        />,
      );

      const input = screen.getByLabelText(/Font File/i);
      expect(input).toBeDisabled();
    });

    it('enables upload when below max font count', () => {
      render(
        <FontUpload
          onUploadSuccess={mockOnUploadSuccess}
          onError={mockOnError}
          storageStats={{ count: CUSTOM_FONT_LIMITS.MAX_FONT_COUNT - 1, totalSize: 0 }}
        />,
      );

      const input = screen.getByLabelText(/Font File/i);
      expect(input).not.toBeDisabled();
    });
  });
});
