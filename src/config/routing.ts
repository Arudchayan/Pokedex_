/**
 * Shared URL contract for the app and its hosting/PWA layers.
 *
 * App routes are deliberately limited to:
 * - `/` (optionally with query state)
 * - `/pokemon/:id` (normalized client-side to `/?pokemon=:id`)
 *
 * Everything else is not an app route and should 404 rather than render the
 * home screen under an arbitrary URL.
 *
 * The id pattern accepts leading zeros but only ids 1..1025. It is embedded in
 * the Vercel redirect source and the Workbox navigation allowlist, so keep it
 * in sync with `MAX_POKEMON_ID`.
 */
export const POKEMON_ID_PATTERN = '0*[1-9][0-9]{0,2}|0*10[01][0-9]|0*102[0-5]';

export const POKEMON_DETAIL_PATH_PATTERN = `/pokemon/(?:${POKEMON_ID_PATTERN})/?`;

/** Workbox matches the navigation allowlist against `pathname + search`. */
export const APP_SHELL_NAVIGATION_ALLOWLIST: RegExp[] = [
  /^\/(?:\?.*)?$/,
  new RegExp(`^${POKEMON_DETAIL_PATH_PATTERN}(?:\\?.*)?$`),
];
