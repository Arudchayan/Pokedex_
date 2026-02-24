import React, { ReactNode, useMemo, useEffect, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useQuery } from '@tanstack/react-query';
import {
  usePokemonStore,
  isCyberpunkAccent,
  PokemonState,
  useTeamPokemon,
  useComparisonPokemon,
} from '../store/usePokemonStore';
import type { Action } from '../store/usePokemonStore';
import { usePokemonStoreEffects } from '../hooks/usePokemonStoreEffects';
import { AccentColor } from '../constants';
import type { PokemonListItem } from '../types';
import { fetchAllPokemons } from '../services/pokeapiService';
import { getFavorites } from '../utils/favorites';

const usePokemonQuerySync = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['pokemonList'],
    queryFn: ({ signal }) => fetchAllPokemons(signal),
    staleTime: 24 * 60 * 60 * 1000,
  });

  useEffect(() => {
    usePokemonStore.getState().setLoading(isLoading);
  }, [isLoading]);

  useEffect(() => {
    usePokemonStore.getState().setError(error ? 'Failed to fetch Pokemon data.' : null);
  }, [error]);

  useEffect(() => {
    if (data) {
      usePokemonStore.getState().setMasterPokemonList(data);
    }
  }, [data]);

  const reload = useCallback(async () => {
    await refetch();
    usePokemonStore.getState().setFavorites(getFavorites());
  }, [refetch]);

  useEffect(() => {
    usePokemonStore.getState().setReload(reload);
  }, [reload]);

  useEffect(() => {
    const storedFavorites = getFavorites();
    if (storedFavorites.size > 0) {
      usePokemonStore.getState().setFavorites(storedFavorites);
    }
  }, []);
};

export type { Action };
export { isCyberpunkAccent };

export interface PokemonDispatchContextType {
  reload: () => Promise<void>;
  undo: () => void;
  redo: () => void;
}

export interface PokemonUIContextType {
  theme: 'dark' | 'light';
  accent: AccentColor;
  isShiny: boolean;
  isCyberpunk: boolean;
}

export interface PokemonDataContextType extends Omit<PokemonState, 'theme' | 'accent' | 'isShiny'> {
  /** Resolved team objects from masterPokemonList (derived from team ID array). */
  teamPokemon: PokemonListItem[];
  /** Resolved comparison objects from masterPokemonList (derived from comparisonList ID array). */
  comparisonPokemon: PokemonListItem[];
  canUndo: boolean;
  canRedo: boolean;
}

export interface PokemonContextType
  extends PokemonDataContextType, PokemonUIContextType, PokemonDispatchContextType {}

export const PokemonProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  usePokemonQuerySync();
  usePokemonStoreEffects();
  return <>{children}</>;
};

export const usePokemonDispatch = (): PokemonDispatchContextType => {
  const reload = usePokemonStore((state) => state.reload);
  const undo = usePokemonStore((state) => state.undo);
  const redo = usePokemonStore((state) => state.redo);

  return useMemo(() => ({ reload, undo, redo }), [reload, undo, redo]);
};

export const usePokemonUI = (): PokemonUIContextType => {
  return usePokemonStore(
    useShallow((state) => ({
      theme: state.theme,
      accent: state.accent,
      isShiny: state.isShiny,
      isCyberpunk: isCyberpunkAccent(state.accent),
    }))
  );
};

export const usePokemonData = (): PokemonDataContextType => {
  const storeSlice = usePokemonStore(
    useShallow((state) => ({
      masterPokemonList: state.masterPokemonList,
      loading: state.loading,
      error: state.error,
      searchTerm: state.searchTerm,
      selectedGeneration: state.selectedGeneration,
      selectedTypes: state.selectedTypes,
      flavorTextSearch: state.flavorTextSearch,
      minStats: state.minStats,
      selectedAbility: state.selectedAbility,
      isMonoType: state.isMonoType,
      minBST: state.minBST,
      team: state.team,
      favorites: state.favorites,
      history: state.history,
      future: state.future,
      comparisonList: state.comparisonList,
      sortBy: state.sortBy,
      sortOrder: state.sortOrder,
      filteredPokemon: state.filteredPokemon,
      isFiltering: state.isFiltering,
      canUndo: state.history.length > 0,
      canRedo: state.future.length > 0,
      // Consolidated persistence fields
      achievements: state.achievements,
      gameStats: state.gameStats,
      savedTeams: state.savedTeams,
    }))
  );

  // Resolve ID arrays → full objects for downstream consumers.
  const teamPokemon = useTeamPokemon();
  const comparisonPokemon = useComparisonPokemon();

  return useMemo(
    () => ({ ...storeSlice, teamPokemon, comparisonPokemon }),
    [storeSlice, teamPokemon, comparisonPokemon]
  );
};

export const usePokemon = (): PokemonContextType => {
  const dispatchContext = usePokemonDispatch();
  const uiContext = usePokemonUI();
  const dataContext = usePokemonData();

  return useMemo(
    () => ({
      ...dispatchContext,
      ...uiContext,
      ...dataContext,
    }),
    [dispatchContext, uiContext, dataContext]
  );
};

export { filterPokemonList } from './pokemonStateHelpers';
