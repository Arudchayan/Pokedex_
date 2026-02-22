/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    // Vitest v4 projects: split UI tests (global pokeapiService mock) from
    // service-layer tests (real pokeapiService implementation).
    projects: ['./vitest.ui.config.ts', './vitest.services.config.ts'],
  },
});
