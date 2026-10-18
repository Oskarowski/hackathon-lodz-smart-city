import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import dcPlugin from './vite/dc-plugin.ts';

export default defineConfig({
  // Relative base + hash routing: the build works from any host or sub-path.
  base: './',
  build: { chunkSizeWarningLimit: 1000 },
  plugins: [
    dcPlugin(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Moje Osiedle',
        short_name: 'Moje Osiedle',
        description: 'Sprawy osiedla w aplikacji miejskiej: budżet obywatelski, zgłoszenia, tablica, zajęcia i pomoc sąsiedzka.',
        lang: 'pl',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#F5F7FA',
        theme_color: '#1D5FA8',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
    }),
  ],
});
