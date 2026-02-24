import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MoveList from '../../components/dex/MoveList';
import { describe, it, expect } from 'vitest';
import { PokemonMove } from '../../types';

const mockMoves: PokemonMove[] = [
  {
    name: 'tackle',
    url: 'https://pokeapi.co/api/v2/move/33/',
    type: 'normal',
    damageClass: 'physical',
    power: 40,
    accuracy: 100,
    pp: 35,
    priority: 0,
    level: 1,
    learnMethod: 'level up',
  },
  {
    name: 'ember',
    url: 'https://pokeapi.co/api/v2/move/52/',
    type: 'fire',
    damageClass: 'special',
    power: 40,
    accuracy: 100,
    pp: 25,
    priority: 0,
    level: 1,
    learnMethod: 'level up',
  },
];

describe('MoveList Stale Memoization Bug', () => {
  it('should update the list when search query changes', async () => {
    const user = userEvent.setup();
    render(<MoveList moves={mockMoves} />);

    // Initially both moves should be visible
    expect(screen.getByText('tackle')).toBeInTheDocument();
    expect(screen.getByText('ember')).toBeInTheDocument();

    // Type 'ember' into the search box
    const searchInput = screen.getByRole('textbox', { name: /search moves/i });
    await user.type(searchInput, 'ember');

    // Wait for the UI to update
    // If the bug exists, 'tackle' will still be visible because filteredMoves updated but sortedMoves didn't

    // We expect 'tackle' to disappear
    await waitFor(() => {
      expect(screen.queryByText('tackle')).not.toBeInTheDocument();
    });

    // 'ember' should still be there
    expect(screen.getByText('ember')).toBeInTheDocument();
  });
});
