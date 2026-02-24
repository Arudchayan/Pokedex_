import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderWithProvider } from './utils';
import { usePokemon } from '../context/PokemonContext';
import { usePokemonStore } from '../store/usePokemonStore';
import { PokemonListItem } from '../types';

const TestComponent = () => {
  const { team, undo, redo, canUndo, canRedo } = usePokemon();

  const addPokemon = () => {
    const newPokemon: PokemonListItem = {
      id: Date.now(),
      name: `Pokemon ${Date.now()}`,
      imageUrl: '',
      shinyImageUrl: '',
      types: ['normal'],
      flavorText: '',
      stats: [],
      abilities: [],
    };
    usePokemonStore.getState().addToTeam(newPokemon);
  };

  const clearTeam = () => {
    usePokemonStore.getState().clearTeam();
  };

  return (
    <div>
      <div data-testid="team-count">{team.length}</div>
      <button onClick={addPokemon}>Add</button>
      <button onClick={clearTeam}>Clear</button>
      <button onClick={undo} disabled={!canUndo}>
        Undo
      </button>
      <button onClick={redo} disabled={!canRedo}>
        Redo
      </button>
    </div>
  );
};

describe('Undo/Redo Functionality', () => {
  beforeEach(() => {
    localStorage.clear();
    usePokemonStore.setState({
      team: [],
      history: [],
      future: [],
      favorites: new Set(),
      masterPokemonList: [],
      loading: false,
      error: null,
    });
  });

  it('should undo and redo adding a pokemon', async () => {
    const user = userEvent.setup();
    renderWithProvider(<TestComponent />);

    // Initial state
    expect(screen.getByTestId('team-count')).toHaveTextContent('0');

    // Add Pokemon
    await user.click(screen.getByText('Add'));
    expect(screen.getByTestId('team-count')).toHaveTextContent('1');

    // Add another
    await user.click(screen.getByText('Add'));
    expect(screen.getByTestId('team-count')).toHaveTextContent('2');

    // Undo
    await user.click(screen.getByText('Undo'));
    expect(screen.getByTestId('team-count')).toHaveTextContent('1');

    // Undo again
    await user.click(screen.getByText('Undo'));
    expect(screen.getByTestId('team-count')).toHaveTextContent('0');

    // Redo
    await user.click(screen.getByText('Redo'));
    expect(screen.getByTestId('team-count')).toHaveTextContent('1');
  });

  it('should handle clear team undo', async () => {
    const user = userEvent.setup();
    renderWithProvider(<TestComponent />);

    // Add Pokemon
    await user.click(screen.getByText('Add'));
    expect(screen.getByTestId('team-count')).toHaveTextContent('1');

    // Clear Team
    await user.click(screen.getByText('Clear'));
    expect(screen.getByTestId('team-count')).toHaveTextContent('0');

    // Undo Clear
    await user.click(screen.getByText('Undo'));
    expect(screen.getByTestId('team-count')).toHaveTextContent('1');
  });
});
