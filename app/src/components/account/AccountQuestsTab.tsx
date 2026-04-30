import { useCallback, useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Quest = {
  slug: string;
  title: string;
  description: string | null;
  progress: number;
  targetCount: number;
  status: string;
  pointsReward: number;
  requiresProof: boolean;
};

type GamificationMe = {
  ok: boolean;
  day: string;
  quests: { daily: Quest[]; active: Quest[] };
};

export default function AccountQuestsTab({ token }: { token: string }) {
  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);
  const [data, setData] = useState<GamificationMe | null>(null);
  const [loading, setLoading] = useState(false);
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const [proofUrl, setProofUrl] = useState('');
  const [info, setInfo] = useState<string | null>(null);

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

  const claim = async (slug: string) => {
    setBusySlug(slug);
    setInfo(null);
    try {
      const res = await fetch('/api/gamification/quests/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ questSlug: slug }),
      });
      const json = (await res.json()) as { ok?: boolean; pendingReview?: boolean; error?: string };
      if (res.ok && json.ok) {
        setInfo(json.pendingReview ? 'Trimis spre verificare.' : 'Recompensă acordată.');
        await load();
      } else {
        setInfo(json.error ? String(json.error) : 'Nu se poate face claim.');
      }
    } catch {
      setInfo('Eroare la claim.');
    } finally {
      setBusySlug(null);
    }
  };

  const submitProof = async (slug: string) => {
    setBusySlug(slug);
    setInfo(null);
    try {
      const res = await fetch('/api/gamification/quests/proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ questSlug: slug, proofUrl }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (res.ok && json.ok) {
        setProofUrl('');
        setInfo('Proof trimis. Așteaptă verificarea.');
        await load();
      } else {
        setInfo(json.error ? String(json.error) : 'Nu s-a putut trimite proof.');
      }
    } catch {
      setInfo('Eroare la proof.');
    } finally {
      setBusySlug(null);
    }
  };

  const all = [...(data?.quests.daily ?? []), ...(data?.quests.active ?? [])];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-white text-xl font-semibold tracking-tight">Misiuni</div>
          <div className="mt-1 text-white/60 text-sm">Completează și fă claim pentru bonus XP.</div>
        </div>
        <Button type="button" variant="secondary" onClick={() => void load()} disabled={loading}>
          Refresh
        </Button>
      </div>

      {info ? <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">{info}</div> : null}

      <div className="space-y-3">
        {all.map((q) => {
          const canClaim = q.status === 'completed';
          const pending = q.status === 'pending_review';
          const claimed = q.status === 'claimed';
          return (
            <div key={q.slug} className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-white font-semibold">{q.title}</div>
                  <div className="mt-1 text-white/60 text-sm">{q.description ?? ''}</div>
                  <div className="mt-2 text-white/50 text-xs font-mono">
                    {q.progress}/{q.targetCount} · {q.status} · +{q.pointsReward} XP
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {q.requiresProof ? (
                    <Button type="button" variant="secondary" onClick={() => void submitProof(q.slug)} disabled={busySlug === q.slug || !proofUrl}>
                      Trimite proof
                    </Button>
                  ) : (
                    <Button type="button" onClick={() => void claim(q.slug)} disabled={busySlug === q.slug || !canClaim}>
                      Claim
                    </Button>
                  )}
                </div>
              </div>
              {q.requiresProof ? (
                <div className="mt-4 flex flex-wrap gap-2 items-center">
                  <Input
                    value={proofUrl}
                    onChange={(e) => setProofUrl(e.target.value)}
                    placeholder="Link proof (X/Twitter, etc.)"
                    className="max-w-[520px]"
                  />
                  <div className="text-white/50 text-xs">{pending ? 'În verificare' : claimed ? 'Acordat' : ''}</div>
                </div>
              ) : null}
            </div>
          );
        })}
        {data && all.length === 0 ? <div className="text-white/60 text-sm">Nu există misiuni active.</div> : null}
      </div>
    </div>
  );
}

