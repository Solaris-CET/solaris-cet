import { Minus, Plus, RotateCcw } from 'lucide-react';
import { type PointerEvent,useEffect, useMemo, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

export type CetuiaTokenStatus = 'available' | 'reserved' | 'sold';

type Viewport = {
  zoom: number;
  x: number;
  y: number;
};

type Axial = { q: number; r: number };

const TOTAL_TOKENS = 9000;
const BASE_HEX_SIZE = 10;
const MIN_ZOOM = 0.35;
const MAX_ZOOM = 3.2;

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function axialKey(a: Axial): string {
  return `${a.q},${a.r}`;
}

const AXIAL_DIRS: readonly Axial[] = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
] as const;

function generateSpiral(count: number): Axial[] {
  const radius = 55;
  const coords: Axial[] = [{ q: 0, r: 0 }];
  for (let k = 1; k <= radius && coords.length < count; k++) {
    let q = AXIAL_DIRS[4].q * k;
    let r = AXIAL_DIRS[4].r * k;
    for (let dir = 0; dir < 6 && coords.length < count; dir++) {
      const step = AXIAL_DIRS[dir];
      for (let i = 0; i < k && coords.length < count; i++) {
        coords.push({ q, r });
        q += step.q;
        r += step.r;
      }
    }
  }
  return coords.slice(0, count);
}

function axialToPixel(a: Axial, size: number): { x: number; y: number } {
  const x = size * Math.sqrt(3) * (a.q + a.r / 2);
  const y = size * 1.5 * a.r;
  return { x, y };
}

function pixelToAxial(p: { x: number; y: number }, size: number): Axial {
  const q = (Math.sqrt(3) / 3 * p.x - (1 / 3) * p.y) / size;
  const r = ((2 / 3) * p.y) / size;
  return cubeRound({ x: q, y: -q - r, z: r });
}

function cubeRound(c: { x: number; y: number; z: number }): Axial {
  let rx = Math.round(c.x);
  const ry = Math.round(c.y);
  let rz = Math.round(c.z);

  const xDiff = Math.abs(rx - c.x);
  const yDiff = Math.abs(ry - c.y);
  const zDiff = Math.abs(rz - c.z);

  if (xDiff > yDiff && xDiff > zDiff) rx = -ry - rz;
  else if (yDiff > zDiff) void 0;
  else rz = -rx - ry;

  return { q: rx, r: rz };
}

function statusToColor(status: CetuiaTokenStatus): { fill: string; stroke: string } {
  if (status === 'sold') return { fill: 'rgba(251, 113, 133, 0.16)', stroke: 'rgba(251, 113, 133, 0.28)' };
  if (status === 'reserved') return { fill: 'rgba(252, 211, 77, 0.16)', stroke: 'rgba(252, 211, 77, 0.28)' };
  return { fill: 'rgba(110, 231, 183, 0.16)', stroke: 'rgba(110, 231, 183, 0.24)' };
}

