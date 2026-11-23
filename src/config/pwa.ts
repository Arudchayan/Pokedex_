import type { ManifestOptions, VitePWAOptions } from 'vite-plugin-pwa';
import { APP_SHELL_NAVIGATION_ALLOWLIST } from './routing';

/**
 * Web app manifest for the installed PWA.
 *
 * The app is dark-first (`#0f172a`), so the splash and theme colours use that
 * same slate instead of the browser's white default. The shipped icons are
 * full-bleed artwork without the maskable safe zone, so they are declared as
 * `any` rather than `maskable` to avoid cropping the Poké Ball.
 */
export const pwaManifest = {
  name: 'Pokedex',
  short_name: 'Pokedex',
  description: 'Explore every Pokémon with instant search, teams, type calculators, and more.',
  theme_color: '#0f172a',
  background_color: '#0f172a',
  icons: [
    {
      src: 'pwa-192x192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: 'pwa-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any',
    },
  ],
} satisfies Partial<ManifestOptions>;

/**
 * Only the declared app routes may fall back to the cached app shell. Unknown
 * paths go to the network so Vercel can return its 404 instead of a soft-200
 * home screen.
 */
export const pwaWorkbox = {
  navigateFallbackAllowlist: APP_SHELL_NAVIGATION_ALLOWLIST,
  runtimeCaching: [
    {
      // Pokemon walkers sprite pack (GitHub raw). Cache for smoother playback.
      urlPattern: ({ url }: { url: URL }) =>
        url.origin === 'https://raw.githubusercontent.com' &&
        url.pathname.includes('/media/') &&
        url.pathname.endsWith('_8fps.gif'),
      handler: 'CacheFirst',
      options: {
        cacheName: 'walkers-sprites',
        cacheableResponse: { statuses: [0, 200] },
        expiration: {
          maxEntries: 250,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
      },
    },
    {
      // Core PokeAPI sprites (pokemon + items) for repeat visits / offline polish.
      urlPattern: ({ url }: { url: URL }) =>
        url.origin === 'https://raw.githubusercontent.com' &&
        url.pathname.includes('/PokeAPI/sprites/'),
      handler: 'CacheFirst',
      options: {
        cacheName: 'pokeapi-sprites',
        cacheableResponse: { statuses: [0, 200] },
        expiration: {
          maxEntries: 800,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
      },
    },
  ],
} satisfies VitePWAOptions['workbox'];
