/// <reference types="vitest" />
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    name: 'services',
    globals: true,
    // Keep jsdom so localStorage + window.* are available like the original tests expect.
    environment: 'jsdom',
    setupFiles: './src/test/setup.services.ts',
    css: false,
    include: ['services/pokeapiService*.test.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/dist-ssr/**',
      '**/test-results/**',
      '**/.codex_tmp/**',
    ],
  },
});
