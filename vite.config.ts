import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { pwaManifest, pwaWorkbox } from './src/config/pwa';

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
            query: [
              '@tanstack/react-query',
              '@tanstack/react-query-devtools',
              '@tanstack/react-virtual',
            ],
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
        includeAssets: ['favicon.ico', 'favicon.png', 'apple-touch-icon.png', 'mask-icon.svg'],
        workbox: pwaWorkbox,
        manifest: pwaManifest,
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
  };
});
