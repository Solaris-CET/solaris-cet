import { Calendar, ChevronDown } from 'lucide-react';

import { useLanguage } from '@/hooks/useLanguage';
import type { RwaTimelineEvent } from '@/lib/rwaPortfolio';
import { timelineChipClass } from '@/lib/rwaPortfolio';

function setGlowVars(el: HTMLElement, clientX: number, clientY: number) {
  const r = el.getBoundingClientRect();
  const x = clientX - r.left;
  const y = clientY - r.top;
  el.style.setProperty('--glow-x', `${x}px`);
  el.style.setProperty('--glow-y', `${y}px`);
  el.style.setProperty('--glow-on', '1');
}

function clearGlowVars(el: HTMLElement) {
  el.style.setProperty('--glow-on', '0');
}

export function RwaTimelinePanel({
  events,
  title,
}: {
  events: readonly RwaTimelineEvent[];
  title?: string;
}) {
  const { t } = useLanguage();
  const tx = t.rwaUi.timeline;
  const resolvedTitle = title ?? tx.title;
  return (
    <section className="bento-card border border-white/10 p-6 shadow-depth" aria-label={tx.ariaLabel}>
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h3 className="font-display font-bold text-base text-solaris-text">{resolvedTitle}</h3>
          <p className="text-solaris-muted text-sm mt-1 max-w-2xl">
            {tx.subtitle}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono text-solaris-muted">
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400/80" aria-hidden="true" />
          {tx.legendComplete}
          <span className="inline-flex h-2 w-2 rounded-full bg-amber-300/80 ml-3" aria-hidden="true" />
          {tx.legendActive}
          <span className="inline-flex h-2 w-2 rounded-full bg-cyan-300/80 ml-3" aria-hidden="true" />
          {tx.legendPlanned}
        </div>
      </div>

      <div className="space-y-3">
        {events.map((e) => (
          <details
            key={e.id}
            id={`milestone-${e.slug}`}
            className="group relative overflow-hidden rounded-xl border border-white/10 bg-black/30 px-4 py-3 open:bg-black/40"
            onPointerMove={(ev) => setGlowVars(ev.currentTarget, ev.clientX, ev.clientY)}
            onPointerLeave={(ev) => clearGlowVars(ev.currentTarget)}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300"
              style={{
                opacity: 'var(--glow-on, 0)' as unknown as number,
                background:
                  'radial-gradient(220px circle at var(--glow-x, 50%) var(--glow-y, 50%), rgba(34,197,94,0.14), rgba(242,201,76,0.06) 45%, transparent 72%)',
              }}
            />
            <summary className="list-none cursor-pointer flex items-start justify-between gap-3 [&::-webkit-details-marker]:hidden">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 w-9 h-9 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4 text-solaris-gold" aria-hidden="true" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display font-semibold text-solaris-text">
                      {e.title}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-mono ${timelineChipClass(
                        e.status,
                      )}`}
                    >
                      {e.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-solaris-muted mt-0.5">{e.date}</p>
                </div>
              </div>
              <ChevronDown
                className="w-4 h-4 text-solaris-muted mt-2 group-open:rotate-180 transition-transform"
                aria-hidden="true"
              />
            </summary>
            <div className="mt-3 pt-3 border-t border-white/10">
              <p className="text-sm text-solaris-muted leading-relaxed">{e.description}</p>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
