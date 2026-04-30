import { execSync } from "node:child_process"
import fs from "node:fs"

import { sentryVitePlugin } from "@sentry/vite-plugin"
import react from "@vitejs/plugin-react"
import path from "path"
import type { PluginOption } from "vite"
import { defineConfig } from "vite"
import { compression } from "vite-plugin-compression2"
import { VitePWA } from 'vite-plugin-pwa'

import { OG_IMAGE_FILENAME, SOLARIS_CET_LOGO_FILENAME } from "./src/lib/brandAssetFilenames"
import { DEDUST_POOL_DEPOSIT_URL } from "./src/lib/dedustUrls"

/**
 * Coolify/Nixpacks often run `vite preview` instead of nginx. Vite's preview
 * SPA `htmlFallback` treats paths containing a dot as client routes, so
 * `/health.json` incorrectly returns `index.html`. Serve the real file first.
 */
function previewHealthJson(): PluginOption {
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
 * Google Search Console: inject real token at build, or drop the meta tag so we never
 * ship a bogus `YOUR_GOOGLE_SITE_VERIFICATION_CODE` (hurts trust vs. mature competitors).
 */
function injectGoogleSiteVerification(): Plugin {
  return {
    name: "inject-google-site-verification",
    transformIndexHtml(html) {
      const raw = process.env.VITE_GOOGLE_SITE_VERIFICATION?.trim()
      const esc = (s: string) =>
        s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;")
      if (raw) {
        return html.replace(
          /<!--\s*google-site-verification:[\s\S]*?-->\s*\n\s*<meta name="google-site-verification"[^>]*\/>/,
          `<meta name="google-site-verification" content="${esc(raw)}" />`,
        )
      }
      return html.replace(
        /\s*<!--\s*google-site-verification:[\s\S]*?-->\s*\n\s*<meta name="google-site-verification"[^>]*\/>\s*/i,
        "\n",
      )
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

/** Build-time artifact seal (Coolify can set VITE_* env). */
function gitShort(): string {
  const fromEnv = process.env.VITE_GIT_COMMIT_HASH?.trim()
  if (fromEnv) return fromEnv.slice(0, 7)
  try {
    return execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim().slice(0, 7)
  } catch {
    return "unknown"
  }
}

function buildTimestamp(): string {
  return process.env.VITE_BUILD_TIMESTAMP?.trim() || new Date().toISOString()
}

const sentryOrg = process.env.SENTRY_ORG?.trim()
const sentryProject = process.env.SENTRY_PROJECT?.trim()
const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN?.trim()
const sentryUrl = process.env.SENTRY_URL?.trim()
const sentryEnabled = Boolean(sentryOrg && sentryProject && sentryAuthToken)

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  define: {
    "import.meta.env.VITE_GIT_COMMIT_HASH": JSON.stringify(gitShort()),
    "import.meta.env.VITE_BUILD_TIMESTAMP": JSON.stringify(buildTimestamp()),
  },
  plugins: [
    previewHealthJson(),
    injectGoogleSiteVerification(),
    react(),
    ...(sentryEnabled
      ? [
          sentryVitePlugin({
            authToken: sentryAuthToken,
            org: sentryOrg,
            project: sentryProject,
            url: sentryUrl,
            release: gitShort(),
            sourcemaps: {
              filesToDeleteAfterUpload: ['dist/**/*.map'],
            },
          } as unknown as Record<string, unknown>),
        ]
      : []),
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
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      manifestFilename: 'manifest.json',
      includeAssets: [
        'favicon.svg',
        'icon-192.png',
        'icon-512.png',
        SOLARIS_CET_LOGO_FILENAME,
        OG_IMAGE_FILENAME,
        'offline.html',
      ],
      manifest: {
        name: 'Solaris CET',
        short_name: 'Solaris',
        description: 'Solaris CET — hyper-scarce RWA on TON: 9,000 CET, 90-year mining, Grok×Gemini Oracle, ~200k task agents, BRAID + RAV.',
        theme_color: '#05060B',
        background_color: '#05060B',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui', 'browser'],
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        categories: ['finance', 'business', 'utilities'],
        lang: 'en',
        id: '/',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
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
            url: DEDUST_POOL_DEPOSIT_URL,
          },
          {
            name: 'Start Mining on Telegram',
            short_name: 'Mine CET',
            url: 'https://t.me/+tKlfzx7IWopmNWQ0',
          },
          {
            name: 'How to buy CET',
            short_name: 'Buy guide',
            url: '/#how-to-buy',
          },
          {
            name: 'Compare vs AI tokens',
            short_name: 'Compare',
            url: '/#competition',
          },
        ],
        share_target: {
          action: '/share',
          method: 'GET',
          enctype: 'application/x-www-form-urlencoded',
          params: {
            title: 'title',
            text: 'text',
            url: 'url',
          },
        },
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,json,webmanifest}'],
        globIgnores: [
          '**/vendor/onnxruntime/**',
          '**/assets/mermaid-*.js*',
          '**/assets/@mermaid-js/**',
          '**/assets/cytoscape-*.js*',
          '**/assets/cytoscape-*/*.js*',
          '**/assets/three-*.js*',
          '**/assets/three-stdlib-*.js*',
          '**/assets/@react-three/**',
          '**/assets/postprocessing-*.js*',
          '**/assets/@react-three/postprocessing-*.js*',
        ],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
    }),
  ] satisfies PluginOption[],
  preview: {
    host: '0.0.0.0',
    port: resolvePreviewPort(),
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks(id: string) {
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
    sourcemap: sentryEnabled,
    chunkSizeWarningLimit: 1600,
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
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    // Add cors to allow all origins in dev, though proxy usually handles it.
    cors: true,
    // hmr: { overlay: false }, // optional, if the overlay is annoying
    proxy: {
      '/api-dedust': {
        target: 'https://api.dedust.io',
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/api-dedust/, ''),
        // Increase timeouts for slow external APIs to prevent ERR_ABORTED
        proxyTimeout: 10000,
        timeout: 10000,
      },
      '/api-country': {
        target: 'https://api.country.is',
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/api-country/, ''),
        proxyTimeout: 5000,
        timeout: 5000,
      },
    },
  },
  optimizeDeps: {
    // Explicitly include heavy dependencies to avoid on-the-fly pre-bundling
    // which can cause server restarts and aborted requests.
    include: [
      'react',
      'react-dom',
      'gsap',
      'lucide-react',
      '@tonconnect/ui-react',
      'recharts',
    ],
  },
});
