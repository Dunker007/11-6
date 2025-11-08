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
            manualChunks: (id) => {
              // Core React libraries
              if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
                return 'react-vendor';
              }
              // Monaco Editor (large dependency)
              if (id.includes('node_modules/monaco-editor') || id.includes('node_modules/@monaco-editor')) {
                return 'monaco-vendor';
              }
              // Markdown renderer
              if (id.includes('node_modules/react-markdown')) {
                return 'markdown-vendor';
              }
              // AI/LLM libraries
              if (id.includes('node_modules/@google/generative-ai')) {
                return 'ai-vendor';
              }
              // Lucide icons
              if (id.includes('node_modules/lucide-react')) {
                return 'icons-vendor';
              }
              // Zustand state management
              if (id.includes('node_modules/zustand')) {
                return 'state-vendor';
              }
              // Other node_modules
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
