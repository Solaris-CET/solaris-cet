import { clientIp } from './clientIp';
import { redisDecr, redisIncr } from './upstashRedis';

type ConcurrencyAcquireOpts = {
  keyPrefix: string;
  limit: unknown;
  ttlSeconds: unknown;
  allowedOrigin: string;
  keyPart?: string | null;
  retryAfterSeconds?: number;
};

function parsePositiveInt(v: unknown, fallback: number): number {
  const n = typeof v === 'number' ? v : Number(String(v ?? '').trim());
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

function overloadedResponse(allowedOrigin: string, retryAfterSeconds: number): Response {
  return new Response(JSON.stringify({ error: 'overloaded', message: 'System is busy. Please retry shortly.' }), {
    status: 503,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': allowedOrigin,
      Vary: 'Origin',
      'Cache-Control': 'no-store',
      'Retry-After': String(retryAfterSeconds),
    },
  });
}

const localInflight = new Map<string, { count: number; resetAtMs: number }>();

function nowMs() {
  return Date.now();
}

function cleanupLocalInflight(now: number) {
  if (localInflight.size < 5000) return;
  for (const [k, v] of localInflight.entries()) {
    if (v.resetAtMs <= now) localInflight.delete(k);
  }
}

export async function acquireConcurrencySlot(
  req: Request,
  opts: ConcurrencyAcquireOpts,
): Promise<{ release: () => Promise<void> } | Response> {
  const retryAfterSeconds = parsePositiveInt(opts.retryAfterSeconds, 2);
  const keyPart = (opts.keyPart ?? '').trim() || clientIp(req);
  const key = `${opts.keyPrefix}:${keyPart}`;

  const ttlSeconds = parsePositiveInt(opts.ttlSeconds, 45);
  const limit = parsePositiveInt(opts.limit, 2);

  const count = await redisIncr(key, ttlSeconds);
  if (count !== null) {
    if (count > limit) {
      void redisDecr(key);
      return overloadedResponse(opts.allowedOrigin, retryAfterSeconds);
    }
    return {
      release: async () => {
        void redisDecr(key);
      },
    };
  }

  const now = nowMs();
  const existing = localInflight.get(key);
  if (!existing || existing.resetAtMs <= now) {
    localInflight.set(key, { count: 1, resetAtMs: now + ttlSeconds * 1000 });
    cleanupLocalInflight(now);
    return {
      release: async () => {
        const v = localInflight.get(key);
        if (!v) return;
        v.count = Math.max(0, v.count - 1);
      },
    };
  }
  existing.count += 1;
  if (existing.count > limit) {
    existing.count = Math.max(0, existing.count - 1);
    return overloadedResponse(opts.allowedOrigin, retryAfterSeconds);
  }
  return {
    release: async () => {
      const v = localInflight.get(key);
      if (!v) return;
      v.count = Math.max(0, v.count - 1);
    },
  };
}
