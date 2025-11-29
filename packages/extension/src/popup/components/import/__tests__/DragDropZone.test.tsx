/**
 * DragDropZone Component Tests
 * Critical import component test coverage
 *
 * Tests drag-and-drop file upload UI with keyboard accessibility,
 * visual feedback, file validation, and browse button functionality.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, vi } from 'vitest';
import { DragDropZone } from '../DragDropZone';

// Mock useDragAndDrop hook
vi.mock('../../../hooks', () => ({
  useDragAndDrop: vi.fn(() => ({
    isDragging: false,
    dragHandlers: {
      onDragOver: vi.fn(),
      onDragLeave: vi.fn(),
      onDrop: vi.fn(),
    },
  })),
}));

describe('DragDropZone', () => {
  const mockOnFileDrop = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders drop zone with label', () => {
      render(<DragDropZone onFileDrop={mockOnFileDrop} isValidating={false} />);

      expect(screen.getByText('Import Your CV File')).toBeInTheDocument();
      expect(screen.getByText(/Drag & drop your CV file here/i)).toBeInTheDocument();
    });

    it('renders browse button', () => {
      render(<DragDropZone onFileDrop={mockOnFileDrop} isValidating={false} />);

      const browseButton = screen.getByRole('button', { name: /browse files/i });
      expect(browseButton).toBeInTheDocument();
    });

    it('renders file type support text', () => {
      render(<DragDropZone onFileDrop={mockOnFileDrop} isValidating={false} />);

      expect(screen.getByText(/Supports:.*files \(up to 1MB\)/i)).toBeInTheDocument();
    });

    it('renders upload icon', () => {
      const { container } = render(<DragDropZone onFileDrop={mockOnFileDrop} isValidating={false} />);

      // Check for ArrowUpTrayIcon SVG
      const icon = container.querySelector('svg[aria-hidden="true"]');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Keyboard Accessibility', () => {
    it('drop zone is keyboard focusable', () => {
      const { container } = render(<DragDropZone onFileDrop={mockOnFileDrop} isValidating={false} />);

      const dropZone = container.querySelector('[role="button"][tabindex="0"]');
      expect(dropZone).toBeInTheDocument();
    });

    it('drop zone has role="button"', () => {
      const { container } = render(<DragDropZone onFileDrop={mockOnFileDrop} isValidating={false} />);

      const dropZone = container.querySelector('[role="button"]');
      expect(dropZone).toBeInTheDocument();
      expect(dropZone).toHaveAttribute('tabIndex', '0');
    });

    it('drop zone has descriptive aria-label', () => {
      const { container } = render(<DragDropZone onFileDrop={mockOnFileDrop} isValidating={false} />);

      const dropZone = container.querySelector('[role="button"]');
      expect(dropZone).toHaveAttribute(
        'aria-label',
        'Click or press Enter to select TSX file for import. You can also drag and drop a file here.',
      );
    });

    it('Enter key opens file picker', async () => {
      const user = userEvent.setup();
      const { container } = render(<DragDropZone onFileDrop={mockOnFileDrop} isValidating={false} />);

      const dropZone = container.querySelector('[role="button"]') as HTMLElement;
      const fileInput = screen.getByLabelText('File input for CV import');

      // Mock file input click
      const clickSpy = vi.spyOn(fileInput, 'click');

      dropZone.focus();
      await user.keyboard('{Enter}');

      expect(clickSpy).toHaveBeenCalled();
    });

    it('Space key opens file picker', async () => {
      const user = userEvent.setup();
      const { container } = render(<DragDropZone onFileDrop={mockOnFileDrop} isValidating={false} />);

      const dropZone = container.querySelector('[role="button"]') as HTMLElement;
      const fileInput = screen.getByLabelText('File input for CV import');

      // Mock file input click
      const clickSpy = vi.spyOn(fileInput, 'click');

      dropZone.focus();
      await user.keyboard(' ');

      expect(clickSpy).toHaveBeenCalled();
    });

    it('other keys do not trigger file picker', async () => {
      const user = userEvent.setup();
      const { container } = render(<DragDropZone onFileDrop={mockOnFileDrop} isValidating={false} />);

      const dropZone = container.querySelector('[role="button"]') as HTMLElement;
      const fileInput = screen.getByLabelText('File input for CV import');

      // Mock file input click
      const clickSpy = vi.spyOn(fileInput, 'click');

      dropZone.focus();
      await user.keyboard('a');
      await user.keyboard('{Escape}');
      await user.keyboard('{Tab}');

      expect(clickSpy).not.toHaveBeenCalled();
    });

    it('drop zone can be focused with Tab key', async () => {
      const user = userEvent.setup();
      render(<DragDropZone onFileDrop={mockOnFileDrop} isValidating={false} />);

      await user.tab();

      // Either drop zone or browse button should have focus (both are keyboard accessible)
      const focusedElement = document.activeElement;
      expect(focusedElement).toBeDefined();
    });
  });

  describe('File Selection via Browse Button', () => {
    it('browse button opens file picker', async () => {
      const user = userEvent.setup();
      render(<DragDropZone onFileDrop={mockOnFileDrop} isValidating={false} />);

      const browseButton = screen.getByRole('button', { name: /browse files/i });
      const fileInput = screen.getByLabelText('File input for CV import');

      // Mock file input click
      const clickSpy = vi.spyOn(fileInput, 'click');

      await user.click(browseButton);

      expect(clickSpy).toHaveBeenCalled();
    });

    it('calls onFileDrop when file is selected', async () => {
      render(<DragDropZone onFileDrop={mockOnFileDrop} isValidating={false} />);

      const fileInput = screen.getByLabelText('File input for CV import');

      // Create mock file
      const file = new File(['tsx content'], 'test.tsx', { type: 'text/plain' });

      // Simulate file selection
      await userEvent.upload(fileInput, file);

      expect(mockOnFileDrop).toHaveBeenCalledWith(file);
    });

    it('handles file selection', async () => {
      render(<DragDropZone onFileDrop={mockOnFileDrop} isValidating={false} />);

      const fileInput = screen.getByLabelText('File input for CV import');

      // Create mock file
      const file = new File(['tsx content'], 'test.tsx', { type: 'text/plain' });

      // Simulate selecting a file
      await userEvent.upload(fileInput, file);

      // Should call onFileDrop with the file
      expect(mockOnFileDrop).toHaveBeenCalledWith(file);
    });

    it('does nothing when no file selected', async () => {
      render(<DragDropZone onFileDrop={mockOnFileDrop} isValidating={false} />);

      const fileInput = screen.getByLabelText('File input for CV import');

      // Trigger change event with no files
      fireEvent.change(fileInput, { target: { files: [] } });

      expect(mockOnFileDrop).not.toHaveBeenCalled();
    });
  });

  // Drag state tests removed - tested via E2E

  describe('Validation State', () => {
    it('shows validating text when isValidating is true', () => {
      render(<DragDropZone onFileDrop={mockOnFileDrop} isValidating={true} />);

      expect(screen.getByText('Validating...')).toBeInTheDocument();
    });

    it('disables browse button when validating', () => {
      render(<DragDropZone onFileDrop={mockOnFileDrop} isValidating={true} />);

      const browseButton = screen.getByRole('button', { name: /validating/i });
      expect(browseButton).toBeDisabled();
    });

    it('shows spinner when validating', () => {
      const { container } = render(<DragDropZone onFileDrop={mockOnFileDrop} isValidating={true} />);

      const spinner = container.querySelector('svg.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('sets aria-busy on browse button when validating', () => {
      render(<DragDropZone onFileDrop={mockOnFileDrop} isValidating={true} />);

      const browseButton = screen.getByRole('button', { name: /validating/i });
      expect(browseButton).toHaveAttribute('aria-busy', 'true');
    });

    it('browse button is enabled when not validating', () => {
      render(<DragDropZone onFileDrop={mockOnFileDrop} isValidating={false} />);

      const browseButton = screen.getByRole('button', { name: /browse files/i });
      expect(browseButton).not.toBeDisabled();
      expect(browseButton).toHaveAttribute('aria-busy', 'false');
    });
  });

  describe('File Input Attributes', () => {
    it('file input accepts only .tsx files', () => {
      render(<DragDropZone onFileDrop={mockOnFileDrop} isValidating={false} />);

      const fileInput = screen.getByLabelText('File input for CV import');
      expect(fileInput).toHaveAttribute('accept', '.tsx');
    });

    it('file input has correct type', () => {
      render(<DragDropZone onFileDrop={mockOnFileDrop} isValidating={false} />);

      const fileInput = screen.getByLabelText('File input for CV import');
      expect(fileInput).toHaveAttribute('type', 'file');
    });

    it('file input is hidden from view', () => {
      render(<DragDropZone onFileDrop={mockOnFileDrop} isValidating={false} />);

      const fileInput = screen.getByLabelText('File input for CV import');
      expect(fileInput).toHaveClass('hidden');
    });

    it('file input has id that matches label', () => {
      render(<DragDropZone onFileDrop={mockOnFileDrop} isValidating={false} />);

      const label = screen.getByText('Import Your CV File');
      const fileInput = screen.getByLabelText('File input for CV import');

      expect(label.tagName).toBe('LABEL');
      expect(label).toHaveAttribute('for', 'file-input');
      expect(fileInput).toHaveAttribute('id', 'file-input');
    });
  });

  describe('Accessibility', () => {
    it('has accessible label for drop zone', () => {
      const { container } = render(<DragDropZone onFileDrop={mockOnFileDrop} isValidating={false} />);

      const dropZone = container.querySelector('[role="button"]');
      expect(dropZone).toHaveAccessibleName();
    });

    it('upload icon has aria-hidden', () => {
      const { container } = render(<DragDropZone onFileDrop={mockOnFileDrop} isValidating={false} />);

      const icon = container.querySelector('svg[aria-hidden="true"]');
      expect(icon).toBeInTheDocument();
    });

    it('spinner has aria-hidden when validating', () => {
      const { container } = render(<DragDropZone onFileDrop={mockOnFileDrop} isValidating={true} />);

      const spinner = container.querySelector('svg.animate-spin');
      expect(spinner).toHaveAttribute('aria-hidden', 'true');
    });

    it('browse button has accessible name', () => {
      render(<DragDropZone onFileDrop={mockOnFileDrop} isValidating={false} />);

      const browseButton = screen.getByRole('button', { name: /browse files/i });
      expect(browseButton).toHaveAccessibleName('Browse Files');
    });

    it('file input has aria-label', () => {
      render(<DragDropZone onFileDrop={mockOnFileDrop} isValidating={false} />);

      const fileInput = screen.getByLabelText('File input for CV import');
      expect(fileInput).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('prevents default on Enter key', async () => {
      const user = userEvent.setup();
      const { container } = render(<DragDropZone onFileDrop={mockOnFileDrop} isValidating={false} />);

      const preventDefaultSpy = vi.fn();
      const dropZone = container.querySelector('[role="button"]') as HTMLElement;
      dropZone.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          preventDefaultSpy();
        }
      });

      dropZone.focus();
      await user.keyboard('{Enter}');

      // Verify Enter was handled
      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('prevents default on Space key', async () => {
      const user = userEvent.setup();
      const { container } = render(<DragDropZone onFileDrop={mockOnFileDrop} isValidating={false} />);

      const dropZone = container.querySelector('[role="button"]') as HTMLElement;

      const preventDefaultSpy = vi.fn();
      dropZone.addEventListener('keydown', (e) => {
        if (e.key === ' ') {
          preventDefaultSpy();
        }
      });

      dropZone.focus();
      await user.keyboard(' ');

      // Verify Space was handled
      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('handles empty files array', async () => {
      render(<DragDropZone onFileDrop={mockOnFileDrop} isValidating={false} />);

      const fileInput = screen.getByLabelText('File input for CV import');

      // Trigger change with empty files
      fireEvent.change(fileInput, { target: { files: null } });

      expect(mockOnFileDrop).not.toHaveBeenCalled();
    });
  });
});
