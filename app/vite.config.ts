import fs from "node:fs"
import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import type { Plugin } from "vite"
import { compression } from "vite-plugin-compression2"
import { VitePWA } from 'vite-plugin-pwa'

/**
 * Coolify/Nixpacks often run `vite preview` instead of nginx. Vite's preview
 * SPA `htmlFallback` treats paths containing a dot as client routes, so
 * `/health.json` incorrectly returns `index.html`. Serve the real file first.
 */
function previewHealthJson(): Plugin {
  return {
    name: "preview-health-json",
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = req.url?.split("?")[0]
        if (pathname !== "/health.json") return next()

        const outDir =
          server.config.environments?.client?.build?.outDir ??
          server.config.build?.outDir ??
          "dist"
        const file = path.resolve(server.config.root, outDir, "health.json")
        if (!fs.existsSync(file)) return next()

        if (req.method !== "GET" && req.method !== "HEAD") {
          res.statusCode = 405
          res.end()
          return
        }

        res.setHeader("Content-Type", "application/json; charset=utf-8")
        res.setHeader("Cache-Control", "no-store")
        res.statusCode = 200
        if (req.method === "HEAD") {
          res.end()
          return
        }
        fs.createReadStream(file).pipe(res)
      })
    },
  }
}

/**
 * Coolify / PaaS often set `PORT`. `0` is valid for Vite (pick a free port);
 * avoid `||` so `0` is not replaced by the fallback.
 */
function resolvePreviewPort(fallback = 4173): number {
  const raw = process.env.PORT
  if (raw == null || raw === '') return fallback
  const n = Number.parseInt(String(raw).trim(), 10)
  if (!Number.isFinite(n) || n < 0) return fallback
  return n
}

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    previewHealthJson(),
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
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png', 'offline.html'],
      manifest: {
        name: 'Solaris CET',
        short_name: 'Solaris',
        description: 'Solaris CET — hyper-scarce RWA on TON: 9,000 CET, 90-year mining, Grok×Gemini Oracle, ~200k task agents, BRAID + RAV.',
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
        /** SPA fallback; do not hijack the zero-JS sovereign subtree. */
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/sovereign\//],
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
            // Cache same-origin ONNX Runtime WASM binaries for offline use.
            urlPattern: /^\/vendor\/onnxruntime\//i,
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
  preview: {
    host: '0.0.0.0',
    port: resolvePreviewPort(),
  },
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