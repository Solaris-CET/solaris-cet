import { useMemo } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import CetAiSearch from '@/components/CetAiSearch';
import { cn } from '@/lib/utils';

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

export default function CetAiPage() {
  const { t } = useLanguage();
  const suggested = useMemo(() => t.cetAi.suggestedQuestions.slice(0, 6), [t]);

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="relative w-full overflow-x-clip pb-[var(--mobile-conversion-dock-reserve)] xl:pb-0"
    >
      <h1 className="sr-only">{t.nav.cetAi}</h1>

      <section
        id="cet-ai"
        aria-label={t.nav.cetAi}
        className="relative section-glass section-padding-y overflow-hidden mesh-bg"
      >
        <div className="section-padding-x mx-auto grid max-w-[1200px] gap-10 lg:grid-cols-2 lg:gap-12">
          <div className="min-w-0">
            <CetAiSearch />
          </div>

          <aside className="min-w-0">
            <div
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur md:p-6"
              onPointerMove={(e) => setGlowVars(e.currentTarget, e.clientX, e.clientY)}
              onPointerLeave={(e) => clearGlowVars(e.currentTarget)}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300"
                style={{
                  opacity: 'var(--glow-on, 0)' as unknown as number,
                  background:
                    'radial-gradient(260px circle at var(--glow-x, 50%) var(--glow-y, 50%), rgba(168,85,247,0.16), rgba(46,231,255,0.08) 44%, transparent 72%)',
                }}
              />
              <div className="mt-2 text-lg font-semibold text-white">{t.cetAi.heroCapabilityNote}</div>
              <div className="mt-3 text-sm leading-relaxed text-white/70">{t.cetAi.privacyNotice}</div>
              <div className="mt-5 text-sm font-semibold text-white">{t.cetAi.askNextLabel}</div>
              <ul className="mt-3 flex flex-wrap gap-2" aria-label={t.cetAi.askNextLabel}>
                {suggested.map((q) => (
                  <li
                    key={q}
                    className={cn(
                      'relative overflow-hidden rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-white/80',
                    )}
                    onPointerMove={(e) => setGlowVars(e.currentTarget, e.clientX, e.clientY)}
                    onPointerLeave={(e) => clearGlowVars(e.currentTarget)}
                  >
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300"
                      style={{
                        opacity: 'var(--glow-on, 0)' as unknown as number,
                        background:
                          'radial-gradient(200px circle at var(--glow-x, 50%) var(--glow-y, 50%), rgba(46,231,255,0.14), rgba(168,85,247,0.08) 55%, transparent 78%)',
                      }}
                    />
                    {q}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
