import { MAX_POKEMON_ID } from '../constants';

export interface UrlParts {
  pathname: string;
  search: string;
  hash: string;
}

/** `/pokemon/25` and `/pokemon/25/` — nothing deeper. */
const POKEMON_DETAIL_PATH = /^\/pokemon\/(\d+)\/?$/;

/**
 * Parse a Pokemon id from a URL value.
 * Only whole numbers in the supported National Dex range are accepted.
 */
export function parsePokemonId(raw: string | null | undefined): number | null {
  if (!raw || !/^\d+$/.test(raw)) return null;
  const id = Number(raw);
  return id >= 1 && id <= MAX_POKEMON_ID ? id : null;
}

/**
 * Canonical URL for a `/pokemon/:id` entry, or `null` when the path is not a
 * valid Pokemon detail path. The result starts at `/`, so it can never match
 * this pattern again (no redirect loop).
 */
export function normalizePokemonPath({ pathname, search, hash }: UrlParts): string | null {
  const match = POKEMON_DETAIL_PATH.exec(pathname);
  if (!match) return null;

  const id = parsePokemonId(match[1]);
  if (id == null) return null;

  // `set` replaces a conflicting `?pokemon=` value, so the path id always wins.
  const params = new URLSearchParams(search);
  params.set('pokemon', String(id));

  return `/?${params.toString()}${hash}`;
}

/**
 * Normalize a `/pokemon/:id` entry URL before React reads the query string.
 * Vercel redirects cold requests; this covers dev, preview, and service-worker
 * navigations, and is a no-op for every other path.
 */
export function normalizePokemonPathInLocation(): void {
  const normalized = normalizePokemonPath(window.location);
  if (normalized == null) return;
  window.history.replaceState(window.history.state, '', normalized);
}
