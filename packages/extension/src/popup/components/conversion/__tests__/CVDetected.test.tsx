/**
 * CVDetected Component Tests
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CVDetected } from '../CVDetected';

describe('CVDetected', () => {
  it('renders "CV Detected!" heading', () => {
    const mockOnExport = vi.fn();
    render(<CVDetected onExport={mockOnExport} />);
    expect(screen.getByRole('heading', { name: /cv detected!/i })).toBeInTheDocument();
  });

  it('displays CV preview with name and role', () => {
    const mockOnExport = vi.fn();
    render(<CVDetected cvName="Jane Smith" cvRole="Designer" onExport={mockOnExport} />);
    expect(screen.getByTestId('cv-preview')).toHaveTextContent('Jane Smith - Designer');
  });

  it('displays "Export to PDF" button', () => {
    const mockOnExport = vi.fn();
    render(<CVDetected onExport={mockOnExport} />);
    const button = screen.getByRole('button', { name: /export.*pdf/i });
    expect(button).toBeInTheDocument();
  });

  it('calls onExport when export button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnExport = vi.fn();
    render(<CVDetected onExport={mockOnExport} />);

    const button = screen.getByRole('button', { name: /export.*pdf/i });
    await user.click(button);

    expect(mockOnExport).toHaveBeenCalledOnce();
  });

  it('has customize settings button', () => {
    const mockOnExport = vi.fn();
    render(<CVDetected onExport={mockOnExport} />);
    expect(screen.getByRole('button', { name: /customize settings/i })).toBeInTheDocument();
  });
});
