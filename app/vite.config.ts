import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { compression } from "vite-plugin-compression2"
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    react(),
    // Emit Brotli-compressed (.br) assets alongside regular files.
    // Reduces transfer size by up to 75 % vs gzip — critical for rural
    // low-bandwidth users. Servers that support pre-compressed assets
    // serve the .br variant with Content-Encoding: br automatically.
    compression({
      algorithms: ["brotliCompress"],
      exclude: [/\.(br)$/, /\.(gz)$/],
      threshold: 1024,
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Solaris CET',
        short_name: 'Solaris',
        description: 'Solaris CET — hyper-scarce RWA token on TON with 200,000 AI agents, 9,000 CET supply, 90-year mining, and the BRAID Framework.',
        theme_color: '#05060B',
        background_color: '#05060B',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
        shortcuts: [
          {
            name: 'Buy CET on DeDust',
            short_name: 'Buy CET',
            url: 'https://dedust.io/pools/EQB5_hZPl4-EI1aWdLSd21c8T9PoKyZK2IJtrDFdPJIelfnB/deposit',
          },
          {
            name: 'Start Mining on Telegram',
            short_name: 'Mine CET',
            url: 'https://t.me/+tKlfzx7IWopmNWQ0',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3 MiB to cover phone-mockup.png
        runtimeCaching: [
          {
            urlPattern: /\/api\/state\.json$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'state-json-cache',
              expiration: {
                maxEntries: 1,
                maxAgeSeconds: 60 * 5, // 5 minutes
              },
            },
          },
          {
            urlPattern: /^https:\/\/api\.dedust\.io\//i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'dedust-api-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 5, // 5 minutes
              },
            },
          },
          {
            urlPattern: /^https:\/\/api\.coingecko\.com\//i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'coingecko-api-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 5, // 5 minutes
              },
            },
          },
          {
            // Cache ONNX Runtime WASM binaries from jsDelivr CDN for offline use.
            // Pattern matches both versioned and non-versioned paths, e.g.:
            //   cdn.jsdelivr.net/npm/onnxruntime-web@1.24.3/dist/...
            //   cdn.jsdelivr.net/npm/onnxruntime-web/dist/...
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/npm\/onnxruntime-web(@[^/]+)?\/dist\//i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'onnx-wasm-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
        ],
      },
    }),
  ],
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            const pkg = id.split('node_modules/')[1];
            // Handle scoped packages like @radix-ui/react-dialog
            if (pkg.startsWith('@')) {
              return pkg.split('/').slice(0, 2).join('/');
            }
            return pkg.split('/')[0];
          }
          return undefined;
        },
      },
    },
    cssCodeSplit: true,
    sourcemap: true,
    chunkSizeWarningLimit: 1000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@sections": path.resolve(__dirname, "./src/sections"),
      "@hooks": path.resolve(__dirname, "./src/hooks"),
      "@lib": path.resolve(__dirname, "./src/lib"),
    },
  },
});
