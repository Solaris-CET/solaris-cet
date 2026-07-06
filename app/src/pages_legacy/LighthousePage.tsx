import { useEffect, useMemo, useState } from 'react';

import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';

type Scores = {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  average: number;
};

type Payload = {
  generatedAt: string | null;
  url: string | null;
  scores: Scores;
};

function scoreColor(v: number) {
  if (v >= 90) return 'text-emerald-400';
  if (v >= 75) return 'text-amber-300';
  return 'text-red-400';
}

export default function LighthousePage() {
  const { t } = useLanguage();
  const [data, setData] = useState<Payload | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'ready'>('idle');

  useEffect(() => {
    let alive = true;
    setStatus('loading');
    fetch('/lighthouse-scores.json', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!alive) return;
        if (!json || typeof json !== 'object') {
          setStatus('error');
          return;
        }
        setData(json as Payload);
        setStatus('ready');
      })
      .catch(() => {
        if (!alive) return;
        setStatus('error');
      });
    return () => {
      alive = false;
    };
  }, []);

  const rows = useMemo(() => {
    const s = data?.scores;
    if (!s) return [];
    return [
      { k: 'Performance', v: s.performance },
      { k: 'Accessibility', v: s.accessibility },
      { k: 'Best Practices', v: s.bestPractices },
      { k: 'SEO', v: s.seo },
    ];
  }, [data]);

  return (
    <main id="main-content" className="relative z-10 min-h-[70vh] section-padding-x max-w-4xl mx-auto w-full py-20">
      <div className="bento-card p-6 md:p-8 border border-white/10 bg-white/[0.03]">
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="hud-label text-solaris-gold mb-2">Lighthouse</div>
            <h1 className="font-display text-3xl md:text-4xl text-white mb-2">Performance snapshot</h1>
            <p className="text-solaris-muted text-sm leading-relaxed max-w-2xl">
              {t.footerMeta?.genesisCertification ?? 'Audit scores for the current deployment build.'}
            </p>
          </div>
          <img src="/lighthouse-badge.svg" alt="Lighthouse badge" className="h-7 w-auto" />
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {status === 'loading' ? (
            <div className="col-span-full animate-pulse rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="h-3 w-40 rounded bg-white/10" />
              <div className="mt-3 h-2 w-64 rounded bg-white/10" />
            </div>
          ) : status === 'error' ? (
            <div className="col-span-full rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-200">
              Lighthouse scores are not available yet. Run `npm run lighthouse:audit` and redeploy.
            </div>
          ) : (
            rows.map((r) => (
              <div key={r.k} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="text-sm font-semibold text-white">{r.k}</div>
                  <div className={cn('font-mono text-lg font-bold', scoreColor(r.v))}>{r.v}</div>
                </div>
              </div>
            ))
          )}
        </div>

        {data?.generatedAt ? (
          <div className="mt-6 text-xs text-solaris-muted font-mono">
            Generated: {data.generatedAt}
            {data.url ? ` · URL: ${data.url}` : ''}
          </div>
        ) : null}
      </div>
    </main>
  );
}

