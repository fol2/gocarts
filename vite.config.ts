import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined;
          }

          if (id.includes('@react-three')) {
            return 'react-three';
          }

          if (id.includes('three')) {
            return 'three';
          }

          if (id.includes('react') || id.includes('scheduler')) {
            return 'react';
          }

          return 'vendor';
        }
      }
    }
  },
  test: {
    environment: 'node',
    globals: true
  }
});
