import type { ManifestOptions } from 'vite-plugin-pwa';

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
