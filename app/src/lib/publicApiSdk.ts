export type SolarisClientOptions = {
  apiKey: string;
  baseUrl?: string;
};

type RequestOptions = {
  method?: string;
  path: string;
  body?: unknown;
  query?: Record<string, string | number | boolean | null | undefined>;
};

function buildUrl(baseUrl: string, path: string, query?: RequestOptions['query']): string {
  const url = new URL(path, baseUrl);
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v === undefined || v === null) continue;
    url.searchParams.set(k, String(v));
  }
  return url.toString();
}

async function requestJson<T>(opts: SolarisClientOptions, req: RequestOptions): Promise<T> {
  const baseUrl = opts.baseUrl?.trim() ? opts.baseUrl.trim() : typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
  const url = buildUrl(baseUrl, req.path, req.query);
  const res = await fetch(url, {
    method: req.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': opts.apiKey,
    },
    body: req.body === undefined ? undefined : JSON.stringify(req.body),
  });
  const json = (await res.json().catch(() => null)) as unknown;
  if (!res.ok) {
    const msg =
      typeof json === 'object' && json !== null && 'error' in json &&
      typeof (json as { error?: unknown }).error === 'object' &&
      (json as { error: { message?: unknown } }).error &&
      typeof (json as { error: { message?: unknown } }).error.message === 'string'
        ? (json as { error: { message: string } }).error.message
        : `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return json as T;
}

export function createSolarisClient(opts: SolarisClientOptions) {
  return {
    v1: {
      price: () => requestJson<{ priceUsd: number }>(opts, { path: '/api/v1/price' }),
      stats: () => requestJson<unknown>(opts, { path: '/api/v1/stats' }),
      transactions: {
        list: (p?: { limit?: number; cursor?: string }) =>
          requestJson<{ items: unknown[]; nextCursor: string | null }>(opts, {
            path: '/api/v1/transactions',
            query: { limit: p?.limit ?? undefined, cursor: p?.cursor ?? undefined },
          }),
        create: (p: { from?: string | null; to?: string | null; amount: string; txHash?: string | null }) =>
          requestJson<{ transaction: unknown }>(opts, { path: '/api/v1/transactions', method: 'POST', body: p }),
      },
      webhooks: {
        list: () => requestJson<{ items: unknown[] }>(opts, { path: '/api/v1/webhooks' }),
        create: (p: { url: string; events?: string[]; enabled?: boolean }) =>
          requestJson<{ endpoint: unknown; secret: string }>(opts, { path: '/api/v1/webhooks', method: 'POST', body: p }),
        remove: (id: string) =>
          requestJson<unknown>(opts, { path: '/api/v1/webhooks', method: 'DELETE', query: { id } }),
        deliveries: (endpointId: string, limit = 50) =>
          requestJson<{ items: unknown[] }>(opts, { path: '/api/v1/webhooks/deliveries', query: { endpointId, limit } }),
      },
    },
    v2: {
      price: () => requestJson<unknown>(opts, { path: '/api/v2/price' }),
      stats: () => requestJson<unknown>(opts, { path: '/api/v2/stats' }),
      transactions: {
        list: (p?: { limit?: number; cursor?: string }) =>
          requestJson<unknown>(opts, { path: '/api/v2/transactions', query: { limit: p?.limit ?? undefined, cursor: p?.cursor ?? undefined } }),
        create: (p: { from?: string | null; to?: string | null; amount: string; txHash?: string | null; metadata?: Record<string, unknown> }) =>
          requestJson<unknown>(opts, { path: '/api/v2/transactions', method: 'POST', body: p }),
      },
    },
  };
}

