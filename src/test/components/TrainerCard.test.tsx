import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TrainerCard from '../../components/team/TrainerCard';
import { renderWithProvider } from '../utils';

// Mock html2canvas dynamic import
vi.mock('html2canvas', () => ({
  default: vi.fn().mockResolvedValue({
      toDataURL: vi.fn().mockReturnValue('data:image/png;base64,mock'),
  }),
}));

describe('TrainerCard', () => {
  it('sanitizes dangerous input in Trainer Name', () => {
    const onClose = vi.fn();
    renderWithProvider(<TrainerCard onClose={onClose} />);

    // Initial render
    expect(screen.getByDisplayValue('Pokemon Trainer')).toBeInTheDocument();

    const input = screen.getByDisplayValue('Pokemon Trainer');

    // Type a dangerous string
    fireEvent.change(input, { target: { value: 'Hacker<script>' } });

    // Expect the input value to be sanitized (stripped of < and >)
    // sanitizeString strips < > " \ `
    expect(input).toHaveValue('Hackerscript');
  });

  it('limits input length attribute', () => {
    const onClose = vi.fn();
    renderWithProvider(<TrainerCard onClose={onClose} />);

    // Note: The default value 'Pokemon Trainer' (15 chars) is longer than max length (12)
    // This is an existing oddity but valid React behavior (defaultValue/value > maxLength is allowed).
    const input = screen.getByDisplayValue('Pokemon Trainer');
    expect(input).toHaveAttribute('maxLength', '12');
  });
});
