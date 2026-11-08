import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  root: 'src/renderer',
  base: './',
  build: {
    outDir: mode === 'mobile' ? '../../dist/mobile' : '../../dist/renderer',
    emptyOutDir: true,
    sourcemap: mode !== 'mobile',
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@renderer': path.resolve(__dirname, 'src/renderer'),
    },
  },
  server: {
    port: 5173,
    strictPort: false,
  },
}));
