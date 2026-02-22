import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PokemonProvider } from '../context/PokemonContext';
import { PokemonListItem } from '../types';

// Define local mock before imports
const fetchAllPokemonsMock = vi.fn();

vi.mock('../services/pokeapiService', () => ({
  fetchAllPokemons: (...args: any[]) => fetchAllPokemonsMock(...args),
  fetchPokemonDetails: vi.fn(),
  fetchAllMoves: vi.fn(),
  fetchAllItems: vi.fn(),
}));

vi.mock('../../utils/favorites', () => ({
  getFavorites: () => new Set(),
}));

const mockPokemonList: PokemonListItem[] = [
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

const renderWithProvider = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false
      }
    }
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <PokemonProvider>{ui}</PokemonProvider>
    </QueryClientProvider>
  );
};

describe('PokemonProvider', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('aborts loading and skips dispatch after unmount', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const deferred = createDeferred<PokemonListItem[]>();
    let receivedSignal: AbortSignal | undefined;

    fetchAllPokemonsMock.mockImplementation(
      (signal?: AbortSignal) => {
        receivedSignal = signal;
        return deferred.promise;
      }
    );

    const { unmount } = renderWithProvider(<div>Test</div>);

    // Trigger unmount which should call abort
    unmount();

    deferred.resolve(mockPokemonList);

    // Wait for promise resolution
    await Promise.resolve();
    await Promise.resolve();

    expect(receivedSignal).toBeDefined();
    expect(receivedSignal?.aborted).toBe(true);
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
