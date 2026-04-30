import { clientIp } from './clientIp';

function jsonRateLimited(allowedOrigin: string, retryAfterSeconds: number): Response {
  return new Response(JSON.stringify({ error: 'Rate limited' }), {
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': allowedOrigin,
      Vary: 'Origin',
      'Cache-Control': 'no-store',
      'Retry-After': String(Math.max(1, Math.floor(retryAfterSeconds || 1))),
    },
  });
}

type RateLimitOpts = { keyPrefix: string; limit: number; windowSeconds: number };

const localWindows = new Map<string, { count: number; resetAtMs: number }>();

function nowMs() {
  return Date.now();
}

function cleanupLocalWindows(now: number) {
  if (localWindows.size < 5000) return;
  for (const [k, v] of localWindows.entries()) {
    if (v.resetAtMs <= now) localWindows.delete(k);
  }
}

export function withLocalRateLimit(req: Request, allowedOrigin: string, opts: RateLimitOpts): Response | null {
  const ip = clientIp(req);
  const key = `${opts.keyPrefix}:${ip}`;
  const now = nowMs();
  const existing = localWindows.get(key);
  if (!existing || existing.resetAtMs <= now) {
    localWindows.set(key, { count: 1, resetAtMs: now + opts.windowSeconds * 1000 });
    cleanupLocalWindows(now);
    return null;
  }
  existing.count += 1;
  if (existing.count > opts.limit) return jsonRateLimited(allowedOrigin, opts.windowSeconds);
  return null;
}

export async function withUpstashRateLimit(
  req: Request,
  allowedOrigin: string,
  opts: RateLimitOpts,
): Promise<Response | null> {
  const url = (process.env.UPSTASH_REDIS_REST_URL ?? '').trim();
  const token = (process.env.UPSTASH_REDIS_REST_TOKEN ?? '').trim();
  if (!url || !token) return null;

  const ip = clientIp(req);
  const key = `${opts.keyPrefix}:${ip}`;

  try {
    const incr = await fetch(`${url}/incr/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-store' },
    });
    const payload = (await incr.json()) as { result?: unknown };
    const count = typeof payload.result === 'number' ? payload.result : Number.NaN;
    if (Number.isFinite(count) && count === 1) {
      await fetch(`${url}/expire/${encodeURIComponent(key)}/${opts.windowSeconds}`, {
        headers: { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-store' },
      });
    }
    if (Number.isFinite(count) && count > opts.limit) return jsonRateLimited(allowedOrigin, opts.windowSeconds);
  } catch {
    return null;
  }

  return null;
}

export async function withRateLimit(
  req: Request,
  allowedOrigin: string,
  opts: RateLimitOpts & { preferUpstash?: boolean },
): Promise<Response | null> {
  const preferUpstash = opts.preferUpstash !== false;
  if (preferUpstash) {
    const upstash = await withUpstashRateLimit(req, allowedOrigin, opts);
    if (upstash) return upstash;
  }
  return withLocalRateLimit(req, allowedOrigin, opts);
}
