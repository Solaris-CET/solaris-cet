import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import { BrandAssetCard } from '@/components/brand/BrandAssetCard';
import { type AssetType,getBrandAssets } from '@/components/brand/brandAssetsCatalog';
import { BrandKitCard } from '@/components/brand/BrandKitCard';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';

export default function BrandAssetsPage() {
  const { lang } = useLanguage();
  const [query, setQuery] = useState('');
  const [activeType, setActiveType] = useState<AssetType | 'all'>('all');
  const [offlineBusy, setOfflineBusy] = useState(false);
  const [offlineInfo, setOfflineInfo] = useState<string | null>(null);

  const tx = useMemo(() => {
    const base = {
      heading: 'Brand Assets',
      subtitle:
        'Logo-uri, icon-uri și materiale oficiale. Descarcă individual sau generează kit-ul complet.',
      kitTitle: 'Brand Kit (ZIP)',
      kitCta: 'Descarcă kit',
      generating: 'Se generează…',
      kitFailed: 'Nu am putut genera kit-ul. Încearcă din nou.',
      searchPlaceholder: 'Caută asset…',
      filterAll: 'Toate',
      filterLogo: 'Logo',
      filterImage: 'Imagini',
      filterIcon: 'Icon-uri',
      filterDoc: 'Ghid',
      download: 'Download',
      saveAllOffline: 'Salvează asset-urile pentru offline',
      savingAll: 'Se salvează…',
      offlineHint: 'Pregătește cache-ul pentru descărcări și kit-ul ZIP în mod offline.',
    };
    if (lang === 'es') {
      return {
        ...base,
        subtitle:
          'Logos, iconos y materiales oficiales. Descarga individual o genera el kit completo.',
        kitTitle: 'Kit de marca (ZIP)',
        kitCta: 'Descargar kit',
        generating: 'Generando…',
        kitFailed: 'No pude generar el kit. Intenta de nuevo.',
        searchPlaceholder: 'Buscar asset…',
        filterAll: 'Todo',
        filterImage: 'Imágenes',
        filterIcon: 'Iconos',
        filterDoc: 'Guía',
        download: 'Descargar',
        saveAllOffline: 'Guardar assets offline',
        savingAll: 'Guardando…',
        offlineHint: 'Prepara cache para descargas y ZIP sin conexión.',
      };
    }
    if (lang === 'en') {
      return {
        ...base,
        subtitle:
          'Official logos, icons, and media. Download individually or generate the full kit.',
        kitCta: 'Download kit',
        generating: 'Generating…',
        kitFailed: 'Could not generate the kit. Please try again.',
        searchPlaceholder: 'Search assets…',
        filterAll: 'All',
        filterImage: 'Images',
        filterIcon: 'Icons',
        filterDoc: 'Guide',
        saveAllOffline: 'Save assets offline',
        savingAll: 'Saving…',
        offlineHint: 'Warm cache so downloads and the ZIP kit work offline after first visit.',
      };
    }
    return base;
  }, [lang]);

  const assets = useMemo(() => getBrandAssets(), []);

  const saveAssetsForOffline = async () => {
    setOfflineBusy(true);
    setOfflineInfo(null);
    try {
      if (!('serviceWorker' in navigator)) {
        setOfflineInfo('Service worker not supported in this browser.');
        return;
      }
      const controller = navigator.serviceWorker.controller;
      if (!controller) {
        setOfflineInfo('Service worker is not controlling the page yet. Reload once and try again.');
        return;
      }

      const urls = assets.map((a) => a.href);
      const payload = await new Promise<any>((resolve) => {
        const timeout = window.setTimeout(() => resolve({ okCount: 0, failCount: urls.length, error: 'timeout' }), 15_000);
        const onMessage = (event: MessageEvent) => {
          const data = (event as any)?.data;
          if (data && typeof data === 'object' && data.type === 'PREFETCH_DONE') {
            window.clearTimeout(timeout);
            navigator.serviceWorker.removeEventListener('message', onMessage as any);
            resolve(data);
          }
        };
        navigator.serviceWorker.addEventListener('message', onMessage as any);
        controller.postMessage({ type: 'PREFETCH_URLS', urls });
      });

      setOfflineInfo(`${Number(payload?.okCount ?? 0)} ok · ${Number(payload?.failCount ?? 0)} failed`);
    } finally {
      setOfflineBusy(false);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return assets.filter((a) => {
      if (activeType !== 'all' && a.type !== activeType) return false;
      if (!q) return true;
      return (
        a.name.toLowerCase().includes(q) ||
        a.format.toLowerCase().includes(q) ||
        a.type.toLowerCase().includes(q)
      );
    });
  }, [assets, query, activeType]);

  const filterPills: Array<{ id: AssetType | 'all'; label: string }> = [
    { id: 'all', label: tx.filterAll },
    { id: 'logo', label: tx.filterLogo },
    { id: 'image', label: tx.filterImage },
    { id: 'icon', label: tx.filterIcon },
    { id: 'doc', label: tx.filterDoc },
  ];

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
            <div className="hud-label text-solaris-gold">BRAND</div>
            <h1 className="mt-3 font-display font-bold text-[clamp(30px,4vw,52px)] text-solaris-text">
              {tx.heading}
            </h1>
            <p className="mt-4 text-solaris-muted text-base leading-relaxed">{tx.subtitle}</p>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-solaris-muted" aria-hidden />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={tx.searchPlaceholder}
                    className="pl-9 bg-black/30 border-white/10"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {filterPills.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setActiveType(p.id)}
                      className={cn(
                        'px-3 py-1.5 rounded-full border text-[11px] font-mono transition-colors',
                        activeType === p.id
                          ? 'border-solaris-gold/30 bg-solaris-gold/10 text-solaris-gold'
                          : 'border-white/10 bg-white/5 text-solaris-muted hover:text-solaris-text',
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {filtered.map((a) => (
                  <BrandAssetCard key={a.id} asset={a} downloadLabel={tx.download} />
                ))}
              </div>
            </div>

            <div className="grid gap-4">
              <aside className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5">
                <div className="hud-label text-solaris-gold">OFFLINE</div>
                <div className="mt-2 text-sm text-solaris-muted">{tx.offlineHint}</div>
                <button
                  type="button"
                  onClick={saveAssetsForOffline}
                  disabled={offlineBusy}
                  className={
                    offlineBusy
                      ? 'mt-4 w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-mono opacity-60 cursor-not-allowed'
                      : 'mt-4 w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-mono'
                  }
                >
                  {offlineBusy ? tx.savingAll : tx.saveAllOffline}
                </button>
                {offlineInfo ? (
                  <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-3 text-white/80 text-sm">
                    {offlineInfo}
                  </div>
                ) : null}
              </aside>

              <BrandKitCard
                assets={filtered}
                title={tx.kitTitle}
                cta={tx.kitCta}
                generating={tx.generating}
                failed={tx.kitFailed}
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
