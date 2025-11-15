/// <reference types="vitest" />
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
      // Polyfill Node.js modules for browser build
      'fs': path.resolve(__dirname, './src/utils/polyfills/fs.ts'),
      'path': path.resolve(__dirname, './src/utils/polyfills/path.ts'),
      'systeminformation': path.resolve(__dirname, './src/utils/polyfills/systeminformation.ts'),
      '@lancedb/lancedb': path.resolve(__dirname, './src/utils/polyfills/lancedb.ts'),
    },
  },
  server: {
    port: 4173,
    strictPort: true,
    hmr: {
      overlay: true,
      clientPort: 4173,
    },
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store',
    },
  },
      build: {
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
          output: {
            manualChunks: (id) => {
              // Monaco Editor (large dependency - ~2MB)
              if (id.includes('node_modules/monaco-editor') || id.includes('node_modules/@monaco-editor')) {
                return 'monaco-vendor';
              }
              // Lucide icons (moderate size)
              if (id.includes('node_modules/lucide-react')) {
                return 'icons-vendor';
              }
              // React and React DOM (core framework)
              if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
                return 'react-vendor';
              }
              // Zustand (state management)
              if (id.includes('node_modules/zustand')) {
                return 'zustand-vendor';
              }
              // Google AI SDK (large)
              if (id.includes('node_modules/@google/generative-ai')) {
                return 'google-ai-vendor';
              }
              // Transformers.js (large ML library)
              if (id.includes('node_modules/@xenova/transformers')) {
                return 'transformers-vendor';
              }
              // LanceDB (large database library)
              if (id.includes('node_modules/@lancedb')) {
                return 'lancedb-vendor';
              }
              // Octokit (GitHub API)
              if (id.includes('node_modules/@octokit')) {
                return 'github-vendor';
              }
              // React Grid Layout
              if (id.includes('node_modules/react-grid-layout')) {
                return 'grid-layout-vendor';
              }
              // React Markdown
              if (id.includes('node_modules/react-markdown')) {
                return 'markdown-vendor';
              }
              // All other node_modules
              if (id.includes('node_modules')) {
                return 'vendor';
              }
              // Split large service files
              if (id.includes('/services/ai/router')) {
                return 'router-service';
              }
              if (id.includes('/services/ai/providers')) {
                return 'providers-service';
              }
              if (id.includes('/components/VibeEditor')) {
                return 'vibe-editor';
              }
              if (id.includes('/components/LLMOptimizer')) {
                return 'llm-optimizer';
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
        exclude: [
          'systeminformation',
          'simple-git',
          '@lancedb/lancedb',
          '@lancedb/lancedb-win32-x64-msvc',
        ], // Don't pre-bundle Node.js-only modules and native bindings
        include: ['react', 'react-dom', '@monaco-editor/react'],
      },
  base: './',
});
