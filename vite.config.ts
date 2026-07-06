import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  // Relative base so the build works under any GitHub Pages project subpath
  // (e.g. https://<user>.github.io/<repo>/) without hardcoding the repo name.
  base: './',
  plugins: [react(), tailwindcss()],
});
