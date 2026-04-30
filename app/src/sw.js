import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'
import { clientsClaim } from 'workbox-core'

const sw = globalThis

sw.addEventListener('install', () => {
  sw.skipWaiting?.()
})

clientsClaim()

precacheAndRoute(self.__WB_MANIFEST || [])
cleanupOutdatedCaches()

sw.addEventListener('message', (event) => {
  const data = event?.data
  if (data && typeof data === 'object' && data.type === 'SKIP_WAITING') {
    sw.skipWaiting?.()
  }
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

registerRoute(
  ({ request, url }) =>
    request.mode === 'navigate' && !url.pathname.startsWith('/sovereign/') && !url.pathname.startsWith('/apocalypse/'),
  new NetworkFirst({
    cacheName: 'pages-offline-fallback',
    plugins: [
      {
        handlerDidError: async () => {
          const match = await sw.caches.match('/offline.html')
          return match ?? undefined
        },
      },
    ],
  }),
)

registerRoute(
  ({ url }) => /\/api\/state\.json$/.test(url.pathname),
  new StaleWhileRevalidate({
    cacheName: 'state-json-cache',
    plugins: [new ExpirationPlugin({ maxEntries: 1, maxAgeSeconds: 60 * 5 })],
  }),
)

registerRoute(
  ({ url }) => /^https:\/\/api\.dedust\.io\//i.test(url.href),
  new NetworkFirst({
    cacheName: 'dedust-api-cache',
    plugins: [new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 5 })],
  }),
)

registerRoute(
  ({ url }) => /^https:\/\/api\.coingecko\.com\//i.test(url.href),
  new NetworkFirst({
    cacheName: 'coingecko-api-cache',
    plugins: [new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 5 })],
  }),
)

registerRoute(
  ({ url }) => /^\/vendor\/onnxruntime\//i.test(url.pathname),
  new CacheFirst({
    cacheName: 'onnx-wasm-cache',
    plugins: [new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 30 })],
  }),
)

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
