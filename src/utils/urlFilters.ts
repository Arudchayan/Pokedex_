import { isPokedexId, type PokedexId } from '../config/pokedex';

export interface UrlFilters {
  search?: string;
  dex?: PokedexId;
}

/** Keep a URL-provided search term within the same order of magnitude as the UI input. */
const MAX_URL_SEARCH_LENGTH = 200;

/**
 * Read the filter state supported on a cold entry URL.
 * Missing or invalid values are ignored, so persisted defaults stay in place.
 */
export function parseUrlFilters(search: string): UrlFilters {
  const params = new URLSearchParams(search);
  const filters: UrlFilters = {};

  const searchTerm = params.get('search')?.trim();
  if (searchTerm) {
    filters.search = searchTerm.slice(0, MAX_URL_SEARCH_LENGTH);
  }

  const dex = params.get('dex')?.trim().toLowerCase();
  if (dex && isPokedexId(dex)) {
    filters.dex = dex;
  }

  return filters;
}
