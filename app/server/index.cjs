const http = require('node:http');
const { readFile, stat } = require('node:fs/promises');
const { createReadStream } = require('node:fs');
const path = require('node:path');

const appRoot = path.resolve(__dirname, '..');
const distDir = path.join(appRoot, 'dist');
const apiDistDir = path.join(appRoot, '.api-dist');

const port = Number.parseInt(process.env.PORT ?? '3000', 10);
const host = process.env.HOST ?? '0.0.0.0';

function setSecurityHeaders(res) {
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'wasm-unsafe-eval'",
      "worker-src 'self' blob:",
      "connect-src 'self' https://mainnet.api.dedust.io https://api.dedust.io https://toncenter.com https://rpc.ankr.com https://api.dexscreener.com wss://bridge.tonapi.io wss://bridge.ton.space",
    ].join('; '),
  );
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('X-Solaris-Server', 'node-static-v4');
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
  ['/api/wallet/balance', 'api/wallet/balance/route.js'],
  ['/api/ton/balance', 'api/ton/balance/route.js'],
  ['/api/auth', 'api/auth/route.js'],
  ['/api/audit', 'api/audit/route.js'],
  ['/api/gdpr', 'api/gdpr/route.js'],
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
  return await new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(Buffer.from(c)));
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
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
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
            setSecurityHeaders(res);
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
      setSecurityHeaders(res);
      await serveFile(res, absPath);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

async function serveIndex(res) {
  const indexPath = path.join(distDir, 'index.html');
  const html = await readFile(indexPath);
  res.statusCode = 200;
  setSecurityHeaders(res);
  res.setHeader('Content-Type', contentTypes['.html']);
  res.setHeader('Cache-Control', 'no-store');
  res.end(html);
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
  const rel = apiRoutes.get(reqUrl.pathname);
  if (!rel) return false;
  const handler = loadApiHandler(rel);
  const method = req.method ?? 'GET';
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (v === undefined) continue;
    if (Array.isArray(v)) headers.set(k, v.join(','));
    else headers.set(k, v);
  }
  const body = method === 'GET' || method === 'HEAD' || method === 'OPTIONS' ? undefined : await readBody(req);
  const request = new Request(reqUrl.toString(), { method, headers, body });
  const response = await handler(request);
  res.statusCode = response.status;
  setSecurityHeaders(res);
  for (const [k, v] of response.headers.entries()) res.setHeader(k, v);
  const buf = Buffer.from(await response.arrayBuffer());
  res.end(buf);
  return true;
}

const server = http.createServer(async (req, res) => {
  try {
    const reqUrl = getRequestUrl(req);
    const p = reqUrl.pathname;
    if (
      p.startsWith('/wp-admin') ||
      p.startsWith('/wp-content') ||
      p.startsWith('/wp-includes') ||
      p.startsWith('/wordpress') ||
      p === '/wp-login.php' ||
      p === '/xmlrpc.php'
    ) {
      res.statusCode = 404;
      setSecurityHeaders(res);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'Not found' }));
      return;
    }
    if (await tryServeStatic(req, reqUrl, res)) return;
    if (reqUrl.pathname.startsWith('/api/')) {
      if (await serveApi(req, res, reqUrl)) return;
      res.statusCode = 404;
      setSecurityHeaders(res);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'Not found' }));
      return;
    }
    await serveIndex(res);
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    setSecurityHeaders(res);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'Server error' }));
  }
});

server.listen(port, host);
