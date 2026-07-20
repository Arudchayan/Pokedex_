import type { QueryClient } from '@tanstack/react-query';
import { fetchPokemonMoves } from './pokeapiService';
import type { PokemonMove } from '../types';
import { POKEMON_DETAILS_STALE_TIME } from './pokemonDetailsQuery';

/** Shared React Query key for Pokemon move payloads. */
export const pokemonMovesQueryKey = (id: number) => ['pokemonMoves', id] as const;

export const POKEMON_MOVES_STALE_TIME = POKEMON_DETAILS_STALE_TIME;

/**
 * Imperative fetch that shares the same React Query cache as PokemonDetailView moves.
 */
export function fetchPokemonMovesQuery(
  queryClient: QueryClient,
  id: number
): Promise<PokemonMove[]> {
  return queryClient.fetchQuery({
    queryKey: pokemonMovesQueryKey(id),
    queryFn: () => fetchPokemonMoves(id),
    staleTime: POKEMON_MOVES_STALE_TIME,
  });
}
