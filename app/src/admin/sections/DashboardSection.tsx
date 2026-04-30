import { ArrowDown, ArrowUp, GripVertical } from 'lucide-react';
import { type DragEvent,useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Card } from '@/components/ui/card';

import { adminApi } from '../adminClient';

type Stats = {
  usersTotal: number;
  aiQueries24h: number;
  aiConversationsTotal: number;
  cmsPostsTotal: number;
  adminActions24h: number;
  aiFeedback24h: { total: number; up: number; down: number };
  aiAvgQualityScore7d: number | null;
};

type Overview = {
  windowDays: number;
  funnel: Array<{ step: string; users: number }>;
  retention: Array<{ day: 'D1' | 'D7' | 'D30'; cohort: number; returning: number; rate: number }>;
  activation: { activated: number; eligible: number; rate: number };
  aiQueriesPerSession7d: { avg: number; p50: number; p90: number };
  segments: Array<{ label: string; users: number }>;
};

export function DashboardSection({ token }: { token: string }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<string[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await adminApi<Stats>('/api/admin/stats', { token });
      const ovr = await adminApi<Overview>('/api/admin/analytics/overview?days=30', { token });
      if (!res.ok) {
        if (!cancelled) setError(res.error);
        return;
      }
      if (!ovr.ok) {
        if (!cancelled) setError(ovr.error);
        return;
      }
      if (!cancelled) {
        setStats(res.data);
        setOverview(ovr.data);
        setError(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('solaris_admin_dashboard_order');
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed) && parsed.every((v) => typeof v === 'string')) {
        setOrder(parsed as string[]);
      }
    } catch {
      void 0;
    }
  }, []);

  const widgets = useMemo(() => {
    return [
      { id: 'usersTotal', title: 'Utilizatori', value: stats?.usersTotal ?? '—' },
      { id: 'aiQueries24h', title: 'Query-uri AI (24h)', value: stats?.aiQueries24h ?? '—' },
      {
        id: 'aiAvgQualityScore7d',
        title: 'Scor AI mediu (7 zile)',
        value: typeof stats?.aiAvgQualityScore7d === 'number' ? stats.aiAvgQualityScore7d.toFixed(1) : '—',
      },
      { id: 'aiConversationsTotal', title: 'Conversații AI', value: stats?.aiConversationsTotal ?? '—' },
      {
        id: 'aiFeedback24h',
        title: 'Feedback AI (24h)',
        value: stats?.aiFeedback24h ? `${stats.aiFeedback24h.total} (${stats.aiFeedback24h.up}↑ / ${stats.aiFeedback24h.down}↓)` : '—',
      },
      { id: 'cmsPostsTotal', title: 'Postări CMS', value: stats?.cmsPostsTotal ?? '—' },
      { id: 'adminActions24h', title: 'Acțiuni admin (24h)', value: stats?.adminActions24h ?? '—' },
      {
        id: 'activation30d',
        title: 'Activare AI (30 zile)',
        value: overview ? `${Math.round(overview.activation.rate * 1000) / 10}%` : '—',
        sub: overview ? `${overview.activation.activated}/${overview.activation.eligible}` : '',
      },
    ];
  }, [overview, stats]);

  const defaultOrder = useMemo(() => widgets.map((w) => w.id), [widgets]);
  const effectiveOrder = useMemo(() => {
    const base = order ?? defaultOrder;
    const known = new Set(widgets.map((w) => w.id));
    const next = base.filter((id) => known.has(id));
    for (const id of defaultOrder) if (!next.includes(id)) next.push(id);
    return next;
  }, [defaultOrder, order, widgets]);

  const persistOrder = (next: string[]) => {
    setOrder(next);
    try {
      localStorage.setItem('solaris_admin_dashboard_order', JSON.stringify(next));
    } catch {
      void 0;
    }
  };

  const move = (id: string, dir: -1 | 1) => {
    const idx = effectiveOrder.indexOf(id);
    const nextIdx = idx + dir;
    if (idx < 0) return;
    if (nextIdx < 0 || nextIdx >= effectiveOrder.length) return;
    const next = [...effectiveOrder];
    const [item] = next.splice(idx, 1);
    next.splice(nextIdx, 0, item);
    persistOrder(next);
  };

  const onDragStart = (event: DragEvent<HTMLDivElement>, id: string) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', id);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>, overId: string) => {
    event.preventDefault();
    const draggedId = event.dataTransfer.getData('text/plain');
    if (!draggedId) return;
    if (draggedId === overId) return;
    const from = effectiveOrder.indexOf(draggedId);
    const to = effectiveOrder.indexOf(overId);
    if (from < 0 || to < 0) return;
    const next = [...effectiveOrder];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    persistOrder(next);
  };

  return (
    <div className="space-y-4">
      <div className="text-white text-lg font-semibold">Statistici rapide</div>
      {error ? <div className="text-sm text-red-300">{error}</div> : null}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {effectiveOrder.map((id) => {
          const w = widgets.find((x) => x.id === id);
          if (!w) return null;
          return (
            <Card
              key={w.id}
              className="border border-white/10 bg-black/30 p-4"
              draggable
              onDragStart={(e) => onDragStart(e, w.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => onDrop(e, w.id)}
              role="group"
              aria-label={`Widget ${w.title}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs text-white/60">{w.title}</div>
                  <div className="text-white text-2xl font-semibold">{w.value}</div>
                  {'sub' in w && w.sub ? <div className="text-[11px] text-white/50">{w.sub}</div> : null}
                </div>
                <div className="shrink-0 flex items-center gap-1">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-white/10 bg-white/5 text-white/60">
                    <GripVertical className="w-4 h-4" aria-hidden />
                  </span>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
                    onClick={() => move(w.id, -1)}
                    aria-label={`Mută sus: ${w.title}`}
                  >
                    <ArrowUp className="w-4 h-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
                    onClick={() => move(w.id, 1)}
                    aria-label={`Mută jos: ${w.title}`}
                  >
                    <ArrowDown className="w-4 h-4" aria-hidden />
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card className="border border-white/10 bg-black/30 p-4">
          <div className="text-white/80 font-semibold">Funnel (30 zile)</div>
          <div className="mt-3 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={overview?.funnel ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="step" stroke="rgba(255,255,255,0.55)" fontSize={12} />
                <YAxis stroke="rgba(255,255,255,0.55)" fontSize={12} />
                <Tooltip contentStyle={{ background: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff' }} />
                <Bar dataKey="users" fill="rgba(234,179,8,0.75)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="border border-white/10 bg-black/30 p-4">
          <div className="text-white/80 font-semibold">Retenție (cohort)</div>
          <div className="mt-3 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={(overview?.retention ?? []).map((r) => ({
                  ...r,
                  ratePct: Math.round(r.rate * 1000) / 10,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.55)" fontSize={12} />
                <YAxis stroke="rgba(255,255,255,0.55)" fontSize={12} />
                <Tooltip contentStyle={{ background: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff' }} />
                <Bar dataKey="ratePct" fill="rgba(34,197,94,0.7)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-white/60">
            <div>p50 întrebări/sesiune: {overview ? Math.round(overview.aiQueriesPerSession7d.p50 * 10) / 10 : '—'}</div>
            <div>p90: {overview ? Math.round(overview.aiQueriesPerSession7d.p90 * 10) / 10 : '—'}</div>
            <div>avg: {overview ? Math.round(overview.aiQueriesPerSession7d.avg * 10) / 10 : '—'}</div>
          </div>
        </Card>
      </div>
    </div>
  );
}
