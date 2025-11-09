import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { readFileSync } from 'fs';
import { execSync } from 'child_process';

// Read package.json for version
const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));
const appVersion = packageJson.version;

// Get git info (if available)
let gitCommit: string | undefined;
let gitBranch: string | undefined;
try {
  gitCommit = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
  gitBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
} catch {
  // Git not available or not a git repo
  gitCommit = undefined;
  gitBranch = undefined;
}

const buildDate = new Date().toISOString();

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
    __BUILD_DATE__: JSON.stringify(buildDate),
    __GIT_COMMIT__: JSON.stringify(gitCommit),
    __GIT_BRANCH__: JSON.stringify(gitBranch),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5174,
    strictPort: true,
  },
      build: {
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
          external: [
            'systeminformation',
            'simple-git',
            'chokidar',
            'fs/promises',
            'path',
            'node:buffer',
            'node:path',
            'node:events',
            'child_process',
            'fs',
          ], // Don't bundle Node.js-only modules
          output: {
            manualChunks: (id) => {
              // Monaco Editor (large dependency)
              if (id.includes('node_modules/monaco-editor') || id.includes('node_modules/@monaco-editor')) {
                return 'monaco-vendor';
              }
              // Lucide icons
              if (id.includes('node_modules/lucide-react')) {
                return 'icons-vendor';
              }
              // All other node_modules INCLUDING React - keep React in vendor for proper loading
              if (id.includes('node_modules')) {
                return 'vendor';
              }
            },
          },
        },
        chunkSizeWarningLimit: 1000,
        minify: 'esbuild',
        cssMinify: true,
        target: 'esnext',
        sourcemap: false, // Disable source maps in production for smaller bundle
        reportCompressedSize: false, // Faster builds
      },
      optimizeDeps: {
        exclude: ['systeminformation', 'simple-git'], // Don't pre-bundle Node.js-only modules
        include: ['react', 'react-dom', '@monaco-editor/react'],
      },
  base: './',
});
