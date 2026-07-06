import { CloudOff, RefreshCw, WifiOff } from 'lucide-react';

import type { SurveyQueueStats } from '@/lib/surveyOfflineQueue';
import { cn } from '@/lib/utils';

type Props = {
  online: boolean;
  draftSavedAt: string | null;
  stats: SurveyQueueStats;
  syncing: boolean;
  onSync: () => void;
  className?: string;
};

export function SurveyOfflinePanel({
  online,
  draftSavedAt,
  stats,
  syncing,
  onSync,
  className,
}: Props) {
  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-medium">
        {!online && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-amber-200">
            <WifiOff className="h-3.5 w-3.5" />
            Offline — draft salvat local
          </span>
        )}
        {draftSavedAt ? (
          <span className="text-white/40">
            Draft: {new Date(draftSavedAt).toLocaleString('ro-RO')}
          </span>
        ) : null}
        {online && stats.total === 0 ? (
          <span className="inline-flex items-center gap-1 text-emerald-400/80">
            <CloudOff className="h-3 w-3" />
            PWA survey ready
          </span>
        ) : null}
      </div>

      {stats.total > 0 ? (
        <div className="flex max-w-md flex-col items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 sm:flex-row">
          <p className="text-sm text-amber-100">
            {stats.total} raport(e) în coadă
            {stats.failed > 0 ? ` · ${stats.failed} eșuate` : ''}
          </p>
          <button
            type="button"
            disabled={!online || syncing}
            onClick={onSync}
            className="inline-flex items-center gap-1 rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-bold text-black disabled:opacity-40"
          >
            <RefreshCw className={cn('h-3 w-3', syncing && 'animate-spin')} />
            {syncing ? 'Se sincronizează...' : 'Sincronizează acum'}
          </button>
        </div>
      ) : null}
    </div>
  );
}