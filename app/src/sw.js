import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute, setCatchHandler } from 'workbox-routing'
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'

const sw = globalThis

const CACHE_SUFFIX = String(
  (import.meta?.env?.VITE_GIT_COMMIT_HASH ?? import.meta?.env?.VITE_BUILD_TIMESTAMP ?? 'dev') || 'dev',
).slice(0, 12)

function cache(base) {
  return `${base}-${CACHE_SUFFIX}`
}

const SENSITIVE_QUERY_KEYS = ['token', 'auth', 'apikey', 'api_key', 'key', 'signature', 'sig', 'session', 'jwt']

function isSensitiveUrl(url) {
  if (!url || typeof url.search !== 'string') return false
  if (!url.search) return false
  for (const k of SENSITIVE_QUERY_KEYS) {
    try {
      if (url.searchParams?.has?.(k)) return true
    } catch {
      void 0
    }
  }
  return /\b(token|auth|apikey|api_key|signature|session|jwt)=/i.test(url.search)
}

function isRangeRequest(request) {
  try {
    const v = request?.headers?.get?.('range')
    return typeof v === 'string' && v.length > 0
  } catch {
    return false
  }
}

function cacheNameForUrl(url) {
  const p = url?.pathname ?? ''
  if (url?.origin === sw.location.origin) {
    if (p.startsWith('/api/')) return null

    if (p.startsWith('/whitepaper/') || p.endsWith('.pdf')) return cache('whitepaper-pdf-cache')
    if (p.startsWith('/assets/') && (p.endsWith('.js') || p.endsWith('.css'))) return cache('asset-chunks')

    if (
      p === '/manifest.json' ||
      p === '/offline.html' ||
      /^\/offline-(en|ro|es|zh|ru|pt|de)\.html$/.test(p) ||
      p === '/offline-image.svg' ||
      p === '/favicon.svg' ||
      p === '/favicon.ico' ||
      /^\/favicon-(16x16|32x32)\.png$/.test(p) ||
      p === '/apple-touch-icon.png' ||
      p === '/safari-pinned-tab.svg'
    ) {
      return cache('meta-files-cache')
    }

    if (/\.(woff2?|ttf|otf)$/i.test(p)) return cache('fonts-cache')
    if (/\.(png|jpe?g|webp|svg|ico)$/i.test(p)) return cache('images-cache')

    if (p.startsWith('/sovereign/') || p.startsWith('/apocalypse/') || p.startsWith('/audit/')) {
      if (/\.(css|js|png|jpe?g|webp|svg|ico|woff2?|ttf|otf)$/i.test(p)) return cache('static-surfaces-assets')
      return cache('static-sites-pages')
    }

    if (p.endsWith('.html')) return cache('static-sites-pages')
    return null
  }

  if (url?.origin === 'https://ipfs.io' && url.pathname.endsWith('.pdf')) return cache('ipfs-whitepaper-cache')

  return null
}

sw.addEventListener('install', (event) => {
  const probe = async () => {
    try {
      const res = await fetch('/index.html', { cache: 'reload' })
      const clients = await sw.clients.matchAll({ type: 'window', includeUncontrolled: true })
      for (const client of clients) {
        try {
          client.postMessage({ type: 'SW_INSTALL_PROBE', url: res.url, status: res.status })
        } catch {
          void 0
        }
      }
    } catch (e) {
      try {
        const clients = await sw.clients.matchAll({ type: 'window', includeUncontrolled: true })
        for (const client of clients) {
          try {
            client.postMessage({ type: 'SW_INSTALL_PROBE', error: String(e ?? '') })
          } catch {
            void 0
          }
        }
      } catch {
        void 0
      }
    }
  }

  event.waitUntil(Promise.all([sw.skipWaiting?.(), probe()]))
})

