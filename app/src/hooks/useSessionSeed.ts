import { useMemo } from 'react';

import { hashStringToUint32, mulberry32 } from '@/lib/seed';

function getSessionSeed(): number {
  if (typeof window === 'undefined') return 0;
  const key = 'solaris.session.seed.v1';
  const existing = window.sessionStorage.getItem(key);
  if (existing) {
    const n = Number(existing);
    if (Number.isFinite(n)) return n >>> 0;
  }
  const buf = new Uint32Array(1);
  window.crypto.getRandomValues(buf);
  const next = buf[0] >>> 0;
  window.sessionStorage.setItem(key, String(next));
  return next;
}

export function useSessionSeed(scope: string): number {
  return useMemo(() => {
    const session = getSessionSeed();
    const route =
      typeof window !== 'undefined' ? window.location.pathname.replace(/\/$/, '') || '/' : '/';
    const scoped = `${scope}|${route}|${session}`;
    const h = hashStringToUint32(scoped);
    const r = mulberry32(h)();
    return r;
  }, [scope]);
}