export function CetuiaHexMap({
  selectedId,
  onSelect,
}: {
  selectedId: number | null;
  onSelect: (id: number | null, status: CetuiaTokenStatus | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const userInteractedRef = useRef(false);
  const dragRef = useRef<{
    isDown: boolean;
    startX: number;
    startY: number;
    startVX: number;
    startVY: number;
    moved: boolean;
  } | null>(null);

  const coords = useMemo(() => generateSpiral(TOTAL_TOKENS), []);
  const axialToId = useMemo(() => {
    const m = new Map<string, number>();
    coords.forEach((a, idx) => m.set(axialKey(a), idx + 1));
    return m;
  }, [coords]);

  const bounds = useMemo(() => {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const a of coords) {
      const p = axialToPixel(a, BASE_HEX_SIZE);
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
    return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
  }, [coords]);

  const [viewport, setViewport] = useState<Viewport>({ zoom: 1, x: 0, y: 0 });
  const [fitZoom, setFitZoom] = useState(1);
  const [canvasSize, setCanvasSize] = useState<{ w: number; h: number; dpr: number }>({ w: 0, h: 0, dpr: 1 });
  const [statuses, setStatuses] = useState<Uint8Array>(() => new Uint8Array(TOTAL_TOKENS));
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (!rect) return;
      const dpr = typeof window !== 'undefined' ? Math.min(2, window.devicePixelRatio || 1) : 1;
      setCanvasSize({ w: Math.max(1, Math.floor(rect.width)), h: Math.max(1, Math.floor(rect.height)), dpr });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!canvasSize.w || !canvasSize.h) return;
    const padding = 120;
    const z = clamp(Math.min(canvasSize.w / (bounds.width + padding), canvasSize.h / (bounds.height + padding)), MIN_ZOOM, MAX_ZOOM);
    setFitZoom(z);
    if (userInteractedRef.current) return;
    setViewport({ zoom: z, x: 0, y: 0 });
  }, [bounds.height, bounds.width, canvasSize.h, canvasSize.w]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    void (async () => {
      try {
        const res = await fetch('/api/cetuia/tokens?all=1', { method: 'GET', cache: 'no-store' });
        const json = (await res.json().catch(() => null)) as
          | { ok?: unknown; tokens?: Array<{ id: number; status: CetuiaTokenStatus }> }
          | null;
        if (!json?.ok || !Array.isArray(json.tokens)) throw new Error('bad_response');
        if (cancelled) return;
        const next = new Uint8Array(TOTAL_TOKENS);
        for (const t of json.tokens) {
          if (!t || typeof t.id !== 'number') continue;
          if (t.id < 1 || t.id > TOTAL_TOKENS) continue;
          const idx = t.id - 1;
          next[idx] = t.status === 'sold' ? 2 : t.status === 'reserved' ? 1 : 0;
        }
        setStatuses(next);
      } catch {
        if (cancelled) return;
        setStatuses(new Uint8Array(TOTAL_TOKENS));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setZoom = (next: number) => {
    userInteractedRef.current = true;
    setViewport((v) => ({ ...v, zoom: clamp(next, MIN_ZOOM, MAX_ZOOM) }));
  };

  const resetView = () => {
    userInteractedRef.current = true;
    setViewport({ zoom: fitZoom, x: 0, y: 0 });
  };

  const selectAtClientPoint = (clientX: number, clientY: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const world = {
      x: (x - rect.width / 2 - viewport.x) / viewport.zoom,
      y: (y - rect.height / 2 - viewport.y) / viewport.zoom,
    };
    const axial = pixelToAxial(world, BASE_HEX_SIZE);
    const id = axialToId.get(axialKey(axial)) ?? null;
    if (!id) {
      onSelect(null, null);
      return;
    }
    const s = statuses[id - 1] === 2 ? 'sold' : statuses[id - 1] === 1 ? 'reserved' : 'available';
    onSelect(id, s);
  };

  const onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    userInteractedRef.current = true;
    setIsDragging(true);
    dragRef.current = {
      isDown: true,
      startX: e.clientX,
      startY: e.clientY,
      startVX: viewport.x,
      startVY: viewport.y,
      moved: false,
    };
  };

  const onPointerMove = (e: PointerEvent) => {
    const d = dragRef.current;
    if (!d?.isDown) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (Math.abs(dx) + Math.abs(dy) > 6) d.moved = true;
    setViewport((v) => ({ ...v, x: d.startVX + dx, y: d.startVY + dy }));
  };

  const onPointerUp = (e: PointerEvent) => {
    const d = dragRef.current;
    if (dragRef.current) dragRef.current.isDown = false;
    setIsDragging(false);
    if (!d?.moved) selectAtClientPoint(e.clientX, e.clientY);
  };

  const counts = useMemo(() => {
    let sold = 0;
    let reserved = 0;
    for (let i = 0; i < statuses.length; i++) {
      if (statuses[i] === 2) sold++;
      else if (statuses[i] === 1) reserved++;
    }
    return { sold, reserved, available: TOTAL_TOKENS - sold - reserved };
  }, [statuses]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!canvasSize.w || !canvasSize.h) return;

    const dpr = canvasSize.dpr;
    canvas.width = Math.floor(canvasSize.w * dpr);
    canvas.height = Math.floor(canvasSize.h * dpr);
    canvas.style.width = `${canvasSize.w}px`;
    canvas.style.height = `${canvasSize.h}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const corners = new Array(6).fill(0).map((_, i) => {
      const angle = (Math.PI / 180) * (60 * i - 30);
      return { x: BASE_HEX_SIZE * Math.cos(angle), y: BASE_HEX_SIZE * Math.sin(angle) };
    });

    const draw = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.translate(canvasSize.w / 2 + viewport.x, canvasSize.h / 2 + viewport.y);
      ctx.scale(viewport.zoom, viewport.zoom);

      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      for (let idx = 0; idx < coords.length; idx++) {
        const id = idx + 1;
        const a = coords[idx];
        const p = axialToPixel(a, BASE_HEX_SIZE);
        const s: CetuiaTokenStatus = statuses[idx] === 2 ? 'sold' : statuses[idx] === 1 ? 'reserved' : 'available';
        const c = statusToColor(s);

        ctx.beginPath();
        ctx.moveTo(p.x + corners[0].x, p.y + corners[0].y);
        for (let i = 1; i < 6; i++) ctx.lineTo(p.x + corners[i].x, p.y + corners[i].y);
        ctx.closePath();

        ctx.fillStyle = c.fill;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 1;
        ctx.stroke();

        if (id === selectedId) {
          ctx.strokeStyle = 'rgba(242,201,76,0.9)';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
    };

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [canvasSize.dpr, canvasSize.h, canvasSize.w, coords, selectedId, statuses, viewport.x, viewport.y, viewport.zoom]);

  return (
    <div
      className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/40 shadow-depth"
      role="region"
      aria-label="Harta interactivă a token-urilor Cetățuia"
      data-testid="cetuia-hex-map"
    >
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(34,211,238,0.10),transparent_52%),radial-gradient(circle_at_70%_60%,rgba(242,201,76,0.12),transparent_60%)]" />
        <div className="absolute inset-0 opacity-[0.16] bg-[linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:22px_22px]" />
      </div>

      <div
        className="absolute left-4 top-4 z-10 flex items-center gap-2"
        role="group"
        aria-label="Controale hartă"
        data-testid="cetuia-map-controls"
      >
        <button
          type="button"
          onClick={() => setZoom(viewport.zoom + 0.2)}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-white/10 bg-black/60 text-solaris-text hover:bg-black/80 transition-colors"
          aria-label="Zoom in"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => setZoom(viewport.zoom - 0.2)}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-white/10 bg-black/60 text-solaris-text hover:bg-black/80 transition-colors"
          aria-label="Zoom out"
        >
          <Minus className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={resetView}
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/10 bg-black/60 px-3 text-solaris-text hover:bg-black/80 transition-colors"
          aria-label="Reset view"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          <span className="ml-2 text-xs font-semibold">RESET</span>
        </button>
      </div>

      <div className="absolute right-4 top-4 z-10 flex flex-col items-end gap-2">
        <div
          className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md px-3 py-2"
          data-testid="cetuia-token-counts"
        >
          <div className="text-[10px] font-mono text-white/55">TOKENS</div>
          <div className="mt-1 flex items-center gap-2 text-xs font-mono text-white/75">
            <span className="text-emerald-200">{counts.available.toLocaleString()}</span>
            <span className="text-white/30">/</span>
            <span className="text-amber-200">{counts.reserved.toLocaleString()}</span>
            <span className="text-white/30">/</span>
            <span className="text-rose-200">{counts.sold.toLocaleString()}</span>
          </div>
        </div>
        {isLoading ? (
          <div
            className="rounded-full border border-white/10 bg-black/60 px-3 py-1.5 text-[11px] font-mono text-white/60"
            data-testid="cetuia-loading"
          >
            LOADING…
          </div>
        ) : null}
      </div>

      <div
        ref={containerRef}
        data-testid="cetuia-map-interaction"
        className={cn('relative h-[520px] md:h-[620px] cursor-grab active:cursor-grabbing touch-none', isDragging && 'select-none')}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <canvas ref={canvasRef} className="absolute inset-0" />
      </div>

      <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md px-4 py-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-solaris-muted">
            Drag pentru pan • Click pe hex pentru selectare
          </p>
          <p className="text-[10px] font-mono text-solaris-muted">
            {TOTAL_TOKENS.toLocaleString()} HEX TOKENS
          </p>
        </div>
      </div>
    </div>
  );
}
