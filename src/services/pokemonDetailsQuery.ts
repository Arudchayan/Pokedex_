import type { QueryClient } from '@tanstack/react-query';
import { fetchPokemonDetails } from './pokeapiService';
import type { PokemonDetails } from '../types';

/** Shared React Query key for Pokemon detail payloads. */
export const pokemonDetailsQueryKey = (id: number) => ['pokemonDetails', id] as const;

export const POKEMON_DETAILS_STALE_TIME = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Imperative fetch that shares the same React Query cache as PokemonDetailView.
 * Prefer calling via `useQueryClient()` from components/hooks.
 */
export function fetchPokemonDetailsQuery(
  queryClient: QueryClient,
  id: number
): Promise<PokemonDetails | null> {
  return queryClient.fetchQuery({
    queryKey: pokemonDetailsQueryKey(id),
    queryFn: () => fetchPokemonDetails(id),
    staleTime: POKEMON_DETAILS_STALE_TIME,
  });
}
