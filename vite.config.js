import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import path from 'node:path';
import { copyFileSync } from 'node:fs';

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        entry: 'main.js',
      },
      {
        entry: 'preload.js',
        onstart(options) {
          options.reload();
        },
      },
    ]),
    renderer(),
    {
      name: 'copy-pdf-worker',
      writeBundle() {
        // Copy PDF.js worker to dist folder
        copyFileSync(
          path.join(__dirname, 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs'),
          path.join(__dirname, 'dist/pdf.worker.min.mjs')
        );
      }
    }
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});