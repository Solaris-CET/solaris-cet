const http = require('node:http');
const crypto = require('node:crypto');
const { readFile, stat } = require('node:fs/promises');
const fs = require('node:fs');
const { createReadStream } = fs;
const path = require('node:path');

const pino = require('pino');
const otelReady = require('./otel.cjs');
const { context: otelContext, trace: otelTrace } = require('@opentelemetry/api');

const appRoot = path.resolve(__dirname, '..');
const distDir = path.join(appRoot, 'dist');
const apiDistDir = path.join(appRoot, '.api-dist');

const port = Number.parseInt(process.env.PORT ?? '3000', 10);
const host = process.env.HOST ?? '0.0.0.0';

const metricsToken = String(process.env.METRICS_TOKEN ?? '').trim();

const forceHttps = (() => {
  const v = String(process.env.FORCE_HTTPS ?? '').trim();
  if (v) return v !== '0' && v.toLowerCase() !== 'false';
  return String(process.env.NODE_ENV ?? '').toLowerCase() === 'production';
})();

const cspReportOnly = (() => {
  const v = String(process.env.CSP_REPORT_ONLY ?? '').trim();
  if (!v) return false;
  return v !== '0' && v.toLowerCase() !== 'false';
})();

const cspReportPath = (() => {
  const v = String(process.env.CSP_REPORT_PATH ?? '').trim();
  return v || '/csp-violation';
})();

const coepMode = (() => {
  const v = String(process.env.COEP_MODE ?? '').trim();
  if (v === 'require-corp' || v === 'credentialless') return v;
  return '';
})();

const coepReportOnly = (() => {
  const v = String(process.env.COEP_REPORT_ONLY ?? '').trim();
  if (!v) return false;
  return v !== '0' && v.toLowerCase() !== 'false';
})();

const sentryDsn = String(process.env.SENTRY_DSN ?? '').trim();
const sentryEnabled = Boolean(sentryDsn);
let sentry = null;

if (sentryEnabled) {
  try {
    sentry = require('@sentry/node');
    sentry.init({
      dsn: sentryDsn,
      environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'production',
      release:
        process.env.GIT_SHA ||
        process.env.GIT_COMMIT ||
        process.env.SOURCE_VERSION ||
        process.env.VERCEL_GIT_COMMIT_SHA ||
        process.env.CF_PAGES_COMMIT_SHA ||
        process.env.GITHUB_SHA ||
        'unknown',
      tracesSampleRate: Number.parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0'),
      sendDefaultPii: false,
    });
    process.on('unhandledRejection', (reason) => {
      try {
        sentry.captureException(reason);
      } catch {
        void 0;
      }
    });
    process.on('uncaughtException', (err) => {
      try {
        sentry.captureException(err);
      } catch {
        void 0;
      }
    });
  } catch {
    sentry = null;
  }
}

const serverStartMs = Date.now();

const log = (() => {
  try {
    const level = String(process.env.LOG_LEVEL ?? '').trim() || 'info';
    return pino({ level });
  } catch {
    return null;
  }
})();

function parseTraceParent(header) {
  const raw = String(header ?? '').trim();
  if (!raw) return null;
  const parts = raw.split('-');
  if (parts.length < 4) return null;
  const traceId = parts[1];
  const spanId = parts[2];
  if (!/^[0-9a-f]{32}$/i.test(traceId)) return null;
  if (!/^[0-9a-f]{16}$/i.test(spanId)) return null;
  return { traceId: traceId.toLowerCase(), spanId: spanId.toLowerCase() };
}

function getBuildSha() {
  const candidates = [
    process.env.GIT_SHA,
    process.env.GIT_COMMIT,
    process.env.SOURCE_VERSION,
    process.env.VERCEL_GIT_COMMIT_SHA,
    process.env.CF_PAGES_COMMIT_SHA,
    process.env.GITHUB_SHA,
  ];
  for (const v of candidates) {
    const s = String(v ?? '').trim();
    if (s) return s;
  }
  return 'unknown';
}

function normalizeMetricsPath(pathname) {
  if (!pathname) return '/';
  if (pathname === '/' || pathname === '/index.html') return '/';
  if (pathname.startsWith('/assets/')) return '/assets/*';
  if (pathname.startsWith('/vendor/')) return '/vendor/*';
  if (pathname.startsWith('/sovereign/')) return '/sovereign/*';
  if (pathname.startsWith('/apocalypse/')) return '/apocalypse/*';
  if (pathname.startsWith('/api/')) {
    const parts = pathname.split('/').filter(Boolean);
    const a = parts[0] ?? 'api';
    const b = parts[1] ?? '*';
    const c = parts[2];
    return c ? `/${a}/${b}/${c}` : `/${a}/${b}`;
  }
  return pathname.replace(/\d+/g, ':n');
}

function escapePromLabel(v) {
  return String(v).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/"/g, '\\"');
}

const metrics = {
  requestsTotal: new Map(),
  requestsDurationMsSum: new Map(),
  requestsDurationMsCount: new Map(),
  requestLatencyMsBucket: new Map(),
  requestLatencyMsSum: new Map(),
  requestLatencyMsCount: new Map(),
  businessCounters: new Map(),
  logCounters: new Map(),
};

function metricsKey(method, path, status) {
  return `${method}|${path}|${status}`;
}

function incMap(map, key, by) {
  map.set(key, (map.get(key) ?? 0) + by);
}

const latencyBucketsMs = [25, 50, 100, 200, 300, 500, 800, 1000, 1500, 2000, 3000, 5000, 8000, 10000];

