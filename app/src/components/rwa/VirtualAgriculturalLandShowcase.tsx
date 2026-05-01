import { Fingerprint, Leaf, LineChart, Shield } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactElement } from 'react';

import { buildVirtualLandGrid, type VirtualParcel, type VirtualParcelStatus } from '@/lib/virtualLand';

type Ui = {
  header: {
    titleLead: string;
    titleAccent: string;
    titleTail: string;
    subtitle: string;
  };
  metrics: {
    cetSupplyLabel: string;
    totalLandLabel: string;
    parcelsLabel: string;
    tokenLandRatioLabel: string;
  };
  map: {
    title: string;
    legendTokenized: string;
    legendAvailable: string;
    legendReserved: string;
    selectedLabel: string;
    zoneLabel: string;
    statusLabel: string;
    statusTokenized: string;
    statusAvailable: string;
    statusReserved: string;
  };
  features: {
    onChainTitle: string;
    onChainBody: string;
    sensorsTitle: string;
    sensorsBody: string;
    distributionTitle: string;
    distributionBody: string;
  };
  layers: {
    title: string;
    l1Title: string;
    l1Body: string;
    l1Status: string;
    l2Title: string;
    l2Body: string;
    l2Status: string;
    l3Title: string;
    l3Body: string;
    l3Status: string;
    l4Title: string;
    l4Body: string;
    l4Status: string;
    l5Title: string;
    l5Body: string;
    l5Status: string;
  };
};

function statusLabel(status: VirtualParcelStatus, ui: Ui['map']): string {
  if (status === 'tokenized') return ui.statusTokenized;
  if (status === 'available') return ui.statusAvailable;
  return ui.statusReserved;
}

function statusClass(status: VirtualParcelStatus): string {
  if (status === 'tokenized') return 'bg-[#4a3a1e] border-emerald-500/20';
  if (status === 'available') return 'bg-emerald-500/30 border-emerald-400/35';
  return 'bg-emerald-950/60 border-emerald-500/15';
}

function layerPill(status: string): string {
  const s = status.toLowerCase();
  if (s.includes('active') || s.includes('activ')) return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25';
  if (s.includes('planned') || s.includes('plan')) return 'bg-amber-500/10 text-amber-200 border-amber-500/25';
  return 'bg-white/5 text-solaris-muted border-white/10';
}

