import { useEffect, useMemo, useState } from 'react';

import { useTonNetwork } from '@/hooks/useTonNetwork';

type BackresolveApi = {
  ok?: unknown;
  primary?: unknown;
};

const cache = new Map<string, { value: string | null; expiresAt: number }>();
const TTL_MS = 2 * 60 * 1000;

function normalizeName(v: unknown): string | null {
  const s = typeof v === 'string' ? v.trim() : '';
  if (!s) return null;
  if (s.length > 180) return null;
  return s;
}

export function useTonDnsBackresolve(account: string): { primary: string | null; loading: boolean } {
  const { network } = useTonNetwork();
  const [primary, setPrimary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const cacheKey = useMemo(() => {
    const a = account.trim();
    return a ? `${network}:${a}` : '';
  }, [network, account]);

  useEffect(() => {
    const a = account.trim();
    if (!a) {
      setPrimary(null);
      return;
    }

    const hit = cacheKey ? cache.get(cacheKey) : null;
    if (hit && hit.expiresAt > Date.now()) {
      setPrimary(hit.value);
      return;
    }

    const ac = new AbortController();
    setLoading(true);
    fetch(`/api/ton/dns/backresolve?account=${encodeURIComponent(a)}&network=${encodeURIComponent(network)}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: ac.signal,
    })
      .then((r) => r.json() as Promise<BackresolveApi>)
      .then((data) => {
        const name = normalizeName(data?.primary);
        setPrimary(name);
        if (cacheKey) cache.set(cacheKey, { value: name, expiresAt: Date.now() + TTL_MS });
      })
      .catch(() => {
        setPrimary(null);
      })
      .finally(() => setLoading(false));

    return () => ac.abort();
  }, [account, network, cacheKey]);

  return { primary, loading };
}

