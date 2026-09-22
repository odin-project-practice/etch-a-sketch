import { defineConfig } from 'vite';

export default defineConfig({
  // Relative asset URLs also work when served from a GitHub Pages subdirectory.
  base: './',
  server: {
    host: '0.0.0.0',
    allowedHosts: ['terminal.local'],
  },
});