export function VirtualAgriculturalLandShowcase(props: {
  ui: Ui;
  metrics: { cetSupply: string; totalLand: string; parcels: number; tokenLandRatio: string };
}): ReactElement {
  const rows = 12;
  const cols = 26;
  const parcelCount = rows * cols;
  const [statusOverride, setStatusOverride] = useState<VirtualParcelStatus[] | null>(null);
  const grid = useMemo(
    () => buildVirtualLandGrid({ zone: 'A', rows, cols, statusOverride: statusOverride ?? undefined }),
    [cols, rows, statusOverride],
  );
  const [selected, setSelected] = useState<VirtualParcel | null>(null);

  const { ui } = props;
  const items: Array<{ value: string; label: string }> = [
    { value: props.metrics.cetSupply, label: ui.metrics.cetSupplyLabel },
    { value: props.metrics.totalLand, label: ui.metrics.totalLandLabel },
    { value: String(props.metrics.parcels), label: ui.metrics.parcelsLabel },
    { value: props.metrics.tokenLandRatio, label: ui.metrics.tokenLandRatioLabel },
  ];

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/cetuia/tokens?all=1', { method: 'GET', cache: 'no-store' });
        const json = (await res.json().catch(() => null)) as
          | { ok?: unknown; tokens?: Array<{ id: number; status: 'available' | 'reserved' | 'sold' }> }
          | null;
        if (!json?.ok || !Array.isArray(json.tokens)) return;
        if (cancelled) return;
        const next: VirtualParcelStatus[] = new Array(parcelCount);
        for (const t of json.tokens) {
          if (!t || typeof t.id !== 'number') continue;
          if (t.id < 1 || t.id > parcelCount) continue;
          next[t.id - 1] = t.status === 'sold' ? 'tokenized' : t.status === 'reserved' ? 'reserved' : 'available';
        }
        setStatusOverride(next);
      } catch {
        void 0;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [parcelCount]);

  return (
    <div className="rounded-3xl border border-emerald-500/20 bg-black/30 p-6 md:p-8 overflow-hidden">
      <div className="text-center max-w-3xl mx-auto">
        <h3 className="font-display text-white text-3xl md:text-4xl font-bold tracking-tight">
          <span className="text-white">{ui.header.titleLead}</span>{' '}
          <span className="text-solaris-gold">{ui.header.titleAccent}</span>{' '}
          <span className="text-emerald-300">{ui.header.titleTail}</span>
        </h3>
        <p className="mt-3 text-solaris-muted text-sm md:text-base leading-relaxed">{ui.header.subtitle}</p>
      </div>

      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map((m) => (
          <div key={m.label} className="rounded-2xl border border-emerald-500/15 bg-emerald-950/20 px-4 py-4">
            <div className="text-white font-display font-bold text-2xl tracking-tight">{m.value}</div>
            <div className="mt-1 text-[10px] font-mono uppercase tracking-widest text-solaris-muted">{m.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[11px] font-mono uppercase tracking-widest text-solaris-muted">{ui.map.title}</div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 text-[11px] text-solaris-muted">
                <span className="h-2.5 w-2.5 rounded-sm border border-emerald-500/20 bg-[#4a3a1e]" />
                {ui.map.legendTokenized}
              </div>
              <div className="inline-flex items-center gap-2 text-[11px] text-solaris-muted">
                <span className="h-2.5 w-2.5 rounded-sm border border-emerald-400/35 bg-emerald-500/30" />
                {ui.map.legendAvailable}
              </div>
              <div className="inline-flex items-center gap-2 text-[11px] text-solaris-muted">
                <span className="h-2.5 w-2.5 rounded-sm border border-emerald-500/15 bg-emerald-950/60" />
                {ui.map.legendReserved}
              </div>
            </div>
          </div>

          <div
            className="mt-3 rounded-2xl border border-emerald-500/15 bg-black/40 p-3 overflow-auto"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <div
              className="grid gap-1"
              style={{ gridTemplateColumns: `repeat(${grid.cols}, minmax(0, 1fr))` }}
            >
              {grid.parcels.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelected(p)}
                  className={`relative aspect-square rounded-[6px] border ${statusClass(p.status)} hover:brightness-110 transition-[filter,transform] motion-safe:hover:-translate-y-[1px] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60`}
                  aria-label={`${p.id} ${statusLabel(p.status, ui.map)}`}
                  title={`${p.id} · ${statusLabel(p.status, ui.map)}`}
                >
                  <span className="absolute inset-x-0 bottom-0.5 text-[7px] font-mono text-white/70 truncate px-0.5">
                    {p.id}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <aside className="lg:col-span-4 rounded-2xl border border-white/10 bg-black/35 p-5">
          <div className="text-[11px] font-mono uppercase tracking-widest text-solaris-muted">
            {ui.map.selectedLabel}
          </div>
          {selected ? (
            <div className="mt-3">
              <div className="text-white font-display font-bold text-lg">{selected.id}</div>
              <dl className="mt-3 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[10px] font-mono uppercase tracking-widest text-solaris-muted">{ui.map.zoneLabel}</dt>
                  <dd className="text-xs text-solaris-text">{selected.zone}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[10px] font-mono uppercase tracking-widest text-solaris-muted">{ui.map.statusLabel}</dt>
                  <dd className="text-xs text-solaris-text">{statusLabel(selected.status, ui.map)}</dd>
                </div>
              </dl>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-white font-display font-bold text-sm">{grid.counts.tokenized}</div>
                  <div className="mt-1 text-[10px] font-mono uppercase tracking-widest text-solaris-muted">
                    {ui.map.legendTokenized}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-white font-display font-bold text-sm">{grid.counts.available}</div>
                  <div className="mt-1 text-[10px] font-mono uppercase tracking-widest text-solaris-muted">
                    {ui.map.legendAvailable}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-white font-display font-bold text-sm">{grid.counts.reserved}</div>
                  <div className="mt-1 text-[10px] font-mono uppercase tracking-widest text-solaris-muted">
                    {ui.map.legendReserved}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-3 text-sm text-solaris-muted">
              {ui.header.titleLead} {ui.header.titleAccent} {ui.header.titleTail}
            </div>
          )}
        </aside>
      </div>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/10 bg-black/35 p-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center">
              <Fingerprint className="w-4 h-4 text-emerald-300" aria-hidden="true" />
            </div>
            <div className="text-white font-display font-bold text-sm">{ui.features.onChainTitle}</div>
          </div>
          <p className="mt-3 text-sm text-solaris-muted leading-relaxed">{ui.features.onChainBody}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/35 p-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center">
              <LineChart className="w-4 h-4 text-emerald-300" aria-hidden="true" />
            </div>
            <div className="text-white font-display font-bold text-sm">{ui.features.sensorsTitle}</div>
          </div>
          <p className="mt-3 text-sm text-solaris-muted leading-relaxed">{ui.features.sensorsBody}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/35 p-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-solaris-gold/10 border border-solaris-gold/20 flex items-center justify-center">
              <Shield className="w-4 h-4 text-solaris-gold" aria-hidden="true" />
            </div>
            <div className="text-white font-display font-bold text-sm">{ui.features.distributionTitle}</div>
          </div>
          <p className="mt-3 text-sm text-solaris-muted leading-relaxed">{ui.features.distributionBody}</p>
        </div>
      </div>

      <div className="mt-10 rounded-2xl border border-emerald-500/15 bg-black/35 p-6">
        <div className="text-[11px] font-mono uppercase tracking-widest text-solaris-muted">{ui.layers.title}</div>
        <div className="mt-4 space-y-4">
          {[
            { n: 'L1', title: ui.layers.l1Title, body: ui.layers.l1Body, status: ui.layers.l1Status, icon: Leaf },
            { n: 'L2', title: ui.layers.l2Title, body: ui.layers.l2Body, status: ui.layers.l2Status, icon: Leaf },
            { n: 'L3', title: ui.layers.l3Title, body: ui.layers.l3Body, status: ui.layers.l3Status, icon: Fingerprint },
            { n: 'L4', title: ui.layers.l4Title, body: ui.layers.l4Body, status: ui.layers.l4Status, icon: LineChart },
            { n: 'L5', title: ui.layers.l5Title, body: ui.layers.l5Body, status: ui.layers.l5Status, icon: Shield },
          ].map((l) => {
            const Icon = l.icon;
            return (
              <div key={l.n} className="flex items-start gap-4">
                <div className="w-10 shrink-0">
                  <div className="text-[11px] font-mono text-emerald-300/80">{l.n}</div>
                  <div className="mt-2 h-[2px] w-full rounded bg-emerald-400/30" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-emerald-200/80" aria-hidden="true" />
                      <div className="text-white text-sm font-semibold">{l.title}</div>
                    </div>
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-mono ${layerPill(l.status)}`}>
                      {l.status}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-solaris-muted leading-relaxed">{l.body}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
