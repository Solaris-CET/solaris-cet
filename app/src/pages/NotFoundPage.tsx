import { ArrowLeft, Compass, Home, MessageSquareText, ScrollText } from 'lucide-react';
import { useEffect } from 'react';

import { useReducedMotion } from '@/hooks/useReducedMotion';

function LostLatticeIllustration({ reduced }: { reduced: boolean }) {
  return (
    <svg
      viewBox="0 0 560 220"
      className="w-full h-auto"
      role="img"
      aria-label="Lost in the lattice"
    >
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="rgba(242,201,76,0.55)" />
          <stop offset="1" stopColor="rgba(46,231,255,0.35)" />
        </linearGradient>
        <filter id="b" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
      </defs>

      <rect x="0" y="0" width="560" height="220" rx="18" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" />
      <circle cx="120" cy="110" r="54" fill="url(#g)" opacity="0.28" filter="url(#b)" />
      <circle cx="430" cy="90" r="62" fill="rgba(46,231,255,0.22)" filter="url(#b)" />

      <g opacity="0.35" stroke="rgba(255,255,255,0.18)" strokeWidth="1">
        {Array.from({ length: 9 }).map((_, i) => (
          <line key={i} x1={80 + i * 45} y1={34} x2={80 + i * 45} y2={186} />
        ))}
        {Array.from({ length: 5 }).map((_, i) => (
          <line key={i} x1={60} y1={54 + i * 34} x2={500} y2={54 + i * 34} />
        ))}
      </g>

      <g>
        <text x="42" y="86" fill="rgba(255,255,255,0.9)" fontSize="42" fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas">
          404
        </text>
        <text x="42" y="118" fill="rgba(255,255,255,0.55)" fontSize="12" fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas">
          ROUTE_NOT_FOUND · LATTICE_DESYNC
        </text>
      </g>

      {!reduced ? (
        <g>
          <circle cx="310" cy="126" r="3" fill="rgba(242,201,76,0.9)">
            <animate attributeName="cx" values="130; 420; 130" dur="6s" repeatCount="indefinite" />
            <animate attributeName="cy" values="156; 68; 156" dur="6s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.2; 1; 0.2" dur="6s" repeatCount="indefinite" />
          </circle>
        </g>
      ) : null}
    </svg>
  );
}

export function NotFoundPage({
  attemptedPath,
  staticRedirectHref,
}: {
  attemptedPath: string;
  staticRedirectHref?: string;
}) {
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!staticRedirectHref) return;
    const id = window.setTimeout(() => {
      window.location.assign(staticRedirectHref);
    }, 150);
    return () => window.clearTimeout(id);
  }, [staticRedirectHref]);

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="min-h-[70vh] flex items-center justify-center px-6 py-20"
    >
      <div className="max-w-3xl w-full">
        <div className="bento-card p-6 md:p-8 border border-white/10">
          <div className="grid gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] items-start">
            <div className="min-w-0">
              <h1 className="text-white text-2xl md:text-3xl font-semibold tracking-tight">Page not found</h1>
              <p className="mt-3 text-white/70 text-sm break-all">
                Path: <span className="font-mono">{attemptedPath}</span>
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  href="/"
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-solaris-gold text-solaris-dark px-5 text-sm font-semibold hover:bg-solaris-gold/90 transition-colors"
                >
                  <Home className="w-4 h-4" aria-hidden />
                  Go home
                </a>
                <a
                  href="/cet-ai"
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                >
                  <MessageSquareText className="w-4 h-4" aria-hidden />
                  CET AI
                </a>
                <a
                  href="/rwa"
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                >
                  <Compass className="w-4 h-4" aria-hidden />
                  RWA
                </a>
                <a
                  href="/faq"
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                >
                  <ScrollText className="w-4 h-4" aria-hidden />
                  FAQ
                </a>
                {staticRedirectHref ? (
                  <a
                    href={staticRedirectHref}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" aria-hidden />
                    Open static page
                  </a>
                ) : null}
              </div>
              <p className="mt-5 text-[11px] text-white/55">
                Tip: Use the navigation or go back to the homepage sections for full context.
              </p>
            </div>
            <div className="min-w-0">
              <LostLatticeIllustration reduced={prefersReducedMotion} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