sw.addEventListener('activate', (event) => {
  const jobs = []
  if (sw.clients?.claim) jobs.push(sw.clients.claim())
  if (sw.registration?.navigationPreload?.enable) {
    jobs.push(
      sw.registration.navigationPreload.enable().catch(() => {
        void 0
      }),
    )
  }

  jobs.push(
    (async () => {
      const bases = [
        'asset-chunks',
        'whitepaper-pdf-cache',
        'ipfs-whitepaper-cache',
        'static-sites-pages',
        'meta-files-cache',
        'images-cache',
        'static-surfaces-assets',
        'fonts-cache',
        'state-json-cache',
        'dedust-api-cache',
        'coingecko-api-cache',
        'onnx-wasm-cache',
      ]
      const keep = new Set(bases.map((b) => cache(b)))
      const keys = await sw.caches.keys()
      await Promise.all(
        keys
          .filter((k) => bases.some((b) => k === b || k.startsWith(`${b}-`)))
          .filter((k) => !keep.has(k))
          .map((k) => sw.caches.delete(k)),
      )
    })(),
  )

  jobs.push(
    (async () => {
      try {
        const cacheName = cache('static-surfaces-assets')
        const c = await sw.caches.open(cacheName)
        const urls = ['/sovereign/css/sovereign-ui.css', '/sovereign/css/print.css']
        for (const u of urls) {
          try {
            const req = new Request(u, { cache: 'reload', credentials: 'omit' })
            const res = await fetch(req)
            if (!res.ok) continue
            await c.put(req, res.clone())
          } catch {
            void 0
          }
        }
      } catch {
        void 0
      }
    })(),
  )
  if (jobs.length) event.waitUntil(Promise.all(jobs))
})

const wbManifest = self.__WB_MANIFEST || []
const filteredManifest = wbManifest.filter((entry) => {
  const rawUrl = typeof entry === 'string' ? entry : entry?.url
  if (typeof rawUrl !== 'string') return false
  const url = rawUrl.replace(/^\//, '')

  if (url === 'index.html') return true
  if (url === 'offline.html') return true
  if (url === 'offline-ro.html') return true
  if (/^offline-(en|ro|es|zh|ru|pt|de)\.html$/.test(url)) return true
  if (url === 'manifest.json') return true
  if (url === 'offline-image.svg') return true
  if (url === 'hero-coin.png') return true
  if (url === 'solaris-cet-logo-emblem-190.jpg') return true
  if (/^cinematic\/cosmic-poster-(768|1024)\.(webp|jpg)$/.test(url)) return true
  if (url === 'fonts/jetbrains-mono-400.woff2') return true
  if (/^icon-(192|512)\.png$/.test(url)) return true
  if (/^icon-maskable-(192|512)\.png$/.test(url)) return true
  if (/^favicon\.(svg|ico)$/.test(url)) return true
  if (/^favicon-(16x16|32x32)\.png$/.test(url)) return true
  if (url === 'apple-touch-icon.png') return true
  if (url === 'safari-pinned-tab.svg') return true

  return false
})
precacheAndRoute(filteredManifest)
cleanupOutdatedCaches()

sw.addEventListener('message', (event) => {
  const data = event?.data
  if (data && typeof data === 'object' && data.type === 'SKIP_WAITING') {
    sw.skipWaiting?.()
  }

  if (data && typeof data === 'object' && data.type === 'CLEAR_CACHES' && data.confirm === true) {
    event.waitUntil(
      (async () => {
        const keys = await sw.caches.keys()
        await Promise.all(keys.map((k) => sw.caches.delete(k)))
      })(),
    )
  }

  if (data && typeof data === 'object' && data.type === 'PREFETCH_URLS' && Array.isArray(data.urls)) {
    const urls = data.urls.slice(0, 60).filter((u) => typeof u === 'string')
    event.waitUntil(
      (async () => {
        let okCount = 0
        let failCount = 0
        for (const raw of urls) {
          try {
            const u = new URL(raw, sw.location.origin)
            if (isSensitiveUrl(u)) {
              failCount += 1
              continue
            }

            const cacheName = cacheNameForUrl(u)
            if (!cacheName) {
              failCount += 1
              continue
            }

            const reqInit =
              u.origin === sw.location.origin
                ? { cache: 'reload', credentials: 'omit' }
                : { cache: 'reload', credentials: 'omit', mode: 'no-cors' }
            const req = new Request(u.href, reqInit)
            const res = await fetch(req)
            const ok = res.ok || res.type === 'opaque'
            if (!ok) {
              failCount += 1
              continue
            }

            const c = await sw.caches.open(cacheName)
            await c.put(req, res.clone())
            okCount += 1
          } catch {
            failCount += 1
          }
        }
        try {
          const source = event.source
          source?.postMessage?.({ type: 'PREFETCH_DONE', okCount, failCount })
        } catch {
          void 0
        }
      })(),
    )
  }

  if (data && typeof data === 'object' && data.type === 'GET_CACHE_STATUS') {
    event.waitUntil(
      (async () => {
        try {
          const cacheNames = await sw.caches.keys()
          const limited = cacheNames.slice(0, 30)
          const entries = await Promise.all(
            limited.map(async (name) => {
              try {
                const c = await sw.caches.open(name)
                const keys = await c.keys()
                return { name, entries: keys.length }
              } catch {
                return { name, entries: -1 }
              }
            }),
          )
          event.source?.postMessage?.({
            type: 'CACHE_STATUS',
            cacheCount: cacheNames.length,
            entries,
          })
        } catch (e) {
          event.source?.postMessage?.({
            type: 'CACHE_STATUS',
            error: String(e instanceof Error ? e.message : e),
          })
        }
      })(),
    )
  }
})

async function broadcast(message) {
  try {
    const clients = await sw.clients.matchAll({ type: 'window', includeUncontrolled: true })
    for (const client of clients) {
      try {
        client.postMessage(message)
      } catch {
        void 0
      }
    }
  } catch {
    void 0
  }
}

sw.addEventListener('error', (event) => {
  void broadcast({
    type: 'SW_ERROR',
    message: String(event?.message ?? ''),
    filename: String(event?.filename ?? ''),
    lineno: Number(event?.lineno ?? 0),
    colno: Number(event?.colno ?? 0),
  })
})

sw.addEventListener('unhandledrejection', (event) => {
  void broadcast({
    type: 'SW_UNHANDLED_REJECTION',
    reason: String(event?.reason ?? ''),
  })
})

registerRoute(
  ({ url }) =>
    url.pathname.startsWith('/assets/') && (url.pathname.endsWith('.js') || url.pathname.endsWith('.css')),
  new StaleWhileRevalidate({
    cacheName: cache('asset-chunks'),
    plugins: [new ExpirationPlugin({ maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 14 })],
  }),
)

registerRoute(
  ({ request, url }) =>
    url.origin === sw.location.origin &&
    !isRangeRequest(request) &&
    (url.pathname.endsWith('.pdf') || url.pathname.startsWith('/whitepaper/')),
  new CacheFirst({
    cacheName: cache('whitepaper-pdf-cache'),
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 8, maxAgeSeconds: 60 * 60 * 24 * 30 }),
    ],
  }),
)

