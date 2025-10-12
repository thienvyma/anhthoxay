/// <reference types='vitest' />
import { defineConfig } from 'vite';
import path from 'path';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../node_modules/.vite/landing',
  server: {
    port: 4200,
    host: 'localhost',
    strictPort: true,
    fs: {
      // Fix Vite 403 fs-allow by explicitly allowing project dir
      allow: [__dirname, path.resolve(__dirname, '..'), path.resolve(__dirname, '..', '..')],
    },
    // Enable historyApiFallback for BrowserRouter (SPA routing)
    proxy: {},
  },
  preview: {
    port: 4200,
    host: 'localhost',
    // Enable historyApiFallback for BrowserRouter in preview mode
    proxy: {},
  },
  plugins: [react(), nxViteTsPaths(), nxCopyAssetsPlugin(['*.md'])],
  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [ nxViteTsPaths() ],
  // },
  build: {
    outDir: '../dist/landing',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  test: {
    name: 'landing',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../coverage/landing',
      provider: 'v8' as const,
    },
  },
}));
