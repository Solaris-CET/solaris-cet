import { clientIp } from './clientIp';

type RateLimitDecision =
  | { ok: true; limit: number; remaining: number; resetAtEpochSeconds: number }
  | { ok: false; limit: number; remaining: number; resetAtEpochSeconds: number; retryAfterSeconds: number };

type WindowState = { count: number; resetAtMs: number };

const windows = new Map<string, WindowState>();

function nowMs() {
  return Date.now();
}

function cleanup(now: number) {
  if (windows.size < 5000) return;
  for (const [k, v] of windows.entries()) {
    if (v.resetAtMs <= now) windows.delete(k);
  }
}

export function decideRateLimit(opts: {
  req: Request;
  bucket: string;
  limit: number;
  windowSeconds: number;
  keyPart?: string;
}): RateLimitDecision {
  const ip = clientIp(opts.req);
  const keyPart = (opts.keyPart ?? '').slice(0, 200);
  const key = `${opts.bucket}:${keyPart}:${ip}`;
  const now = nowMs();
  const existing = windows.get(key);
  if (!existing || existing.resetAtMs <= now) {
    const resetAtMs = now + opts.windowSeconds * 1000;
    windows.set(key, { count: 1, resetAtMs });
    cleanup(now);
    return {
      ok: true,
      limit: opts.limit,
      remaining: Math.max(0, opts.limit - 1),
      resetAtEpochSeconds: Math.floor(resetAtMs / 1000),
    };
  }

  existing.count += 1;
  const remaining = Math.max(0, opts.limit - existing.count);
  const resetAtEpochSeconds = Math.floor(existing.resetAtMs / 1000);
  if (existing.count > opts.limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAtMs - now) / 1000));
    return { ok: false, limit: opts.limit, remaining: 0, resetAtEpochSeconds, retryAfterSeconds };
  }
  return { ok: true, limit: opts.limit, remaining, resetAtEpochSeconds };
}

export function rateLimitHeaders(d: RateLimitDecision): Record<string, string> {
  const base: Record<string, string> = {
    'X-RateLimit-Limit': String(d.limit),
    'X-RateLimit-Remaining': String(d.remaining),
    'X-RateLimit-Reset': String(d.resetAtEpochSeconds),
    'Access-Control-Expose-Headers': 'X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, Retry-After',
  };
  if (!d.ok) base['Retry-After'] = String(d.retryAfterSeconds);
  return base;
}
