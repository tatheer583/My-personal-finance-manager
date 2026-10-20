import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';
import { existsSync, copyFileSync } from 'node:fs';
import path from 'node:path';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

/**
 * GitHub Pages serves the site from a sub-path (`/<repo>/`), while local dev
 * and most other hosts serve from the root. Derive the base path from the
 * CI environment so a single config works everywhere.
 */
const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1];
const base = repoName ? `/${repoName}/` : '/';

/**
 * Copies `index.html` to `404.html` after the build.
 *
 * GitHub Pages has no SPA rewrite support, so any deep link (e.g. /transactions)
 * would 404. Serving the same document under 404.html lets the client-side
 * router hydrate and render the correct route instead.
 */
function spaFallbackPlugin(): Plugin {
  return {
    name: 'spa-fallback',
    apply: 'build',
    closeBundle() {
      const outDir = path.resolve(rootDir, 'dist');
      const indexPath = path.join(outDir, 'index.html');
      if (existsSync(indexPath)) {
        copyFileSync(indexPath, path.join(outDir, '404.html'));
      }
    },
  };
}

export default defineConfig({
  base,
  plugins: [react(), tailwindcss(), spaFallbackPlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
  preview: {
    port: 4173,
  },
  build: {
    target: 'es2022',
    sourcemap: false,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/node_modules[\\/](recharts|d3-|victory-|internmap|delaunator|robust-predicates)/.test(id)) {
            return 'vendor-charts';
          }
          if (/node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler|@remix-run)/.test(id)) {
            return 'vendor-react';
          }
          return undefined;
        },
      },
    },
  },
});
