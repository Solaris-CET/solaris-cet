function jsonRateLimited(allowedOrigin: string): Response {
  return new Response(JSON.stringify({ error: 'Rate limited' }), {
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': allowedOrigin,
      Vary: 'Origin',
      'Cache-Control': 'no-store',
    },
  });
}

export async function withUpstashRateLimit(
  req: Request,
  allowedOrigin: string,
  opts: { keyPrefix: string; limit: number; windowSeconds: number },
): Promise<Response | null> {
  const url = (process.env.UPSTASH_REDIS_REST_URL ?? '').trim();
  const token = (process.env.UPSTASH_REDIS_REST_TOKEN ?? '').trim();
  if (!url || !token) return null;

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
  const key = `${opts.keyPrefix}:${ip}`;

  try {
    const incr = await fetch(`${url}/incr/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    const payload = (await incr.json()) as { result?: unknown };
    const count = typeof payload.result === 'number' ? payload.result : Number.NaN;
    if (Number.isFinite(count) && count === 1) {
      await fetch(`${url}/expire/${encodeURIComponent(key)}/${opts.windowSeconds}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
    }
    if (Number.isFinite(count) && count > opts.limit) return jsonRateLimited(allowedOrigin);
  } catch {
    return null;
  }

  return null;
}

