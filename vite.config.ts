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
      rolldownOptions: {
        output: {
          // Vite 8 (Rolldown) replaces the object form of `manualChunks` with groups.
          codeSplitting: {
            groups: [
              { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
              { name: 'query', test: /node_modules[\\/]@tanstack[\\/]/ },
              { name: 'dnd', test: /node_modules[\\/]@dnd-kit[\\/]/ },
              { name: 'state', test: /node_modules[\\/]zustand[\\/]/ },
              { name: 'storage', test: /node_modules[\\/](idb-keyval|lz-string)[\\/]/ },
            ],
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
