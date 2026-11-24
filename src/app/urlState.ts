import { DEFAULT_POKEDEX } from '../constants';
import { usePokemonStore } from '../store/usePokemonStore';
import { parseUrlFilters } from '../utils/urlFilters';

/**
 * Apply read-on-entry URL filters (`?search`, `?dex`) before the first render,
 * so the initial list and controls already reflect the shared URL.
 */
export function applyUrlFilters(search: string): void {
  const { search: searchTerm, dex } = parseUrlFilters(search);
  const store = usePokemonStore.getState();

  if (searchTerm !== undefined) {
    store.setSearchTerm(searchTerm);
  }

  if (dex !== undefined) {
    store.setPokedex(dex);
    store.setSort(dex === DEFAULT_POKEDEX ? 'id' : 'regional-dex', store.sortOrder);
  }
}
