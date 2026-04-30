import { useCallback, useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';

type GamificationMe = {
  ok: boolean;
  user: { walletAddress: string; referralCode: string | null };
  xp: number;
  level: number;
  levelProgress: { xpThisLevel: number; xpNextLevel: number; xpIntoLevel: number; xpToNext: number; pct: number };
  vip?: { tier: string; label: string };
  streak: { current: number; longest: number; lastActiveDay: string | null };
  day: string;
  quests: { daily: Array<{ slug: string; title: string; progress: number; targetCount: number; status: string; pointsReward: number }> };
  badges: Array<{ slug: string; title: string; rarity: string; awardedAt: string }>;
};

export default function AccountXpTab({ token }: { token: string }) {
  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);
  const [data, setData] = useState<GamificationMe | null>(null);
  const [loading, setLoading] = useState(false);
  const [spinBusy, setSpinBusy] = useState(false);
  const [spinResult, setSpinResult] = useState<string | null>(null);
  const [friendWallet, setFriendWallet] = useState('');
  const [friend, setFriend] = useState<{ walletAddress: string; xp: number; level: number; badges: number } | null>(null);
  const [friendBusy, setFriendBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/gamification/me', { headers: authHeaders });
      const json = (await res.json()) as GamificationMe;
      if (res.ok && json.ok) setData(json);
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void fetch('/api/gamification/visit', { method: 'POST', headers: authHeaders }).catch(() => null);
  }, [authHeaders]);

  const spin = async () => {
    setSpinBusy(true);
    setSpinResult(null);
    try {
      const res = await fetch('/api/gamification/wheel/spin', { method: 'POST', headers: authHeaders });
      const json = (await res.json()) as { ok?: boolean; rewardPoints?: number; day?: string; spun?: boolean };
      if (res.ok && json.ok) {
        setSpinResult(`Roată: +${json.rewardPoints ?? 0} XP`);
        await load();
      } else {
        setSpinResult('Roata nu este disponibilă acum.');
      }
    } catch {
      setSpinResult('Eroare la roată.');
    } finally {
      setSpinBusy(false);
    }
  };

  const loadFriend = async () => {
    const w = friendWallet.trim();
    if (!w) return;
    setFriendBusy(true);
    try {
      const res = await fetch(`/api/gamification/profile?wallet=${encodeURIComponent(w)}`, { headers: authHeaders });
      const json = (await res.json()) as { ok?: boolean; profile?: { walletAddress: string; xp: number; level: number; badges: unknown[] } };
      if (res.ok && json.ok && json.profile) {
        setFriend({
          walletAddress: json.profile.walletAddress,
          xp: json.profile.xp,
          level: json.profile.level,
          badges: Array.isArray(json.profile.badges) ? json.profile.badges.length : 0,
        });
      } else {
        setFriend(null);
      }
    } catch {
      setFriend(null);
    } finally {
      setFriendBusy(false);
    }
  };

  const pct = Math.round(((data?.levelProgress?.pct ?? 0) * 100) * 10) / 10;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-white text-xl font-semibold tracking-tight">XP & Nivel</div>
          <div className="mt-1 text-white/60 text-sm">Progres, streak și badge-uri.</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="secondary" onClick={() => void load()} disabled={loading}>
            Refresh
          </Button>
          <Button type="button" onClick={() => void spin()} disabled={spinBusy}>
            Roata zilnică
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="text-white/80 text-sm">
            Nivel <span className="text-white font-semibold">{data?.level ?? 1}</span>
            <span className="text-white/40"> · </span>
            XP <span className="text-white font-semibold">{data?.xp ?? 0}</span>
          </div>
          <div className="text-white/60 text-xs font-mono">
            {data ? `${data.levelProgress.xpIntoLevel}/${data.levelProgress.xpNextLevel - data.levelProgress.xpThisLevel} · ${pct}%` : '—'}
          </div>
        </div>
        <div className="mt-3">
          <Progress value={pct} />
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-sm text-white/70">
          <div>
            Streak: <span className="text-white font-semibold">{data?.streak.current ?? 0}</span> (max {data?.streak.longest ?? 0})
          </div>
          <div>
            Zi: <span className="text-white font-mono">{data?.day ?? '—'}</span>
          </div>
          <div>
            VIP: <span className="text-white font-semibold">{data?.vip?.label ?? 'VIP Bronze'}</span>
          </div>
        </div>
        {spinResult ? <div className="mt-3 text-sm text-solaris-gold">{spinResult}</div> : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
          <div className="text-white font-semibold">Misiuni zilnice</div>
          <div className="mt-3 space-y-2">
            {(data?.quests.daily ?? []).map((q) => (
              <div key={q.slug} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <div className="min-w-0">
                  <div className="text-white/90 text-sm truncate">{q.title}</div>
                  <div className="text-white/50 text-xs">
                    {q.progress}/{q.targetCount} · {q.status}
                  </div>
                </div>
                <div className="text-white/80 text-xs font-mono whitespace-nowrap">+{q.pointsReward}</div>
              </div>
            ))}
            {data && data.quests.daily.length === 0 ? <div className="text-white/60 text-sm">Nu există misiuni active.</div> : null}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
          <div className="text-white font-semibold">Badge-uri</div>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(data?.badges ?? []).slice(0, 12).map((b) => (
              <div key={b.slug} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <div className="text-white/90 text-sm">{b.title}</div>
                <div className="text-white/50 text-xs font-mono">{b.rarity}</div>
              </div>
            ))}
            {data && data.badges.length === 0 ? <div className="text-white/60 text-sm">Încă nu ai badge-uri.</div> : null}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
        <div className="text-white font-semibold">Compară cu un prieten</div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Input value={friendWallet} onChange={(e) => setFriendWallet(e.target.value)} placeholder="Wallet address (TON)" className="max-w-[520px]" />
          <Button type="button" variant="secondary" onClick={() => void loadFriend()} disabled={friendBusy || !friendWallet.trim()}>
            Compară
          </Button>
        </div>
        {friend ? (
          <div className="mt-3 text-white/80 text-sm">
            {friend.walletAddress} · lvl {friend.level} · {friend.xp} XP · {friend.badges} badge-uri
          </div>
        ) : (
          <div className="mt-3 text-white/50 text-sm">—</div>
        )}
      </div>
    </div>
  );
}
