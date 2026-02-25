import { useEffect, useRef } from 'react';
import { usePokemonStore, isCyberpunkAccent } from '../store/usePokemonStore';
import { ACCENT_COLORS, AccentColor, UI_CONSTANTS } from '../constants';
import { fetchRegionalDexMap } from '../services/pokeapiService';
import { applyFilters, applySort } from '../domain/pokemonList';
import { decompressTeam } from '../utils/urlCompression';
import { PokemonListItem } from '../types';
import { MAX_COMPRESSED_LENGTH } from '../utils/securityUtils';

export const usePokemonStoreEffects = () => {
  const store = usePokemonStore;
  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);
  const lastSyncedListRef = useRef<PokemonListItem[] | null>(null);
  const lastSyncedFavoritesRef = useRef<Set<number> | null | undefined>(undefined);
  const masterListMapRef = useRef<Map<number, PokemonListItem>>(new Map());
  const supportsWorker = typeof window !== 'undefined' && typeof Worker !== 'undefined';

  // 1. Initial Data Fetch & Worker Setup
  useEffect(() => {
    if (supportsWorker) {
      const worker = new Worker(new URL('../workers/pokemonFilterWorker.ts', import.meta.url), {
        type: 'module',
      });
      workerRef.current = worker;
      lastSyncedListRef.current = null; // Reset cache tracking
      lastSyncedFavoritesRef.current = undefined; // Reset favorites tracking

      worker.onmessage = (event) => {
        if (event.data.requestId !== requestIdRef.current) return;

        // Optimization: Receive IDs and map to objects
        // This drastically reduces data transfer from worker to main thread
        const filteredIds: number[] = event.data.filteredIds;

        if (filteredIds) {
          const filtered = filteredIds
            .map((id) => masterListMapRef.current.get(id))
            .filter((p): p is PokemonListItem => p !== undefined);
          store.getState().setFilteredPokemon(filtered);
        } else if (event.data.filtered) {
          // Fallback (should not be hit with updated worker, but good for safety)
          store.getState().setFilteredPokemon(event.data.filtered);
        }

        store.getState().setIsFiltering(false);
      };

      return () => {
        worker.terminate();
      };
    }
  }, [supportsWorker]);

  // Maintain O(1) Lookup Map for Worker Response reconstruction
  useEffect(() => {
    // Initial population
    const currentList = store.getState().masterPokemonList;
    if (currentList.length > 0 && masterListMapRef.current.size === 0) {
      masterListMapRef.current = new Map(currentList.map((p) => [p.id, p]));
    }

    return store.subscribe((state, prevState) => {
      if (
        state.masterPokemonList !== prevState.masterPokemonList &&
        state.masterPokemonList.length > 0
      ) {
        masterListMapRef.current = new Map(state.masterPokemonList.map((p) => [p.id, p]));
      }
    });
  }, []);

  // 2. Hydrate Team from URL when Master List Loads
  useEffect(() => {
    // Subscribe to masterPokemonList changes
    const unsub = store.subscribe((state, prevState) => {
      if (state.masterPokemonList.length > 0 && prevState.masterPokemonList.length === 0) {
        const searchParams = new URLSearchParams(window.location.search);
        const teamParam = searchParams.get('team');
        const teamDataParam = searchParams.get('team_data');

        let newTeam: PokemonListItem[] = [];

        if (teamDataParam && teamDataParam.length <= MAX_COMPRESSED_LENGTH) {
          const urlTeam = decompressTeam(teamDataParam, state.masterPokemonList);
          if (urlTeam.length > 0) newTeam = urlTeam;
        }

        if (newTeam.length === 0 && teamParam && teamParam.length <= 120) {
          const ids = teamParam
            .split(',')
            .slice(0, UI_CONSTANTS.MAX_TEAM_SIZE)
            .map((id) => Number.parseInt(id, 10))
            .filter((id) => Number.isInteger(id) && id > 0);
          const uniqueIds = Array.from(new Set(ids));
          const urlTeam = state.masterPokemonList.filter((p) => uniqueIds.includes(p.id));
          if (urlTeam.length > 0) newTeam = urlTeam;
        }

        if (newTeam.length > 0) {
          store.getState().setTeam(newTeam);
        }
      }
    });
    return unsub;
  }, []);

  // 3. Sync Theme/Accent to DOM
  useEffect(() => {
    const updateDOM = (theme: 'dark' | 'light', accent: AccentColor) => {
      localStorage.setItem('theme', theme);

      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      localStorage.setItem('accent', accent);
      const colors = ACCENT_COLORS[accent];
      if (colors) {
        document.documentElement.style.setProperty('--color-primary-300', colors[300]);
        document.documentElement.style.setProperty('--color-primary-400', colors[400]);
        document.documentElement.style.setProperty('--color-primary-500', colors[500]);
        document.documentElement.style.setProperty('--color-primary-600', colors[600]);
      }

      if (isCyberpunkAccent(accent)) {
        document.documentElement.classList.add('cyberpunk');
      } else {
        document.documentElement.classList.remove('cyberpunk');
      }
    };

    // Initial run
    const { theme, accent } = store.getState();
    updateDOM(theme, accent);

    // Subscribe
    return store.subscribe((state, prevState) => {
      if (state.theme !== prevState.theme || state.accent !== prevState.accent) {
        updateDOM(state.theme, state.accent);
      }
    });
  }, []);

  // 4. Sync Team to URL
  useEffect(() => {
    return store.subscribe((state, prevState) => {
      if (state.team !== prevState.team) {
        const searchParams = new URLSearchParams(window.location.search);
        if (state.team.length > 0) {
          searchParams.set('team', state.team.join(','));
        } else {
          searchParams.delete('team');
        }
        if (searchParams.has('team_data')) {
          searchParams.delete('team_data');
        }
        const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
        window.history.replaceState(null, '', newUrl);
      }
    });
  }, []);

  // 5. Filtering Logic (Worker or Main Thread)
  useEffect(() => {
    const filterProps = [
      'masterPokemonList',
      'searchTerm',
      'selectedGeneration',
      'selectedTypes',
      'flavorTextSearch',
      'minStats',
      'selectedAbility',
      'isMonoType',
      'minBST',
      'sortBy',
      'sortOrder',
      'favorites',
      'selectedPokedex',
    ] as const;

    // Initial Filter
    const runFilter = (state: any) => {
      const {
        masterPokemonList,
        sortBy,
        sortOrder,
        favorites,
        searchTerm,
        selectedGeneration,
        selectedTypes,
        flavorTextSearch,
        minStats,
        selectedAbility,
        isMonoType,
        minBST,
        selectedPokedex,
      } = state;

      const filters = {
        searchTerm,
        selectedGeneration,
        selectedTypes,
        flavorTextSearch,
        minStats,
        selectedAbility,
        isMonoType,
        minBST,
      };

      // Optimization: relevantFavorites
      // Use null to represent "not using favorites" for stable caching comparison
      const relevantFavoritesSource = sortBy === 'favorite' ? favorites : null;

      if (supportsWorker && workerRef.current && sortBy !== 'regional-dex') {
        const requestId = requestIdRef.current + 1;
        requestIdRef.current = requestId;
        store.getState().setIsFiltering(true);

        // Check if we need to send the list (initial load or update)
        // Only send if reference changed
        const listToSend =
          masterPokemonList !== lastSyncedListRef.current ? masterPokemonList : undefined;

        if (listToSend) {
          lastSyncedListRef.current = listToSend;
        }

        // Check if we need to send favorites
        // Only send if the source Set reference changed (or switched between null/Set)
        let favoritesToSend: number[] | undefined;
        if (relevantFavoritesSource !== lastSyncedFavoritesRef.current) {
          favoritesToSend = relevantFavoritesSource ? Array.from(relevantFavoritesSource) : [];
          lastSyncedFavoritesRef.current = relevantFavoritesSource;
        }

        workerRef.current.postMessage({
          pokemonList: listToSend,
          options: filters,
          sortBy,
          sortOrder,
          favorites: favoritesToSend,
          requestId,
        });
      } else {
        const runMainThreadSort = async () => {
          const relevantFavorites = sortBy === 'favorite' ? favorites : new Set<number>();
          const filtered = applyFilters(masterPokemonList, filters);

          if (sortBy === 'regional-dex') {
            const pokedexName =
              typeof selectedPokedex === 'string' && selectedPokedex.length > 0
                ? selectedPokedex
                : 'national';
            const map = await fetchRegionalDexMap(pokedexName);
            const sorted = applySort(filtered, sortBy, sortOrder, relevantFavorites, map);
            store.getState().setFilteredPokemon(sorted);
            store.getState().setIsFiltering(false);
            return;
          }

          const sorted = applySort(filtered, sortBy, sortOrder, relevantFavorites);
          store.getState().setFilteredPokemon(sorted);
          store.getState().setIsFiltering(false);
        };

        runMainThreadSort();
      }
    };

    // Run once after the subscription is installed. In tests (and occasionally in fast networks),
    // the list can load before the subscribe callback is registered, leaving filteredPokemon empty.
    const initialState = store.getState();
    if (initialState.masterPokemonList.length > 0) {
      runFilter(initialState);
    }

    return store.subscribe((state, prevState) => {
      const hasChanged = filterProps.some((prop) => state[prop] !== prevState[prop]);

      if (hasChanged) {
        // Skip if only favorites changed but not sorting by favorites
        if (
          state.sortBy !== 'favorite' &&
          state.favorites !== prevState.favorites &&
          filterProps.every((p) => p === 'favorites' || state[p] === prevState[p])
        ) {
          return;
        }

        runFilter(state);
      }
    });
  }, [supportsWorker]);
};
