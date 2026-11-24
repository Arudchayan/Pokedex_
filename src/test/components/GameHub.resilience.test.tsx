import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
// Imported before GameHub so the shared pokeapiService mock is registered first.
import { fetchAllPokemonsMock, renderWithProvider, setPokeapiServiceMock } from '../utils';
import GameHub from '../../components/games/GameHub';
import { usePokemonStore } from '../../store/usePokemonStore';

const mockGameState = vi.hoisted(() => ({ readyOnMount: false }));

vi.mock('../../components/games/WhosThatPokemonGame', async () => {
  const { useEffect } = await import('react');
  const MockWhoIsThatGame = ({ onReady }: { onReady?: () => void }) => {
    useEffect(() => {
      if (mockGameState.readyOnMount) onReady?.();
    }, [onReady]);
    return <div>Mock Who&apos;s That game</div>;
  };
  return { default: MockWhoIsThatGame };
});

describe('GameHub loading resilience', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    usePokemonStore.setState({ masterPokemonList: [], loading: true, error: null });
    setupResolvedPokemonList();
    mockGameState.readyOnMount = false;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows one status and lets the player leave while a game is loading', async () => {
    fetchAllPokemonsMock.mockImplementation(() => new Promise(() => {}));
    renderWithProvider(<GameHub onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /Who's That Pokémon/ }));

    const back = await screen.findByRole('button', { name: /Back to games/ });
    expect(back).toHaveFocus();
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(screen.getByRole('status')).toHaveTextContent(/Loading Who's That Pokémon/);

    fireEvent.click(back);

    expect(await screen.findByText('Game Suite')).toBeInTheDocument();
  });

  it('times out with one alert and recovers when Retry remounts the game', async () => {
    vi.useFakeTimers();
    renderWithProvider(<GameHub onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /Who's That Pokémon/ }));
    expect(screen.getByRole('status')).toHaveTextContent(/Loading Who's That Pokémon/);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(12_000);
    });

    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(screen.getByRole('alert')).toHaveTextContent(/Game data couldn't load/i);
    expect(screen.getByRole('button', { name: 'Retry' })).toHaveFocus();

    mockGameState.readyOnMount = true;
    vi.useRealTimers();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() => {
      expect(screen.getByText("Mock Who's That game")).toBeInTheDocument();
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('returns to the hub on Escape and restores focus to the launching card', async () => {
    mockGameState.readyOnMount = true;
    renderWithProvider(<GameHub onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /Who's That Pokémon/ }));
    expect(await screen.findByText("Mock Who's That game")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(await screen.findByText('Game Suite')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Who's That Pokémon/ })).toHaveFocus();
  });

  it('explains the outage and disables games that need Pokémon data', async () => {
    fetchAllPokemonsMock.mockRejectedValue(new Error('offline'));
    const onClose = vi.fn();
    renderWithProvider(<GameHub onClose={onClose} />);

    expect(await screen.findByText('Game data is unavailable')).toBeInTheDocument();
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(screen.getByRole('button', { name: /Who's That Pokémon/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /MoveDle/ })).toBeEnabled();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
}, 15_000);

function setupResolvedPokemonList() {
  setPokeapiServiceMock({
    fetchAllPokemons: [
      {
        id: 1,
        name: 'bulbasaur',
        types: ['grass', 'poison'],
        imageUrl: 'url',
        shinyImageUrl: 'url',
        flavorText: 'seed pokemon',
        stats: [],
        abilities: [],
      },
      {
        id: 4,
        name: 'charmander',
        types: ['fire'],
        imageUrl: 'url',
        shinyImageUrl: 'url',
        flavorText: 'lizard pokemon',
        stats: [],
        abilities: [],
      },
      {
        id: 7,
        name: 'squirtle',
        types: ['water'],
        imageUrl: 'url',
        shinyImageUrl: 'url',
        flavorText: 'tiny turtle pokemon',
        stats: [],
        abilities: [],
      },
      {
        id: 25,
        name: 'pikachu',
        types: ['electric'],
        imageUrl: 'url',
        shinyImageUrl: 'url',
        flavorText: 'mouse pokemon',
        stats: [],
        abilities: [],
      },
    ],
  });
}
