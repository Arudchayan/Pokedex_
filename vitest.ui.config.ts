/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    name: 'ui',
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: false,
    include: ['**/*.test.{ts,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/dist-ssr/**',
      '**/test-results/**',
      '**/.codex_tmp/**',
      // Service-layer tests must run against the real implementation (no global mock).
      'services/pokeapiService*.test.ts',
    ],
  },
});
