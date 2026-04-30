import { Download, FileText, HardDriveDownload, WifiOff } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { type LangCode,useLanguage } from '@/hooks/useLanguage';
import { trackWhitepaperClick } from '@/lib/analytics';
import { mktConversion } from '@/lib/marketing';
import { PUBLIC_WHITEPAPER_IPFS_URL } from '@/lib/publicTrustLinks';
import { cn } from '@/lib/utils';

type WhitepaperDoc = {
  lang: LangCode;
  label: string;
  url: string;
  filename: string;
};

function isLikelySameOrigin(url: string) {
  if (typeof window === 'undefined') return false;
  try {
    const u = new URL(url, window.location.origin);
    return u.origin === window.location.origin;
  } catch {
    return false;
  }
}

async function isCached(url: string) {
  if (typeof window === 'undefined') return false;
  if (!('caches' in window)) return false;
  try {
    const req = new Request(url, { credentials: 'omit' });
    const res = await caches.match(req);
    return Boolean(res);
  } catch {
    return false;
  }
}

async function warmCache(url: string) {
  try {
    await fetch(url, { cache: 'reload' });
  } catch {
    await fetch(url, { mode: 'no-cors' });
  }
}

export default function WhitepaperPage() {
  const { lang, setLang } = useLanguage();
  const [selected, setSelected] = useState<LangCode>(lang);
  const [offlineReady, setOfflineReady] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSelected(lang);
  }, [lang]);

  const tx = useMemo(() => {
    const base = {
      heading: 'Whitepaper',
      subtitle: 'Citește PDF-ul direct pe site și descarcă varianta pe limba ta.',
      language: 'Limbă',
      download: 'Descarcă PDF',
      saveOffline: 'Salvează pentru offline',
      saved: 'Disponibil offline',
      notSaved: 'Nu este salvat offline',
      offlineHint: 'Ești offline — conținutul funcționează dacă a fost deschis anterior.',
      noDoc: 'Nu există încă un PDF pentru această limbă.',
      openNewTab: 'Deschide în tab nou',
      saving: 'Se salvează…',
    };
    if (lang === 'es') {
      return {
        ...base,
        subtitle: 'Lee el PDF en el sitio y descarga la versión en tu idioma.',
        language: 'Idioma',
        download: 'Descargar PDF',
        saveOffline: 'Guardar para offline',
        saved: 'Disponible offline',
        notSaved: 'No guardado offline',
        offlineHint: 'Estás offline — funciona si lo abriste antes.',
        noDoc: 'Todavía no hay PDF para este idioma.',
        openNewTab: 'Abrir en nueva pestaña',
        saving: 'Guardando…',
      };
    }
    if (lang === 'en') {
      return {
        ...base,
        subtitle: 'Read the PDF on-site and download the version in your language.',
        language: 'Language',
        download: 'Download PDF',
        saveOffline: 'Save for offline',
        saved: 'Available offline',
        notSaved: 'Not saved offline',
        offlineHint: 'You are offline — works if previously opened.',
        noDoc: 'No PDF is available for this language yet.',
        openNewTab: 'Open in new tab',
        saving: 'Saving…',
      };
    }
    return base;
  }, [lang]);

  const docs = useMemo<WhitepaperDoc[]>(
    () => [
      {
        lang: 'en',
        label: 'EN',
        url: PUBLIC_WHITEPAPER_IPFS_URL,
        filename: 'solaris-cet-whitepaper-en.pdf',
      },
      {
        lang: 'ro',
        label: 'RO',
        url: '/whitepaper/solaris-cet-whitepaper-ro.pdf',
        filename: 'solaris-cet-whitepaper-ro.pdf',
      },
      {
        lang: 'es',
        label: 'ES',
        url: '/whitepaper/solaris-cet-whitepaper-es.pdf',
        filename: 'solaris-cet-whitepaper-es.pdf',
      },
    ],
    [],
  );

  const activeDoc = useMemo(() => docs.find((d) => d.lang === selected) ?? docs[0], [docs, selected]);

  useEffect(() => {
    let alive = true;
    setOfflineReady(false);
    void isCached(activeDoc.url).then((ok) => {
      if (!alive) return;
      setOfflineReady(ok);
    });
    return () => {
      alive = false;
    };
  }, [activeDoc.url]);

  const online = typeof navigator !== 'undefined' ? navigator.onLine : true;
  const docMissing = activeDoc.url.startsWith('/whitepaper/') && activeDoc.url.endsWith('.pdf');

  const downloadHref = isLikelySameOrigin(activeDoc.url)
    ? activeDoc.url
    : activeDoc.url;

  const saveForOffline = async () => {
    setSaving(true);
    try {
      await warmCache(activeDoc.url);
      const ok = await isCached(activeDoc.url);
      setOfflineReady(ok);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="relative w-full overflow-x-clip pb-[var(--mobile-conversion-dock-reserve)] xl:pb-0"
    >
      <section className="relative section-glass section-padding-y overflow-hidden mesh-bg">
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
          <div className="absolute bottom-0 left-0 right-0 h-[40vh] grid-floor opacity-10" />
          <div className="absolute top-[-10%] left-[-12%] h-[520px] w-[520px] rounded-full bg-solaris-gold/10 blur-[140px]" />
          <div className="absolute bottom-[-14%] right-[-10%] h-[520px] w-[520px] rounded-full bg-solaris-cyan/10 blur-[160px]" />
        </div>

        <div className="relative z-10 section-padding-x mx-auto w-full max-w-6xl">
          <div className="max-w-3xl">
            <div className="hud-label text-solaris-gold">PDF</div>
            <h1 className="mt-3 font-display font-bold text-[clamp(30px,4vw,52px)] text-solaris-text">
              {tx.heading}
            </h1>
            <p className="mt-4 text-solaris-muted text-base leading-relaxed">{tx.subtitle}</p>
          </div>

          {!online ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4 flex items-center gap-3">
              <WifiOff className="w-4 h-4 text-solaris-muted" aria-hidden />
              <div className="text-[12px] text-solaris-muted">{tx.offlineHint}</div>
            </div>
          ) : null}

          <div className="mt-10 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden">
              <div className="h-[min(78vh,860px)] bg-black/30">
                <iframe
                  title="Whitepaper PDF"
                  src={activeDoc.url}
                  className="w-full h-full"
                />
              </div>
            </div>

            <aside className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="hud-label text-solaris-gold">{tx.language}</div>
                <div className="flex items-center gap-2">
                  {docs.map((d) => (
                    <button
                      key={d.lang}
                      type="button"
                      onClick={() => {
                        setSelected(d.lang);
                        setLang(d.lang);
                      }}
                      className={cn(
                        'px-3 py-1.5 rounded-full border text-[11px] font-mono transition-colors',
                        selected === d.lang
                          ? 'border-solaris-gold/30 bg-solaris-gold/10 text-solaris-gold'
                          : 'border-white/10 bg-white/5 text-solaris-muted hover:text-solaris-text',
                      )}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-solaris-gold/10 border border-solaris-gold/20 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-solaris-gold" aria-hidden />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-solaris-text truncate">{activeDoc.filename}</div>
                  <div className="mt-1 text-[12px] text-solaris-muted break-all">{activeDoc.url}</div>
                </div>
              </div>

              <div className="mt-5 grid gap-2">
                <Button asChild className="w-full">
                  <a
                    href={downloadHref}
                    {...(isLikelySameOrigin(activeDoc.url) ? { download: activeDoc.filename } : {})}
                    target={isLikelySameOrigin(activeDoc.url) ? undefined : '_blank'}
                    rel={isLikelySameOrigin(activeDoc.url) ? undefined : 'noopener noreferrer'}
                    onClick={() => {
                      trackWhitepaperClick({ destination: downloadHref, source: 'whitepaper_download', lang: selected });
                      mktConversion('Lead', { destination: downloadHref, source: 'whitepaper_download', lang: selected });
                    }}
                  >
                    <Download className="w-4 h-4" aria-hidden />
                    {tx.download}
                  </a>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={saveForOffline}
                  disabled={saving}
                >
                  <HardDriveDownload className="w-4 h-4" aria-hidden />
                  {saving ? tx.saving : tx.saveOffline}
                </Button>
              </div>

              <div
                className={cn(
                  'mt-5 rounded-xl border px-3 py-2 text-[12px] flex items-center justify-between gap-3',
                  offlineReady
                    ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-100'
                    : 'border-white/10 bg-white/5 text-solaris-muted',
                )}
              >
                <span>{offlineReady ? tx.saved : tx.notSaved}</span>
                {!offlineReady ? (
                  <a
                    href={activeDoc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-4"
                  >
                    {tx.openNewTab}
                  </a>
                ) : null}
              </div>

              {docMissing ? (
                <div className="mt-4 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-[12px] text-solaris-muted">
                  {tx.noDoc}
                </div>
              ) : null}
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
