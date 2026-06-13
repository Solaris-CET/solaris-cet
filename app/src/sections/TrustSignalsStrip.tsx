import { useMemo } from 'react';

import { companyProfile } from '@/data/companyProfile';

import styles from './TrustSignalsStrip.module.css';

function Star({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} aria-hidden focusable="false">
      <path
        fill="currentColor"
        d="M12 2.6l2.83 5.74 6.33.92-4.58 4.46 1.08 6.3L12 17.92 6.34 20.02l1.08-6.3L2.84 9.26l6.33-.92L12 2.6Z"
      />
    </svg>
  );
}

export default function TrustSignalsStrip() {
  const reviewLine = useMemo(() => {
    const rv = companyProfile.reviews?.ratingValue;
    const src = companyProfile.reviews?.sourceLabel;
    const count = companyProfile.reviews?.ratingCount;
    return rv && src ? (count ? `${rv.toFixed(1)}/5 · ${count}+ ${src}` : `${rv.toFixed(1)}/5 · ${src}`) : 'Execuție curată · suport post-proiect';
  }, []);

  const tickerText =
    'Fotovoltaice · Acoperișuri tablă/țiglă · TPO industrial · Atice și fațade · Reparații · Mentenanță ·';

  const facts = [
    {
      value: '6',
      label: 'Tipuri de lucrări',
      note: 'Fotovoltaice, acoperișuri, TPO, atice/fațade, reparații',
    },
    {
      value: '24h',
      label: 'Răspuns comercial',
      note: 'Confirmare rapidă pentru cereri, poze și clarificări',
    },
    {
      value: 'RO',
      label: 'Arie de lucru',
      note: 'Vaslui, Moldova și proiecte selectate la nivel național',
    },
  ];

  return (
    <section data-reveal className="relative z-20 bg-[#0a0f1c] text-white">
      <div
        className="absolute inset-x-0 top-0 h-px"
        aria-hidden
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(245,215,110,0.55) 30%, rgba(245,215,110,0.85) 50%, rgba(245,215,110,0.55) 70%, transparent)',
        }}
      />
      <div className="max-w-7xl mx-auto px-5 sm:px-8 xl:px-12 py-12">
        <div className="solaris-card-gold rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-sm">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)_minmax(0,0.9fr)]">
            <div className="p-6 sm:p-7" data-reveal-stagger>
              <div className="solaris-eyebrow">Repere comerciale</div>
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {facts.map((s) => (
                  <div key={s.label} className="solaris-stat rounded-2xl px-5 py-4">
                    <div className="solaris-gold-text text-2xl sm:text-3xl font-black tabular-nums leading-none">{s.value}</div>
                    <div className="mt-2 text-sm font-semibold text-white/85">{s.label}</div>
                    <div className="mt-2 text-xs leading-relaxed text-white/50">{s.note}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-white/10 lg:border-t-0 lg:border-x lg:border-white/10 p-6 sm:p-7 flex items-center">
              <div className="w-full">
                <div className="sr-only">Tehnologii și termeni: {tickerText}</div>
                <div className={`${styles.ticker} text-sm font-semibold tracking-wide text-white/70`}>
                  <div className={styles.tickerTrack} aria-hidden>
                    <div className={styles.tickerChunk}>
                      <span>{tickerText}</span>
                      <span>{tickerText}</span>
                      <span>{tickerText}</span>
                    </div>
                    <div className={styles.tickerChunk}>
                      <span>{tickerText}</span>
                      <span>{tickerText}</span>
                      <span>{tickerText}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={`p-6 sm:p-7 flex items-center ${styles.starsVisible}`}>
              <div className="w-full">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-black text-white">Ce promitem clar</div>
                    <div className="mt-1 text-xs text-white/60">{reviewLine}</div>
                  </div>
                  <div role="img" className="flex items-center gap-1 text-amber-400" aria-label={reviewLine}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${styles.star}`}
                        style={{ animationDelay: `${i * 100}ms` }}
                      />
                    ))}
                  </div>
                </div>
                <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-white/12 to-transparent" aria-hidden />
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-white/55">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400/80" aria-hidden />
                    Atestări & conformitate
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400/80" aria-hidden />
                    Execuție curată
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400/80" aria-hidden />
                    Suport post-proiect
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