function recordRequestMetric(method, pathname, statusCode, durationMs) {
  const pathLabel = normalizeMetricsPath(pathname);
  const methodLabel = (method || 'GET').toUpperCase();
  const statusLabel = String(statusCode || 0);
  const k = metricsKey(methodLabel, pathLabel, statusLabel);
  incMap(metrics.requestsTotal, k, 1);
  incMap(metrics.requestsDurationMsSum, k, durationMs);
  incMap(metrics.requestsDurationMsCount, k, 1);

  const kLat = `${methodLabel}|${pathLabel}`;
  incMap(metrics.requestLatencyMsSum, kLat, durationMs);
  incMap(metrics.requestLatencyMsCount, kLat, 1);
  for (const b of latencyBucketsMs) {
    if (durationMs <= b) incMap(metrics.requestLatencyMsBucket, `${kLat}|${b}`, 1);
  }
  incMap(metrics.requestLatencyMsBucket, `${kLat}|+Inf`, 1);

  if (methodLabel === 'POST' && statusCode === 201 && pathname === '/api/v1/transactions') {
    incMap(metrics.businessCounters, 'transactions_created_total|v1', 1);
  }
  if (methodLabel === 'POST' && statusCode === 201 && pathname === '/api/v2/transactions') {
    incMap(metrics.businessCounters, 'transactions_created_total|v2', 1);
  }
  if (methodLabel === 'POST' && statusCode === 200 && pathname === '/api/admin/signup') {
    incMap(metrics.businessCounters, 'users_created_total|admin', 1);
  }
}

function formatPromMetrics() {
  const now = Math.floor(Date.now() / 1000);
  const upSeconds = Math.max(0, Math.floor((Date.now() - serverStartMs) / 1000));
  const sha = getBuildSha();
  const lines = [
    '# HELP solaris_up Service is up.',
    '# TYPE solaris_up gauge',
    'solaris_up 1',
    '# HELP solaris_uptime_seconds Process uptime in seconds.',
    '# TYPE solaris_uptime_seconds gauge',
    `solaris_uptime_seconds ${upSeconds}`,
    '# HELP solaris_time_seconds Current server time in seconds since epoch.',
    '# TYPE solaris_time_seconds gauge',
    `solaris_time_seconds ${now}`,
    '# HELP solaris_build_info Build metadata.',
    '# TYPE solaris_build_info gauge',
    `solaris_build_info{git_sha="${escapePromLabel(sha)}",node="${escapePromLabel(process.version)}"} 1`,
    '# HELP solaris_http_requests_total Total HTTP requests processed by the Node server.',
    '# TYPE solaris_http_requests_total counter',
  ];

  for (const [k, v] of metrics.requestsTotal.entries()) {
    const [method, path, status] = k.split('|');
    lines.push(
      `solaris_http_requests_total{method="${escapePromLabel(method)}",path="${escapePromLabel(
        path,
      )}",status="${escapePromLabel(status)}"} ${v}`,
    );
  }

  lines.push(
    '# HELP solaris_http_request_duration_ms_sum Total request duration (ms) sum.',
    '# TYPE solaris_http_request_duration_ms_sum counter',
  );
  for (const [k, v] of metrics.requestsDurationMsSum.entries()) {
    const [method, path, status] = k.split('|');
    lines.push(
      `solaris_http_request_duration_ms_sum{method="${escapePromLabel(method)}",path="${escapePromLabel(
        path,
      )}",status="${escapePromLabel(status)}"} ${v}`,
    );
  }

  lines.push(
    '# HELP solaris_http_request_duration_ms_count Total request duration (ms) count.',
    '# TYPE solaris_http_request_duration_ms_count counter',
  );
  for (const [k, v] of metrics.requestsDurationMsCount.entries()) {
    const [method, path, status] = k.split('|');
    lines.push(
      `solaris_http_request_duration_ms_count{method="${escapePromLabel(method)}",path="${escapePromLabel(
        path,
      )}",status="${escapePromLabel(status)}"} ${v}`,
    );
  }

  lines.push(
    '# HELP solaris_http_request_latency_ms Request latency histogram (ms).',
    '# TYPE solaris_http_request_latency_ms histogram',
  );
  for (const [k, v] of metrics.requestLatencyMsBucket.entries()) {
    const [method, path, le] = k.split('|');
    lines.push(
      `solaris_http_request_latency_ms_bucket{method="${escapePromLabel(method)}",path="${escapePromLabel(
        path,
      )}",le="${escapePromLabel(le)}"} ${v}`,
    );
  }
  for (const [k, v] of metrics.requestLatencyMsSum.entries()) {
    const [method, path] = k.split('|');
    lines.push(
      `solaris_http_request_latency_ms_sum{method="${escapePromLabel(method)}",path="${escapePromLabel(path)}"} ${v}`,
    );
  }
  for (const [k, v] of metrics.requestLatencyMsCount.entries()) {
    const [method, path] = k.split('|');
    lines.push(
      `solaris_http_request_latency_ms_count{method="${escapePromLabel(method)}",path="${escapePromLabel(path)}"} ${v}`,
    );
  }

  const mem = (() => {
    try {
      return process.memoryUsage();
    } catch {
      return null;
    }
  })();
  if (mem) {
    lines.push(
      '# HELP solaris_process_resident_memory_bytes Resident set size in bytes.',
      '# TYPE solaris_process_resident_memory_bytes gauge',
      `solaris_process_resident_memory_bytes ${mem.rss}`,
      '# HELP solaris_process_heap_used_bytes Heap used in bytes.',
      '# TYPE solaris_process_heap_used_bytes gauge',
      `solaris_process_heap_used_bytes ${mem.heapUsed}`,
      '# HELP solaris_process_heap_total_bytes Heap total in bytes.',
      '# TYPE solaris_process_heap_total_bytes gauge',
      `solaris_process_heap_total_bytes ${mem.heapTotal}`,
    );
  }

  lines.push(
    '# HELP solaris_business_transactions_created_total Transactions created (best-effort heuristic).',
    '# TYPE solaris_business_transactions_created_total counter',
  );
  for (const [k, v] of metrics.businessCounters.entries()) {
    const [name, label] = k.split('|');
    if (name !== 'transactions_created_total') continue;
    lines.push(`solaris_business_transactions_created_total{version="${escapePromLabel(label)}"} ${v}`);
  }
  lines.push(
    '# HELP solaris_business_users_created_total Users created (best-effort heuristic).',
    '# TYPE solaris_business_users_created_total counter',
  );
  for (const [k, v] of metrics.businessCounters.entries()) {
    const [name, label] = k.split('|');
    if (name !== 'users_created_total') continue;
    lines.push(`solaris_business_users_created_total{kind="${escapePromLabel(label)}"} ${v}`);
  }

  lines.push('# HELP solaris_log_events_total Log events emitted by the Node server.', '# TYPE solaris_log_events_total counter');
  for (const [k, v] of metrics.logCounters.entries()) {
    lines.push(`solaris_log_events_total{kind="${escapePromLabel(k)}"} ${v}`);
  }

  lines.push('');
  return lines.join('\n');
}

