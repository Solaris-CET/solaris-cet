# PWA / Offline — backlog (100 taskuri)

Scop: să întărim experiența offline, update flow-ul service worker, precache/runtime caching, și testarea/observabilitatea PWA.

## A. Manifest, instalare, UX
1. Elimină sursele duplicate pentru `manifest.json` (o singură sursă de adevăr).
2. Validează că `start_url` și `scope` sunt consistente cu i18n routing.
3. Adaugă iconuri `maskable` dedicate (nu doar `purpose: any maskable` pe aceleași fișiere).
4. Adaugă `screenshots` în manifest (2–3 rezoluții).
5. Adaugă `categories` relevante (audit a2hs).
6. Adaugă `iarc_rating_id` dacă e necesar (policy store).
7. Adaugă `related_applications` (dacă există app native).
8. Adaugă `prefer_related_applications: false` (explicit).
9. Adaugă shortcut spre „CET App” (intern) dacă există rută stabilă.
10. Adaugă `share_target` test E2E pentru query params.
11. Uniformizează `theme-color` între HTML și manifest.
12. Asigură fallback pentru `apple-touch-icon` și meta pentru iOS.
13. Introdu un banner UI „Offline mode” când `navigator.onLine=false`.
14. Introdu un banner UI „Update available” cu CTA „Reload now”.
15. Loghează (în event sink) evenimentele: install prompt shown/accepted.
16. Asigură că `display_override` nu degradează pe anumite UA.
17. Verifică accesibilitatea paginii `offline.html` (contrast, focus).
18. Adaugă un buton „Retry” în `offline.html`.
19. Adaugă un buton „Go home” în `offline.html`.
20. Adaugă localizare minimă pentru `offline.html` (en/ro).

## B. Service worker lifecycle & update flow
21. Adaugă `networkTimeoutSeconds` la `NetworkFirst` pentru navigație.
22. Trimite mesaj către clienți când SW intră online/offline fallback.
23. Adaugă `setCatchHandler` global pentru fallback document/image.
24. Controlează `skipWaiting` doar la mesaj (nu automat) dacă vrei update-uri mai sigure.
25. Adaugă „versioning” pentru cache-uri (prefix cu build id).
26. Adaugă cleanup pentru cache-uri vechi (custom, pe prefix).
27. Folosește `clientsClaim()` doar după activare (confirmă comportamentul).
28. Adaugă handler pentru `message: CLEAR_CACHES` (debug/QA).
29. Adaugă handler pentru `message: PREFETCH_URLS` (warm cache).
30. Adaugă handler pentru `message: GET_CACHE_STATUS` (diagnostic).
31. Adaugă handler pentru `pushsubscriptionchange` dacă e suportat.
32. Consolidare: un singur SW pentru push + app.
33. Adaugă `navigationPreload.enable()` când e disponibil.
34. Integrează navigation preload în route-ul de navigație.
35. Adaugă protecție pentru request-uri `range` (media).
36. Adaugă fallback pentru `opaque` responses când e sigur.
37. Setează `workbox.core.setCacheNameDetails` (prefix/suffix controlat).
38. Normalizează numele cache-urilor (categorie + versiune).
39. Adaugă limitări mai stricte pe cache-uri third-party.
40. Adaugă cleanup periodic (pe `activate`).

## C. Runtime caching: assets, imagini, fonts
41. Adaugă caching pentru `request.destination === 'image'` (SWR).
42. Adaugă caching pentru `request.destination === 'font'` (CacheFirst).
43. Adaugă caching pentru `request.destination === 'style'` (SWR).
44. Adaugă caching pentru `request.destination === 'script'` (SWR) dacă nu e deja.
45. Adaugă caching pentru `*.woff2` cu expirare lungă.
46. Adaugă fallback pentru imagini lipsă (placeholder local).
47. Evită caching pentru URL-uri cu `auth`/`token` query.
48. Evită caching pentru `no-store`/`private`.
49. Adaugă `CacheableResponse` pentru status 200/206 după caz.
50. Adaugă reguli de bypass pentru rute admin/debug.
51. Adaugă caching pentru favicon-urile PNG/ICO.
52. Adaugă caching pentru SVG locale.
53. Adaugă caching pentru `robots.txt`/`sitemap.xml` (SWR).
54. Adaugă caching pentru `app-shell` HTML (NetworkFirst + timeout).
55. Adaugă warming: precache pentru `offline.html` + iconuri.
56. Adaugă route dedicat pentru `/sovereign/*` static offline.
57. Adaugă route dedicat pentru `/apocalypse/*` static offline.
58. Adaugă `denylist` pentru resurse mari (video) în runtime.
59. Configurează `maximumFileSizeToCacheInBytes` după audit.
60. Adaugă protecție împotriva cache poisoning (Vary, query keys).

## D. API caching offline-aware
61. Extinde caching pentru `/api/state.json` cu `networkTimeoutSeconds`.
62. Cache separat pentru endpoint-uri read-only locale.
63. Bypass complet pentru endpoint-uri mutative (POST/PUT/DELETE).
64. Adaugă fallback JSON pentru `/api/state.json` când offline.
65. Adaugă „stale-while-revalidate” pentru feed-uri publice.
66. Limitează cache API third-party la 1–2 minute (audit).
67. Introdu un „circuit breaker” când third-party e down.
68. Adaugă headers de diagnostic (via SW) în dev.
69. Adaugă metri (număr hits/misses) agregate.
70. Adaugă colectare anonimizată: offline fallback triggered.

## E. Push notifications
71. Verifică unificarea SW push handlers (fără `public/push/sw.js`).
72. Adaugă route de navigație pe `notificationclick` către URL relevant.
73. Normalizează payload parsing + default notification.
74. Adaugă dedup (tag) pentru notificări repetate.
75. Adaugă `requireInteraction` opțional pe desktop.
76. Adaugă test E2E/integrare pentru click notification (mock).
77. Expune status push subscription în UI (online/offline).
78. Adaugă fallback când push nu e suportat.
79. Adaugă logică de resubscribe când key se schimbă.
80. Curăță vechile subscripții (server-side) dacă e cazul.

## F. Testare & QA
81. Extinde E2E: navigație offline către rute SPA (verifică offline.html).
82. Extinde E2E: navigație offline către `/sovereign/` (verifică page din cache).
83. Extinde E2E: navigație offline către `/apocalypse/` (verifică page din cache).
84. Extinde E2E: verifică că `offline.html` e precached (SW cache match).
85. Extinde E2E: verifică update flow (simulate `needRefresh`).
86. Adaugă test pentru `networkTimeoutSeconds` (timp limită).
87. Adaugă test pentru caching imagini (request count scade).
88. Adaugă test pentru caching fonts.
89. Adaugă test pentru bypass POST.
90. Adaugă test pentru state-json fallback.

## G. Observabilitate & operare
91. Adaugă endpoint intern `/.well-known/pwa-health.json` (versiune, SW).
92. Adaugă log de versiune SW în UI (debug panel).
93. Expune „last precache update” în localStorage.
94. Adaugă „cache size estimate” (StorageManager) în debug.
95. Introdu o pagină „PWA diagnostics”.
96. Adaugă metrici pentru `offline.html` served.
97. Adaugă metrici pentru `asset-chunks` hit rate.
98. Adaugă alerting când SW nu se înregistrează (Sentry breadcrumb).
99. Adaugă fallback dacă `virtual:pwa-register/react` nu e disponibil.
100. Documentează policy: ce cache-uim, ce nu, și de ce.
