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
      external: ['systeminformation'], // Don't bundle systeminformation - it's Node.js only
    },
  },
  optimizeDeps: {
    exclude: ['systeminformation'], // Don't pre-bundle systeminformation
  },
  base: './',
});
