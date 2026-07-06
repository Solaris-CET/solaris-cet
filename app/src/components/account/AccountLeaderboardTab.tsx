import { useCallback, useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';

type WeeklyLeaderboard = {
  ok: boolean;
  weekStart: string;
  weekEnd: string;
  items: Array<{ rank: number; walletAddress: string | null; xpEarned: number; totalXp: number | null }>;
};

type WeeklyRewards = {
  ok: boolean;
  rewards: Array<{ weekStart: string; weekEnd: string; rank: number; cetAmount: string; status: string; txHash: string | null }>;
};

export default function AccountLeaderboardTab({ token }: { token: string }) {
  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);
  const [lb, setLb] = useState<WeeklyLeaderboard | null>(null);
  const [rewards, setRewards] = useState<WeeklyRewards | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [lRes, rRes] = await Promise.all([
        fetch('/api/gamification/leaderboard/weekly'),
        fetch('/api/gamification/rewards/weekly', { headers: authHeaders }),
      ]);
      const lJson = (await lRes.json()) as WeeklyLeaderboard;
      const rJson = (await rRes.json()) as WeeklyRewards;
      if (lRes.ok && lJson.ok) setLb(lJson);
      if (rRes.ok && rJson.ok) setRewards(rJson);
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-white text-xl font-semibold tracking-tight">Clasament săptămânal</div>
          <div className="mt-1 text-white/60 text-sm">Top XP săptămâna curentă. Primii 10 primesc $CET (pending).</div>
        </div>
        <Button type="button" variant="secondary" onClick={() => void load()} disabled={loading}>
          Refresh
        </Button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
        <div className="text-white/80 text-sm">
          Interval: <span className="text-white font-mono">{lb ? `${lb.weekStart} → ${lb.weekEnd}` : '—'}</span>
        </div>
        <div className="mt-4 space-y-2">
          {(lb?.items ?? []).slice(0, 20).map((it) => (
            <div key={it.rank} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <div className="text-white/80 text-sm font-mono">#{it.rank}</div>
              <div className="min-w-0 flex-1 text-white/80 text-sm truncate">{it.walletAddress ?? '—'}</div>
              <div className="text-white/80 text-sm font-mono whitespace-nowrap">+{it.xpEarned}</div>
            </div>
          ))}
          {lb && lb.items.length === 0 ? <div className="text-white/60 text-sm">Nu există activitate în această săptămână.</div> : null}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
        <div className="text-white font-semibold">Recompensele mele ($CET)</div>
        <div className="mt-3 space-y-2">
          {(rewards?.rewards ?? []).map((r) => (
            <div key={`${r.weekStart}:${r.rank}`} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-white/80 text-sm">
                  {r.weekStart} → {r.weekEnd} · rank #{r.rank}
                </div>
                <div className="text-solaris-gold text-sm font-mono">{r.cetAmount} CET</div>
              </div>
              <div className="mt-1 text-white/50 text-xs font-mono">
                {r.status}
                {r.txHash ? ` · tx ${r.txHash}` : ''}
              </div>
            </div>
          ))}
          {rewards && rewards.rewards.length === 0 ? <div className="text-white/60 text-sm">Nu ai recompense încă.</div> : null}
        </div>
      </div>
    </div>
  );
}

