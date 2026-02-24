import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      build: {
        // Keep the main entry chunk smaller for better caching and to avoid "single giant bundle" warnings.
        rollupOptions: {
          output: {
            manualChunks: {
              react: ['react', 'react-dom'],
              query: ['@tanstack/react-query', '@tanstack/react-query-devtools', '@tanstack/react-virtual'],
              dnd: ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
              state: ['zustand'],
              storage: ['idb-keyval', 'lz-string'],
            },
          },
        },
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'prompt',
          includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
          workbox: {
            runtimeCaching: [
              {
                // Pokemon walkers sprite pack (GitHub raw). Cache for smoother playback.
                urlPattern: ({ url }) =>
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
            ],
          },
          manifest: {
            name: 'GraphQL Pokedex',
            short_name: 'Pokedex',
            description: 'An ultra-fast Pokedex built with React and Vite',
            theme_color: '#ffffff',
            icons: [
              {
                src: 'pwa-192x192.png',
                sizes: '192x192',
                type: 'image/png'
              },
              {
                src: 'pwa-512x512.png',
                sizes: '512x512',
                type: 'image/png'
              }
            ]
          }
        })
      ],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, 'src'),
        }
      }
    };
});
