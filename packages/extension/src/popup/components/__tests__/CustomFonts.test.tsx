/**
 * Custom Fonts Component Tests
 * Settings UI tests
 */

import type { CustomFont, FontWeight } from '@/shared/domain/fonts/models/Font';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import userEvent from '@testing-library/user-event';
import { fakeBrowser } from '@webext-core/fake-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CustomFonts } from '../CustomFonts';

// Mock webextension-polyfill BEFORE any other imports
vi.mock('webextension-polyfill', () => ({
  default: fakeBrowser,
}));

// Helper to create File with arrayBuffer support
function createMockFile(bytes: number[], name: string, type: string): File {
  const file = new File([new Uint8Array(bytes)], name, { type });
  // Add arrayBuffer method for test environment
  Object.defineProperty(file, 'arrayBuffer', {
    value: async () => new Uint8Array(bytes).buffer,
  });
  return file;
}

describe('CustomFonts', () => {
  beforeEach(() => {
    // Reset fake browser state before each test
    fakeBrowser.reset();
    vi.clearAllMocks();

    // Setup message handlers using fakeBrowser's spy
    const sendMessageSpy = vi.spyOn(fakeBrowser.runtime, 'sendMessage');
    sendMessageSpy.mockImplementation(async (message: unknown) => {
      const msg = message as { type: string; payload?: unknown };

      if (msg.type === 'LIST_CUSTOM_FONTS') {
        return Promise.resolve({ fonts: [] });
      }
      else if (msg.type === 'GET_CUSTOM_FONT_STATS') {
        return Promise.resolve({ count: 0, totalSize: 0 });
      }
      else if (msg.type === 'UPLOAD_CUSTOM_FONT') {
        return Promise.resolve({
          font: {
            id: 'new-font',
            family: 'Test Font',
            weight: 400,
            style: 'normal',
            format: 'ttf',
            size: 4,
            uploadedAt: Date.now(),
          },
        });
      }
      else if (msg.type === 'REMOVE_CUSTOM_FONT') {
        return Promise.resolve({ success: true });
      }
      return Promise.reject(new Error(`Unknown message type: ${msg.type}`));
    });
  });

  describe('Initial Render', () => {
    it('should render the custom fonts section', async () => {
      render(<CustomFonts />);

      await waitFor(() => {
        expect(screen.getByText('Custom Fonts')).toBeInTheDocument();
        expect(screen.getByText('Upload Font')).toBeInTheDocument();
        expect(screen.getByText('Uploaded Fonts')).toBeInTheDocument();
      });
    });

    it('should load and display fonts on mount', async () => {
      const mockFonts: CustomFont[] = [
        {
          id: 'font-1',
          family: 'Roboto',
          weight: 400 as FontWeight,
          style: 'normal',
          format: 'ttf',
          bytes: new Uint8Array([0, 1, 2, 3]),
          uploadedAt: Date.now(),
          fileSize: 150000,
        },
        {
          id: 'font-2',
          family: 'Open Sans',
          weight: 700 as FontWeight,
          style: 'italic',
          format: 'woff2',
          bytes: new Uint8Array([4, 5, 6, 7]),
          uploadedAt: Date.now(),
          fileSize: 200000,
        },
      ];

      vi.spyOn(fakeBrowser.runtime, 'sendMessage').mockImplementation(async (message: unknown) => {
        const msg = message as { type: string; payload?: unknown };
        if (msg.type === 'LIST_CUSTOM_FONTS') {
          return Promise.resolve({ fonts: mockFonts });
        }
        else if (msg.type === 'GET_CUSTOM_FONT_STATS') {
          return Promise.resolve({ count: 2, totalSize: 350000 });
        }
        return Promise.reject(new Error(`Unknown message type: ${msg.type}`));
      });

      render(<CustomFonts />);

      await waitFor(() => {
        expect(screen.getByText('Roboto')).toBeInTheDocument();
        expect(screen.getByText('Open Sans')).toBeInTheDocument();
      });

      // Check weight and style text
      expect(screen.getByText(/Weight: 400.*Style: normal/)).toBeInTheDocument();
      expect(screen.getByText(/Weight: 700.*Style: italic/)).toBeInTheDocument();

      // Check format badges (displayed separately as badges, not inline with weight/style)
      expect(screen.getByText('TTF')).toBeInTheDocument();
      expect(screen.getByText('WOFF2')).toBeInTheDocument();
    });

    it('should show "no fonts" message when list is empty', async () => {
      render(<CustomFonts />);

      await waitFor(() => {
        expect(screen.getByText('No custom fonts uploaded yet')).toBeInTheDocument();
      });
    });
  });

  describe('Storage Stats', () => {
    it('should display storage statistics', async () => {
      vi.spyOn(fakeBrowser.runtime, 'sendMessage').mockImplementation(async (message: unknown) => {
        const msg = message as { type: string; payload?: unknown };
        if (msg.type === 'LIST_CUSTOM_FONTS') {
          return Promise.resolve({ fonts: [] });
        }
        else if (msg.type === 'GET_CUSTOM_FONT_STATS') {
          return Promise.resolve({ count: 5, totalSize: 10 * 1024 * 1024 }); // 10MB
        }
        return Promise.reject(new Error(`Unknown message type: ${msg.type}`));
      });

      render(<CustomFonts />);

      await waitFor(() => {
        expect(screen.getByTestId('storage-usage')).toHaveTextContent('10.0 MB / 20.0 MB');
        expect(screen.getByTestId('font-count')).toHaveTextContent('5 / 10 fonts');
      });
    });

    it('should show storage bar as green when under 70%', async () => {
      vi.spyOn(fakeBrowser.runtime, 'sendMessage').mockImplementation(async (message: unknown) => {
        const msg = message as { type: string; payload?: unknown };
        if (msg.type === 'LIST_CUSTOM_FONTS') {
          return Promise.resolve({ fonts: [] });
        }
        else if (msg.type === 'GET_CUSTOM_FONT_STATS') {
          return Promise.resolve({ count: 3, totalSize: 5 * 1024 * 1024 }); // 5MB (25%)
        }
        return Promise.reject(new Error(`Unknown message type: ${msg.type}`));
      });

      render(<CustomFonts />);

      await waitFor(() => {
        const progressBar = document.querySelector('.bg-green-500');
        expect(progressBar).toBeInTheDocument();
      });
    });

    it('should show storage bar as yellow when 70-90%', async () => {
      vi.spyOn(fakeBrowser.runtime, 'sendMessage').mockImplementation(async (message: unknown) => {
        const msg = message as { type: string; payload?: unknown };
        if (msg.type === 'LIST_CUSTOM_FONTS') {
          return Promise.resolve({ fonts: [] });
        }
        else if (msg.type === 'GET_CUSTOM_FONT_STATS') {
          return Promise.resolve({ count: 8, totalSize: 16 * 1024 * 1024 }); // 16MB (80%)
        }
        return Promise.reject(new Error(`Unknown message type: ${msg.type}`));
      });

      render(<CustomFonts />);

      await waitFor(() => {
        const progressBar = document.querySelector('.bg-yellow-500');
        expect(progressBar).toBeInTheDocument();
      });
    });

    it('should show storage bar as red when over 90%', async () => {
      vi.spyOn(fakeBrowser.runtime, 'sendMessage').mockImplementation(async (message: unknown) => {
        const msg = message as { type: string; payload?: unknown };
        if (msg.type === 'LIST_CUSTOM_FONTS') {
          return Promise.resolve({ fonts: [] });
        }
        else if (msg.type === 'GET_CUSTOM_FONT_STATS') {
          return Promise.resolve({ count: 9, totalSize: 19 * 1024 * 1024 }); // 19MB (95%)
        }
        return Promise.reject(new Error(`Unknown message type: ${msg.type}`));
      });

      render(<CustomFonts />);

      await waitFor(() => {
        const progressBar = document.querySelector('.bg-red-500');
        expect(progressBar).toBeInTheDocument();
      });
    });
  });

  describe('Upload Form', () => {
    it('should render upload form fields', async () => {
      render(<CustomFonts />);

      await waitFor(() => {
        expect(screen.getByLabelText('Font Family Name')).toBeInTheDocument();
      });

      expect(screen.getByLabelText('Weight')).toBeInTheDocument();
      expect(screen.getByLabelText('Style')).toBeInTheDocument();
      expect(screen.getByLabelText(/Font File/)).toBeInTheDocument();
    });

    it('should update form fields on input', async () => {
      render(<CustomFonts />);

      await waitFor(() => {
        expect(screen.getByLabelText('Font Family Name')).toBeInTheDocument();
      });

      const familyInput = screen.getByLabelText('Font Family Name');
      const weightSelect = screen.getByLabelText('Weight');
      const styleSelect = screen.getByLabelText('Style');

      fireEvent.change(familyInput, { target: { value: 'My Custom Font' } });
      fireEvent.change(weightSelect, { target: { value: '700' } });
      fireEvent.change(styleSelect, { target: { value: 'italic' } });

      expect((familyInput as HTMLInputElement).value).toBe('My Custom Font');
      expect((weightSelect as HTMLSelectElement).value).toBe('700');
      expect((styleSelect as HTMLSelectElement).value).toBe('italic');
    });

    it('should show error when uploading without font family', async () => {
      render(<CustomFonts />);

      const fileInput = screen.getByLabelText(/Font File/);
      const file = createMockFile([0, 1, 0, 0], 'test.ttf', 'font/ttf');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('Font family name is required')).toBeInTheDocument();
      });

      // Should not send UPLOAD_CUSTOM_FONT message
      expect(vi.mocked(fakeBrowser.runtime.sendMessage)).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: 'UPLOAD_CUSTOM_FONT' })
      );
    });

    it('should upload font successfully', async () => {
      render(<CustomFonts />);

      // Fill form
      const familyInput = screen.getByLabelText('Font Family Name');
      fireEvent.change(familyInput, { target: { value: 'Test Font' } });

      // Upload file
      const fileInput = screen.getByLabelText(/Font File/);
      const file = createMockFile([0, 1, 0, 0], 'test.ttf', 'font/ttf');
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(vi.mocked(fakeBrowser.runtime.sendMessage)).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'UPLOAD_CUSTOM_FONT',
            payload: expect.objectContaining({
              fileName: 'test.ttf',
              fileBytes: [0, 1, 0, 0],
              metadata: {
                family: 'Test Font',
                weight: 400,
                style: 'normal',
              },
            }),
          })
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Font uploaded successfully')).toBeInTheDocument();
      });
    });

    it('should show error on upload failure', async () => {
      // Mock sendMessage to reject for UPLOAD_CUSTOM_FONT
      vi.spyOn(fakeBrowser.runtime, 'sendMessage').mockImplementation(async (message: unknown) => {
        const msg = message as { type: string; payload?: unknown };
        if (msg.type === 'LIST_CUSTOM_FONTS') {
          return Promise.resolve({ fonts: [] });
        }
        else if (msg.type === 'GET_CUSTOM_FONT_STATS') {
          return Promise.resolve({ count: 0, totalSize: 0 });
        }
        else if (msg.type === 'UPLOAD_CUSTOM_FONT') {
          return Promise.reject(new Error('File too large'));
        }
        return Promise.reject(new Error(`Unknown message type: ${msg.type}`));
      });

      render(<CustomFonts />);

      // Fill form
      const familyInput = screen.getByLabelText('Font Family Name');
      fireEvent.change(familyInput, { target: { value: 'Test Font' } });

      // Upload file
      const fileInput = screen.getByLabelText(/Font File/);
      const file = createMockFile([0, 1, 0, 0], 'test.ttf', 'font/ttf');
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        // Error message includes original error plus recovery guidance
        expect(screen.getByText(/File too large/i)).toBeInTheDocument();
      });
    });

    it('should disable upload when font count limit reached', async () => {
      vi.spyOn(fakeBrowser.runtime, 'sendMessage').mockImplementation(async (message: unknown) => {
        const msg = message as { type: string; payload?: unknown };
        if (msg.type === 'LIST_CUSTOM_FONTS') {
          return Promise.resolve({ fonts: [] });
        }
        else if (msg.type === 'GET_CUSTOM_FONT_STATS') {
          return Promise.resolve({ count: 10, totalSize: 5 * 1024 * 1024 });
        }
        return Promise.reject(new Error(`Unknown message type: ${msg.type}`));
      });

      render(<CustomFonts />);

      await waitFor(() => {
        const fileInput = screen.getByLabelText(/Font File/);
        expect(fileInput).toBeDisabled();
        expect(screen.getByText('Maximum number of fonts reached. Delete a font to upload more.')).toBeInTheDocument();
      });
    });
  });

  describe('Font Deletion', () => {
    it('should delete font when delete button clicked', async () => {
      const mockFonts: CustomFont[] = [
        {
          id: 'font-1',
          family: 'Roboto',
          weight: 400 as FontWeight,
          style: 'normal',
          format: 'ttf',
          bytes: new Uint8Array([0, 1, 2, 3]),
          uploadedAt: Date.now(),
          fileSize: 150000,
        },
      ];

      vi.spyOn(fakeBrowser.runtime, 'sendMessage').mockImplementation(async (message: unknown) => {
        const msg = message as { type: string; payload?: unknown };
        if (msg.type === 'LIST_CUSTOM_FONTS') {
          return Promise.resolve({ fonts: mockFonts });
        }
        else if (msg.type === 'GET_CUSTOM_FONT_STATS') {
          return Promise.resolve({ count: 1, totalSize: 150000 });
        }
        else if (msg.type === 'REMOVE_CUSTOM_FONT') {
          return Promise.resolve({ success: true });
        }
        return Promise.reject(new Error(`Unknown message type: ${msg.type}`));
      });

      render(<CustomFonts />);

      await waitFor(() => {
        expect(screen.getByText('Roboto')).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: 'Delete Roboto' });
      await userEvent.click(deleteButton);

      // Confirm dialog should appear
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Delete Font')).toBeInTheDocument();
      });

      // Click confirm button in dialog
      const confirmButton = screen.getByRole('button', { name: 'Delete' });
      await userEvent.click(confirmButton);

      await waitFor(() => {
        expect(vi.mocked(fakeBrowser.runtime.sendMessage)).toHaveBeenCalledWith({
          type: 'REMOVE_CUSTOM_FONT',
          payload: { fontId: 'font-1' },
        });
      });

      await waitFor(() => {
        expect(screen.getByText('Deleted Roboto')).toBeInTheDocument();
      });
    });

    it('should not delete font when confirm cancelled', async () => {
      const mockFonts: CustomFont[] = [
        {
          id: 'font-1',
          family: 'Roboto',
          weight: 400 as FontWeight,
          style: 'normal',
          format: 'ttf',
          bytes: new Uint8Array([0, 1, 2, 3]),
          uploadedAt: Date.now(),
          fileSize: 150000,
        },
      ];

      vi.spyOn(fakeBrowser.runtime, 'sendMessage').mockImplementation(async (message: unknown) => {
        const msg = message as { type: string; payload?: unknown };
        if (msg.type === 'LIST_CUSTOM_FONTS') {
          return Promise.resolve({ fonts: mockFonts });
        }
        else if (msg.type === 'GET_CUSTOM_FONT_STATS') {
          return Promise.resolve({ count: 1, totalSize: 150000 });
        }
        return Promise.reject(new Error(`Unknown message type: ${msg.type}`));
      });

      render(<CustomFonts />);

      await waitFor(() => {
        expect(screen.getByText('Roboto')).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: 'Delete Roboto' });
      await userEvent.click(deleteButton);

      // Confirm dialog should appear
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Delete Font')).toBeInTheDocument();
      });

      // Click cancel button in dialog
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      await userEvent.click(cancelButton);

      // Dialog should close and deletion should not occur
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      // Should not send REMOVE_CUSTOM_FONT message
      expect(vi.mocked(fakeBrowser.runtime.sendMessage)).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: 'REMOVE_CUSTOM_FONT' })
      );
    });
  });

  describe('File Size Formatting', () => {
    it('should format file sizes correctly', async () => {
      const mockFonts: CustomFont[] = [
        {
          id: 'font-1',
          family: 'Small Font',
          weight: 400 as FontWeight,
          style: 'normal',
          format: 'ttf',
          bytes: new Uint8Array(500),
          uploadedAt: Date.now(),
          fileSize: 500, // 500 B
        },
        {
          id: 'font-2',
          family: 'Medium Font',
          weight: 400 as FontWeight,
          style: 'normal',
          format: 'ttf',
          bytes: new Uint8Array(50000),
          uploadedAt: Date.now(),
          fileSize: 50000, // 48.8 KB
        },
        {
          id: 'font-3',
          family: 'Large Font',
          weight: 400 as FontWeight,
          style: 'normal',
          format: 'ttf',
          bytes: new Uint8Array(1500000),
          uploadedAt: Date.now(),
          fileSize: 1500000, // 1.4 MB
        },
      ];

      vi.spyOn(fakeBrowser.runtime, 'sendMessage').mockImplementation(async (message: unknown) => {
        const msg = message as { type: string; payload?: unknown };
        if (msg.type === 'LIST_CUSTOM_FONTS') {
          return Promise.resolve({ fonts: mockFonts });
        }
        else if (msg.type === 'GET_CUSTOM_FONT_STATS') {
          return Promise.resolve({ count: 3, totalSize: 1550500 });
        }
        return Promise.reject(new Error(`Unknown message type: ${msg.type}`));
      });

      render(<CustomFonts />);

      await waitFor(() => {
        expect(screen.getByText(/500 B/)).toBeInTheDocument();
        expect(screen.getByText(/48\.8 KB/)).toBeInTheDocument();
        expect(screen.getByText(/1\.4 MB/)).toBeInTheDocument();
      });
    });
  });
});