function isMetricsAuthorized(req) {
  if (!metricsToken) return true;
  const url = getRequestUrl(req);
  const tokenQuery = url.searchParams.get('token');
  if (tokenQuery && tokenQuery === metricsToken) return true;
  const auth = String(req.headers.authorization ?? '');
  if (auth.toLowerCase().startsWith('bearer ')) {
    const token = auth.slice('bearer '.length).trim();
    return token === metricsToken;
  }
  return false;
}

function setSecurityHeaders(res, opts) {
  const nonce = opts?.nonce ? String(opts.nonce) : '';
  const isHttps = Boolean(opts?.isHttps);
  const origin = opts?.origin ? String(opts.origin) : '';
  const reportToUrl = origin ? `${origin}${cspReportPath}` : cspReportPath;
  const scriptNonce = nonce ? `'nonce-${nonce}'` : '';
  const styleNonce = nonce ? `'nonce-${nonce}'` : '';

  const hotjarSiteId = String(process.env.VITE_HOTJAR_SITE_ID ?? '').trim();
  const mixpanelToken = String(process.env.VITE_MIXPANEL_TOKEN ?? '').trim();
  const amplitudeApiKey = String(process.env.VITE_AMPLITUDE_API_KEY ?? '').trim();
  const fbPixelId = String(process.env.VITE_FACEBOOK_PIXEL_ID ?? '').trim();
  const liPartnerId = String(process.env.VITE_LINKEDIN_PARTNER_ID ?? '').trim();

  const marketingScriptSrc = [fbPixelId ? 'https://connect.facebook.net' : '', liPartnerId ? 'https://snap.licdn.com' : '']
    .filter(Boolean)
    .join(' ');
  const marketingConnectSrc = [
    fbPixelId ? 'https://www.facebook.com' : '',
    liPartnerId ? 'https://px.ads.linkedin.com' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const analyticsScriptSrc = [
    mixpanelToken ? 'https://cdn.mxpnl.com' : '',
    amplitudeApiKey ? 'https://cdn.amplitude.com' : '',
    hotjarSiteId ? 'https://static.hotjar.com' : '',
  ]
    .filter(Boolean)
    .join(' ');
  const analyticsConnectSrc = [
    'https://region1.google-analytics.com',
    mixpanelToken ? 'https://api.mixpanel.com https://decide.mixpanel.com' : '',
    amplitudeApiKey ? 'https://api2.amplitude.com https://api.amplitude.com' : '',
    hotjarSiteId ? 'https://*.hotjar.com https://*.hotjar.io' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const extraScriptSrc = [marketingScriptSrc, analyticsScriptSrc].filter(Boolean).join(' ');
  const extraConnectSrc = [marketingConnectSrc, analyticsConnectSrc].filter(Boolean).join(' ');

  const cspDirectives = [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    `style-src 'self' ${styleNonce}`.trim(),
    `style-src-elem 'self' ${styleNonce}`.trim(),
    "style-src-attr 'unsafe-inline'",
    `script-src 'self' ${scriptNonce} 'wasm-unsafe-eval' https://telegram.org https://www.googletagmanager.com https://www.google-analytics.com https://s3.tradingview.com https://www.tradingview.com ${extraScriptSrc}`.trim(),
    "worker-src 'self' blob:",
    `connect-src 'self' https://toncenter.com https://tonapi.io https://github.com https://api.dedust.io https://mainnet.api.dedust.io https://bridge.tonapi.io https://tonconnectapi.com https://telegram.org https://config.ton.org https://api.country.is https://api.coingecko.com https://rpc.ankr.com https://api.dexscreener.com https://www.google-analytics.com https://www.googletagmanager.com ${extraConnectSrc} wss:`.trim(),
    "frame-src https://www.google.com https://www.googletagmanager.com https://www.tradingview.com https://s.tradingview.com",
    `report-uri ${cspReportPath}`,
    'report-to csp',
  ];
  if (isHttps) {
    cspDirectives.push('upgrade-insecure-requests');
    cspDirectives.push('block-all-mixed-content');
  }
  const csp = cspDirectives.join('; ');

  res.setHeader('Reporting-Endpoints', `csp="${reportToUrl}"`);
  res.setHeader(
    'Report-To',
    JSON.stringify({
      group: 'csp',
      max_age: 10886400,
      endpoints: [{ url: reportToUrl }],
    }),
  );

  if (cspReportOnly) res.setHeader('Content-Security-Policy-Report-Only', csp);
  else res.setHeader('Content-Security-Policy', csp);

  if (isHttps) res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader(
    'Permissions-Policy',
    [
      'accelerometer=() ',
      'ambient-light-sensor=() ',
      'autoplay=() ',
      'camera=() ',
      'display-capture=() ',
      'document-domain=() ',
      'encrypted-media=() ',
      'fullscreen=(self) ',
      'geolocation=() ',
      'gyroscope=() ',
      'magnetometer=() ',
      'microphone=() ',
      'midi=() ',
      'payment=() ',
      'picture-in-picture=() ',
      'publickey-credentials-get=() ',
      'usb=() ',
      'xr-spatial-tracking=() ',
    ].join(''),
  );
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  if (coepMode) {
    const headerName = coepReportOnly ? 'Cross-Origin-Embedder-Policy-Report-Only' : 'Cross-Origin-Embedder-Policy';
    res.setHeader(headerName, coepMode);
  }
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
}

function generateNonce() {
  return crypto.randomBytes(16).toString('base64');
}

function shouldServeBrotli(req) {
  const accept = String(req.headers['accept-encoding'] ?? '');
  return accept.includes('br');
}

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
};

const apiRoutes = new Map([
  ['/api/chat', 'api/chat/route.js'],
  ['/api/react', 'api/react/route.js'],
  ['/api/recovery', 'api/recovery/route.js'],
  ['/api/route', 'api/route/route.js'],
  ['/api/lyapunov', 'api/lyapunov/route.js'],
  ['/api/mermaid/agent', 'api/mermaid/agent/route.js'],
  ['/api/status', 'api/status/route.js'],
  ['/api/health', 'api/health/route.js'],
  ['/api/metrics', 'api/metrics/route.js'],
  ['/api/cache', 'api/cache/route.js'],
  ['/api/market/coingecko', 'api/market/coingecko/route.js'],
  ['/api/cetuia/tokens', 'api/cetuia/tokens/route.js'],
  ['/api/wallet/balance', 'api/wallet/balance/route.js'],
  ['/api/ton/balance', 'api/ton/balance/route.js'],
  ['/api/ton/dns/resolve', 'api/ton/dns/resolve/route.js'],
  ['/api/ton/dns/backresolve', 'api/ton/dns/backresolve/route.js'],
  ['/api/ton/txs', 'api/ton/txs/route.js'],
  ['/api/ton/indexed-txs', 'api/ton/indexed-txs/route.js'],
  ['/api/auth', 'api/auth/route.js'],
  ['/api/audit', 'api/audit/route.js'],
  ['/api/gdpr', 'api/gdpr/route.js'],
  ['/api/gdpr/export', 'api/gdpr/export/route.js'],
  ['/api/waitlist', 'api/waitlist/route.js'],
  ['/api/newsletter/subscribe', 'api/newsletter/subscribe/route.js'],
  ['/api/newsletter/confirm', 'api/newsletter/confirm/route.js'],
  ['/api/newsletter/verify', 'api/newsletter/verify/route.js'],
  ['/api/newsletter/unsubscribe', 'api/newsletter/unsubscribe/route.js'],
  ['/api/jobs/email-outbox', 'api/jobs/email-outbox/route.js'],
  ['/api/jobs/price-alerts', 'api/jobs/price-alerts/route.js'],
  ['/api/jobs/ton-indexer', 'api/jobs/ton-indexer/route.js'],
  ['/api/alerts', 'api/alerts/route.js'],
  ['/api/account/profile', 'api/account/profile/route.js'],
  ['/api/push/vapid', 'api/push/vapid/route.js'],
  ['/api/push/subscribe', 'api/push/subscribe/route.js'],
  ['/api/push/unsubscribe', 'api/push/unsubscribe/route.js'],
  ['/api/push/test', 'api/push/test/route.js'],
  ['/api/support/start', 'api/support/start/route.js'],
  ['/api/support/messages', 'api/support/messages/route.js'],
  ['/api/support/message', 'api/support/message/route.js'],
  ['/api/analytics/track', 'api/analytics/track/route.js'],
  ['/api/ai/ask', 'api/ai/ask/route.js'],
  ['/api/ai/history', 'api/ai/history/route.js'],
  ['/api/ai/pins', 'api/ai/pins/route.js'],
  ['/api/ai/report', 'api/ai/report/route.js'],
  ['/api/ai/feedback', 'api/ai/feedback/route.js'],
  ['/api/ai/admin/queries', 'api/ai/admin/queries/route.js'],
  ['/api/ai/admin/feedback', 'api/ai/admin/feedback/route.js'],
  ['/api/admin/conversations', 'api/admin/conversations/route.js'],
  ['/api/admin/conversation', 'api/admin/conversation/route.js'],
  ['/api/admin/conversation/reply', 'api/admin/conversation/reply/route.js'],
  ['/api/admin/conversation/resolve', 'api/admin/conversation/resolve/route.js'],
  ['/api/admin/leads', 'api/admin/leads/route.js'],
  ['/api/admin/audit', 'api/admin/audit/route.js'],
  ['/api/admin/login', 'api/admin/login/route.js'],
  ['/api/admin/logout', 'api/admin/logout/route.js'],
  ['/api/admin/me', 'api/admin/me/route.js'],
  ['/api/admin/signup', 'api/admin/signup/route.js'],
  ['/api/admin/stats', 'api/admin/stats/route.js'],
  ['/api/admin/token', 'api/admin/token/route.js'],
  ['/api/admin/users', 'api/admin/users/route.js'],
  ['/api/admin/invites', 'api/admin/invites/route.js'],
  ['/api/admin/i18n', 'api/admin/i18n/route.js'],
  ['/api/admin/i18n/export', 'api/admin/i18n/export/route.js'],
  ['/api/admin/settings', 'api/admin/settings/route.js'],
  ['/api/admin/cache/clear', 'api/admin/cache/clear/route.js'],
  ['/api/admin/media/upload', 'api/admin/media/upload/route.js'],
  ['/api/admin/cms/posts', 'api/admin/cms/posts/route.js'],
  ['/api/admin/cms/post', 'api/admin/cms/post/route.js'],
  ['/api/admin/cms/blocks', 'api/admin/cms/blocks/route.js'],
  ['/api/admin/ai/conversations', 'api/admin/ai/conversations/route.js'],
  ['/api/admin/ai/kb/reindex', 'api/admin/ai/kb/reindex/route.js'],
  ['/api/admin/analytics/overview', 'api/admin/analytics/overview/route.js'],
  ['/api/admin/cetuia/seed', 'api/admin/cetuia/seed/route.js'],
  ['/api/admin/cetuia/tokens', 'api/admin/cetuia/tokens/route.js'],
  ['/api/web3/intents', 'api/web3/intents/route.js'],

  ['/api/v1/price', 'api/v1/price/route.js'],
  ['/api/v1/stats', 'api/v1/stats/route.js'],
  ['/api/v1/transactions', 'api/v1/transactions/route.js'],
  ['/api/v1/webhooks', 'api/v1/webhooks/route.js'],
  ['/api/v1/webhooks/deliveries', 'api/v1/webhooks/deliveries/route.js'],

  ['/api/v2/price', 'api/v2/price/route.js'],
  ['/api/v2/ai/oracle', 'api/v2/ai/oracle/route.js'],
  ['/api/v2/stats', 'api/v2/stats/route.js'],
  ['/api/v2/transactions', 'api/v2/transactions/route.js'],

  ['/api/openapi/v1', 'api/openapi/v1/route.js'],
  ['/api/openapi/v2', 'api/openapi/v2/route.js'],

  ['/api/console/api-keys', 'api/console/api-keys/route.js'],
  ['/api/console/webhooks', 'api/console/webhooks/route.js'],
  ['/api/console/webhooks/deliveries', 'api/console/webhooks/deliveries/route.js'],
]);

const handlerCache = new Map();

function getRequestUrl(req) {
  const proto = String(req.headers['x-forwarded-proto'] ?? 'http').split(',')[0].trim();
  const hostHeader = String(req.headers['x-forwarded-host'] ?? req.headers.host ?? 'localhost')
    .split(',')[0]
    .trim();
  return new URL(req.url ?? '/', `${proto}://${hostHeader}`);
}

async function readBody(req) {
  const maxBytes = 1024 * 1024;
  return await new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > maxBytes) {
        reject(new Error('Body too large'));
        req.destroy();
        return;
      }
      chunks.push(Buffer.from(c));
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function readBodyLimited(req, maxBytes) {
  return await new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > maxBytes) {
        reject(new Error('Body too large'));
        req.destroy();
        return;
      }
      chunks.push(Buffer.from(c));
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function serveFile(res, absPath) {
  const ext = path.extname(absPath).toLowerCase();
  const basePath = ext === '.br' ? absPath.slice(0, -3) : absPath;
  const baseExt = path.extname(basePath).toLowerCase();
  const type = contentTypes[baseExt] ?? 'application/octet-stream';
  res.statusCode = 200;
  res.setHeader('Content-Type', type);
  const baseName = path.basename(basePath);
  if (baseName === 'sw.js' || /^sw-[a-f0-9]{7}\.js$/i.test(baseName)) {
    res.setHeader('Cache-Control', 'no-store');
  } else if (baseExt === '.html' || baseExt === '.json' || baseExt === '.xml' || baseExt === '.txt') {
    res.setHeader('Cache-Control', 'no-store');
  } else {
    res.setHeader('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable');
  }
  createReadStream(absPath).pipe(res);
}

async function tryServeStatic(req, reqUrl, res) {
  let pathname = decodeURIComponent(reqUrl.pathname);
  if (pathname.includes('\0')) return false;
  const candidates = [];
  if (pathname === '/') {
    candidates.push('/index.html');
  } else {
    candidates.push(pathname);
    if (pathname.endsWith('/')) candidates.push(`${pathname}index.html`);
    else candidates.push(`${pathname}/index.html`);
  }
  try {
    for (const candidate of candidates) {
      const absPath = path.join(distDir, path.normalize(candidate));
      if (!absPath.startsWith(distDir)) continue;
      if (shouldServeBrotli(req)) {
        try {
          const brPath = `${absPath}.br`;
          const brStat = await stat(brPath);
          if (brStat.isFile()) {
            if (absPath === path.join(distDir, 'index.html')) continue;
            setSecurityHeaders(res, { isHttps: reqUrl.protocol === 'https:', origin: reqUrl.origin });
            res.setHeader('Content-Encoding', 'br');
            res.setHeader('Vary', 'Accept-Encoding');
            await serveFile(res, brPath);
            return true;
          }
        } catch {
          void 0;
        }
      }

      const st = await stat(absPath);
      if (!st.isFile()) continue;
      const nonce = absPath === path.join(distDir, 'index.html') ? generateNonce() : '';
      setSecurityHeaders(res, { nonce, isHttps: reqUrl.protocol === 'https:', origin: reqUrl.origin });
      if (nonce) {
        await serveSpaIndex(res, nonce, reqUrl.protocol === 'https:', reqUrl.origin);
      } else {
        await serveFile(res, absPath);
      }
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

async function serveSpaIndex(res, nonce, isHttps, origin) {
  const indexPath = path.join(distDir, 'index.html');
  const html = String(await readFile(indexPath));
  const withNonce = nonce ? html.replaceAll('__CSP_NONCE__', nonce) : html;
  res.statusCode = 200;
  setSecurityHeaders(res, { nonce, isHttps, origin });
  res.setHeader('Content-Type', contentTypes['.html']);
  res.setHeader('Cache-Control', 'no-store');
  res.end(withNonce);
}

async function serveIndex(res, reqUrl) {
  const nonce = generateNonce();
  res.statusCode = 200;
  setSecurityHeaders(res, { nonce, isHttps: reqUrl.protocol === 'https:', origin: reqUrl.origin });
  res.setHeader('Content-Type', contentTypes['.html']);
  res.setHeader('Cache-Control', 'no-store');
  const indexPath = path.join(distDir, 'index.html');
  const html = String(await readFile(indexPath));
  res.end(html.replaceAll('__CSP_NONCE__', nonce));
}

function loadApiHandler(relPath) {
  const cached = handlerCache.get(relPath);
  if (cached) return cached;
  const abs = path.join(apiDistDir, relPath);
  const mod = require(abs);
  const handler = mod?.default;
  if (typeof handler !== 'function') throw new Error('Invalid handler');
  handlerCache.set(relPath, handler);
  return handler;
}

async function serveApi(req, res, reqUrl) {
  let rel = apiRoutes.get(reqUrl.pathname);
  if (!rel && reqUrl.pathname.startsWith('/api/')) {
    const candidate = `${reqUrl.pathname.slice(1)}/route.js`;
    const normalized = path.posix.normalize(candidate);
    if (normalized.startsWith('api/') && !normalized.includes('..')) {
      const abs = path.join(apiDistDir, normalized);
      try {
        if (fs.existsSync(abs) && fs.statSync(abs).isFile()) {
          rel = normalized;
        }
      } catch {
        void 0;
      }
    }
  }
  if (!rel) return false;
  const handler = loadApiHandler(rel);
  const method = req.method ?? 'GET';
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (v === undefined) continue;
    if (Array.isArray(v)) headers.set(k, v.join(','));
    else headers.set(k, v);
  }
  const body =
    method === 'GET' || method === 'HEAD' || method === 'OPTIONS'
      ? undefined
      : await readBody(req).catch(() => Buffer.from(''));
  const request = new Request(reqUrl.toString(), { method, headers, body });
  const response = await handler(request);
  if (response && response.status >= 500 && sentry) {
    try {
      sentry.captureMessage('api_error_response', {
        level: 'error',
        extra: {
          path: reqUrl.pathname,
          method,
          status: response.status,
        },
      });
    } catch {
      void 0;
    }
  }
  res.statusCode = response.status;
  setSecurityHeaders(res, { isHttps: reqUrl.protocol === 'https:', origin: reqUrl.origin });
  for (const [k, v] of response.headers.entries()) res.setHeader(k, v);
  const buf = Buffer.from(await response.arrayBuffer());
  res.end(buf);
  return true;
}

async function main() {
  await otelReady;
  const server = http.createServer(async (req, res) => {
    const start = Date.now();
    const requestId = String(req.headers['x-request-id'] ?? '').trim() || crypto.randomUUID();
    res.setHeader('X-Request-Id', requestId);
    const activeSpan = (() => {
      try {
        return otelTrace.getSpan(otelContext.active());
      } catch {
        return null;
      }
    })();
    const spanCtx = activeSpan ? activeSpan.spanContext() : null;
    const tp =
      spanCtx && spanCtx.traceId && spanCtx.spanId
        ? { traceId: String(spanCtx.traceId), spanId: String(spanCtx.spanId) }
        : parseTraceParent(req.headers.traceparent);

    res.on('finish', () => {
      try {
        const pathname = (() => {
          try {
            return getRequestUrl(req).pathname;
          } catch {
            return '/';
          }
        })();
        const dur = Date.now() - start;
        recordRequestMetric(req.method ?? 'GET', pathname, res.statusCode, dur);
        if (log) {
          log.info(
            {
              kind: 'http',
              request_id: requestId,
              trace_id: tp?.traceId ?? null,
              span_id: tp?.spanId ?? null,
              method: String(req.method ?? 'GET').toUpperCase(),
              path: pathname,
              status: res.statusCode,
              duration_ms: dur,
            },
            'http_request',
          );
        }
      } catch {
        void 0;
      }
    });

    try {
      const reqUrl = getRequestUrl(req);
      const p = reqUrl.pathname;

    if (forceHttps && reqUrl.protocol === 'http:' && reqUrl.hostname !== 'localhost' && reqUrl.hostname !== '127.0.0.1') {
      const location = new URL(reqUrl.toString());
      location.protocol = 'https:';
      const status = req.method === 'GET' || req.method === 'HEAD' ? 301 : 308;
      res.statusCode = status;
      setSecurityHeaders(res, { isHttps: true, origin: location.origin });
      res.setHeader('Location', location.toString());
      res.setHeader('Cache-Control', 'no-store');
      res.end();
      return;
    }

    const URL_LOCALES = ['en', 'es', 'zh', 'ru', 'ro', 'pt', 'de'];
    const normalizePathname = (pathname) => {
      const s = String(pathname || '/');
      const withSlash = s.startsWith('/') ? s : `/${s}`;
      return withSlash.replace(/\/{2,}/g, '/');
    };
    const isLikelyFileRequest = (pathname) => {
      const p0 = normalizePathname(pathname);
      const last = p0.split('/').pop() || '';
      return last.includes('.') && !p0.startsWith('/.well-known/');
    };
    const shouldLocalePrefixPathname = (pathname) => {
      const p0 = normalizePathname(pathname);
      if (isLikelyFileRequest(p0)) return false;
      if (p0.startsWith('/assets/') || p0.startsWith('/images/') || p0.startsWith('/fonts/')) return false;
      if (p0.startsWith('/api/')) return false;
      if (p0 === '/metrics' || p0 === '/sitemap.xml' || p0 === '/robots.txt') return false;
      if (p0.startsWith('/.well-known/')) return false;
      if (p0 === '/audit' || p0.startsWith('/audit/')) return false;
      if (p0 === '/whitepaper' || p0 === '/whitepaper/') return false;
      if (p0.startsWith('/sovereign/') || p0.startsWith('/apocalypse/')) return false;
      return true;
    };
    const readCookie = (name) => {
      try {
        const raw = req.headers.cookie || '';
        const parts = String(raw)
          .split(';')
          .map((x) => x.trim())
          .filter(Boolean);
        for (const part of parts) {
          const eq = part.indexOf('=');
          if (eq <= 0) continue;
          const k = part.slice(0, eq);
          const v = part.slice(eq + 1);
          if (k === name) return decodeURIComponent(v);
        }
      } catch {
        void 0;
      }
      return null;
    };
    const parseLocalePrefix = (pathname) => {
      const parts = normalizePathname(pathname).split('/').filter(Boolean);
      const first = parts[0] || '';
      if (!URL_LOCALES.includes(first)) return { locale: null, pathnameNoLocale: normalizePathname(pathname) };
      const rest = `/${parts.slice(1).join('/')}`;
      const pathnameNoLocale = rest === '/' ? '/' : normalizePathname(rest).replace(/\/$/, '') || '/';
      return { locale: first, pathnameNoLocale };
    };
    const localizePathname = (pathnameNoLocale, locale) => {
      const base = normalizePathname(pathnameNoLocale).replace(/\/$/, '') || '/';
      if (!shouldLocalePrefixPathname(base)) return base;
      if (base === '/') return `/${locale}/`;
      return normalizePathname(`/${locale}${base}`);
    };
    const detectLocale = () => {
      try {
        const qp = reqUrl.searchParams.get('lang');
        const candidate = qp ? String(qp).slice(0, 2).toLowerCase() : '';
        if (candidate && URL_LOCALES.includes(candidate)) return candidate;
      } catch {
        void 0;
      }
      const cookieLang = readCookie('solaris_lang');
      if (cookieLang && URL_LOCALES.includes(cookieLang)) return cookieLang;
      try {
        const al = req.headers['accept-language'] || '';
        const tokens = String(al)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        for (const token of tokens) {
          const m = /^([a-zA-Z]{2})\b/.exec(token);
          const code = m && m[1] ? m[1].toLowerCase() : '';
          if (code && URL_LOCALES.includes(code)) return code;
        }
      } catch {
        void 0;
      }
      return 'en';
    };

    if ((req.method === 'GET' || req.method === 'HEAD') && shouldLocalePrefixPathname(p)) {
      const accept = String(req.headers.accept || '');
      const acceptsHtml = !accept || accept.includes('text/html') || accept.includes('*/*');
      if (acceptsHtml) {
        const { locale: localePrefix, pathnameNoLocale } = parseLocalePrefix(p);
        if (localePrefix) {
          const canonical = localizePathname(pathnameNoLocale, localePrefix);
          if (p !== canonical) {
            const location = new URL(reqUrl.toString());
            location.pathname = canonical;
            res.statusCode = 301;
            setSecurityHeaders(res, { isHttps: reqUrl.protocol === 'https:', origin: reqUrl.origin });
            res.setHeader('Location', location.toString());
            res.setHeader('Cache-Control', 'no-store');
            res.end();
            return;
          }
        } else {
          const targetLocale = detectLocale();
          const canonical = localizePathname(pathnameNoLocale, targetLocale);
          const location = new URL(reqUrl.toString());
          location.pathname = canonical;
          location.searchParams.delete('lang');
          res.statusCode = 302;
          setSecurityHeaders(res, { isHttps: reqUrl.protocol === 'https:', origin: reqUrl.origin });
          try {
            const qp = reqUrl.searchParams.get('lang');
            const candidate = qp ? String(qp).slice(0, 2).toLowerCase() : '';
            if (candidate && URL_LOCALES.includes(candidate)) {
              res.setHeader('Set-Cookie', `solaris_lang=${encodeURIComponent(candidate)}; Path=/; Max-Age=31536000; SameSite=Lax`);
            }
          } catch {
            void 0;
          }
          res.setHeader('Location', location.toString());
          res.setHeader('Cache-Control', 'no-store');
          res.end();
          return;
        }
      }
    }

    if (p === cspReportPath) {
      if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        setSecurityHeaders(res, { isHttps: reqUrl.protocol === 'https:', origin: reqUrl.origin });
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.setHeader('Cache-Control', 'no-store');
        res.end();
        return;
      }
      if (req.method !== 'POST') {
        res.statusCode = 405;
        setSecurityHeaders(res, { isHttps: reqUrl.protocol === 'https:', origin: reqUrl.origin });
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        res.end(JSON.stringify({ error: 'Method not allowed' }));
        return;
      }

      try {
        const body = await readBodyLimited(req, 64 * 1024);
        const text = body.toString('utf8');
        const payload = (() => {
          try {
            return JSON.parse(text);
          } catch {
            return null;
          }
        })();
        if (payload && typeof payload === 'object') {
          const report =
            payload['csp-report'] && typeof payload['csp-report'] === 'object'
              ? payload['csp-report']
              : Array.isArray(payload) && payload.length
                ? payload[0]
                : payload;
          const blocked = typeof report?.['blocked-uri'] === 'string' ? report['blocked-uri'] : '';
          const violated = typeof report?.['violated-directive'] === 'string' ? report['violated-directive'] : '';
          const doc = typeof report?.['document-uri'] === 'string' ? report['document-uri'] : '';
          const docOrigin = (() => {
            try {
              return doc ? new URL(doc).origin : '';
            } catch {
              return '';
            }
          })();
          if (blocked || violated) {
            console.warn('[csp-violation]', {
              blocked,
              violated,
              documentOrigin: docOrigin,
            });
          }
        }
      } catch {
        void 0;
      }

      res.statusCode = 204;
      setSecurityHeaders(res, { isHttps: reqUrl.protocol === 'https:', origin: reqUrl.origin });
      res.setHeader('Cache-Control', 'no-store');
      res.end();
      return;
    }

    if (p === '/metrics') {
      if (!isMetricsAuthorized(req)) {
        res.statusCode = 401;
        setSecurityHeaders(res, { isHttps: reqUrl.protocol === 'https:', origin: reqUrl.origin });
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        res.end('unauthorized');
        return;
      }
      res.statusCode = 200;
      setSecurityHeaders(res, { isHttps: reqUrl.protocol === 'https:', origin: reqUrl.origin });
      res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      res.end(formatPromMetrics());
      return;
    }
    const sendRedirect = (location, code = 301) => {
      res.statusCode = code;
      setSecurityHeaders(res, { isHttps: reqUrl.protocol === 'https:', origin: reqUrl.origin });
      res.setHeader('Location', location);
      res.setHeader('Cache-Control', 'no-store');
      res.end();
    };

    if (p === '/audit') {
      sendRedirect('/audit/');
      return;
    }

    if (p === '/status' || p === '/status/') {
      sendRedirect('/status.html');
      return;
    }

    if (p === '/privacy-policy') {
      sendRedirect('/privacy');
      return;
    }
    if (p === '/terms-and-conditions') {
      sendRedirect('/terms');
      return;
    }
    if (p === '/cookie-policy') {
      sendRedirect('/cookies');
      return;
    }

    const localeMatch = p.match(/^\/(en|es|zh|ru|ro|pt|de)(\/.*)?$/);
    if (localeMatch) {
      const locale = localeMatch[1];
      const restRaw = localeMatch[2] ?? '/';
      const rest = (restRaw.replace(/\/$/, '') || '/').replace('/index.html', '/');

      if (p === `/${locale}`) {
        sendRedirect(`/${locale}/`);
        return;
      }
      if (rest === '/privacy-policy') {
        sendRedirect(`/${locale}/privacy`);
        return;
      }
      if (rest === '/terms-and-conditions') {
        sendRedirect(`/${locale}/terms`);
        return;
      }
      if (rest === '/cookie-policy') {
        sendRedirect(`/${locale}/cookies`);
        return;
      }
    }
    if (
      p.startsWith('/wp-admin') ||
      p.startsWith('/wp-content') ||
      p.startsWith('/wp-includes') ||
      p.startsWith('/wordpress') ||
      p === '/wp-login.php' ||
      p === '/xmlrpc.php'
    ) {
      res.statusCode = 404;
      setSecurityHeaders(res, { isHttps: reqUrl.protocol === 'https:', origin: reqUrl.origin });
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'Not found' }));
      return;
    }
    if (await tryServeStatic(req, reqUrl, res)) return;
    if (reqUrl.pathname.startsWith('/api/')) {
      if (await serveApi(req, res, reqUrl)) return;
      res.statusCode = 404;
      setSecurityHeaders(res, { isHttps: reqUrl.protocol === 'https:' });
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'Not found' }));
      return;
    }
    await serveIndex(res, reqUrl);
    } catch (err) {
      try {
        incMap(metrics.logCounters, 'server_error', 1);
      } catch {
        void 0;
      }
      try {
        if (log) log.error({ err, request_id: requestId, trace_id: tp?.traceId ?? null }, 'server_error');
        else console.error(err);
      } catch {
        void 0;
      }
      try {
        if (sentry) sentry.captureException(err);
      } catch {
        void 0;
      }
      res.statusCode = 500;
      setSecurityHeaders(res, { isHttps: true });
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'Server error' }));
    }
  });

  server.listen(port, host);
}

void main();
