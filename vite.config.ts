import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// Mehrseitiger Build: Portfolio und Design-System bleiben statisch, das Spiel liegt unter /spiel/
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        design: resolve(__dirname, 'design-system.html'),
        spiel: resolve(__dirname, 'spiel/index.html'),
      },
    },
  },
});
