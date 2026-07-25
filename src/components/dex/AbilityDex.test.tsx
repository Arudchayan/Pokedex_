import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import AbilityDex from './AbilityDex';
import { renderWithProvider, setPokeapiServiceMock } from '../../test/utils';

const mockAbilities = [
  { name: 'stench', effect: 'Helps repel wild Pokemon.' },
  { name: 'drizzle', effect: 'Summons rain.' },
];

describe('AbilityDex', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    setPokeapiServiceMock({ fetchAbilityDex: mockAbilities });
  });

  afterEach(() => {
    setPokeapiServiceMock();
    vi.clearAllMocks();
  });

  it('renders correctly and loads data', async () => {
    renderWithProvider(<AbilityDex onClose={onClose} />);

    // Check loading state
    expect(screen.getByText('Loading Abilities...')).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('stench')).toBeInTheDocument();
      expect(screen.getByText('drizzle')).toBeInTheDocument();
    });
  });

  it('has accessible attributes on close button and search input', async () => {
    renderWithProvider(<AbilityDex onClose={onClose} />);

    // Wait for load
    await waitFor(() => {
      expect(screen.getByText('stench')).toBeInTheDocument();
    });

    // The Modal wrapper renders a close button with aria-label="Close"
    const closeBtn = screen.getByRole('button', { name: /close/i });
    expect(closeBtn).toBeInTheDocument();
    expect(closeBtn).toHaveAttribute('aria-label', 'Close');

    // Check search input
    const input = screen.getByLabelText('Search abilities');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('placeholder', 'Search abilities...');
  });
});
