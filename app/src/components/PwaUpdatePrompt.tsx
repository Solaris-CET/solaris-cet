import { RefreshCw, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';

export function PwaUpdatePrompt({ className }: { className?: string }) {
  const { lang } = useLanguage();
  const [dismissed, setDismissed] = useState(false);
  const { needRefresh, updateServiceWorker } = useRegisterSW({
    immediate: true,
    onRegisteredSW: () => {
      setDismissed(false);
    },
  });

  useEffect(() => {
    if (!needRefresh) return;
    setDismissed(false);
  }, [needRefresh]);

  const tx = useMemo(() => {
    const base = {
      title: 'Actualizare disponibilă',
      body: 'O versiune nouă este pregătită. Reîncarcă pentru a o activa.',
      reload: 'Reîncarcă acum',
      later: 'Mai târziu',
    };
    if (lang === 'es') {
      return {
        title: 'Actualización disponible',
        body: 'Hay una nueva versión lista. Recarga para activarla.',
        reload: 'Recargar ahora',
        later: 'Más tarde',
      };
    }
    if (lang === 'en') {
      return {
        title: 'Update available',
        body: 'A new version is ready. Reload to activate it.',
        reload: 'Reload now',
        later: 'Later',
      };
    }
    return base;
  }, [lang]);

  if (!needRefresh || dismissed) return null;

  return (
    <div
      className={cn(
        'fixed inset-x-0 z-[920] bottom-[max(1rem,calc(env(safe-area-inset-bottom)+1rem+var(--mobile-conversion-dock-reserve,0px)))] xl:bottom-[max(1rem,calc(env(safe-area-inset-bottom)+1rem))]',
        className,
      )}
      role="region"
      aria-label={tx.title}
    >
      <div className="mx-auto max-w-2xl px-3">
        <div className="rounded-2xl border border-white/10 bg-black/55 backdrop-blur-xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-solaris-text truncate">{tx.title}</div>
            <div className="mt-0.5 text-[12px] text-solaris-muted leading-snug line-clamp-2">{tx.body}</div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              size="sm"
              onClick={async () => {
                await updateServiceWorker(true);
                window.location.reload();
              }}
            >
              <RefreshCw className="w-4 h-4" aria-hidden />
              {tx.reload}
            </Button>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="p-2 rounded-xl border border-white/10 bg-white/5 text-solaris-muted hover:text-solaris-text transition-colors"
              aria-label={tx.later}
            >
              <X className="w-4 h-4" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
