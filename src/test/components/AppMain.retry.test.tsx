import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppMain from '../../app/AppMain';
import { useAppController } from '../../app/useAppController';
import { PokemonProvider } from '../../context/PokemonContext';
import { ToastProvider } from '../../context/ToastContext';
import { usePokemonStore } from '../../store/usePokemonStore';
import type { PokemonListItem } from '../../types';

const fetchAllPokemonsMock = vi.fn();

vi.mock('../../services/pokeapiService', () => ({
  fetchAllPokemons: (...args: unknown[]) => fetchAllPokemonsMock(...args),
  fetchRegionalDexMap: vi.fn().mockResolvedValue(new Map()),
}));

vi.mock('../../services/soundService', () => ({
  playUISound: vi.fn(),
  toggleAudio: vi.fn(() => true),
  isAudioEnabled: vi.fn(() => true),
}));

vi.mock('../../components/pokemon/VirtualPokemonList', () => ({
  default: ({ pokemonList }: { pokemonList: PokemonListItem[] }) => (
    <div data-testid="pokemon-results-list">
      {pokemonList.map((pokemon) => (
        <span key={pokemon.id}>{pokemon.name}</span>
      ))}
    </div>
  ),
}));

vi.mock('../../components/team/TeamBuilder', () => ({
  default: () => <div data-testid="team-builder" />,
}));

vi.mock('../../components/layout/SortingControls', () => ({
  default: () => <div data-testid="sorting-controls" />,
}));

vi.mock('../../components/layout/FilterControls', () => ({
  default: () => <div data-testid="filter-controls" />,
}));

const pokemonList: PokemonListItem[] = [
  {
    id: 1,
    name: 'bulbasaur',
    imageUrl: 'url',
    shinyImageUrl: 'url',
    types: ['grass'],
    flavorText: 'seed pokemon',
    stats: [],
    abilities: [],
  },
];

const createDeferred = <T,>() => {
  let resolve: (value: T) => void;
  let reject: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return { promise, resolve: resolve!, reject: reject! };
};

const Harness = () => {
  const controller = useAppController();
  return <AppMain controller={controller} />;
};

const renderApp = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      // Mirror the production client's retry budget. The pokemonList query must
      // override this so its service-level 3-attempt cycle is the only budget.
      queries: { retry: 2, retryDelay: 0 },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <PokemonProvider>
        <ToastProvider>
          <Harness />
        </ToastProvider>
      </PokemonProvider>
    </QueryClientProvider>
  );
};

const flush = async (ms = 0) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
};

const expectNoSkeleton = () => {
  expect(document.querySelector('.animate-shimmer, .animate-pulse')).toBeNull();
};

