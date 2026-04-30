import { ExternalLink, MessageSquare, Trophy, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

type FeedItem = { kind: string; title: string; href: string; at: string };

export default function CommunityPulseSection() {
  const [items, setItems] = useState<FeedItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetch('/api/community/feed?limit=12', { cache: 'no-store' });
      const data = (await res.json().catch(() => null)) as { items?: unknown } | null;
      const list = Array.isArray(data?.items) ? (data.items as FeedItem[]) : [];
      if (cancelled) return;
      setItems(list.slice(0, 6));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section aria-label="Comunitate" className="relative z-40 py-14 sm:py-18">
      <div className="mx-auto w-full max-w-6xl px-6">
        <div className="rounded-2xl border border-white/10 bg-black/30 p-6 backdrop-blur-xl">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-solaris-cyan" />
              <h2 className="text-white text-xl font-semibold tracking-tight">Comunitate</h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="/comunitate"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/85 hover:bg-white/10 transition"
              >
                Hub <ExternalLink className="h-4 w-4 text-white/60" />
              </a>
              <a
                href="/forum"
                className="inline-flex items-center gap-2 rounded-xl bg-solaris-gold px-4 py-2 text-sm font-semibold text-solaris-dark hover:brightness-110 transition"
              >
                Forum <MessageSquare className="h-4 w-4" />
              </a>
              <a
                href="/recompense"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/85 hover:bg-white/10 transition"
              >
                Puncte <Trophy className="h-4 w-4 text-solaris-gold" />
              </a>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.length === 0 ? (
              <div className="text-sm text-white/60">Încarc activitatea…</div>
            ) : (
              items.map((i) => (
                <a
                  key={`${i.kind}:${i.href}`}
                  href={i.href}
                  className="rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition"
                >
                  <div className="text-white text-sm font-medium line-clamp-2">{i.title}</div>
                  <div className="mt-2 text-[11px] text-white/50">{new Date(i.at).toLocaleString()}</div>
                </a>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