registerRoute(
  ({ url }) => /^https:\/\/dweb\.link\/ipfs\//i.test(url.href),
  new CacheFirst({
    cacheName: cache('ipfs-whitepaper-cache'),
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 8, maxAgeSeconds: 60 * 60 * 24 * 30 }),
    ],
  }),
)

const appShellHandler = createHandlerBoundToURL('/index.html')
registerRoute(
  new NavigationRoute(
    async (options) => {
      try {
        const preload = await options?.event?.preloadResponse
        if (preload) return preload
        return await appShellHandler(options)
      } catch {
        const u = options?.request?.url ? new URL(options.request.url) : null
        const p = u?.pathname ?? '/'
        const m = p.match(/^\/(en|ro|es|zh|ru|pt|de)(?:\/|$)/i)
        const locale = m?.[1]?.toLowerCase() ?? ''
        const localized = locale ? await sw.caches.match(`/offline-${locale}.html`) : undefined
        const offline = localized ?? (await sw.caches.match('/offline.html'))
        return offline ?? Response.error()
      }
    },
    {
      denylist: [/^\/sovereign\//, /^\/apocalypse\//, /\/[^/?]+\.[^/]+$/],
    },
  ),
)

registerRoute(
  ({ request, url }) =>
    request.mode === 'navigate' && (url.pathname.startsWith('/sovereign/') || url.pathname.startsWith('/apocalypse/')),
  new StaleWhileRevalidate({
    cacheName: cache('static-sites-pages'),
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      new ExpirationPlugin({ maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 30 }),
    ],
  }),
)

registerRoute(
  ({ request, url }) =>
    request.method === 'GET' &&
    url.origin === sw.location.origin &&
    (url.pathname === '/robots.txt' || url.pathname === '/sitemap.xml'),
  new StaleWhileRevalidate({
    cacheName: cache('meta-files-cache'),
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      new ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 60 * 60 * 24 * 7 }),
    ],
  }),
)

registerRoute(
  ({ request, url }) =>
    request.method === 'GET' &&
    url.origin === sw.location.origin &&
    !isRangeRequest(request) &&
    !isSensitiveUrl(url) &&
    (request.destination === 'image' || /\.(png|jpe?g|webp|svg|ico)$/i.test(url.pathname)),
  new StaleWhileRevalidate({
    cacheName: cache('images-cache'),
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 30 }),
    ],
  }),
)

registerRoute(
  ({ request, url }) =>
    request.method === 'GET' &&
    url.origin === sw.location.origin &&
    !isRangeRequest(request) &&
    !isSensitiveUrl(url) &&
    (url.pathname.startsWith('/sovereign/') || url.pathname.startsWith('/apocalypse/')),
  new CacheFirst({
    cacheName: cache('static-surfaces-assets'),
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 30 }),
    ],
  }),
)