describe('AppMain retry behavior', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    localStorage.clear();
    usePokemonStore.setState({
      masterPokemonList: [],
      filteredPokemon: [],
      loading: true,
      isRetrying: false,
      error: null,
      searchTerm: '',
      selectedGeneration: 'all',
      selectedTypes: [],
      flavorTextSearch: '',
      minStats: {},
      selectedAbility: '',
      isMonoType: false,
      minBST: 0,
      team: [],
      favorites: new Set(),
      comparisonList: [],
      sortBy: 'id',
      sortOrder: 'asc',
    });
  });

  it('shows one durable error and never starts another automatic load after the budget', async () => {
    fetchAllPokemonsMock.mockRejectedValue(new Error('Network error'));

    renderApp();
    await flush(10);

    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(screen.getByText('Failed to fetch Pokemon data.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeEnabled();
    expect(screen.queryByTestId('pokemon-results-list')).not.toBeInTheDocument();
    expectNoSkeleton();

    // One service invocation is one bounded 3-attempt cycle. React Query must
    // not multiply it, and focus/reconnect must not restart it.
    expect(fetchAllPokemonsMock).toHaveBeenCalledTimes(1);

    await flush(120_000);
    expect(fetchAllPokemonsMock).toHaveBeenCalledTimes(1);
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Retry' })).toBeEnabled();
  });

  it('shows immediate retry feedback and keeps the error visible until success', async () => {
    const nextAttempt = createDeferred<PokemonListItem[]>();
    fetchAllPokemonsMock
      .mockRejectedValueOnce(new Error('Network error'))
      .mockImplementationOnce(() => nextAttempt.promise);

    renderApp();
    await flush(10);

    const retryButton = screen.getByRole('button', { name: 'Retry' });
    retryButton.focus();
    fireEvent.click(retryButton);

    const retryingButton = screen.getByRole('button', { name: /retrying/i });
    expect(retryingButton).toBeDisabled();
    expect(retryingButton).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Failed to fetch Pokemon data.');
    expect(screen.getByRole('status')).toHaveTextContent('Retrying Pokemon data...');
    expect(screen.getByRole('region', { name: 'Pokemon results' })).toHaveFocus();
    expectNoSkeleton();
    expect(fetchAllPokemonsMock).toHaveBeenCalledTimes(2);

    nextAttempt.resolve(pokemonList);
    await flush(10);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /retrying/i })).not.toBeInTheDocument();
    expect(screen.getByTestId('pokemon-results-list')).toHaveTextContent('bulbasaur');
    expect(screen.getByText('Pokemon data loaded.')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Pokemon results' })).toHaveFocus();
  });

  it('returns to the same durable error after a failed retry, with no skeleton loop', async () => {
    const nextAttempt = createDeferred<PokemonListItem[]>();
    fetchAllPokemonsMock
      .mockRejectedValueOnce(new Error('Network error'))
      .mockImplementationOnce(() => nextAttempt.promise);

    renderApp();
    await flush(10);
    const retryButton = screen.getByRole('button', { name: 'Retry' });
    retryButton.focus();
    fireEvent.click(retryButton);

    expect(screen.getByRole('button', { name: /retrying/i })).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent('Failed to fetch Pokemon data.');
    expect(screen.getByRole('region', { name: 'Pokemon results' })).toHaveFocus();

    nextAttempt.reject(new Error('Still failing'));
    await flush(10);

    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(screen.getByRole('alert')).toHaveTextContent('Failed to fetch Pokemon data.');
    expect(screen.getByRole('button', { name: 'Retry' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Retry' })).toHaveFocus();
    expectNoSkeleton();
    expect(screen.getByRole('status')).toHaveTextContent('Retry failed.');

    await flush(120_000);
    expect(fetchAllPokemonsMock).toHaveBeenCalledTimes(2);
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expectNoSkeleton();
  });

  it('starts only one bounded cycle when Retry is double-clicked', async () => {
    const nextAttempt = createDeferred<PokemonListItem[]>();
    fetchAllPokemonsMock
      .mockRejectedValueOnce(new Error('Network error'))
      .mockImplementationOnce(() => nextAttempt.promise);

    renderApp();
    await flush(10);

    const retryButton = screen.getByRole('button', { name: 'Retry' });
    fireEvent.click(retryButton);
    fireEvent.click(retryButton);

    expect(fetchAllPokemonsMock).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('button', { name: /retrying/i })).toBeDisabled();
    expect(screen.getByRole('alert')).toBeInTheDocument();

    nextAttempt.resolve(pokemonList);
    await flush(10);

    expect(screen.getByTestId('pokemon-results-list')).toHaveTextContent('bulbasaur');
  });

  it('does not warn or throw when unmounted during a retry', async () => {
    const nextAttempt = createDeferred<PokemonListItem[]>();
    fetchAllPokemonsMock
      .mockRejectedValueOnce(new Error('Network error'))
      .mockImplementationOnce(() => nextAttempt.promise);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { unmount } = renderApp();
    await flush(10);
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    unmount();
    nextAttempt.resolve(pokemonList);
    await flush(10);

    expect(consoleError).not.toHaveBeenCalled();
    expect(usePokemonStore.getState().isRetrying).toBe(false);
    consoleError.mockRestore();
  });
});
