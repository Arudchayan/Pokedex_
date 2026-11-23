import React, { ReactNode, useMemo, useEffect, useCallback, useRef } from 'react';
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
import type { PokemonListItem, TeamMember } from '../types';
import { fetchAllPokemons } from '../services/pokeapiService';
import { getFavorites } from '../utils/favorites';

const usePokemonQuerySync = () => {
  const retryingRef = useRef(false);
  const mountedRef = useRef(true);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['pokemonList'],
    queryFn: ({ signal }) => fetchAllPokemons(signal),
    staleTime: 24 * 60 * 60 * 1000,
    // fetchAllPokemons already performs the bounded 3-attempt cycle with backoff.
    // React Query must not add another retry chain on top of it, and a terminal
    // error must not silently restart via focus/reconnect/remount.
    retry: false,
    retryOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  useEffect(() => {
    mountedRef.current = true;
    usePokemonStore.getState().setRetrying(false);
    return () => {
      mountedRef.current = false;
      retryingRef.current = false;
      usePokemonStore.getState().setRetrying(false);
    };
  }, []);

  useEffect(() => {
    // A manual retry keeps the previous error on screen; only the first load shows skeletons.
    usePokemonStore.getState().setLoading(isLoading && !retryingRef.current);
  }, [isLoading]);

  useEffect(() => {
    if (error) {
      usePokemonStore.getState().setError('Failed to fetch Pokemon data.');
    }
  }, [error]);

  useEffect(() => {
    if (!data) return;
    const store = usePokemonStore.getState();
    store.setMasterPokemonList(data);
    store.setError(null);
  }, [data]);

  const reload = useCallback(async () => {
    // One bounded cycle at a time, including synchronous double-clicks.
    if (retryingRef.current) return;
    retryingRef.current = true;
    usePokemonStore.getState().setRetrying(true);

    try {
      await refetch({ cancelRefetch: false });
    } catch {
      // The query error state drives the durable error UI; never leak a rejection.
    } finally {
      retryingRef.current = false;
      if (mountedRef.current) {
        usePokemonStore.getState().setRetrying(false);
      }
    }
  }, [refetch]);

  useEffect(() => {
    usePokemonStore.getState().setReload(reload);
  }, [reload]);

  useEffect(() => {
    // One-time legacy migration: only seed from pokedex_favorites when Zustand has none.
    const current = usePokemonStore.getState().favorites;
    if (current.size > 0) return;
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
  /**
   * One entry per persisted team ID. Unresolved IDs are labelled placeholders
   * (`detailsUnavailable`), so membership/counts never depend on species data.
   */
  teamPokemon: TeamMember[];
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
      isRetrying: state.isRetrying,
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
      teamCustomizations: state.teamCustomizations,
      favorites: state.favorites,
      history: state.history,
      future: state.future,
      comparisonList: state.comparisonList,
      sortBy: state.sortBy,
      sortOrder: state.sortOrder,
      selectedPokedex: state.selectedPokedex,
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
