import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProvider, setPokeapiServiceMock } from './utils';
import GameHub from '../components/games/GameHub';

const mockPokemonList = [
    { id: 1, name: 'bulbasaur', types: ['grass', 'poison'], imageUrl: 'url', shinyImageUrl: 'url', flavorText: 'seed pokemon', stats: [], abilities: [] },
    { id: 4, name: 'charmander', types: ['fire'], imageUrl: 'url', shinyImageUrl: 'url', flavorText: 'lizard pokemon', stats: [], abilities: [] },
    { id: 7, name: 'squirtle', types: ['water'], imageUrl: 'url', shinyImageUrl: 'url', flavorText: 'tiny turtle pokemon', stats: [], abilities: [] },
    { id: 25, name: 'pikachu', types: ['electric'], imageUrl: 'url', shinyImageUrl: 'url', flavorText: 'mouse pokemon', stats: [], abilities: [] },
];

const mockDetails = {
    id: 1,
    name: 'bulbasaur',
    types: ['grass', 'poison'],
    imageUrl: 'url',
    height: 7,
    weight: 69,
    stats: [{ name: 'hp', value: 45 }],
    abilities: [{ name: 'overgrow' }],
    flavorText: 'A strange seed was planted on its back at birth.',
    color: 'green',
    habitat: 'grassland',
    evolutionChain: [
        { id: 1, name: 'bulbasaur', evolvesFromId: null },
        { id: 2, name: 'ivysaur', evolvesFromId: 1 },
        { id: 3, name: 'venusaur', evolvesFromId: 2 }
    ]
};

describe('GameHub and Games', () => {
    beforeAll(() => {
        // Mock Audio
        vi.stubGlobal('Audio', vi.fn().mockImplementation(() => ({
            play: vi.fn().mockResolvedValue(undefined),
            pause: vi.fn(),
            currentTime: 0,
            volume: 0.5,
        })));
    });

    afterAll(() => {
        vi.unstubAllGlobals();
    });

    beforeEach(() => {
        vi.resetAllMocks();
        setPokeapiServiceMock({
            fetchAllPokemons: mockPokemonList,
            fetchPokemonDetails: mockDetails,
        });
    });

    it('should render GameHub and navigate to Pokedle', async () => {
        const onClose = vi.fn();
        renderWithProvider(<GameHub onClose={onClose} />);

        await waitFor(() => {
            expect(screen.getByText('Game Suite')).toBeInTheDocument();
        });

        // Click Pokedle
        const pokedleBtn = screen.getByText('Pokédle');
        fireEvent.click(pokedleBtn);

        // Check if Pokedle renders
        await waitFor(() => {
            expect(screen.getByText('Pokedle')).toBeInTheDocument();
        });

        // Verify new columns exist
        expect(screen.getByText('Type 1')).toBeInTheDocument();
        expect(screen.getByText('Type 2')).toBeInTheDocument();
        expect(screen.getByText('Habitat')).toBeInTheDocument();
        expect(screen.getByText('Stage')).toBeInTheDocument();
    });

    it('should render GameHub and navigate to CryDle', async () => {
        const onClose = vi.fn();
        renderWithProvider(<GameHub onClose={onClose} />);

        const cryBtn = screen.getByText('CryDle');
        fireEvent.click(cryBtn);

        await waitFor(() => {
            expect(screen.getByText('CryDle')).toBeInTheDocument();
        });

        // Check if play button exists
        const playBtn = screen.getByText('Tap to play sound');
        expect(playBtn).toBeInTheDocument();
    });
});
