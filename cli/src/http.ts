export async function httpJson<T>(
  url: string,
  opts: { method: string; token?: string; body?: unknown },
): Promise<{ ok: true; data: T } | { ok: false; status: number; error: string; bodyText?: string }> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  if (opts.body != null) headers['Content-Type'] = 'application/json';

  let res: Response;
  try {
    res = await fetch(url, {
      method: opts.method,
      headers,
      body: opts.body != null ? JSON.stringify(opts.body) : undefined,
    });
  } catch (err) {
    return { ok: false, status: 0, error: err instanceof Error ? err.message : String(err) };
  }

  const text = await res.text();
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const parsed = JSON.parse(text) as { error?: string };
      if (parsed?.error) msg = parsed.error;
    } catch {
      void 0;
    }
    return { ok: false, status: res.status, error: msg, bodyText: text };
  }

  try {
    return { ok: true, data: JSON.parse(text) as T };
  } catch {
    return { ok: false, status: res.status, error: 'Invalid JSON response', bodyText: text };
  }
}