registerRoute(
  ({ request, url }) =>
    request.destination === 'font' && request.method === 'GET' && !isRangeRequest(request) && !isSensitiveUrl(url),
  new CacheFirst({
    cacheName: cache('fonts-cache'),
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 }),
    ],
  }),
)

registerRoute(
  ({ url }) => /\/api\/state\.json$/.test(url.pathname),
  new NetworkFirst({
    cacheName: cache('state-json-cache'),
    networkTimeoutSeconds: 2,
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      new ExpirationPlugin({ maxEntries: 1, maxAgeSeconds: 60 * 5 }),
    ],
  }),
)

registerRoute(
  ({ url }) => /^https:\/\/api\.dedust\.io\//i.test(url.href),
  new NetworkFirst({
    cacheName: cache('dedust-api-cache'),
    networkTimeoutSeconds: 4,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 5 }),
    ],
  }),
)

registerRoute(
  ({ url }) => /^https:\/\/api\.coingecko\.com\//i.test(url.href),
  new NetworkFirst({
    cacheName: cache('coingecko-api-cache'),
    networkTimeoutSeconds: 4,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 5 }),
    ],
  }),
)

registerRoute(
  ({ url }) => /^\/vendor\/onnxruntime\//i.test(url.pathname),
  new CacheFirst({
    cacheName: cache('onnx-wasm-cache'),
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 30 }),
    ],
  }),
)

setCatchHandler(async ({ event }) => {
  const url = event?.request?.url ? new URL(event.request.url) : null
  if (url && url.origin === sw.location.origin && url.pathname === '/api/state.json') {
    const cached = await sw.caches.match(event.request)
    if (cached) return cached
    return new Response(
      JSON.stringify({
        token: { symbol: 'CET', name: 'Solaris CET', contract: 'unknown', totalSupply: null, decimals: 9 },
        pool: { address: 'unknown', reserveTon: null, reserveCet: null, lpSupply: null, priceTonPerCet: null },
        updatedAt: new Date(0).toISOString(),
      }),
      { headers: { 'content-type': 'application/json; charset=utf-8' }, status: 200 },
    )
  }

  if (event?.request?.destination === 'document') {
    const p = url?.pathname ?? '/'
    const m = p.match(/^\/(en|ro|es|zh|ru|pt|de)(?:\/|$)/i)
    const locale = m?.[1]?.toLowerCase() ?? ''
    const localized = locale ? await sw.caches.match(`/offline-${locale}.html`) : undefined
    const offline = localized ?? (await sw.caches.match('/offline.html'))
    if (offline) return offline
  }

  if (event?.request?.destination === 'image') {
    const img = await sw.caches.match('/offline-image.svg')
    if (img) return img
  }

  return Response.error()
})

function getPushPayload(event) {
  const data = event?.data
  if (!data) return null
  try {
    return data.json()
  } catch {
    try {
      const text = data.text()
      return { title: 'Solaris CET', body: text }
    } catch {
      return null
    }
  }
}

sw.addEventListener('push', (event) => {
  const payload = getPushPayload(event)
  const title = (payload?.title ?? 'Solaris CET').toString()
  const body = (payload?.body ?? '').toString()
  const url = typeof payload?.url === 'string' ? payload.url : '/'

  event.waitUntil(
    sw.registration.showNotification(title, {
      body,
      icon: '/icon-192.png',
      badge: '/favicon-32x32.png',
      tag: typeof payload?.tag === 'string' ? payload.tag : undefined,
      renotify: Boolean(payload?.renotify),
      data: { url },
      actions: [
        { action: 'open', title: 'Open' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    }),
  )
})

sw.addEventListener('notificationclick', (event) => {
  const url = typeof event?.notification?.data?.url === 'string' ? event.notification.data.url : '/'
  event.notification?.close?.()

  event.waitUntil(
    (async () => {
      const allClients = await sw.clients.matchAll({ type: 'window', includeUncontrolled: true })
      for (const client of allClients) {
        const clientUrl = new URL(client.url)
        if (clientUrl.origin !== sw.location.origin) continue
        await client.focus()
        client.postMessage({ type: 'NAVIGATE', url })
        return
      }
      await sw.clients.openWindow(url)
    })(),
  )
})

sw.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    (async () => {
      const allClients = await sw.clients.matchAll({ type: 'window', includeUncontrolled: true })
      for (const client of allClients) {
        client.postMessage({ type: 'PUSH_SUBSCRIPTION_CHANGED' })
      }
    })(),
  )
})
