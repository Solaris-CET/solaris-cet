import { CloudOff, RefreshCw, WifiOff } from 'lucide-react';
import { useMemo } from 'react';

import type { SurveyQueueStats } from '@/lib/surveyOfflineQueue';
import { cn } from '@/lib/utils';

const LABELS = {
  offlineBadge: 'Offline — draft salvat local',
  draftPrefix: 'Draft:',
  ready: 'PWA survey ready',
  queueReports: (total: number) => `${total} raport(e) în coadă`,
  queueFailed: (failed: number) => ` · ${failed} eșuate`,
  syncNow: 'Sincronizează acum',
  syncing: 'Se sincronizează...',
  syncAria: 'Sincronizează rapoartele din coada offline',
  panelAria: 'Stare survey offline și coadă de sincronizare',
} as const;

export type SurveyOfflinePanelProps = {
  online: boolean;
  draftSavedAt: string | null;
  stats: SurveyQueueStats;
  syncing: boolean;
  onSync: () => void;
  className?: string;
};

function formatDraftSavedAt(iso: string): string {
  const parsed = Date.parse(iso);
  if (Number.isNaN(parsed)) return iso;
  return new Date(parsed).toLocaleString('ro-RO');
}

function queueSummary(stats: SurveyQueueStats): string {
  const base = LABELS.queueReports(stats.total);
  return stats.failed > 0 ? `${base}${LABELS.queueFailed(stats.failed)}` : base;
}

export function SurveyOfflinePanel({
  online,
  draftSavedAt,
  stats,
  syncing,
  onSync,
  className,
}: SurveyOfflinePanelProps) {
  const draftLabel = useMemo(
    () => (draftSavedAt ? `${LABELS.draftPrefix} ${formatDraftSavedAt(draftSavedAt)}` : null),
    [draftSavedAt],
  );
  const summary = useMemo(() => (stats.total > 0 ? queueSummary(stats) : null), [stats]);

  return (
    <aside
      className={cn('flex flex-col items-center gap-2', className)}
      aria-label={LABELS.panelAria}
      aria-live="polite"
    >
      <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-medium">
        {!online ? (
          <span
            className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-amber-200"
            role="status"
          >
            <WifiOff className="h-3.5 w-3.5" aria-hidden />
            {LABELS.offlineBadge}
          </span>
        ) : null}
        {draftLabel ? <span className="text-white/40">{draftLabel}</span> : null}
        {online && stats.total === 0 ? (
          <span className="inline-flex items-center gap-1 text-emerald-400/80" role="status">
            <CloudOff className="h-3 w-3" aria-hidden />
            {LABELS.ready}
          </span>
        ) : null}
      </div>

      {summary ? (
        <div className="flex max-w-md flex-col items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 sm:flex-row">
          <p className="text-sm text-amber-100" id="survey-offline-queue-summary">
            {summary}
          </p>
          <button
            type="button"
            disabled={!online || syncing}
            onClick={onSync}
            aria-label={LABELS.syncAria}
            aria-describedby="survey-offline-queue-summary"
            aria-busy={syncing}
            className="inline-flex items-center gap-1 rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-bold text-black disabled:opacity-40"
          >
            <RefreshCw className={cn('h-3 w-3', syncing && 'animate-spin')} aria-hidden />
            {syncing ? LABELS.syncing : LABELS.syncNow}
          </button>
        </div>
      ) : null}
    </aside>
  );
}