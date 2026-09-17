import { defineConfig } from 'vite';

export default defineConfig({
  // Relativne putanje - build radi na bilo kojem hostu, i u podfolderu,
  // i otvoren direktno kao file://
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
