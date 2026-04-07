import { useCallback, useEffect, useRef, useState } from 'react';
import { Download, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '../hooks/useLanguage';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

const DISMISSED_KEY = 'solaris_pwa_install_dismissed';

export default function PwaInstallPrompt() {
  const { t } = useLanguage();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const showTimerRef = useRef<number | null>(null);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISSED_KEY, '1');
    } catch {
      void 0;
    }
    setVisible(false);
    setDeferred(null);
  }, []);

  const canShowOnThisViewport = () => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 1023px)').matches;
  };

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISSED_KEY) === '1') return;
    } catch {
      void 0;
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      if (!canShowOnThisViewport()) return;
      setDeferred(e as BeforeInstallPromptEvent);
      if (showTimerRef.current !== null) window.clearTimeout(showTimerRef.current);
      showTimerRef.current = window.setTimeout(() => {
        setVisible(true);
      }, 30_000);
    };

    const handleAppInstalled = () => {
      dismiss();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
      if (showTimerRef.current !== null) window.clearTimeout(showTimerRef.current);
    };
  }, [dismiss]);

  useEffect(() => {
    const handleResize = () => {
      if (!canShowOnThisViewport()) setVisible(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return;
    try {
      await deferred.prompt();
      await deferred.userChoice;
    } finally {
      dismiss();
    }
  }, [deferred, dismiss]);

  if (!deferred || !visible) return null;

  return (
    <div
      className={cn(
        'fixed inset-x-0 z-[901] lg:hidden',
        'bottom-[max(4.75rem,calc(env(safe-area-inset-bottom)+4.75rem))]',
      )}
      role="region"
      aria-label={t.mobileDock.install}
    >
      <div className="mx-auto max-w-lg px-3">
        <div className="bento-card border border-white/10 bg-black/50 backdrop-blur-xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-solaris-gold/10 border border-solaris-gold/20 flex items-center justify-center shrink-0">
              <Download className="w-4 h-4 text-solaris-gold" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-solaris-text truncate">
                {t.mobileDock.install}
              </div>
              <div className="text-[11px] text-solaris-muted truncate">
                Solaris CET — PWA
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={install}
              className="btn-gold btn-magnetic px-3 py-1.5 text-xs font-semibold rounded-xl border border-solaris-gold/35 bg-solaris-gold/10 text-solaris-gold"
            >
              {t.mobileDock.install}
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="p-2 rounded-xl border border-white/10 bg-white/5 text-solaris-muted hover:text-solaris-text transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
