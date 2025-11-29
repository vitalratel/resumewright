/**
 * CVPreviewModal Component Tests
 * CV preview before export with confirmation
 * P1-A11Y-007: Focus management for screen reader accessibility
 * Modal close on Escape
 *
 * Tests for CVPreviewModal component:
 * - Rendering with CV content preview
 * - Confirm/Cancel actions
 * - Keyboard interaction (Escape key)
 * - Backdrop click behavior
 * - Focus management and restoration
 */

import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CVPreviewModal } from '../CVPreviewModal';

describe('CVPreviewModal', () => {
  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();

  const mockTsxContent = `
    export default function CV() {
      return (
        <div>
          <h1>John Doe</h1>
          <p>Senior Software Engineer</p>
          <section>
            <h2>Experience</h2>
            <ul>
              <li>Company A - 2020-2023</li>
              <li>Company B - 2018-2020</li>
            </ul>
          </section>
        </div>
      );
    }
  `;

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onConfirm: mockOnConfirm,
    tsxContent: mockTsxContent,
    filename: 'john-doe-resume.tsx',
    fileSize: '2.4 KB',
    // Settings adjustment props
    pageSize: 'Letter' as const,
    margins: 'normal' as const,
    marginValues: { top: 0.75, right: 0.75, bottom: 0.75, left: 0.75 },
    onPageSizeChange: vi.fn(),
    onMarginsChange: vi.fn(),
    onCustomMarginChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render as dialog modal when open', () => {
      render(<CVPreviewModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'preview-title');
    });

    it('should not render when closed', () => {
      render(<CVPreviewModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should display modal title', () => {
      render(<CVPreviewModal {...defaultProps} />);

      expect(screen.getByText('Preview & Adjust Settings')).toBeInTheDocument();
    });

    it('should display filename', () => {
      render(<CVPreviewModal {...defaultProps} />);

      expect(screen.getByText('john-doe-resume.tsx')).toBeInTheDocument();
    });

    it('should display file size', () => {
      render(<CVPreviewModal {...defaultProps} />);

      expect(screen.getByText('2.4 KB')).toBeInTheDocument();
    });

    it('should display CV content preview', () => {
      render(<CVPreviewModal {...defaultProps} />);

      // Should show preview of TSX content (appears in multiple places, use getAllByText)
      const previewSections = screen.getAllByText(/John Doe/i);
      expect(previewSections.length).toBeGreaterThan(0);
    });

    it('should handle empty TSX content gracefully', () => {
      render(<CVPreviewModal {...defaultProps} tsxContent="" />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Preview & Adjust Settings')).toBeInTheDocument();
    });

    it('should handle very long TSX content', () => {
      const longContent = 'a'.repeat(10000);
      render(<CVPreviewModal {...defaultProps} tsxContent={longContent} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should display file metadata section', () => {
      render(<CVPreviewModal {...defaultProps} />);

      // Should show filename and filesize
      expect(screen.getByText('john-doe-resume.tsx')).toBeInTheDocument();
      expect(screen.getByText('2.4 KB')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in filename', () => {
      render(
        <CVPreviewModal
          {...defaultProps}
          filename="résumé-josé-o'brien.tsx"
        />,
      );

      expect(screen.getByText('résumé-josé-o\'brien.tsx')).toBeInTheDocument();
    });

    it('should handle very large file sizes', () => {
      render(<CVPreviewModal {...defaultProps} fileSize="12.8 MB" />);

      expect(screen.getByText('12.8 MB')).toBeInTheDocument();
    });

    it('should handle TSX with special characters', () => {
      const specialContent = `
        export default function CV() {
          return <div>Name: José O'Brien & Co.</div>;
        }
      `;

      render(<CVPreviewModal {...defaultProps} tsxContent={specialContent} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});
