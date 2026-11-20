import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'apple-touch-icon.png',
          'nekolover-touch-180.png',
          'nekolover-192x192.png',
          'nekolover-512x512.png',
          'nekolover-maskable-512x512.png',
        ],
        manifest: {
          id: '/',
          name: 'NekoLover Read',
          short_name: 'NekoLover',
          description:
            'Lector Kawaii Dark & EPUB/PDF con estanterías 3D, stickers movibles, citas literarias y ficha automática de libros.',
          theme_color: '#121019',
          background_color: '#121019',
          display: 'standalone',
          display_override: ['window-controls-overlay', 'standalone'],
          orientation: 'any',
          start_url: '/',
          scope: '/',
          lang: 'es',
          dir: 'ltr',
          prefer_related_applications: false,
          categories: ['books', 'education', 'lifestyle'],
          launch_handler: {
            client_mode: 'navigate-existing',
          },
          shortcuts: [
            {
              name: 'Mi Estantería',
              short_name: 'Biblioteca',
              description: 'Abrir tu biblioteca personal de libros',
              url: '/',
              icons: [
                {
                  src: '/nekolover-192x192.png',
                  sizes: '192x192',
                  type: 'image/png',
                },
              ],
            },
            {
              name: 'Club VIP NekoLover',
              short_name: 'Club VIP',
              description: 'Activar código VIP o gestionar membresía',
              url: '/?view=vip',
              icons: [
                {
                  src: '/nekolover-192x192.png',
                  sizes: '192x192',
                  type: 'image/png',
                },
              ],
            },
          ],
          file_handlers: [
            {
              action: '/',
              accept: {
                'application/epub+zip': ['.epub'],
                'application/pdf': ['.pdf'],
                'text/plain': ['.txt'],
                'text/markdown': ['.md'],
              },
            },
          ],
          icons: [
            {
              src: '/nekolover-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/nekolover-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/nekolover-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
          screenshots: [
            {
              src: '/screenshot-library.png',
              sizes: '540x960',
              type: 'image/png',
              form_factor: 'narrow',
              label: 'Biblioteca Kawaii Dark NekoLover Read',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          globIgnores: ['**/NekoLoverRead-Android-Package.zip', '**/assets/aistudio/**', '**/screenshot-library.png', '**/pwa-*.png', '**/icon.svg'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/pdf\.js\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'pdfjs-cdn-cache',
                expiration: {
                  maxEntries: 5,
                  maxAgeSeconds: 60 * 60 * 24 * 90,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': import.meta.dirname,
      },
    },
    build: {
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              {
                name: 'react-vendor',
                test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/,
                priority: 30,
              },
              {
                name: 'jszip-vendor',
                test: /node_modules[\\/]jszip[\\/]/,
                priority: 20,
              },
              {
                name: 'icons-vendor',
                test: /node_modules[\\/]lucide-react[\\/]/,
                priority: 10,
              },
            ],
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
