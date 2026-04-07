import { useEffect, useMemo, useState } from 'react';

type CommunityProofPayload = {
  telegramMembers: number;
  xFollowers: number;
  updatedAt: string;
};

const FALLBACK: CommunityProofPayload = {
  telegramMembers: 0,
  xFollowers: 0,
  updatedAt: '—',
};

export function useCommunityProof() {
  const [data, setData] = useState<CommunityProofPayload>(FALLBACK);
  const [stale, setStale] = useState(false);

  useEffect(() => {
    const ac = new AbortController();
    const timeout = window.setTimeout(() => ac.abort(), 1500);

    fetch(`${import.meta.env.BASE_URL}api/social.json`, { signal: ac.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('bad_status'))))
      .then((raw: unknown) => {
        const parsed = raw as Partial<CommunityProofPayload>;
        const telegramMembers =
          typeof parsed.telegramMembers === 'number' ? parsed.telegramMembers : FALLBACK.telegramMembers;
        const xFollowers =
          typeof parsed.xFollowers === 'number' ? parsed.xFollowers : FALLBACK.xFollowers;
        const updatedAt =
          typeof parsed.updatedAt === 'string' ? parsed.updatedAt : FALLBACK.updatedAt;
        setData({ telegramMembers, xFollowers, updatedAt });
        setStale(false);
      })
      .catch(() => {
        setStale(true);
      })
      .finally(() => window.clearTimeout(timeout));

    return () => {
      window.clearTimeout(timeout);
      ac.abort();
    };
  }, []);

  return useMemo(() => ({ ...data, stale }), [data, stale]);
}

