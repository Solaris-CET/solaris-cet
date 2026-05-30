import { ExternalLink, Link2, MessageSquare, Send, Trophy, Users,X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import SocialShare from '@/components/SocialShare';
import { TwitterTimeline } from '@/components/TwitterTimeline';
import { useJwtSession } from '@/hooks/useJwtSession';

const TELEGRAM_CHANNEL_URL = 'https://t.me/SolarisCET';
const TELEGRAM_INVITE_URL = 'https://t.me/+tKlfzx7IWopmNWQ0';
const DISCORD_INVITE_URL = (import.meta.env.VITE_DISCORD_INVITE_URL as string | undefined)?.trim() || '';

export default function CommunityPage() {
  const { token } = useJwtSession();
  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState<{ kind: string; title: string; href: string; at: string }[]>([]);
  const [leaderboard, setLeaderboard] = useState<{ userId: string; walletAddress: string; points: number }[]>([]);

  const pageUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return window.location.origin + '/comunitate';
  }, []);

  const generateLinkCode = async () => {
    if (!token) return;
    setBusy(true);
    try {
      const res = await fetch('/api/telegram/link-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      const data = (await res.json().catch(() => null)) as { code?: unknown } | null;
      const code = typeof data?.code === 'string' ? data.code : null;
      setLinkCode(code);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    setLinkCode(null);
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetch('/api/community/feed', { cache: 'no-store' });
      const data = (await res.json().catch(() => null)) as { items?: unknown; leaderboard?: unknown } | null;
      const list = Array.isArray(data?.items) ? (data.items as { kind: string; title: string; href: string; at: string }[]) : [];
      const lb = Array.isArray(data?.leaderboard)
        ? (data.leaderboard as { userId: string; walletAddress: string; points: number }[])
        : [];
      if (cancelled) return;
      setItems(list.slice(0, 10));
      setLeaderboard(lb.slice(0, 6));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main id="main-content" tabIndex={-1} className="relative min-h-[70vh] w-full pb-[var(--mobile-conversion-dock-reserve)] xl:pb-0">
      <div className="section-padding-x max-w-6xl mx-auto w-full pt-24 pb-16">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-solaris-cyan" />
            <h1 className="text-white text-2xl font-semibold tracking-tight">Comunitate</h1>
          </div>
          <p className="text-white/70 text-sm max-w-2xl">
            Intră în comunitate, urmărește update-urile pe X și conectează Telegram pentru notificări și comenzi rapide.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <div className="flex items-center gap-2 text-white font-semibold">
                <MessageSquare className="w-4 h-4 text-solaris-gold" /> Forum
              </div>
              <p className="mt-2 text-white/70 text-sm">Postări, comentarii, like/dislike, raportări.</p>
              <div className="mt-3">
                <a
                  href="/forum"
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 hover:bg-white/10 transition"
                >
                  <span className="text-white text-sm">Deschide forum</span>
                  <ExternalLink className="w-4 h-4 text-white/60" />
                </a>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Send className="w-4 h-4 text-solaris-cyan" /> Telegram
              </div>
              <div className="mt-3 grid gap-2">
                <a
                  href={TELEGRAM_CHANNEL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 hover:bg-white/10 transition"
                >
                  <span className="text-white text-sm">Canal @SolarisCET</span>
                  <ExternalLink className="w-4 h-4 text-white/60" />
                </a>
                <a
                  href={TELEGRAM_INVITE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 hover:bg-white/10 transition"
                >
                  <span className="text-white text-sm">Invite permanent (chat)</span>
                  <ExternalLink className="w-4 h-4 text-white/60" />
                </a>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Users className="w-4 h-4 text-solaris-gold" /> Discord
              </div>
              <p className="mt-2 text-white/70 text-sm">Invite permanent către comunitate.</p>
              <div className="mt-3">
                {DISCORD_INVITE_URL ? (
                  <a
                    href={DISCORD_INVITE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 hover:bg-white/10 transition"
                  >
                    <span className="text-white text-sm">Discord invite</span>
                    <ExternalLink className="w-4 h-4 text-white/60" />
                  </a>
                ) : (
                  <div className="text-xs text-white/60">Setează `VITE_DISCORD_INVITE_URL` în `.env`.</div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Link2 className="w-4 h-4 text-solaris-gold" /> Conectează Telegram
              </div>
              <p className="mt-2 text-white/70 text-sm">
                Generează un cod pe site, apoi trimite în Telegram bot comanda <span className="font-mono text-white">/link COD</span>.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={generateLinkCode}
                  disabled={!token || busy}
                  className="px-4 py-2 rounded-xl bg-solaris-gold text-solaris-dark font-semibold disabled:opacity-60"
                >
                  Generează cod
                </button>
                {linkCode ? (
                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                    <span className="text-white font-mono text-sm">{linkCode}</span>
                  </div>
                ) : null}
                {!token ? <span className="text-xs text-white/60">Conectează wallet ca să generezi codul.</span> : null}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <div className="flex items-center gap-2 text-white font-semibold">
                <X className="w-4 h-4" /> Share
              </div>
              <p className="mt-2 text-white/70 text-sm">Distribuie pagina Comunitate. Dacă ești autentificat, primești puncte.</p>
              <div className="mt-4">
                <SocialShare url={pageUrl} text="Solaris CET — Comunitate" />
              </div>
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-5 mb-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <Trophy className="w-4 h-4 text-solaris-gold" /> Activitate
                </div>
                <a href="/recompense" className="text-xs text-white/70 hover:text-white">
                  Vezi recompense
                </a>
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-xs text-white/60">Ultimele update-uri</div>
                  <div className="mt-2 space-y-2">
                    {items.length === 0 ? (
                      <div className="text-sm text-white/60">—</div>
                    ) : (
                      items.map((i) => (
                        <a key={`${i.kind}:${i.href}`} href={i.href} className="block hover:bg-white/5 rounded-lg px-2 py-2">
                          <div className="text-white text-sm font-medium line-clamp-1">{i.title}</div>
                          <div className="text-[11px] text-white/50">{new Date(i.at).toLocaleString()}</div>
                        </a>
                      ))
                    )}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-xs text-white/60">Wall of fame (puncte)</div>
                  <div className="mt-2 space-y-2">
                    {leaderboard.length === 0 ? (
                      <div className="text-sm text-white/60">—</div>
                    ) : (
                      leaderboard.map((u) => (
                        <div key={u.userId} className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-white/5">
                          <div className="text-sm text-white/80 truncate">{u.walletAddress}</div>
                          <div className="text-sm text-solaris-gold font-semibold">{u.points}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
              {!token ? <div className="mt-3 text-xs text-white/60">Conectează wallet ca să primești puncte pentru activitate.</div> : null}
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="text-white font-semibold">Feed X @SolarisCET</div>
                <a
                  href="https://twitter.com/SolarisCET"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-white/70 hover:text-white flex items-center gap-1"
                >
                  Deschide pe X <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <div className="mt-4">
                <TwitterTimeline handle="SolarisCET" height={660} theme="dark" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
