import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute, setCatchHandler } from 'workbox-routing'
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'

const sw = globalThis

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
  if (sw.clients?.claim) {
    event.waitUntil(sw.clients.claim())
  }
})

const wbManifest = self.__WB_MANIFEST || []
const filteredManifest = wbManifest.filter((entry) => {
  const rawUrl = typeof entry === 'string' ? entry : entry?.url
  if (typeof rawUrl !== 'string') return false
  const url = rawUrl.replace(/^\//, '')

  if (url === 'index.html') return true
  if (url === 'offline.html') return true
  if (url === 'manifest.json') return true
  if (url === 'offline-image.svg') return true
  if (/^icon-(192|512)\.png$/.test(url)) return true
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
    cacheName: 'asset-chunks',
    plugins: [new ExpirationPlugin({ maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 14 })],
  }),
)

registerRoute(
  ({ url }) =>
    url.origin === sw.location.origin &&
    (url.pathname.endsWith('.pdf') || url.pathname.startsWith('/whitepaper/')),
  new CacheFirst({
    cacheName: 'whitepaper-pdf-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 8, maxAgeSeconds: 60 * 60 * 24 * 30 }),
    ],
  }),
)

registerRoute(
  ({ url }) => /^https:\/\/dweb\.link\/ipfs\//i.test(url.href),
  new CacheFirst({
    cacheName: 'ipfs-whitepaper-cache',
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
        return await appShellHandler(options)
      } catch {
        const offline = await sw.caches.match('/offline.html')
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
    cacheName: 'static-sites-pages',
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
    cacheName: 'meta-files-cache',
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
    (request.destination === 'image' || /\.(png|jpe?g|webp|svg|ico)$/i.test(url.pathname)),
  new StaleWhileRevalidate({
    cacheName: 'images-cache',
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
    (url.pathname.startsWith('/sovereign/') || url.pathname.startsWith('/apocalypse/')),
  new CacheFirst({
    cacheName: 'static-surfaces-assets',
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      new ExpirationPlugin({ maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 30 }),
    ],
  }),
)

registerRoute(
  ({ request }) => request.destination === 'font' && request.method === 'GET',
  new CacheFirst({
    cacheName: 'fonts-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 }),
    ],
  }),
)

registerRoute(
  ({ url }) => /\/api\/state\.json$/.test(url.pathname),
  new NetworkFirst({
    cacheName: 'state-json-cache',
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
    cacheName: 'dedust-api-cache',
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
    cacheName: 'coingecko-api-cache',
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
    cacheName: 'onnx-wasm-cache',
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
    const offline = await sw.caches.match('/offline.html')
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
