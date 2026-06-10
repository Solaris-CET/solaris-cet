import { useEffect, useMemo, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform?: string }>;
};

export function DownloadAppButton({ className }: { className?: string }) {
  const { t, lang } = useLanguage();
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const { needRefresh, updateServiceWorker } = useRegisterSW({ immediate: true });

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  const label = useMemo(
    () => (needRefresh ? (lang === 'ro' ? 'Actualizează' : 'Update') : t.nav.downloadApp),
    [lang, needRefresh, t.nav.downloadApp],
  );

  return (
    <>
      <button
        type="button"
        onClick={async () => {
          if (needRefresh) {
            await updateServiceWorker(true);
            window.location.reload();
            return;
          }
          if (installPrompt) {
            await installPrompt.prompt();
            await installPrompt.userChoice;
            setInstallPrompt(null);
            return;
          }
          setHelpOpen(true);
        }}
        className={cn(
          'btn-filled-gold inline-flex items-center justify-center gap-1.5 text-xs sm:text-sm px-3 py-2 sm:px-4 sm:py-2.5 min-h-[44px] lg:min-h-0',
          className,
        )}
        aria-label={t.nav.downloadApp}
      >
        <span>{label}</span>
      </button>

      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{lang === 'ro' ? 'Instalează Solaris Engineering' : 'Install Solaris Engineering'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm text-solaris-muted leading-relaxed">
            <div>
              <div className="text-solaris-text font-semibold">Android / Chrome</div>
              <div>
                {lang === 'ro'
                  ? 'Apasă meniul browserului și alege „Install app” / „Adaugă pe ecranul principal”.'
                  : 'Open the browser menu and choose “Install app” / “Add to Home screen”.'}
              </div>
            </div>
            <div>
              <div className="text-solaris-text font-semibold">iPhone / Safari</div>
              <div>
                {lang === 'ro'
                  ? 'Apasă „Share” → „Add to Home Screen” pentru a instala aplicația.'
                  : 'Tap “Share” → “Add to Home Screen” to install the app.'}
              </div>
            </div>
            <div>
              <div className="text-solaris-text font-semibold">Desktop</div>
              <div>
                {lang === 'ro'
                  ? 'În bara de adrese (Chrome/Edge) caută icon-ul de instalare și confirmă.'
                  : 'In Chrome/Edge, use the install icon in the address bar and confirm.'}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
