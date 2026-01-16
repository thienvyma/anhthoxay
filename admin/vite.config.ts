/// <reference types='vitest' />
import { defineConfig, loadEnv } from 'vite';
import path from 'path';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';

// Production API URL - hardcoded for reliable builds
const PRODUCTION_API_URL = 'https://ntn-api-gsfn3zbloa-as.a.run.app';

export default defineConfig(({ mode }) => {
  // Load env from workspace root
  const env = loadEnv(mode, path.resolve(__dirname, '..'), '');

  // In production mode, always use production API URL
  // In development, use env var or fallback to localhost
  const isProduction = mode === 'production';
  const apiUrl = isProduction
    ? PRODUCTION_API_URL
    : (process.env.VITE_API_URL || env.VITE_API_URL || 'http://localhost:4202');
  const portalUrl =
    process.env.VITE_PORTAL_URL ||
    env.VITE_PORTAL_URL ||
    'http://localhost:4203';

  // eslint-disable-next-line no-console -- Build-time debug info
  console.log(`[Vite] Building admin ${mode} with VITE_API_URL=${apiUrl}`);

  return {
    root: __dirname,
    cacheDir: '../node_modules/.vite/admin',
    // Load .env from workspace root
    envDir: path.resolve(__dirname, '..'),
    // Define env vars for build-time replacement in all modules including packages
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(apiUrl),
      'import.meta.env.VITE_PORTAL_URL': JSON.stringify(portalUrl),
    },
    server: {
      port: 4201,
      host: 'localhost',
      strictPort: true,
      // Allow external tunnel domains for testing
      allowedHosts: ['.ngrok-free.app', '.ngrok.io', '.trycloudflare.com'],
      fs: {
        allow: [
          __dirname,
          path.resolve(__dirname, '..'),
          path.resolve(__dirname, '..', '..'),
        ],
      },
    },
    preview: {
      port: 4201,
      host: 'localhost',
    },
    plugins: [react(), nxViteTsPaths(), nxCopyAssetsPlugin(['*.md'])],
    build: {
      outDir: '../dist/admin',
      emptyOutDir: true,
      reportCompressedSize: true,
      commonjsOptions: {
        transformMixedEsModules: true,
      },
    },
    test: {
      name: 'admin',
      watch: false,
      globals: true,
      environment: 'jsdom',
      include: [
        '{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      ],
      reporters: ['default'],
      coverage: {
        reportsDirectory: '../coverage/admin',
        provider: 'v8' as const,
      },
    },
  };
});
