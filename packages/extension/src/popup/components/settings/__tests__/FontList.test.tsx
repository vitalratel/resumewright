/**
 * FontList Component Tests
 * Font list display and delete functionality
 */

import type { CustomFont, FontWeight } from '@/shared/domain/fonts/models/Font';
import { render, screen } from '@testing-library/react';

import userEvent from '@testing-library/user-event';
import { fakeBrowser } from '@webext-core/fake-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FontList } from '../FontList';

// Mock webextension-polyfill BEFORE any other imports
vi.mock('webextension-polyfill', () => ({
  default: fakeBrowser,
}));

describe('FontList', () => {
  const mockOnDeleteSuccess = vi.fn();
  const mockOnDeleteError = vi.fn();

  beforeEach(() => {
    // Reset fake browser state before each test
    fakeBrowser.reset();
    vi.clearAllMocks();
  });

  const mockFonts: CustomFont[] = [
    {
      id: 'font-1',
      family: 'Roboto',
      weight: 400 as FontWeight,
      style: 'normal',
      format: 'ttf',
      bytes: new Uint8Array([1, 2, 3]),
      fileSize: 1024,
      uploadedAt: Date.now(),
    },
    {
      id: 'font-2',
      family: 'Open Sans',
      weight: 700 as FontWeight,
      style: 'italic',
      format: 'woff',
      bytes: new Uint8Array([4, 5, 6]),
      fileSize: 2048,
      uploadedAt: Date.now(),
    },
    {
      id: 'font-3',
      family: 'Arial',
      weight: 400 as FontWeight,
      style: 'normal',
      format: 'woff2',
      bytes: new Uint8Array([7, 8, 9]),
      fileSize: 512,
      uploadedAt: Date.now(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock for sendMessage
    const sendMessageSpy = vi.spyOn(fakeBrowser.runtime, 'sendMessage');
    sendMessageSpy.mockImplementation(async (message: unknown) => {
        const msg = message as { type: string; payload?: unknown };
        if (msg.type === 'REMOVE_CUSTOM_FONT') {
        return Promise.resolve({ success: true });
      }
      return Promise.reject(new Error(`Unknown message type: ${msg.type}`));
    });
  });

  describe('Empty State', () => {
    it('renders empty state when no fonts', () => {
      render(<FontList fonts={[]} onDeleteSuccess={mockOnDeleteSuccess} onDeleteError={mockOnDeleteError} />);

      expect(screen.getByText('Uploaded Fonts')).toBeInTheDocument();
      expect(screen.getByText('No custom fonts uploaded yet')).toBeInTheDocument();
    });

    it('does not render delete buttons in empty state', () => {
      render(<FontList fonts={[]} onDeleteSuccess={mockOnDeleteSuccess} onDeleteError={mockOnDeleteError} />);

      expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
    });
  });

  describe('Font Display', () => {
    it('renders all fonts in the list', () => {
      render(<FontList fonts={mockFonts} onDeleteSuccess={mockOnDeleteSuccess} onDeleteError={mockOnDeleteError} />);

      expect(screen.getByText('Roboto')).toBeInTheDocument();
      expect(screen.getByText('Open Sans')).toBeInTheDocument();
      expect(screen.getByText('Arial')).toBeInTheDocument();
    });

    it('displays font metadata correctly', () => {
      render(<FontList fonts={mockFonts} onDeleteSuccess={mockOnDeleteSuccess} onDeleteError={mockOnDeleteError} />);

      // Check for weight, style, and size - use getAllByText for multiple matches
      expect(screen.getAllByText(/Weight: 400/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Style: normal/).length).toBeGreaterThan(0);
      expect(screen.getByText(/Size: 1\.0 KB/)).toBeInTheDocument();
    });

    it('displays format badges for all fonts', () => {
      render(<FontList fonts={mockFonts} onDeleteSuccess={mockOnDeleteSuccess} onDeleteError={mockOnDeleteError} />);

      expect(screen.getByText('TTF')).toBeInTheDocument();
      expect(screen.getByText('WOFF')).toBeInTheDocument();
      expect(screen.getByText('WOFF2')).toBeInTheDocument();
    });

    it('formats file sizes correctly', () => {
      render(<FontList fonts={mockFonts} onDeleteSuccess={mockOnDeleteSuccess} onDeleteError={mockOnDeleteError} />);

      expect(screen.getByText(/1\.0 KB/)).toBeInTheDocument(); // 1024 bytes
      expect(screen.getByText(/2\.0 KB/)).toBeInTheDocument(); // 2048 bytes
      expect(screen.getByText(/512 B/)).toBeInTheDocument(); // 512 bytes
    });
  });

  describe('Format Badges', () => {
    it('has aria-label for format badges', () => {
      render(<FontList fonts={[mockFonts[0]]} onDeleteSuccess={mockOnDeleteSuccess} onDeleteError={mockOnDeleteError} />);

      const badge = screen.getByLabelText('Font format: TTF');
      expect(badge).toBeInTheDocument();
    });

    it('applies consistent neutral color to TTF badge', () => {
      render(<FontList fonts={[mockFonts[0]]} onDeleteSuccess={mockOnDeleteSuccess} onDeleteError={mockOnDeleteError} />);

      const ttfBadge = screen.getByText('TTF');
      expect(ttfBadge).toHaveClass('bg-gray-50');
      expect(ttfBadge).toHaveClass('text-gray-600');
    });

    it('applies consistent neutral color to WOFF badge', () => {
      render(<FontList fonts={[mockFonts[1]]} onDeleteSuccess={mockOnDeleteSuccess} onDeleteError={mockOnDeleteError} />);

      const woffBadge = screen.getByText('WOFF');
      expect(woffBadge).toHaveClass('bg-gray-50');
      expect(woffBadge).toHaveClass('text-gray-600');
    });

    it('applies consistent neutral color to WOFF2 badge', () => {
      render(<FontList fonts={[mockFonts[2]]} onDeleteSuccess={mockOnDeleteSuccess} onDeleteError={mockOnDeleteError} />);

      const woff2Badge = screen.getByText('WOFF2');
      expect(woff2Badge).toHaveClass('bg-gray-50');
      expect(woff2Badge).toHaveClass('text-gray-600');
    });
  });

  describe('Delete Functionality', () => {
    it('renders delete button for each font', () => {
      render(<FontList fonts={mockFonts} onDeleteSuccess={mockOnDeleteSuccess} onDeleteError={mockOnDeleteError} />);

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      expect(deleteButtons).toHaveLength(3);
    });

    it('calls sendMessage and onDeleteSuccess when delete confirmed', async () => {
      const user = userEvent.setup();
      render(<FontList fonts={mockFonts} onDeleteSuccess={mockOnDeleteSuccess} onDeleteError={mockOnDeleteError} />);

      const deleteButton = screen.getByRole('button', { name: 'Delete Roboto' });
      await user.click(deleteButton);

      // Confirmation dialog should appear
      expect(screen.getByText('Delete Font')).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to delete "Roboto"/)).toBeInTheDocument();

      // Click confirm button
      const confirmButton = screen.getByRole('button', { name: 'Delete' });
      await user.click(confirmButton);

      // Should send REMOVE_CUSTOM_FONT message first
      expect(fakeBrowser.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'REMOVE_CUSTOM_FONT',
        payload: { fontId: 'font-1' },
      });

      // Then call onDeleteSuccess
      expect(mockOnDeleteSuccess).toHaveBeenCalledWith('font-1', 'Roboto');
    });

    it('has accessible delete button labels', () => {
      render(<FontList fonts={mockFonts} onDeleteSuccess={mockOnDeleteSuccess} onDeleteError={mockOnDeleteError} />);

      expect(screen.getByRole('button', { name: 'Delete Roboto' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Delete Open Sans' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Delete Arial' })).toBeInTheDocument();
    });

    it('delete button is keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<FontList fonts={[mockFonts[0]]} onDeleteSuccess={mockOnDeleteSuccess} onDeleteError={mockOnDeleteError} />);

      const deleteButton = screen.getByRole('button', { name: 'Delete Roboto' });
      deleteButton.focus();

      await user.keyboard('{Enter}');

      // Confirmation dialog should appear
      expect(screen.getByText('Delete Font')).toBeInTheDocument();

      // Confirm deletion with Enter
      const confirmButton = screen.getByRole('button', { name: 'Delete' });
      await user.click(confirmButton);

      expect(fakeBrowser.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'REMOVE_CUSTOM_FONT',
        payload: { fontId: 'font-1' },
      });
      expect(mockOnDeleteSuccess).toHaveBeenCalledWith('font-1', 'Roboto');
    });

    it('can delete with Space key', async () => {
      const user = userEvent.setup();
      render(<FontList fonts={[mockFonts[0]]} onDeleteSuccess={mockOnDeleteSuccess} onDeleteError={mockOnDeleteError} />);

      const deleteButton = screen.getByRole('button', { name: 'Delete Roboto' });
      deleteButton.focus();

      await user.keyboard(' ');

      // Confirmation dialog should appear
      expect(screen.getByText('Delete Font')).toBeInTheDocument();

      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: 'Delete' });
      await user.click(confirmButton);

      expect(fakeBrowser.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'REMOVE_CUSTOM_FONT',
        payload: { fontId: 'font-1' },
      });
      expect(mockOnDeleteSuccess).toHaveBeenCalledWith('font-1', 'Roboto');
    });

    it('does not delete when cancel is clicked', async () => {
      const user = userEvent.setup();
      render(<FontList fonts={[mockFonts[0]]} onDeleteSuccess={mockOnDeleteSuccess} onDeleteError={mockOnDeleteError} />);

      const deleteButton = screen.getByRole('button', { name: 'Delete Roboto' });
      await user.click(deleteButton);

      // Confirmation dialog should appear
      expect(screen.getByText('Delete Font')).toBeInTheDocument();

      // Click cancel button
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      await user.click(cancelButton);

      // sendMessage and callbacks should not be called
      expect(fakeBrowser.runtime.sendMessage).not.toHaveBeenCalled();
      expect(mockOnDeleteSuccess).not.toHaveBeenCalled();

      // Dialog should be closed
      expect(screen.queryByText('Delete Font')).not.toBeInTheDocument();
    });
  });

  describe('Font Variations', () => {
    it('displays italic style correctly', () => {
      render(<FontList fonts={[mockFonts[1]]} onDeleteSuccess={mockOnDeleteSuccess} onDeleteError={mockOnDeleteError} />);

      expect(screen.getByText(/Style: italic/)).toBeInTheDocument();
    });

    it('displays bold weight correctly', () => {
      render(<FontList fonts={[mockFonts[1]]} onDeleteSuccess={mockOnDeleteSuccess} onDeleteError={mockOnDeleteError} />);

      expect(screen.getByText(/Weight: 700/)).toBeInTheDocument();
    });

    it('handles fonts with same family but different weights', () => {
      const variations: CustomFont[] = [
        { ...mockFonts[0], id: 'font-a', weight: 400 as FontWeight },
        { ...mockFonts[0], id: 'font-b', weight: 700 as FontWeight },
      ];

      render(<FontList fonts={variations} onDeleteSuccess={mockOnDeleteSuccess} onDeleteError={mockOnDeleteError} />);

      const weights = screen.getAllByText(/Weight:/);
      expect(weights).toHaveLength(2);
    });
  });

  describe('Edge Cases', () => {
    it('handles single font correctly', () => {
      render(<FontList fonts={[mockFonts[0]]} onDeleteSuccess={mockOnDeleteSuccess} onDeleteError={mockOnDeleteError} />);

      expect(screen.getByText('Roboto')).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /delete/i })).toHaveLength(1);
    });

    it('renders heading even with no fonts', () => {
      render(<FontList fonts={[]} onDeleteSuccess={mockOnDeleteSuccess} onDeleteError={mockOnDeleteError} />);

      expect(screen.getByText('Uploaded Fonts')).toBeInTheDocument();
    });

    it('handles fonts with very long family names', () => {
      const longNameFont: CustomFont = {
        ...mockFonts[0],
        family: 'Very Long Font Family Name That Should Wrap',
      };

      render(<FontList fonts={[longNameFont]} onDeleteSuccess={mockOnDeleteSuccess} onDeleteError={mockOnDeleteError} />);

      expect(screen.getByText('Very Long Font Family Name That Should Wrap')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('calls onDeleteError when sendMessage fails', async () => {
      const user = userEvent.setup();
      const testError = new Error('Network error');
      vi.spyOn(fakeBrowser.runtime, 'sendMessage').mockRejectedValue(testError);

      render(<FontList fonts={[mockFonts[0]]} onDeleteSuccess={mockOnDeleteSuccess} onDeleteError={mockOnDeleteError} />);

      const deleteButton = screen.getByRole('button', { name: 'Delete Roboto' });
      await user.click(deleteButton);

      // Confirmation dialog should appear
      expect(screen.getByText('Delete Font')).toBeInTheDocument();

      // Click confirm button
      const confirmButton = screen.getByRole('button', { name: 'Delete' });
      await user.click(confirmButton);

      // Should send REMOVE_CUSTOM_FONT message
      expect(fakeBrowser.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'REMOVE_CUSTOM_FONT',
        payload: { fontId: 'font-1' },
      });

      // Should call onDeleteError with the error
      expect(mockOnDeleteError).toHaveBeenCalledWith(testError);
      expect(mockOnDeleteSuccess).not.toHaveBeenCalled();
    });
  });
});
