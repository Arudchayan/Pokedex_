import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import BreedingCalculator from '../../components/calculators/BreedingCalculator';
import { PokemonProvider } from '../../context/PokemonContext';

// Mock Sound Service
vi.mock('../../services/soundService', () => ({
  playUISound: vi.fn(),
  isAudioEnabled: vi.fn().mockReturnValue(true),
}));

// Mock PokemonContext
const mockMasterList = [
  { id: 1, name: 'bulbasaur', nameLower: 'bulbasaur', imageUrl: 'url', types: ['grass'], eggGroups: ['monster'], genderRate: 1 },
  { id: 4, name: 'charmander', nameLower: 'charmander', imageUrl: 'url', types: ['fire'], eggGroups: ['monster'], genderRate: 1 },
  { id: 25, name: 'pikachu', nameLower: 'pikachu', imageUrl: 'url', types: ['electric'], eggGroups: ['field'], genderRate: 1 },
];

vi.mock('../../context/PokemonContext', async () => {
  const actual = await vi.importActual('../../context/PokemonContext');
  return {
    ...actual,
    usePokemon: () => ({
      masterPokemonList: mockMasterList,
      theme: 'light',
    }),
  };
});

// Mock fetchPokemonDetails
vi.mock('../../services/pokeapiService', () => ({
  fetchPokemonDetails: vi.fn(),
}));

describe('BreedingCalculator', () => {
  it('renders and filters parents correctly', async () => {
    const onClose = vi.fn();
    render(<BreedingCalculator onClose={onClose} />);

    // Check header
    expect(screen.getByText('Breeding Calculator')).toBeInTheDocument();

    // Check Search Input A
    const inputA = screen.getByPlaceholderText('Search Parent A...');
    fireEvent.change(inputA, { target: { value: 'bulb' } });

    // Expect Bulbasaur to appear
    await waitFor(() => {
        expect(screen.getByText('bulbasaur')).toBeInTheDocument();
    });

    // Expect Charmander NOT to appear
    expect(screen.queryByText('charmander')).not.toBeInTheDocument();
  });
});
