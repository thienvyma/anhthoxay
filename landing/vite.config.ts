/// <reference types='vitest' />
import { defineConfig, loadEnv } from 'vite';
import path from 'path';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';

// Production API URL - hardcoded for reliable builds
const PRODUCTION_API_URL = 'https://ntn-api-qzy5vvmc6q-as.a.run.app';

export default defineConfig(({ mode }) => {
  // Load env from workspace root
  const env = loadEnv(mode, path.resolve(__dirname, '..'), '');
  
  // In production mode, always use production API URL
  // In development, use env var or fallback to localhost
  const isProduction = mode === 'production';
  const apiUrl = isProduction 
    ? PRODUCTION_API_URL 
    : (process.env.VITE_API_URL || env.VITE_API_URL || 'http://localhost:4202');
  const portalUrl = process.env.VITE_PORTAL_URL || env.VITE_PORTAL_URL || 'http://localhost:4203';
  
  // eslint-disable-next-line no-console
  console.log(`[Vite] Building ${mode} with VITE_API_URL=${apiUrl}`);
  
  return {
    root: __dirname,
    cacheDir: '../node_modules/.vite/landing',
    // Load .env from workspace root
    envDir: path.resolve(__dirname, '..'),
    // Define env vars for build-time replacement in all modules including packages
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(apiUrl),
      'import.meta.env.VITE_PORTAL_URL': JSON.stringify(portalUrl),
    },
    server: {
    port: 4200,
    host: 'localhost',
    strictPort: true,
    // Allow external tunnel domains for testing
    allowedHosts: ['.ngrok-free.app', '.ngrok.io', '.trycloudflare.com'],
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
  };
});
