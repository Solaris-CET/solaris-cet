import { MapPin, Minus, Plus, RotateCcw } from 'lucide-react';
import { type PointerEvent,useMemo, useRef, useState } from 'react';

import { useLanguage } from '@/hooks/useLanguage';
import type { RwaProject } from '@/lib/rwaPortfolio';
import { statusChipClass } from '@/lib/rwaPortfolio';

type Viewport = {
  zoom: number;
  x: number;
  y: number;
};

const MIN_ZOOM = 1;
const MAX_ZOOM = 2.6;

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function RwaPortfolioMap({
  projects,
  selectedProjectId,
  onSelectProject,
}: {
  projects: readonly RwaProject[];
  selectedProjectId: string | null;
  onSelectProject: (id: string) => void;
}) {
  const { t } = useLanguage();
  const tx = t.rwaUi.map;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    isDown: boolean;
    startX: number;
    startY: number;
    startVX: number;
    startVY: number;
  } | null>(null);

  const [viewport, setViewport] = useState<Viewport>({ zoom: 1.2, x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const selection = useMemo(() => {
    return projects.find((p) => p.id === selectedProjectId) ?? null;
  }, [projects, selectedProjectId]);

  const setZoom = (next: number) => {
    setViewport((v) => ({ ...v, zoom: clamp(next, MIN_ZOOM, MAX_ZOOM) }));
  };

  const resetView = () => {
    setViewport({ zoom: 1.2, x: 0, y: 0 });
  };

  const onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragRef.current = {
      isDown: true,
      startX: e.clientX,
      startY: e.clientY,
      startVX: viewport.x,
      startVY: viewport.y,
    };
  };

  const onPointerMove = (e: PointerEvent) => {
    const d = dragRef.current;
    if (!d?.isDown) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    setViewport((v) => ({ ...v, x: d.startVX + dx, y: d.startVY + dy }));
  };

  const onPointerUp = () => {
    if (dragRef.current) dragRef.current.isDown = false;
    setIsDragging(false);
  };

  return (
    <div
      ref={containerRef}
      className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/40 shadow-depth"
      role="region"
      aria-label={tx.ariaLabel}
    >
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(34,211,238,0.10),transparent_52%),radial-gradient(circle_at_70%_60%,rgba(242,201,76,0.12),transparent_60%)]" />
        <div className="absolute inset-0 opacity-[0.18] bg-[linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:22px_22px]" />
      </div>

      <div
        className="absolute left-4 top-4 z-10 flex items-center gap-2"
        role="group"
        aria-label={tx.controlsAria}
      >
        <button
          type="button"
          onClick={() => setZoom(viewport.zoom + 0.2)}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-white/10 bg-black/60 text-solaris-text hover:bg-black/80 transition-colors"
          aria-label={tx.zoomInAria}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => setZoom(viewport.zoom - 0.2)}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-white/10 bg-black/60 text-solaris-text hover:bg-black/80 transition-colors"
          aria-label={tx.zoomOutAria}
        >
          <Minus className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={resetView}
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/10 bg-black/60 px-3 text-solaris-text hover:bg-black/80 transition-colors"
          aria-label={tx.resetAria}
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          <span className="ml-2 text-xs font-semibold">{tx.resetLabel}</span>
        </button>
      </div>

      <div
        className="absolute right-4 top-4 z-10 flex items-center gap-2"
        aria-label={tx.selectionAria}
        role="status"
      >
        {selection ? (
          <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-mono ${statusChipClass(selection.status)}`}>
            <span className="inline-flex h-2 w-2 rounded-full bg-current opacity-80" aria-hidden="true" />
            {selection.status.toUpperCase()}
          </span>
        ) : null}
      </div>

      <div
        className="relative h-[520px] md:h-[580px] cursor-grab active:cursor-grabbing touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          className="absolute inset-0"
          style={{
            transform: `translate3d(${viewport.x}px, ${viewport.y}px, 0) scale(${viewport.zoom})`,
            transformOrigin: '50% 50%',
            transition: isDragging ? 'none' : 'transform 160ms ease-out',
          }}
        >
          <div
            className="absolute inset-0"
            aria-hidden="true"
            style={{
              background:
                'radial-gradient(circle at 55% 45%, rgba(16,185,129,0.16), transparent 45%), radial-gradient(circle at 68% 52%, rgba(56,189,248,0.12), transparent 52%)',
            }}
          />

          {projects.map((p) => {
            const active = p.id === selectedProjectId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectProject(p.id)}
                className={
                  'absolute -translate-x-1/2 -translate-y-1/2 rounded-full border shadow-[0_0_20px_rgba(242,201,76,0.12)] transition-colors ' +
                  (active
                    ? 'bg-solaris-gold/20 border-solaris-gold/50 text-solaris-gold'
                    : 'bg-black/50 border-white/15 text-solaris-text hover:border-solaris-gold/40 hover:text-solaris-gold')
                }
                style={{ left: `${p.marker.xPct}%`, top: `${p.marker.yPct}%` }}
                aria-label={tx.selectProjectAria.replace('{title}', p.title)}
              >
                <span className="inline-flex min-h-11 min-w-11 items-center justify-center">
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                </span>
              </button>
            );
          })}

          <div
            className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md px-4 py-3"
            role="note"
          >
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-solaris-muted">
                {tx.infoNote}
              </p>
              <p className="text-[10px] font-mono text-solaris-muted">
                {tx.helpLine}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
