import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import AppImage from '@/components/AppImage';
import { SolarisFooter } from '@/components/company/SolarisFooter';
import { SolarisLogoMark } from '@/components/SolarisLogoMark';
import { cn } from '@/lib/utils';

import styles from './ProjectsGallery.module.css';

type ProjectTag = 'fotovoltaice' | 'acoperisuri' | 'atice';
type FilterTag = 'all' | ProjectTag;

type ProjectItem = {
  id: string;
  tag: ProjectTag;
  typeLabel: string;
  title: string;
  location: string;
  image: { src: string; alt: string; width: number; height: number };
  lightbox: { src: string; width: number; height: number };
};

function img(prompt: string, image_size: string) {
  return `https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=${encodeURIComponent(image_size)}`;
}

export default function ProjectsPage() {
  const projects = useMemo<ProjectItem[]>(
    () => [
      {
        id: 'pv-rez-vaslui',
        tag: 'fotovoltaice',
        typeLabel: 'Fotovoltaice',
        title: 'Sistem rezidențial pe acoperiș înclinat',
        location: 'Vaslui',
        image: {
          src: img(
            'realistic professional photo of a modern Romanian house with black solar panels installed on a pitched roof, clean mounting rails, golden hour light, high detail, no people, no logos, no text',
            'portrait_4_3',
          ),
          alt: 'Panouri fotovoltaice montate pe acoperiș rezidențial',
          width: 768,
          height: 1024,
        },
        lightbox: {
          src: img(
            'realistic professional wide photo of a modern Romanian house with black solar panels installed on a pitched roof, clean installation, golden hour, high detail, no people, no logos, no text',
            'landscape_16_9',
          ),
          width: 1536,
          height: 864,
        },
      },
      {
        id: 'pv-industrial-iasi',
        tag: 'fotovoltaice',
        typeLabel: 'Fotovoltaice',
        title: 'Instalație PV pe hală industrială',
        location: 'Iași',
        image: {
          src: img(
            'realistic professional photo of an industrial warehouse roof with solar panels installed in neat rows, modern industrial background, high detail, no people, no logos, no text',
            'landscape_4_3',
          ),
          alt: 'Instalație fotovoltaică pe acoperiș de hală industrială',
          width: 1024,
          height: 768,
        },
        lightbox: {
          src: img(
            'realistic professional wide photo of an industrial warehouse rooftop solar installation, neat rows, clean details, high detail, no people, no logos, no text',
            'landscape_16_9',
          ),
          width: 1536,
          height: 864,
        },
      },
      {
        id: 'tpo-roof-bacau',
        tag: 'acoperisuri',
        typeLabel: 'Acoperișuri',
        title: 'Acoperiș industrial cu membrană TPO',
        location: 'Bacău',
        image: {
          src: img(
            'realistic professional photo of a white TPO membrane flat roof installation on an industrial building, clean seams and details around parapets, high detail, no people, no logos, no text',
            'portrait_4_3',
          ),
          alt: 'Acoperiș industrial cu folie TPO, detalii curate la atice',
          width: 768,
          height: 1024,
        },
        lightbox: {
          src: img(
            'realistic professional wide photo of a white TPO membrane flat roof on an industrial building, clean parapet and penetration details, high detail, no people, no logos, no text',
            'landscape_16_9',
          ),
          width: 1536,
          height: 864,
        },
      },
      {
        id: 'metal-roof-click-suceava',
        tag: 'acoperisuri',
        typeLabel: 'Acoperișuri',
        title: 'Tablă click (standing seam) — finisaj premium',
        location: 'Suceava',
        image: {
          src: img(
            'realistic professional close-up photo of a standing seam metal roof on a modern house, clean lines, premium finish, high detail, no people, no logos, no text',
            'landscape_4_3',
          ),
          alt: 'Acoperiș din tablă click cu îmbinări standing seam',
          width: 1024,
          height: 768,
        },
        lightbox: {
          src: img(
            'realistic professional wide photo of a modern house with a standing seam metal roof, clean geometry, premium finish, high detail, no people, no logos, no text',
            'landscape_16_9',
          ),
          width: 1536,
          height: 864,
        },
      },
      {
        id: 'atice-tabla-galati',
        tag: 'atice',
        typeLabel: 'Atice',
        title: 'Atice tablă — muchii precise',
        location: 'Galați',
        image: {
          src: img(
            'realistic professional photo of sheet metal parapet flashing (atice) on a modern building roof edge, clean corners, high detail, no people, no logos, no text',
            'portrait_4_3',
          ),
          alt: 'Detaliu de atic din tablă cu muchii precise',
          width: 768,
          height: 1024,
        },
        lightbox: {
          src: img(
            'realistic professional wide photo of sheet metal parapet flashing on a modern building roof edge, clean corners and seams, high detail, no people, no logos, no text',
            'landscape_16_9',
          ),
          width: 1536,
          height: 864,
        },
      },
      {
        id: 'facade-sheet-metal-neamt',
        tag: 'atice',
        typeLabel: 'Atice',
        title: 'Fațadă tablă — linii curate',
        location: 'Neamț',
        image: {
          src: img(
            'realistic professional photo of a modern sheet metal facade cladding with clean vertical lines, architectural detail, high detail, no people, no logos, no text',
            'landscape_4_3',
          ),
          alt: 'Fațadă placată cu tablă, detaliu arhitectural modern',
          width: 1024,
          height: 768,
        },
        lightbox: {
          src: img(
            'realistic professional wide photo of a modern building with sheet metal facade cladding, clean lines, high detail, no people, no logos, no text',
            'landscape_16_9',
          ),
          width: 1536,
          height: 864,
        },
      },
      {
        id: 'pv-inverter-wall',
        tag: 'fotovoltaice',
        typeLabel: 'Fotovoltaice',
        title: 'Invertor + protecții — montaj curat',
        location: 'Vaslui',
        image: {
          src: img(
            'realistic professional photo of a clean solar inverter installation on an interior wall with electrical protections, tidy cabling, high detail, no people, no logos, no text',
            'portrait_4_3',
          ),
          alt: 'Invertor fotovoltaic și protecții montate curat pe perete',
          width: 768,
          height: 1024,
        },
        lightbox: {
          src: img(
            'realistic professional wide photo of a clean solar inverter installation with tidy cabling and protections, high detail, no people, no logos, no text',
            'landscape_16_9',
          ),
          width: 1536,
          height: 864,
        },
      },
      {
        id: 'metal-roof-valley',
        tag: 'acoperisuri',
        typeLabel: 'Acoperișuri',
        title: 'Detaliu dolie / coamă',
        location: 'Iași',
        image: {
          src: img(
            'realistic professional close-up photo of metal roof valley flashing detail, clean seams, high detail, no people, no logos, no text',
            'landscape_4_3',
          ),
          alt: 'Detaliu dolie la acoperiș metalic, îmbinări curate',
          width: 1024,
          height: 768,
        },
        lightbox: {
          src: img(
            'realistic professional wide photo of a metal roof with visible valley and ridge details, clean seams, high detail, no people, no logos, no text',
            'landscape_16_9',
          ),
          width: 1536,
          height: 864,
        },
      },
      {
        id: 'tpo-penetration-detail',
        tag: 'acoperisuri',
        typeLabel: 'Acoperișuri',
        title: 'Străpungere TPO — detaliu etanș',
        location: 'Bacău',
        image: {
          src: img(
            'realistic professional close-up photo of TPO roof membrane penetration detail with clean sealing, high detail, no people, no logos, no text',
            'portrait_4_3',
          ),
          alt: 'Detaliu de etanșare la străpungere în folie TPO',
          width: 768,
          height: 1024,
        },
        lightbox: {
          src: img(
            'realistic professional wide photo of a TPO roof membrane with clean penetration details and seams, high detail, no people, no logos, no text',
            'landscape_16_9',
          ),
          width: 1536,
          height: 864,
        },
      },
      {
        id: 'facade-corner-detail',
        tag: 'atice',
        typeLabel: 'Atice',
        title: 'Colț fațadă — îmbinări discrete',
        location: 'Suceava',
        image: {
          src: img(
            'realistic professional photo of sheet metal facade corner detail with crisp edges and clean joints, architectural detail, high detail, no people, no logos, no text',
            'portrait_4_3',
          ),
          alt: 'Detaliu colț fațadă din tablă cu îmbinări curate',
          width: 768,
          height: 1024,
        },
        lightbox: {
          src: img(
            'realistic professional wide photo of a modern building facade with sheet metal cladding, clean lines and corners, high detail, no people, no logos, no text',
            'landscape_16_9',
          ),
          width: 1536,
          height: 864,
        },
      },
      {
        id: 'pv-roof-array',
        tag: 'fotovoltaice',
        typeLabel: 'Fotovoltaice',
        title: 'Panouri pe acoperiș — aliniere perfectă',
        location: 'Neamț',
        image: {
          src: img(
            'realistic professional photo of a rooftop solar panel array aligned neatly on a residential roof, clean installation, high detail, no people, no logos, no text',
            'landscape_4_3',
          ),
          alt: 'Rânduri de panouri fotovoltaice aliniate pe acoperiș',
          width: 1024,
          height: 768,
        },
        lightbox: {
          src: img(
            'realistic professional wide photo of a rooftop solar panel array on a residential roof, clean installation, high detail, no people, no logos, no text',
            'landscape_16_9',
          ),
          width: 1536,
          height: 864,
        },
      },
      {
        id: 'metal-roof-finish',
        tag: 'acoperisuri',
        typeLabel: 'Acoperișuri',
        title: 'Finisaj tablă — detalii la streașină',
        location: 'Galați',
        image: {
          src: img(
            'realistic professional close-up photo of a metal roof eaves detail with gutter and clean edge flashing, high detail, no people, no logos, no text',
            'landscape_4_3',
          ),
          alt: 'Detaliu la streașină pentru acoperiș din tablă, finisaj curat',
          width: 1024,
          height: 768,
        },
        lightbox: {
          src: img(
            'realistic professional wide photo of a modern metal roof with clean eaves and gutter details, high detail, no people, no logos, no text',
            'landscape_16_9',
          ),
          width: 1536,
          height: 864,
        },
      },
    ],
    [],
  );

  const [filter, setFilter] = useState<FilterTag>('all');
  const visible = useMemo(() => {
    return filter === 'all' ? projects : projects.filter((p) => p.tag === filter);
  }, [filter, projects]);

  const [openId, setOpenId] = useState<string | null>(null);
  const openIndex = useMemo(() => visible.findIndex((p) => p.id === openId), [openId, visible]);
  const active = openIndex >= 0 ? visible[openIndex] : null;
  const lightboxRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);

  const close = useCallback(() => setOpenId(null), []);
  const go = useCallback(
    (dir: -1 | 1) => {
      if (!visible.length) return;
      const idx = openIndex >= 0 ? openIndex : 0;
      const next = (idx + dir + visible.length) % visible.length;
      setOpenId(visible[next]?.id ?? null);
    },
    [openIndex, visible],
  );

  useEffect(() => {
    if (!active) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => lightboxRef.current?.focus());
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [active, close, go]);

  const filterTabs: Array<{ tag: FilterTag; label: string }> = [
    { tag: 'all', label: 'Toate' },
    { tag: 'fotovoltaice', label: 'Fotovoltaice' },
    { tag: 'acoperisuri', label: 'Acoperișuri' },
    { tag: 'atice', label: 'Atice' },
  ];

  return (
    <main id="main-content" tabIndex={-1} className="pt-24 pb-0 bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 xl:px-12">
        <div className="max-w-3xl" data-reveal>
          <h1 className="font-display font-bold tracking-tight text-[length:var(--text-h1)] leading-[var(--lh-display)]">
            Proiecte
            <span className="mx-3 text-white/20" aria-hidden>
              /
            </span>
            <span className="text-white/70">Portofoliu</span>
          </h1>
          <p className="mt-5 text-lg text-solaris-muted">
            Exemple orientative de lucrări: fotovoltaice, acoperișuri și detalii de tablă (atice/fațade). Pentru un portofoliu
            complet cu fotografii reale, le încărcăm imediat ce sunt disponibile.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-2" data-reveal-stagger>
          {filterTabs.map((x) => {
            const activeTab = filter === x.tag;
            return (
              <button
                key={x.tag}
                type="button"
                onClick={() => setFilter(x.tag)}
                className={cn(
                  'rounded-full border px-4 py-2 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60',
                  activeTab ? 'border-orange-400/70 bg-orange-400/10 text-white' : 'border-white/10 bg-black/20 text-white/70 hover:text-white hover:bg-white/5',
                )}
              >
                {x.label}
              </button>
            );
          })}
        </div>

        <div className="mt-8" data-reveal>
          <div className="text-xs font-semibold tracking-[0.18em] uppercase text-orange-300/90">Galerie</div>
          <div className="mt-2 text-sm text-white/60">
            Filtru: <span className="text-white/80">{filterTabs.find((x) => x.tag === filter)?.label}</span> · click pe o poză pentru
            fullscreen
          </div>
        </div>

        <div className="mt-8" data-reveal>
          <div className={styles.grid} data-reveal-stagger>
            {projects.map((p) => {
              const isHidden = filter !== 'all' && p.tag !== filter;
              return (
                <div key={p.id} className={cn(styles.card, isHidden ? styles.hidden : '')} data-tag={p.tag}>
                  <button
                    type="button"
                    onClick={() => setOpenId(p.id)}
                    className={cn('w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60 rounded-[1.5rem]')}
                    aria-label={`Deschide: ${p.title} (${p.location})`}
                  >
                    <div className={styles.media}>
                      <span className={styles.pill}>
                        {p.typeLabel}
                        <span className="text-white/35" aria-hidden>
                          ·
                        </span>
                        <span className="text-white/75">{p.location}</span>
                      </span>
                      <span className={styles.plus} aria-hidden>
                        +
                      </span>
                      <span
                        className="pointer-events-none absolute bottom-3 right-3 z-[3] inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-black/35 backdrop-blur"
                        aria-hidden
                      >
                        <SolarisLogoMark className="h-7 w-7 text-orange-300" />
                      </span>
                      <AppImage
                        src={p.image.src}
                        alt={p.image.alt}
                        width={p.image.width}
                        height={p.image.height}
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className={styles.overlay} aria-hidden>
                        <div className={styles.overlayInner}>
                          <div className={styles.title}>{p.title}</div>
                          <div className={styles.meta}>{p.location}</div>
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-16">
        <SolarisFooter />
      </div>

      <div
        ref={lightboxRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={active ? `Galerie: ${active.title}` : 'Galerie'}
        className={cn(styles.lightbox, active ? styles.lightboxOpen : '')}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) close();
        }}
        onTouchStart={(e) => {
          const t = e.touches?.[0];
          if (!t) return;
          touchStartX.current = t.clientX;
          touchStartY.current = t.clientY;
        }}
        onTouchEnd={(e) => {
          const t = e.changedTouches?.[0];
          if (!t) return;
          const dx = t.clientX - touchStartX.current;
          const dy = t.clientY - touchStartY.current;
          if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
          if (dx > 0) go(-1);
          else go(1);
        }}
      >
        {active ? (
          <>
            <button type="button" className={cn(styles.close)} onClick={close} aria-label="Închide (ESC)">
              ×
            </button>
            {visible.length > 1 ? (
              <>
                <button type="button" className={cn(styles.arrow, styles.arrowLeft)} onClick={() => go(-1)} aria-label="Anterior (←)">
                  ←
                </button>
                <button type="button" className={cn(styles.arrow, styles.arrowRight)} onClick={() => go(1)} aria-label="Următor (→)">
                  →
                </button>
              </>
            ) : null}
            <AppImage
              src={active.lightbox.src}
              alt={active.image.alt}
              width={active.lightbox.width}
              height={active.lightbox.height}
              loading="eager"
              className={styles.lightboxImg}
              referrerPolicy="no-referrer"
            />
            <span
              className="pointer-events-none fixed bottom-6 right-6 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/35 text-orange-300/90 backdrop-blur"
              aria-hidden
            >
              <SolarisLogoMark className="h-8 w-8" />
            </span>
          </>
        ) : null}
      </div>
    </main>
  );
}
