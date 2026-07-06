import { corsJson, corsOptions } from '../../../lib/http';
import { fetchTonapiJson, parseTonNetwork, type TonNetwork } from '../../../lib/tonapi';

export const config = { runtime: 'nodejs' };

function clampNetwork(v: string | null): TonNetwork {
  return parseTonNetwork(v);
}

function clampName(v: string | null): string | null {
  const s = String(v ?? '').trim().toLowerCase();
  if (!s) return null;
  if (s.length > 140) return null;
  if (!/^[a-z0-9._-]+(\.ton)?$/.test(s)) return null;
  return s.endsWith('.ton') ? s : `${s}.ton`;
}

function looksLikeAccountId(s: string): boolean {
  const t = s.trim();
  if (!t) return false;
  if (t.startsWith('EQ') || t.startsWith('UQ')) return t.length >= 40 && t.length <= 80;
  if (/^[0-9a-fA-F]{2}:[0-9a-fA-F]{64}$/.test(t)) return true;
  return false;
}

function extractAccountId(raw: unknown): string | null {
  const stack: Array<{ v: unknown; depth: number }> = [{ v: raw, depth: 0 }];
  while (stack.length) {
    const cur = stack.pop();
    if (!cur) break;
    const { v, depth } = cur;
    if (depth > 4) continue;
    if (typeof v === 'string') {
      const s = v.trim();
      if (looksLikeAccountId(s)) return s;
      continue;
    }
    if (!v || typeof v !== 'object') continue;
    if (Array.isArray(v)) {
      for (const item of v) stack.push({ v: item, depth: depth + 1 });
      continue;
    }
    const obj = v as Record<string, unknown>;
    for (const k of Object.keys(obj)) {
      stack.push({ v: obj[k], depth: depth + 1 });
    }
  }
  return null;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, 'GET, OPTIONS');
  if (req.method !== 'GET') return corsJson(req, 405, { error: 'Method not allowed' });

  const url = new URL(req.url);
  const network = clampNetwork(url.searchParams.get('network'));
  const name = clampName(url.searchParams.get('name'));
  if (!name) return corsJson(req, 400, { ok: false, error: 'Missing name' });

  const primary = await fetchTonapiJson<unknown>(network, `/v2/dns/${encodeURIComponent(name)}`, { timeoutMs: 4500 });
  const res =
    primary.ok
      ? primary
      : await fetchTonapiJson<unknown>(network, `/v2/dns/${encodeURIComponent(name)}/resolve`, { timeoutMs: 4500 });

  if (!res.ok) return corsJson(req, 502, { ok: false, error: 'Upstream unavailable' });

  const account = extractAccountId(res.data);
  return corsJson(
    req,
    200,
    { ok: true, network, name, account, data: res.data },
    { 'Cache-Control': 'public, max-age=60' },
  );
}

