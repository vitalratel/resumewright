/**
 * NoCVDetected Component Tests
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NoCVDetected } from '../components/NoCVDetected';

describe('NoCVDetected', () => {
  it('renders "No CV Detected" heading', () => {
    render(<NoCVDetected />);
    expect(screen.getByRole('heading', { name: /no cv detected/i })).toBeInTheDocument();
  });

  it('displays instructional text', () => {
    render(<NoCVDetected />);
    expect(
      screen.getByText(/visit claude\.ai and generate a cv to get started/i),
    ).toBeInTheDocument();
  });

  it('displays help link', () => {
    render(<NoCVDetected />);
    const link = screen.getByRole('link', { name: /how to create a cv with claude/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://claude.ai');
  });

  it('has correct accessibility attributes', () => {
    render(<NoCVDetected />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link).toHaveAttribute('target', '_blank');
  });
});
