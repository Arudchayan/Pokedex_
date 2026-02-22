import { PokemonListItem } from '../types';
import { applyFilters, applySort, PokemonFilterOptions } from '../domain/pokemonList';
import { SortOption } from '../types/sorting';

interface WorkerRequest {
  pokemonList?: PokemonListItem[]; // Optional - will use cache if undefined
  options: PokemonFilterOptions;
  sortBy: SortOption;
  sortOrder: 'asc' | 'desc';
  favorites?: number[]; // Optional - will use cache if undefined
  requestId: number;
}

interface WorkerResponse {
  filteredIds: number[];
  requestId: number;
}

let cachedPokemonList: PokemonListItem[] = [];
let cachedFavorites: Set<number> = new Set();

self.addEventListener('message', (event: MessageEvent<unknown>) => {
  const request = sanitizeWorkerRequest(event.data);
  if (!request) return;

  const { pokemonList, options, sortBy, sortOrder, favorites, requestId } = request;

  try {
    // Update cache if new list provided
    if (pokemonList) {
      cachedPokemonList = pokemonList;
    }

    // Update favorites cache if provided
    if (favorites !== undefined) {
      cachedFavorites = new Set(favorites);
    }

    // Use cached list or fallback to empty array if no cache yet
    const listToFilter = cachedPokemonList;

    const filtered = applyFilters(listToFilter, options);
    const sorted = applySort(filtered, sortBy, sortOrder, cachedFavorites);

    // Optimization: Return only IDs to reduce transfer overhead (objects can be large)
    // The main thread will map these IDs back to the full objects using a Map.
    const filteredIds = sorted.map((p) => p.id);

    const response: WorkerResponse = { filteredIds, requestId };
    self.postMessage(response);
  } catch {
    const response: WorkerResponse = { filteredIds: [], requestId };
    self.postMessage(response);
  }
});

self.addEventListener('messageerror', () => {
  // Ignore malformed/cloned payload errors from hostile or corrupted callers.
});

self.addEventListener('error', () => {
  // Keep worker resilient; the main thread already has non-worker fallback.
});

function sanitizeWorkerRequest(data: unknown): WorkerRequest | null {
  if (!data || typeof data !== 'object') return null;
  const candidate = data as Partial<WorkerRequest>;

  if (!Number.isInteger(candidate.requestId)) return null;
  if (candidate.sortOrder !== 'asc' && candidate.sortOrder !== 'desc') return null;
  if (!candidate.options || typeof candidate.options !== 'object') return null;
  if (!candidate.sortBy || typeof candidate.sortBy !== 'string') return null;

  let safeList: PokemonListItem[] | undefined;
  if (candidate.pokemonList !== undefined) {
    if (!Array.isArray(candidate.pokemonList) || candidate.pokemonList.length > 6000) return null;
    safeList = candidate.pokemonList;
  }

  let safeFavorites: number[] | undefined;
  if (candidate.favorites !== undefined) {
    if (!Array.isArray(candidate.favorites) || candidate.favorites.length > 10000) return null;
    safeFavorites = candidate.favorites.filter((f) => Number.isInteger(f));
  }

  return {
    pokemonList: safeList,
    options: candidate.options as PokemonFilterOptions,
    sortBy: candidate.sortBy as SortOption,
    sortOrder: candidate.sortOrder,
    favorites: safeFavorites,
    requestId: candidate.requestId,
  };
}
