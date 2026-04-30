import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight, Quote, Star } from 'lucide-react';
import { useMemo } from 'react';

import { ScrollFadeUp } from '@/components/ScrollFadeUp';
import { useReducedMotion } from '@/hooks/useReducedMotion';

type QuoteCard = {
  quote: string;
  name: string;
  role: string;
  score?: number;
};

function clampScore(v: number | undefined): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) return 5;
  return Math.max(1, Math.min(5, Math.round(v)));
}

function readJsonEnv<T>(key: string): T | null {
  try {
    const raw = String((import.meta.env as Record<string, unknown>)[key] ?? '').trim();
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export default function SocialProofSection() {
  const prefersReducedMotion = useReducedMotion();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: prefersReducedMotion ? 0 : 25 });

  const testimonials = useMemo<QuoteCard[]>(() => {
    const fromEnv = readJsonEnv<QuoteCard[]>('VITE_TESTIMONIALS_JSON');
    if (Array.isArray(fromEnv) && fromEnv.length > 0) return fromEnv.slice(0, 10);
    return [
      {
        quote:
          'Fast, verifiable narrative. The RAV framing makes tokenomics and on-chain proof easy to audit, not just market.',
        name: 'DeFi Reviewer',
        role: 'Research & risk',
        score: 5,
      },
      {
        quote:
          'The CET AI demo UX is unusually honest: rate limits, fallback modes, and citations. It feels production-ready.',
        name: 'TON Builder',
        role: 'Infra & tooling',
        score: 5,
      },
      {
        quote:
          'Clean hierarchy: RWA story, whitepaper, then actionable flows. The landing converts without feeling spammy.',
        name: 'Growth Lead',
        role: 'Web3 marketing',
        score: 4,
      },
      {
        quote:
          'The on-chain anchoring surfaces are clear. I can explain the audit path to stakeholders in minutes.',
        name: 'Operator',
        role: 'Compliance & ops',
        score: 4,
      },
      {
        quote:
          'Visual system is consistent: glass, gold/cyan accents, restrained motion. Reads like a serious protocol.',
        name: 'Product Designer',
        role: 'UX systems',
        score: 5,
      },
    ];
  }, []);

  const partnerQuotes = useMemo<QuoteCard[]>(() => {
    const fromEnv = readJsonEnv<QuoteCard[]>('VITE_PARTNER_QUOTES_JSON');
    if (Array.isArray(fromEnv) && fromEnv.length > 0) return fromEnv.slice(0, 8);
    return [
      {
        quote:
          'Replace these partner quotes via VITE_PARTNER_QUOTES_JSON (array of {quote,name,role,score}).',
        name: 'Partner slot',
        role: 'Waiting confirmation',
        score: 5,
      },
      {
        quote:
          'Keep claims measurable: links, addresses, and on-chain proof beats vague “partnership” language.',
        name: 'Partner slot',
        role: 'Waiting confirmation',
        score: 5,
      },
    ];
  }, []);

  return (
    <section id="social-proof" aria-label="Social proof" className="relative section-glass section-padding-y overflow-hidden mesh-bg">
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute bottom-0 left-0 right-0 h-[40vh] grid-floor opacity-10" />
        <div className="absolute -top-24 left-1/2 h-72 w-[min(96vw,880px)] -translate-x-1/2 rounded-full bg-solaris-gold/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-12%] h-[420px] w-[420px] rounded-full bg-solaris-cyan/8 blur-[140px]" />
      </div>

      <div className="relative z-10 section-padding-x mx-auto w-full max-w-6xl">
        <ScrollFadeUp className="max-w-2xl mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-solaris-gold/10 flex items-center justify-center">
              <Quote className="w-5 h-5 text-solaris-gold" aria-hidden />
            </div>
            <span className="hud-label text-solaris-gold">PROOF</span>
          </div>
          <h2 className="font-display font-bold text-[clamp(26px,3.2vw,44px)] text-solaris-text">
            Testimonials & Partner Quotes
          </h2>
          <p className="mt-3 text-solaris-muted text-sm leading-relaxed">
            These cards are data-driven. Set `VITE_TESTIMONIALS_JSON` and `VITE_PARTNER_QUOTES_JSON` to publish real quotes.
          </p>
        </ScrollFadeUp>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="font-mono text-[10px] uppercase tracking-widest text-solaris-muted">
                Testimonials
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => emblaApi?.scrollPrev()}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-solaris-muted hover:text-solaris-text hover:bg-white/10 transition-colors"
                  aria-label="Anterior"
                >
                  <ChevronLeft className="w-4 h-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => emblaApi?.scrollNext()}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-solaris-muted hover:text-solaris-text hover:bg-white/10 transition-colors"
                  aria-label="Următor"
                >
                  <ChevronRight className="w-4 h-4" aria-hidden />
                </button>
              </div>
            </div>

            <div ref={emblaRef} className="overflow-hidden">
              <div className="flex">
                {testimonials.map((t, idx) => {
                  const score = clampScore(t.score);
                  return (
                    <div
                      key={`${t.name}-${idx}`}
                      className="min-w-0 flex-[0_0_92%] sm:flex-[0_0_70%] lg:flex-[0_0_62%] pr-4"
                    >
                      <div className="bento-card p-6 border border-white/10">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 text-xs text-solaris-muted">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${i < score ? 'text-solaris-gold' : 'text-white/15'}`}
                                aria-hidden
                              />
                            ))}
                          </div>
                          <div className="font-mono text-[10px] uppercase tracking-widest text-white/35">RAV UX</div>
                        </div>
                        <p className="mt-4 text-solaris-text leading-relaxed">
                          “{t.quote}”
                        </p>
                        <div className="mt-5 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-semibold text-solaris-text truncate">{t.name}</div>
                            <div className="text-xs text-solaris-muted truncate">{t.role}</div>
                          </div>
                          <div className="h-10 w-10 shrink-0 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center text-solaris-gold font-mono">
                            {t.name
                              .split(' ')
                              .filter(Boolean)
                              .slice(0, 2)
                              .map((p) => p.slice(0, 1).toUpperCase())
                              .join('')}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="min-w-0">
            <div className="font-mono text-[10px] uppercase tracking-widest text-solaris-muted mb-3">
              Partner quotes
            </div>
            <div className="space-y-3">
              {partnerQuotes.map((q, idx) => (
                <div key={`${q.name}-${idx}`} className="bento-card p-5 border border-white/10">
                  <p className="text-solaris-text text-sm leading-relaxed">“{q.quote}”</p>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-solaris-text truncate">{q.name}</div>
                      <div className="text-xs text-solaris-muted truncate">{q.role}</div>
                    </div>
                    <div className="inline-flex items-center gap-1 rounded-full border border-solaris-cyan/20 bg-solaris-cyan/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-solaris-cyan">
                      {clampScore(q.score)}/5
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

