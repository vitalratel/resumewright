/**
 * ABOUTME: Tests for FileImport component - file upload, validation, and drag-drop.
 * ABOUTME: Uses real hooks (no mocks) to test actual file handling behavior.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FileImport } from '../FileImport';

// Helper to create a File object with content
function createFile(content: string, name: string, options: { type?: string } = {}): File {
  const blob = new Blob([content], { type: options.type ?? 'text/plain' });
  return new File([blob], name, { type: options.type ?? 'text/plain' });
}

// Valid TSX content that passes all validation
const VALID_TSX_CONTENT = `
import React from 'react';

export default function CV() {
  return (
    <div>
      <h1>John Doe</h1>
      <p>Software Engineer</p>
    </div>
  );
}
`;

describe('FileImport', () => {
  const mockOnFileValidated = vi.fn();
  const mockOnClearFile = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    it('renders dropzone with instructions', () => {
      render(<FileImport onFileValidated={mockOnFileValidated} onClearFile={mockOnClearFile} />);

      expect(screen.getByText(/Drag & drop your CV file here/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Browse Files/i })).toBeInTheDocument();
    });

    it('shows supported file types and size limit', () => {
      render(<FileImport onFileValidated={mockOnFileValidated} onClearFile={mockOnClearFile} />);

      expect(screen.getByText(/up to 1MB/i)).toBeInTheDocument();
    });

    it('has accessible file input', () => {
      render(<FileImport onFileValidated={mockOnFileValidated} onClearFile={mockOnClearFile} />);

      const input = screen.getByLabelText(/File input for CV import/i);
      expect(input).toBeInTheDocument();
      expect((input as HTMLInputElement).accept).toBe('.tsx');
    });
  });

  describe('File Display When Imported', () => {
    it('shows file name and size when file is imported', () => {
      const importedFile = { name: 'resume.tsx', size: 2048 };

      render(
        <FileImport
          onFileValidated={mockOnFileValidated}
          onClearFile={mockOnClearFile}
          importedFile={importedFile}
        />,
      );

      expect(screen.getByText('resume.tsx')).toBeInTheDocument();
      expect(screen.getByText('2.0 KB')).toBeInTheDocument();
    });

    it('formats bytes correctly', () => {
      render(
        <FileImport
          onFileValidated={mockOnFileValidated}
          onClearFile={mockOnClearFile}
          importedFile={{ name: 'tiny.tsx', size: 512 }}
        />,
      );

      expect(screen.getByText('512 B')).toBeInTheDocument();
    });

    it('formats megabytes correctly', () => {
      render(
        <FileImport
          onFileValidated={mockOnFileValidated}
          onClearFile={mockOnClearFile}
          importedFile={{ name: 'large.tsx', size: 1048576 }}
        />,
      );

      expect(screen.getByText('1.0 MB')).toBeInTheDocument();
    });
  });

  describe('File Selection via Browse Button', () => {
    it('triggers file input when browse button is clicked', async () => {
      render(<FileImport onFileValidated={mockOnFileValidated} onClearFile={mockOnClearFile} />);

      const browseButton = screen.getByRole('button', { name: /Browse Files/i });
      const input = screen.getByLabelText(/File input for CV import/i);
      const clickSpy = vi.spyOn(input, 'click');

      await userEvent.click(browseButton);

      expect(clickSpy).toHaveBeenCalled();
    });

    it('validates and accepts valid TSX file', async () => {
      render(<FileImport onFileValidated={mockOnFileValidated} onClearFile={mockOnClearFile} />);

      const file = createFile(VALID_TSX_CONTENT, 'cv.tsx');
      const input = screen.getByLabelText(/File input for CV import/i);

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockOnFileValidated).toHaveBeenCalledWith(
          expect.stringContaining('import React'),
          'cv.tsx',
          expect.any(Number),
        );
      });
    });
  });

  describe('File Validation - Extension', () => {
    it('rejects non-TSX files with user-friendly error', async () => {
      render(<FileImport onFileValidated={mockOnFileValidated} onClearFile={mockOnClearFile} />);

      const file = createFile('some content', 'document.pdf', { type: 'application/pdf' });
      const input = screen.getByLabelText(/File input for CV import/i);

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/file type isn't supported/i)).toBeInTheDocument();
      });

      expect(mockOnFileValidated).not.toHaveBeenCalled();
    });

    it('accepts .ts files', async () => {
      render(<FileImport onFileValidated={mockOnFileValidated} onClearFile={mockOnClearFile} />);

      const file = createFile(VALID_TSX_CONTENT, 'cv.ts');
      const input = screen.getByLabelText(/File input for CV import/i);

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockOnFileValidated).toHaveBeenCalled();
      });
    });
  });

  describe('File Validation - Size', () => {
    it('rejects files larger than 1MB', async () => {
      render(<FileImport onFileValidated={mockOnFileValidated} onClearFile={mockOnClearFile} />);

      // Create file with actual content > 1MB (1MB = 1048576 bytes)
      // Generate content that's over 1MB
      const largeContent = `${VALID_TSX_CONTENT}\n// padding\n${'x'.repeat(1024 * 1024 + 1000)}`;
      const file = createFile(largeContent, 'large.tsx');
      const input = screen.getByLabelText(/File input for CV import/i);

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/file is too big/i)).toBeInTheDocument();
      });

      expect(mockOnFileValidated).not.toHaveBeenCalled();
    });

    it('rejects empty files', async () => {
      render(<FileImport onFileValidated={mockOnFileValidated} onClearFile={mockOnClearFile} />);

      const file = createFile('', 'empty.tsx');
      const input = screen.getByLabelText(/File input for CV import/i);

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/file appears to be empty/i)).toBeInTheDocument();
      });

      expect(mockOnFileValidated).not.toHaveBeenCalled();
    });
  });

  describe('File Validation - Content', () => {
    it('rejects files without React import', async () => {
      render(<FileImport onFileValidated={mockOnFileValidated} onClearFile={mockOnClearFile} />);

      const file = createFile('const x = 1; export default x;', 'notreact.tsx');
      const input = screen.getByLabelText(/File input for CV import/i);

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/doesn't look like a valid CV/i)).toBeInTheDocument();
      });

      expect(mockOnFileValidated).not.toHaveBeenCalled();
    });

    it('rejects whitespace-only files', async () => {
      render(<FileImport onFileValidated={mockOnFileValidated} onClearFile={mockOnClearFile} />);

      const file = createFile('   \n\t  \n  ', 'whitespace.tsx');
      const input = screen.getByLabelText(/File input for CV import/i);

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/doesn't contain any content/i)).toBeInTheDocument();
      });

      expect(mockOnFileValidated).not.toHaveBeenCalled();
    });
  });

  describe('File Clearing', () => {
    it('shows clear button only when file is imported', () => {
      const { rerender } = render(
        <FileImport onFileValidated={mockOnFileValidated} onClearFile={mockOnClearFile} />,
      );

      expect(screen.queryByLabelText(/Clear imported file/i)).not.toBeInTheDocument();

      rerender(
        <FileImport
          onFileValidated={mockOnFileValidated}
          onClearFile={mockOnClearFile}
          importedFile={{ name: 'test.tsx', size: 1024 }}
        />,
      );

      expect(screen.getByLabelText(/Clear imported file/i)).toBeInTheDocument();
    });

    it('shows confirmation dialog before clearing', async () => {
      render(
        <FileImport
          onFileValidated={mockOnFileValidated}
          onClearFile={mockOnClearFile}
          importedFile={{ name: 'resume.tsx', size: 1024 }}
        />,
      );

      const clearButton = screen.getByLabelText(/Clear imported file/i);
      await userEvent.click(clearButton);

      // Confirmation dialog should appear
      expect(screen.getByText(/Clear File\?/i)).toBeInTheDocument();
      expect(mockOnClearFile).not.toHaveBeenCalled();
    });

    it('calls onClearFile after confirmation', async () => {
      render(
        <FileImport
          onFileValidated={mockOnFileValidated}
          onClearFile={mockOnClearFile}
          importedFile={{ name: 'resume.tsx', size: 1024 }}
        />,
      );

      const clearButton = screen.getByLabelText(/Clear imported file/i);
      await userEvent.click(clearButton);

      const confirmButton = await screen.findByRole('button', { name: /^Clear$/i });
      await userEvent.click(confirmButton);

      expect(mockOnClearFile).toHaveBeenCalled();
    });

    it('does not clear when confirmation is cancelled', async () => {
      render(
        <FileImport
          onFileValidated={mockOnFileValidated}
          onClearFile={mockOnClearFile}
          importedFile={{ name: 'resume.tsx', size: 1024 }}
        />,
      );

      const clearButton = screen.getByLabelText(/Clear imported file/i);
      await userEvent.click(clearButton);

      const cancelButton = await screen.findByRole('button', { name: /Cancel/i });
      await userEvent.click(cancelButton);

      expect(mockOnClearFile).not.toHaveBeenCalled();
    });
  });

  describe('Validating State', () => {
    it('shows validating indicator during file processing', async () => {
      // Make onFileValidated hang to keep validating state
      mockOnFileValidated.mockImplementation(async () => new Promise(() => {}));

      render(<FileImport onFileValidated={mockOnFileValidated} onClearFile={mockOnClearFile} />);

      const file = createFile(VALID_TSX_CONTENT, 'cv.tsx');
      const input = screen.getByLabelText(/File input for CV import/i);

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/Validating file/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels on interactive elements in upload state', () => {
      render(<FileImport onFileValidated={mockOnFileValidated} onClearFile={mockOnClearFile} />);

      // In upload state, file input is available
      expect(screen.getByLabelText(/File input for CV import/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Browse Files/i })).toBeInTheDocument();
    });

    it('has proper ARIA labels on interactive elements when file imported', () => {
      render(
        <FileImport
          onFileValidated={mockOnFileValidated}
          onClearFile={mockOnClearFile}
          importedFile={{ name: 'resume.tsx', size: 1024 }}
        />,
      );

      // In imported state, only clear button is shown (no file input)
      expect(screen.getByLabelText(/Clear imported file/i)).toBeInTheDocument();
    });

    it('announces validation errors with role="alert"', async () => {
      render(<FileImport onFileValidated={mockOnFileValidated} onClearFile={mockOnClearFile} />);

      const file = createFile('not valid', 'bad.pdf', { type: 'application/pdf' });
      const input = screen.getByLabelText(/File input for CV import/i);

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
      });
    });
  });
});
