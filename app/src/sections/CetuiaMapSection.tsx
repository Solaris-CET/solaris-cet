import { useMemo, useState } from 'react';

import { CetuiaHexMap, type CetuiaTokenStatus } from '@/components/cetuia/CetuiaHexMap';
import { useLanguage } from '@/hooks/useLanguage';

export default function CetuiaMapSection() {
  const { t } = useLanguage();
  const [selected, setSelected] = useState<{ id: number; status: CetuiaTokenStatus } | null>(null);

  const statusLabel = useMemo(() => {
    if (!selected) return null;
    if (selected.status === 'sold') return 'VÂNDUT';
    if (selected.status === 'reserved') return 'REZERVAT';
    return 'DISPONIBIL';
  }, [selected]);

  return (
    <section
      data-testid="cetuia-map-section"
      className="relative z-10 w-full max-w-6xl mx-auto px-6 pt-16 md:pt-20 pb-14"
    >
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-mono text-white/70">
          CET • 9,000 TOKENS
        </div>
        <h2 className="mt-5 font-display text-4xl md:text-5xl tracking-tight text-white">
          {t.nav.cetuia}
        </h2>
        <p className="mt-3 max-w-2xl text-solaris-muted leading-relaxed">
          Selectează un hex pentru detalii. Pan: drag. Zoom: +/−.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr,340px] gap-6 items-start">
        <CetuiaHexMap
          selectedId={selected?.id ?? null}
          onSelect={(id, status) => {
            if (!id || !status) {
              setSelected(null);
              return;
            }
            setSelected({ id, status });
          }}
        />

        <aside className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-md shadow-depth overflow-hidden">
          <div className="p-5 border-b border-white/10">
            <div className="text-xs font-mono text-white/55">TOKEN SELECTAT</div>
            <div className="mt-2 flex items-baseline justify-between gap-3">
              <div className="font-display text-2xl text-white" data-testid="cetuia-selected-token">
                {selected ? `#${selected.id}` : '—'}
              </div>
              {statusLabel ? (
                <div
                  data-testid="cetuia-selected-status"
                  className={
                    'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-mono ' +
                    (selected?.status === 'sold'
                      ? 'border-rose-400/30 bg-rose-400/10 text-rose-200'
                      : selected?.status === 'reserved'
                        ? 'border-amber-400/30 bg-amber-400/10 text-amber-200'
                        : 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200')
                  }
                >
                  <span className="inline-flex h-2 w-2 rounded-full bg-current opacity-80" aria-hidden="true" />
                  {statusLabel}
                </div>
              ) : null}
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-xs font-mono text-white/55">LEGENDĂ</div>
              <div className="mt-3 grid grid-cols-1 gap-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-white/80">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-300/90" aria-hidden />
                    Disponibil
                  </div>
                  <div className="text-xs font-mono text-white/45">AVAILABLE</div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-white/80">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-300/90" aria-hidden />
                    Rezervat
                  </div>
                  <div className="text-xs font-mono text-white/45">RESERVED</div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-white/80">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-300/90" aria-hidden />
                    Vândut
                  </div>
                  <div className="text-xs font-mono text-white/45">SOLD</div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-xs font-mono text-white/55">NOTE</div>
              <p className="mt-2 text-sm text-solaris-muted leading-relaxed">
                Statusurile sunt generate dintr-un endpoint de demo și vor fi conectate la dovada deținerii on-chain + indexer în pasul următor.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
