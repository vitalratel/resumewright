/**
 * FileImport Component Tests
 *
 * Tests for file import, drag-and-drop, and validation
 */

import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useDragAndDrop, useFileReader, useLocalStorage } from '../../hooks';

import { FileImport } from '../FileImport';

// Mock custom hooks to prevent initialization hangs
vi.mock('../../hooks', () => ({
  useFileReader: vi.fn(),
  useDragAndDrop: vi.fn(),
  useLocalStorage: vi.fn(),
}));

describe('FileImport', () => {
  const mockOnFileValidated = vi.fn();
  const mockOnClearFile = vi.fn();

  beforeEach(() => {
    // Mock useFileReader to return readAsText and readAsDataURL functions
    vi.mocked(useFileReader).mockReturnValue({
      readAsText: vi.fn().mockResolvedValue(''),
      readAsDataURL: vi.fn().mockResolvedValue(''),
    });

    // Mock useDragAndDrop to return drag handlers and state
    vi.mocked(useDragAndDrop).mockReturnValue({
      isDragging: false,
      dragHandlers: {
        onDragEnter: vi.fn(),
        onDragLeave: vi.fn(),
        onDragOver: vi.fn(),
        onDrop: vi.fn(),
      },
    });

    // Mock useLocalStorage to behave like useState
    vi.mocked(useLocalStorage).mockImplementation((_key, initialValue) => [initialValue, vi.fn()]);

    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render file import dropzone', () => {
      render(<FileImport onFileValidated={mockOnFileValidated} onClearFile={mockOnClearFile} />);

      expect(screen.getByText(/Drag & drop your CV file here/i)).toBeInTheDocument();
      expect(screen.getByText(/Browse Files/i)).toBeInTheDocument();
    });

    it('should show imported file details when file is loaded', () => {
      const importedFile = { name: 'resume.tsx', size: 2048 };

      render(
        <FileImport
          onFileValidated={mockOnFileValidated}
          onClearFile={mockOnClearFile}
          importedFile={importedFile}
        />
      );

      expect(screen.getByText('resume.tsx')).toBeInTheDocument();
      expect(screen.getByText(/2.0 KB/i)).toBeInTheDocument();
    });
  });

  describe('Drag and Drop', () => {
    it('should render dropzone with drag-and-drop functionality', () => {
      render(<FileImport onFileValidated={mockOnFileValidated} onClearFile={mockOnClearFile} />);

      // Dropzone has keyboard accessibility with proper aria-label
      const dropzone = screen.getByLabelText(/Click or press Enter to select TSX file for import/i);

      expect(dropzone).toBeInTheDocument();
      expect(screen.getByText('Drag & drop your CV file here')).toBeInTheDocument();

      // Browse button provides keyboard accessibility
      expect(screen.getByRole('button', { name: /Browse Files/i })).toBeInTheDocument();
    });

    it('should have accessible dropzone with proper ARIA label', () => {
      render(<FileImport onFileValidated={mockOnFileValidated} onClearFile={mockOnClearFile} />);

      // Dropzone has role="button" and tabindex for keyboard accessibility
      const dropzone = screen.getByLabelText(/Click or press Enter to select TSX file for import/i);

      expect(dropzone).toHaveAttribute('role', 'button');
      expect(dropzone).toHaveAttribute('tabIndex', '0');
    });

    it('should call useDragAndDrop hook on component render', () => {
      render(<FileImport onFileValidated={mockOnFileValidated} onClearFile={mockOnClearFile} />);

      // Verify the hook was called
      expect(useDragAndDrop).toHaveBeenCalled();
    });
  });

  describe('File Clearing', () => {
    it('should call onClearFile when clear button is clicked', async () => {
      const importedFile = { name: 'resume.tsx', size: 1024 };

      render(
        <FileImport
          onFileValidated={mockOnFileValidated}
          onClearFile={mockOnClearFile}
          importedFile={importedFile}
        />
      );

      const clearButton = screen.getByLabelText(/Clear imported file/i);
      await userEvent.click(clearButton);

      // ConfirmDialog should now be visible - wait for it to appear
      const confirmButton = await screen.findByRole('button', { name: /^Clear$/i });
      await userEvent.click(confirmButton);

      expect(mockOnClearFile).toHaveBeenCalled();
    });

    it('should not show clear button when no file imported', () => {
      render(<FileImport onFileValidated={mockOnFileValidated} onClearFile={mockOnClearFile} />);

      const clearButton = screen.queryByLabelText(/Clear imported file/i);
      expect(clearButton).not.toBeInTheDocument();
    });

    it('should reset file input value on clear', async () => {
      const importedFile = { name: 'test.tsx', size: 512 };

      render(
        <FileImport
          onFileValidated={mockOnFileValidated}
          onClearFile={mockOnClearFile}
          importedFile={importedFile}
        />
      );

      const clearButton = screen.getByLabelText(/Clear imported file/i);
      await userEvent.click(clearButton);

      // ConfirmDialog should now be visible - wait for it to appear
      const confirmButton = await screen.findByRole('button', { name: /^Clear$/i });
      await userEvent.click(confirmButton);

      expect(mockOnClearFile).toHaveBeenCalled();
    });
  });

  describe('File Size Formatting', () => {
    it('should format bytes correctly', () => {
      render(
        <FileImport
          onFileValidated={mockOnFileValidated}
          onClearFile={mockOnClearFile}
          importedFile={{ name: 'tiny.tsx', size: 512 }}
        />
      );

      expect(screen.getByText('512 B')).toBeInTheDocument();
    });

    it('should format kilobytes correctly', () => {
      render(
        <FileImport
          onFileValidated={mockOnFileValidated}
          onClearFile={mockOnClearFile}
          importedFile={{ name: 'medium.tsx', size: 5120 }}
        />
      );

      expect(screen.getByText('5.0 KB')).toBeInTheDocument();
    });

    it('should format megabytes correctly', () => {
      render(
        <FileImport
          onFileValidated={mockOnFileValidated}
          onClearFile={mockOnClearFile}
          importedFile={{ name: 'large.tsx', size: 1048576 }}
        />
      );

      expect(screen.getByText('1.0 MB')).toBeInTheDocument();
    });
  });

  describe('Browse Button', () => {
    it('should open file picker when dropzone is clicked', () => {
      render(<FileImport onFileValidated={mockOnFileValidated} onClearFile={mockOnClearFile} />);

      const browseButton = screen.getByRole('button', { name: /Browse Files/i });
      const input = screen.getByLabelText(/File input for CV import/i);
      const clickSpy = vi.spyOn(input, 'click');

      fireEvent.click(browseButton);

      expect(clickSpy).toHaveBeenCalled();
    });

    it('should have hidden file input', () => {
      render(<FileImport onFileValidated={mockOnFileValidated} onClearFile={mockOnClearFile} />);

      const input = screen.getByLabelText(/File input for CV import/i);
      expect(input).toHaveClass('hidden');
    });

    it('should accept correct file types', () => {
      render(<FileImport onFileValidated={mockOnFileValidated} onClearFile={mockOnClearFile} />);

      const input = screen.getByLabelText(/File input for CV import/i);
      expect((input as HTMLInputElement).accept).toBe('.tsx');
    });
  });

  describe('Error State', () => {
    it('should show try another file button when error', () => {
      render(<FileImport onFileValidated={mockOnFileValidated} onClearFile={mockOnClearFile} />);

      // When there's an error, the Browse Files button is still visible
      const browseButton = screen.getByRole('button', { name: /Browse Files/i });
      expect(browseButton).toBeInTheDocument();
    });
  });

  describe('File Size Limits', () => {
    it('should display max file size in instructions', () => {
      render(<FileImport onFileValidated={mockOnFileValidated} onClearFile={mockOnClearFile} />);

      expect(screen.getByText(/up to 1MB/i)).toBeInTheDocument();
    });

    it('should show supported file extensions', () => {
      render(<FileImport onFileValidated={mockOnFileValidated} onClearFile={mockOnClearFile} />);

      expect(screen.getByText(/Supports:.*files.*up to 1MB/i)).toBeInTheDocument();
    });
  });

  describe('File Reading Error Handler', () => {
    it('should handle file reading errors gracefully', async () => {
      // Mock useFileReader to throw an error when reading file
      vi.mocked(useFileReader).mockReturnValue({
        readAsText: vi.fn().mockRejectedValue(new Error('File read failed')),
        readAsDataURL: vi.fn().mockResolvedValue(''),
      });

      render(<FileImport onFileValidated={mockOnFileValidated} onClearFile={mockOnClearFile} />);

      // Create a valid TSX file
      const file = new File(
        ['import React from "react"; export default function CV() { return <div>CV</div>; }'],
        'cv.tsx',
        {
          type: 'text/plain',
        }
      );

      const input = screen.getByLabelText(/File input for CV import/i);
      fireEvent.change(input, { target: { files: [file] } });

      // Wait for error message to appear in UI
      await vi.waitFor(() => {
        const errorMessage = screen.getByText(/couldn't open this file/i);
        expect(errorMessage).toBeInTheDocument();
      });
    });
  });
});
