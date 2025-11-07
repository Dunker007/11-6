import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
      build: {
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
          external: [
            'systeminformation',
            'simple-git',
            'node:buffer',
            'node:path',
            'node:events',
            'child_process',
            'fs',
          ], // Don't bundle Node.js-only modules
          output: {
            manualChunks: {
              'react-vendor': ['react', 'react-dom'],
              'monaco-vendor': ['@monaco-editor/react', 'monaco-editor'],
              'ai-vendor': ['@google/generative-ai'],
            },
          },
        },
        chunkSizeWarningLimit: 1000,
        minify: 'esbuild',
        target: 'esnext',
      },
      optimizeDeps: {
        exclude: ['systeminformation', 'simple-git'], // Don't pre-bundle Node.js-only modules
        include: ['react', 'react-dom', '@monaco-editor/react'],
      },
  base: './',
});
