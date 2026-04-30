import { Copy, Sparkles, Trophy, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import SocialShare from '@/components/SocialShare';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useJwtSession } from '@/hooks/useJwtSession';
import { useLanguage } from '@/hooks/useLanguage';
import { mktConversion } from '@/lib/marketing';

type LeaderRow = { userId: string; walletAddress: string | null; points: number };
type AiRow = { userId: string | null; walletAddress: string | null; aiQueries: number };

export default function RewardsPage() {
  const { token } = useJwtSession();
  const { lang } = useLanguage();
  const [me, setMe] = useState<{ points: number; referralCode: string | null } | null>(null);
  const [top, setTop] = useState<LeaderRow[]>([]);
  const [ai, setAi] = useState<AiRow[]>([]);
  const [ambEmail, setAmbEmail] = useState('');
  const [ambConsent, setAmbConsent] = useState(true);
  const [ambBusy, setAmbBusy] = useState(false);

  const referralLink = useMemo(() => {
    if (typeof window === 'undefined') return null;
    if (!me?.referralCode) return null;
    const u = new URL(window.location.origin + '/');
    u.searchParams.set('ref', me.referralCode);
    return u.toString();
  }, [me?.referralCode]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetch('/api/rewards/leaderboard', { cache: 'no-store' });
      const data = (await res.json().catch(() => null)) as { points?: unknown; ai?: unknown } | null;
      const points = Array.isArray(data?.points) ? (data?.points as LeaderRow[]) : [];
      const aiRows = Array.isArray(data?.ai) ? (data?.ai as AiRow[]) : [];
      if (cancelled) return;
      setTop(points);
      setAi(aiRows);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!token) {
      setMe(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      const res = await fetch('/api/me', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
      const data = (await res.json().catch(() => null)) as { user?: unknown } | null;
      const user = data?.user as { points?: unknown; referralCode?: unknown } | undefined;
      const points = typeof user?.points === 'number' ? user.points : 0;
      const referralCode = typeof user?.referralCode === 'string' ? user.referralCode : null;
      if (cancelled) return;
      setMe({ points, referralCode });
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const copyReferral = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      toast.success('Link copiat');
    } catch {
      void 0;
    }
  };

  const applyAmbassador = async () => {
    const e = ambEmail.trim();
    if (!e || !e.includes('@')) {
      toast.error('Email invalid');
      return;
    }
    if (!ambConsent) {
      toast.error('Confirmă consimțământul');
      return;
    }
    setAmbBusy(true);
    try {
      const res = await fetch('/api/marketing/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: e,
          locale: lang,
          consent: true,
          newsletter: true,
          pageUrl: typeof window === 'undefined' ? null : window.location.href,
          utm: { campaign: 'ambassador_apply' },
        }),
        cache: 'no-store',
      });
      if (!res.ok) {
        toast.error('Eroare la trimitere');
        return;
      }
      toast.success('Aplicare trimisă. Verifică emailul pentru confirmare.');
      mktConversion('Lead', { source: 'ambassador_apply' });
    } finally {
      setAmbBusy(false);
    }
  };

  return (
    <main id="main-content" tabIndex={-1} className="relative min-h-[70vh] w-full pb-[var(--mobile-conversion-dock-reserve)] xl:pb-0">
      <div className="section-padding-x max-w-6xl mx-auto w-full pt-24 pb-16">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-solaris-gold" />
          <h1 className="text-white text-2xl font-semibold tracking-tight">Recompense</h1>
        </div>
        <p className="mt-2 text-white/70 text-sm">Puncte pentru share, chat, RSVP și activitate AI.</p>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <div className="text-white font-semibold">Punctele mele</div>
              <div className="mt-3 text-4xl font-bold text-white">{me ? me.points : '—'}</div>
              {!token ? <div className="mt-2 text-xs text-white/60">Conectează wallet ca să vezi punctele.</div> : null}
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Users className="w-4 h-4 text-solaris-cyan" /> Referral
              </div>
              <p className="mt-2 text-white/70 text-sm">Invite prieteni. Amândoi primiți puncte după prima conectare.</p>
              <div className="mt-4">
                {referralLink ? (
                  <button
                    type="button"
                    onClick={() => void copyReferral()}
                    className="w-full flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-3 hover:bg-white/10"
                  >
                    <span className="text-white/80 text-xs truncate">{referralLink}</span>
                    <Copy className="w-4 h-4 text-white/60" />
                  </button>
                ) : (
                  <div className="text-xs text-white/60">Conectează wallet ca să generezi link-ul.</div>
                )}
              </div>
              {referralLink ? (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                  <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <div className="text-xs text-white/60">QR personal</div>
                    <img
                      alt="QR referral"
                      className="mt-2 w-[160px] h-[160px] rounded-lg border border-white/10 bg-white"
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(referralLink)}`}
                      loading="lazy"
                    />
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <div className="text-xs text-white/60">Program de ambasadori</div>
                    <div className="mt-2 grid gap-2">
                      <Input
                        value={ambEmail}
                        onChange={(e) => setAmbEmail(e.target.value)}
                        placeholder="email@exemplu.com"
                        inputMode="email"
                        autoComplete="email"
                        className="bg-black/40 border-white/10 text-white placeholder:text-white/40"
                        disabled={ambBusy}
                      />
                      <label className="flex items-start gap-2 text-xs text-white/70 leading-relaxed">
                        <Checkbox checked={ambConsent} onCheckedChange={(v) => setAmbConsent(Boolean(v))} disabled={ambBusy} />
                        Sunt de acord să primesc emailuri despre program.
                      </label>
                      <Button
                        type="button"
                        onClick={() => void applyAmbassador()}
                        disabled={ambBusy}
                        className="rounded-xl bg-solaris-gold text-solaris-dark font-semibold hover:bg-solaris-gold/90"
                      >
                        Aplică
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <div className="text-white font-semibold">Share rapid</div>
              <div className="mt-3">
                <SocialShare />
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Trophy className="w-4 h-4 text-solaris-gold" /> Top puncte
              </div>
              <div className="mt-4 space-y-2">
                {top.map((r, idx) => (
                  <div key={r.userId} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                    <div className="text-white/80 text-sm">#{idx + 1} {r.walletAddress ? r.walletAddress.slice(0, 6) + '…' + r.walletAddress.slice(-4) : r.userId.slice(0, 8)}</div>
                    <div className="text-white font-semibold">{r.points}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Trophy className="w-4 h-4 text-solaris-cyan" /> Activitate AI (7 zile)
              </div>
              <div className="mt-4 space-y-2">
                {ai.map((r, idx) => (
                  <div key={`${r.userId ?? 'anon'}-${idx}`} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                    <div className="text-white/80 text-sm">#{idx + 1} {r.walletAddress ? r.walletAddress.slice(0, 6) + '…' + r.walletAddress.slice(-4) : 'anon'}</div>
                    <div className="text-white font-semibold">{r.aiQueries}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
