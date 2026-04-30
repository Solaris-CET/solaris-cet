type UpstashResponse<T> = { result: T };

function cfg(): { url: string; token: string } | null {
  const url = (process.env.UPSTASH_REDIS_REST_URL ?? '').trim();
  const token = (process.env.UPSTASH_REDIS_REST_TOKEN ?? '').trim();
  if (!url || !token) return null;
  return { url, token };
}

async function upstashFetch(path: string): Promise<Response | null> {
  const c = cfg();
  if (!c) return null;
  try {
    return await fetch(`${c.url}${path}`, {
      headers: { Authorization: `Bearer ${c.token}`, 'Cache-Control': 'no-store' },
    });
  } catch {
    return null;
  }
}

export async function redisGetString(key: string): Promise<string | null> {
  const res = await upstashFetch(`/get/${encodeURIComponent(key)}`);
  if (!res?.ok) return null;
  try {
    const payload = (await res.json()) as UpstashResponse<string | null>;
    return payload?.result ?? null;
  } catch {
    return null;
  }
}

export async function redisGetJson<T>(key: string): Promise<T | null> {
  const s = await redisGetString(key);
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

export async function redisSetString(key: string, value: string, exSeconds: number): Promise<boolean> {
  const res = await upstashFetch(
    `/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}?ex=${encodeURIComponent(String(exSeconds))}`,
  );
  return Boolean(res?.ok);
}

export async function redisSetJson(key: string, value: unknown, exSeconds: number): Promise<boolean> {
  try {
    return await redisSetString(key, JSON.stringify(value), exSeconds);
  } catch {
    return false;
  }
}

export async function redisIncr(key: string, expireSeconds: number | null): Promise<number | null> {
  const res = await upstashFetch(`/incr/${encodeURIComponent(key)}`);
  if (!res?.ok) return null;
  try {
    const payload = (await res.json()) as UpstashResponse<unknown>;
    const n = typeof payload.result === 'number' ? payload.result : Number.NaN;
    if (!Number.isFinite(n)) return null;
    if (expireSeconds && n === 1) {
      void upstashFetch(`/expire/${encodeURIComponent(key)}/${encodeURIComponent(String(expireSeconds))}`);
    }
    return n;
  } catch {
    return null;
  }
}

export async function redisDecr(key: string): Promise<number | null> {
  const res = await upstashFetch(`/decr/${encodeURIComponent(key)}`);
  if (!res?.ok) return null;
  try {
    const payload = (await res.json()) as UpstashResponse<unknown>;
    const n = typeof payload.result === 'number' ? payload.result : Number.NaN;
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export function hasRedis(): boolean {
  return cfg() !== null;
}

export async function redisDel(keys: string[]): Promise<{ deleted: number; ok: boolean }> {
  const c = cfg();
  if (!c) return { deleted: 0, ok: false };
  let deleted = 0;
  for (const key of keys) {
    try {
      const res = await fetch(`${c.url}/del/${encodeURIComponent(key)}`, {
        headers: { Authorization: `Bearer ${c.token}`, 'Cache-Control': 'no-store' },
      });
      if (res.ok) deleted += 1;
    } catch {
      void 0;
    }
  }
  return { deleted, ok: true };
}
