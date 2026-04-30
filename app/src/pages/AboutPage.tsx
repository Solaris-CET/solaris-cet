import { CalendarDays, CheckCircle2, Globe2, ShieldCheck } from 'lucide-react';

import { useLanguage } from '@/hooks/useLanguage';
import { useReducedMotion } from '@/hooks/useReducedMotion';

type Milestone = {
  title: string;
  body: string;
  tag: string;
  icon: typeof CalendarDays;
};

export default function AboutPage() {
  const prefersReducedMotion = useReducedMotion();
  const { t } = useLanguage();

  const milestones: Milestone[] = [
    {
      title: 'Genesis: fixed scarcity on TON',
      body: 'CET is engineered around a hard cap of 9,000 tokens and a 90-year mining horizon—designed for long-lived, verifiable ownership surfaces.',
      tag: 'SUPPLY · 9,000',
      icon: CheckCircle2,
    },
    {
      title: 'Public liquidity & discovery',
      body: 'Liquidity and discovery routes are designed to be simple and auditable: on-chain addresses, pool references, and repeatable verification steps.',
      tag: 'DEX · AUDIT PATH',
      icon: Globe2,
    },
    {
      title: 'CET AI: RAV protocol demo',
      body: 'The CET AI interface prioritises UX integrity: explicit fallback states, rate-limit handling, and a response format meant to be copy-pasteable for audits.',
      tag: 'RAV · UX',
      icon: ShieldCheck,
    },
    {
      title: 'RWA narrative and documentation',
      body: 'The RWA story is presented as navigable documentation: timeline, proof surfaces, and downloadable artifacts, with a print-friendly reading mode.',
      tag: 'RWA · DOCS',
      icon: CalendarDays,
    },
  ];

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="relative w-full overflow-x-clip pb-[var(--mobile-conversion-dock-reserve)] xl:pb-0"
    >
      <section className="relative section-glass section-padding-y overflow-hidden mesh-bg">
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
          <div className="absolute bottom-0 left-0 right-0 h-[40vh] grid-floor opacity-10" />
          <div className="absolute top-[-10%] left-[-12%] h-[520px] w-[520px] rounded-full bg-solaris-gold/10 blur-[140px]" />
          <div className="absolute bottom-[-14%] right-[-10%] h-[520px] w-[520px] rounded-full bg-solaris-cyan/10 blur-[160px]" />
        </div>

        <div className="relative z-10 section-padding-x mx-auto w-full max-w-6xl">
          <div className="max-w-3xl">
            <div className="hud-label text-solaris-gold">ABOUT</div>
            <h1 className="mt-3 font-display font-bold text-[clamp(30px,4vw,52px)] text-solaris-text">
              Solaris CET — why it exists
            </h1>
            <p className="mt-4 text-solaris-muted text-base leading-relaxed">
              This page is a concise timeline and rationale layer. It avoids vague claims and instead focuses on verifiable primitives: supply, on-chain proof, and operational UX.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-mono text-solaris-text">
                {t.nav.rwa}
              </span>
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-mono text-solaris-text">
                {t.nav.cetAi}
              </span>
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-mono text-solaris-text">
                {t.nav.whitepaper}
              </span>
            </div>
          </div>

          <div className="mt-12 grid gap-4 lg:grid-cols-2">
            {milestones.map((m) => {
              const Icon = m.icon;
              return (
                <div key={m.title} className="bento-card p-6 border border-white/10">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="font-mono text-[10px] uppercase tracking-widest text-solaris-muted">
                        {m.tag}
                      </div>
                      <h2 className="mt-2 font-display font-semibold text-solaris-text text-lg">
                        {m.title}
                      </h2>
                    </div>
                    <div className="h-10 w-10 shrink-0 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-solaris-gold" aria-hidden />
                    </div>
                  </div>
                  <p className="mt-3 text-solaris-muted text-sm leading-relaxed">{m.body}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <a
              href="/"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-solaris-gold/10 border border-solaris-gold/30 text-solaris-gold px-5 text-sm font-semibold hover:bg-solaris-gold/20 transition-colors btn-quantum"
            >
              Back to home
            </a>
            <a
              href="/cet-ai"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-solaris-text px-5 text-sm font-semibold hover:bg-white/10 transition-colors btn-quantum"
            >
              Open CET AI
            </a>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' })}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-solaris-text px-5 text-sm font-semibold hover:bg-white/10 transition-colors btn-quantum"
            >
              Top
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

