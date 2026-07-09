export type AdminRole = 'admin' | 'editor' | 'viewer';

export type AdminSession = {
  token: string;
  admin: { id: string; email: string; role: AdminRole };
};

async function readJsonSafe(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export type AdminApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string };

/** Safe error message when `res.ok === false` (TS narrowing helper). */
export function adminApiErr<T>(res: AdminApiResult<T>): string | null {
  return res.ok === false ? res.error : null;
}

/** Parse `{ total }` from admin leads list JSON without unsafe casts. */
export function parseLeadsTotal(payload: unknown): number {
  if (!payload || typeof payload !== 'object') return 0;
  const total = (payload as { total?: unknown }).total;
  return typeof total === 'number' && Number.isFinite(total) ? total : 0;
}

export async function adminApi<T>(
  path: string,
  opts: {
    token: string | null;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: unknown;
  },
): Promise<AdminApiResult<T>> {
  const res = await fetch(path, {
    method: opts.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  if (res.ok) {
    const data = (await readJsonSafe(res)) as T;
    return { ok: true, data };
  }

  const payload = (await readJsonSafe(res)) as { error?: unknown } | null;
  const error = payload && typeof payload === 'object' && typeof payload.error === 'string' ? payload.error : res.statusText;
  return { ok: false, status: res.status, error: error || 'Request failed' };
}
