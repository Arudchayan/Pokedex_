import React, { useEffect } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PokemonListItem } from '../types';

// Mock pokeapiService MUST be before imports of context/components
vi.mock('../services/pokeapiService', () => ({
  fetchAllPokemons: vi.fn(() => Promise.resolve(mockPokemonList)),
  fetchPokemonDetails: vi.fn(),
  validatePokemonListItem: vi.fn((p) => p),
}));

import { PokemonProvider, usePokemon } from '../context/PokemonContext';
import { usePokemonStore } from '../store/usePokemonStore';

// Mock Data
const mockPokemonList: PokemonListItem[] = [
  { id: 1, name: 'bulbasaur', types: ['grass', 'poison'], imageUrl: '', shinyImageUrl: '', flavorText: '', stats: [], abilities: [] },
  { id: 2, name: 'ivysaur', types: ['grass', 'poison'], imageUrl: '', shinyImageUrl: '', flavorText: '', stats: [], abilities: [] },
];

// Spy on domain list logic (applySort/applyFilters).
// We need to verify that applySort is called (or not called) when store effects run.
const applySortSpy = vi.fn();
const applyFiltersSpy = vi.fn();

vi.mock('../domain/pokemonList', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    applySort: (...args: any[]) => {
      applySortSpy(...args);
      return actual.applySort(...args);
    },
    applyFilters: (...args: any[]) => {
      applyFiltersSpy(...args);
      return actual.applyFilters(...args);
    },
  };
});

// Test Component
const TestComponent = () => {
  const { filteredPokemon, favorites } = usePokemon();

  return (
    <div>
      <div data-testid="count">{filteredPokemon.length}</div>
      <button onClick={() => usePokemonStore.getState().toggleFavorite(1)}>
        Toggle Fav 1
      </button>
      <button onClick={() => usePokemonStore.getState().setSort('favorite', 'desc')}>
        Sort By Fav
      </button>
       <button onClick={() => usePokemonStore.getState().setSort('id', 'asc')}>
        Sort By ID
      </button>
    </div>
  );
};

describe('PokemonContext Performance Optimization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset spies
    applySortSpy.mockClear();
    applyFiltersSpy.mockClear();
  });

  it('should avoid re-sorting when toggling favorites if not sorting by favorites', async () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <PokemonProvider>
          <TestComponent />
        </PokemonProvider>
      </QueryClientProvider>
    );

    // Wait for initial load
    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('2'));

    // Initial load calls applySort
    expect(applySortSpy).toHaveBeenCalled();
    const initialCallCount = applySortSpy.mock.calls.length;

    // Clear calls to focus on update behavior
    applySortSpy.mockClear();

    // 1. Toggle Favorite while sorting by ID (default)
    // CURRENT BEHAVIOR: This triggers re-sort.
    // OPTIMIZED BEHAVIOR: This should NOT trigger re-sort.
    await act(async () => {
      screen.getByText('Toggle Fav 1').click();
    });

    // Wait for any effects
    await new Promise(resolve => setTimeout(resolve, 50));

    // CHECK: How many times was applySort called?
    // In unoptimized code, it is called once.
    // In optimized code, it should be 0.
    // We expect it NOT to be called (verifying the optimization)
    expect(applySortSpy).not.toHaveBeenCalled();

    // 2. Change Sort to Favorite
    applySortSpy.mockClear();
    await act(async () => {
      screen.getByText('Sort By Fav').click();
    });

    // Wait for effect
    await new Promise(resolve => setTimeout(resolve, 50));

    // Should be called
    expect(applySortSpy).toHaveBeenCalled();

    // 3. Toggle Favorite while sorting by Favorite
    applySortSpy.mockClear();
    await act(async () => {
        screen.getByText('Toggle Fav 1').click();
    });

    // Wait for effect
    await new Promise(resolve => setTimeout(resolve, 50));

    // Should be called because we are sorting by favorites!
    expect(applySortSpy).toHaveBeenCalled();
  });
});
