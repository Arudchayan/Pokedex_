import { MAX_POKEMON_ID } from '../constants';
import { POKEMON_ID_PATTERN } from '../config/routing';

export interface UrlParts {
  pathname: string;
  search: string;
  hash: string;
}

/** Query marker used by the Vercel redirect so the path id can win over `?pokemon=`. */
export const POKEMON_PATH_MARKER_PARAM = 'pokemonPath';

const POKEMON_DETAIL_PATH = new RegExp(`^/pokemon/(${POKEMON_ID_PATTERN})/?$`);

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

  // `set` replaces a conflicting `?pokemon=` value, and the internal redirect
  // marker must never survive a real path link (`/pokemon/25?pokemonPath=6`).
  const params = new URLSearchParams(search);
  params.delete(POKEMON_PATH_MARKER_PARAM);
  params.set('pokemon', String(id));

  return `/?${params.toString()}${hash}`;
}

/**
 * Convert the `?pokemonPath=<id>` marker emitted by the Vercel redirect into the
 * canonical `?pokemon=<id>` parameter, dropping the marker and any conflicting
 * `?pokemon=` value. Returns `null` when the marker is absent.
 */
export function consumePokemonPathMarker({ pathname, search, hash }: UrlParts): string | null {
  const params = new URLSearchParams(search);
  const markers = params.getAll(POKEMON_PATH_MARKER_PARAM);
  if (markers.length === 0) return null;

  // The redirect destination is appended after the request query, so the last
  // value is the trusted path id.
  const id = parsePokemonId(markers[markers.length - 1]);
  params.delete(POKEMON_PATH_MARKER_PARAM);

  if (id != null) {
    params.set('pokemon', String(id));
  }

  const query = params.toString();
  return `${pathname}${query ? `?${query}` : ''}${hash}`;
}

/**
 * Normalize a `/pokemon/:id` entry URL (or a Vercel `?pokemonPath=` redirect)
 * before React reads the query string. Vercel redirects cold requests; this
 * covers dev, preview, and service-worker navigations, and is a no-op for every
 * other path.
 */
export function normalizePokemonPathInLocation(): void {
  const normalized =
    normalizePokemonPath(window.location) ?? consumePokemonPathMarker(window.location);
  if (normalized == null) return;
  window.history.replaceState(window.history.state, '', normalized);
}
