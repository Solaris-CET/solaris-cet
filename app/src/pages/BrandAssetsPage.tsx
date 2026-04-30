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
      };
    }
    return base;
  }, [lang]);

  const assets = useMemo(() => getBrandAssets(), []);

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

            <BrandKitCard
              assets={filtered}
              title={tx.kitTitle}
              cta={tx.kitCta}
              generating={tx.generating}
              failed={tx.kitFailed}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
