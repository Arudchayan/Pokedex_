import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import StatCalculator from '../../components/calculators/StatCalculator';
import { renderWithProvider } from '../utils'; // Import helper but not the mock setter
import { PokemonListItem } from '../../types';

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

const mockPokemonList: PokemonListItem[] = [
  {
    id: 25,
    name: 'Pikachu',
    nameLower: 'pikachu', // Pre-computed
    types: ['electric'],
    imageUrl: 'pikachu.png',
    shinyImageUrl: 'pikachu-shiny.png',
    flavorText: 'Pika pika',
    stats: [{ name: 'hp', value: 35 }],
    abilities: ['static'],
  },
  {
    id: 4,
    name: 'Charmander',
    nameLower: 'charmander',
    types: ['fire'],
    imageUrl: 'charmander.png',
    shinyImageUrl: 'charmander-shiny.png',
    flavorText: 'Char char',
    stats: [{ name: 'hp', value: 39 }],
    abilities: ['blaze'],
  },
  {
    id: 5,
    name: 'Charmeleon',
    nameLower: 'charmeleon',
    types: ['fire'],
    imageUrl: 'charmeleon.png',
    shinyImageUrl: 'charmeleon-shiny.png',
    flavorText: 'Char char',
    stats: [{ name: 'hp', value: 58 }],
    abilities: ['blaze'],
  },
  {
    id: 6,
    name: 'Charizard',
    // Missing nameLower to test fallback
    types: ['fire', 'flying'],
    imageUrl: 'charizard.png',
    shinyImageUrl: 'charizard-shiny.png',
    flavorText: 'Char char',
    stats: [{ name: 'hp', value: 78 }],
    abilities: ['blaze'],
  },
];

// Mock pokeapiService directly in the test file
vi.mock('../../services/pokeapiService', () => ({
  fetchAllPokemons: vi.fn(() => Promise.resolve(mockPokemonList)),
  fetchPokemonDetails: vi.fn(), // Not needed for search list test
  fetchAllMoves: vi.fn(() => Promise.resolve([])),
  fetchAllItems: vi.fn(() => Promise.resolve([])),
  validatePokemonListItem: vi.fn((data) => data),
}));

describe('StatCalculator Search Optimization', () => {
  // No need for beforeEach setPokeapiServiceMock since we mocked the module directly

  it('filters pokemon list based on search term (case-insensitive)', async () => {
    renderWithProvider(<StatCalculator onClose={vi.fn()} />);

    // Initial state: no search results visible
    const searchInput = screen.getByPlaceholderText(/search pokemon/i);

    // Search for "pika"
    fireEvent.change(searchInput, { target: { value: 'pika' } });

    // Should find Pikachu
    await waitFor(() => {
      expect(screen.getByText('Pikachu')).toBeInTheDocument();
    });
    expect(screen.queryByText('Charmander')).not.toBeInTheDocument();
  });

  it('filters pokemon list with partial match', async () => {
    renderWithProvider(<StatCalculator onClose={vi.fn()} />);
    const searchInput = screen.getByPlaceholderText(/search pokemon/i);

    // Search for "char"
    fireEvent.change(searchInput, { target: { value: 'char' } });

    // Should find Charmander, Charmeleon, Charizard
    await waitFor(() => {
      expect(screen.getByText('Charmander')).toBeInTheDocument();
      expect(screen.getByText('Charmeleon')).toBeInTheDocument();
      expect(screen.getByText('Charizard')).toBeInTheDocument();
    });
    expect(screen.queryByText('Pikachu')).not.toBeInTheDocument();
  });

  it('handles fallback when nameLower is missing', async () => {
    renderWithProvider(<StatCalculator onClose={vi.fn()} />);
    const searchInput = screen.getByPlaceholderText(/search pokemon/i);

    // Search for "charizard" (which has no nameLower in our mock)
    fireEvent.change(searchInput, { target: { value: 'charizard' } });

    await waitFor(() => {
      expect(screen.getByText('Charizard')).toBeInTheDocument();
    });
  });

  it('shows no results for non-matching search', async () => {
    renderWithProvider(<StatCalculator onClose={vi.fn()} />);
    const searchInput = screen.getByPlaceholderText(/search pokemon/i);

    fireEvent.change(searchInput, { target: { value: 'xyz' } });

    // Use a small delay or check for absence
    await waitFor(() => {
      // Wait for any potential re-render
    });

    expect(screen.queryByText('Pikachu')).not.toBeInTheDocument();
    expect(screen.queryByText('Charmander')).not.toBeInTheDocument();
  });
});
