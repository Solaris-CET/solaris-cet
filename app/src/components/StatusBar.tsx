import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, CloudOff, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type HealthPayload = {
  status?: string;
  service?: string;
  version?: string;
  environment?: string;
};

function useDismissed(key: string) {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(key) === '1';
    } catch {
      return false;
    }
  });

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(key, '1');
    } catch {
      void 0;
    }
  };

  return { dismissed, dismiss };
}

export default function StatusBar({ className }: { className?: string }) {
  const { dismissed, dismiss } = useDismissed('solaris_status_bar_dismissed');
  const [health, setHealth] = useState<HealthPayload | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;

    const run = async () => {
      try {
        const res = await fetch('/health.json', { cache: 'no-store' });
        if (!res.ok) throw new Error('bad status');
        const payload = (await res.json()) as HealthPayload;
        if (!alive) return;
        setHealth(payload);
        setFailed(false);
      } catch {
        if (!alive) return;
        setFailed(true);
      }
    };

    void run();
    const id = window.setInterval(run, 30_000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);

  const online = typeof navigator !== 'undefined' ? navigator.onLine : true;
  const ok = useMemo(() => {
    if (!online) return false;
    if (failed) return false;
    return (health?.status ?? '').toLowerCase() === 'healthy';
  }, [failed, health?.status, online]);

  if (dismissed) return null;

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-[120] hidden sm:block',
        'backdrop-blur-md bg-slate-950/60 border-t border-white/10 pointer-events-none',
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div className="max-w-6xl mx-auto w-full px-4 py-2 flex items-center justify-between gap-3">
        <div className="min-w-0 flex items-center gap-2">
          {health == null && !failed ? (
            <Skeleton className="h-4 w-32 bg-white/10" />
          ) : ok ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden />
          ) : (
            <CloudOff className="w-4 h-4 text-solaris-muted shrink-0" aria-hidden />
          )}
          <div className="min-w-0 font-mono text-[11px] text-solaris-muted truncate">
            {health?.service ?? 'solaris-cet'} · {health?.environment ?? 'env'} · v{health?.version ?? '—'}
          </div>
        </div>

        <button
          type="button"
          onClick={dismiss}
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-white/10 bg-white/5 text-solaris-muted hover:text-solaris-text hover:bg-white/10 transition-colors pointer-events-auto"
          aria-label="Dismiss status bar"
        >
          <X className="w-4 h-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
