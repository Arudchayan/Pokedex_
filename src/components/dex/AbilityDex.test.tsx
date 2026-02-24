import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import AbilityDex from './AbilityDex';
import { renderWithProvider } from '../../test/utils';

// Mock fetch for the specific GraphQL query
const mockAbilities = {
  data: {
    pokemon_v2_ability: [
      {
        id: 1,
        name: 'stench',
        pokemon_v2_abilityeffecttexts: [{ effect: 'Helps repel wild Pokemon.' }],
      },
      {
        id: 2,
        name: 'drizzle',
        pokemon_v2_abilityeffecttexts: [{ effect: 'Summons rain.' }],
      },
    ],
  },
};

describe('AbilityDex', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockAbilities),
    } as Response);
  });

  afterEach(() => {
    vi.restoreAllMocks();
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
