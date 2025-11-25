import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      // Use source files directly for development - enables hot reload
      '@kerdar/core': path.resolve(__dirname, '../../packages/core/src/index.ts'),
      '@kerdar/nodes-standard': path.resolve(__dirname, '../../packages/nodes-standard/src/index.ts'),
    },
  },
  optimizeDeps: {
    // Exclude local packages from pre-bundling
    exclude: ['@kerdar/core', '@kerdar/nodes-standard'],
  },
});
