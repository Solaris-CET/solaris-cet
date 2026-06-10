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
  caseStudy: {
    summary: string;
    specs: Array<{ label: string; value: string }>;
    duration: string;
    challenge: string;
    solution: string;
    testimonial: { name: string; text: string };
  };
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
        title: 'Prosumator 5.2 kW — acoperiș înclinat',
        location: 'Vaslui',
        caseStudy: {
          summary:
            'Sistem dimensionat pentru autoconsum (casă 3–4 persoane), montaj curat pe tablă și configurare monitorizare pentru urmărirea producției.',
          specs: [
            { label: 'Putere instalată', value: '5.2 kWp' },
            { label: 'Invertor', value: 'string (monitorizare online)' },
            { label: 'Structură', value: 'prinderi dedicate pentru tablă/țiglă (după caz)' },
            { label: 'Protecții', value: 'SPD DC/AC + siguranțe + împământare' },
          ],
          duration: '2 zile execuție (montaj + teste + punere în funcțiune)',
          challenge: 'Umbriri parțiale dimineața + trasee cabluri prin pod îngust.',
          solution: 'Reconfigurare string-uri + trasee ordonate și protejate, cu străpungeri etanșate corect.',
          testimonial: {
            name: 'Client rezidențial, Vaslui',
            text: 'Lucrarea arată curat, ne-au explicat pașii și avem monitorizarea în aplicație. Au fost punctuali și atenți la detalii.',
          },
        },
        image: {
          src: img(
            'documentary style photo, Romanian house with rooftop solar panels, worker in PPE checking rails, natural light, slight imperfections, real worksite, no logos, no text',
            'portrait_4_3',
          ),
          alt: 'Panouri fotovoltaice montate pe acoperiș rezidențial',
          width: 768,
          height: 1024,
        },
        lightbox: {
          src: img(
            'wide documentary photo, Romanian house with rooftop solar panels, installer in PPE, realistic lighting, slight dirt, true-to-life scene, no logos, no text',
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
        title: 'PV industrial — hală logistică',
        location: 'Iași',
        caseStudy: {
          summary:
            'Configurație industrială pentru autoconsum, planificată pe etape ca să nu afecteze operațiunile; monitorizare + checklist de mentenanță.',
          specs: [
            { label: 'Putere instalată', value: '120 kWp (orientativ)' },
            { label: 'Acoperiș', value: 'industrial (detalii la străpungeri/atice)' },
            { label: 'Monitorizare', value: 'dashboard + alerte performanță' },
            { label: 'Siguranță', value: 'zone de lucru + verificări finale înainte de predare' },
          ],
          duration: '8–10 zile (în funcție de acces și condiții meteo)',
          challenge: 'Lucru în paralel cu activitatea zilnică a halei + acces limitat pe anumite zone.',
          solution: 'Execuție pe etape, trasee marcate, livrare cu poze și proces-verbal de verificare.',
          testimonial: {
            name: 'Manager locație, Iași',
            text: 'Au venit cu un plan clar și au lucrat etapizat, fără să blocheze activitatea. Comunicare bună și execuție ordonată.',
          },
        },
        image: {
          src: img(
            'documentary photo, industrial warehouse rooftop solar installation, installer in PPE in distance, natural cloudy light, realistic imperfections, no logos, no text',
            'landscape_4_3',
          ),
          alt: 'Instalație fotovoltaică pe acoperiș de hală industrială',
          width: 1024,
          height: 768,
        },
        lightbox: {
          src: img(
            'wide documentary photo, industrial rooftop solar array with safety lines, workers in PPE, true-to-life details, no logos, no text',
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
        caseStudy: {
          summary:
            'Refacere zonă de membrană TPO la hală, cu atenție pe îmbinări, atice și scurgeri. Verificare finală și recomandări de mentenanță.',
          specs: [
            { label: 'Sistem', value: 'membrană TPO (industrial)' },
            { label: 'Intervenție', value: 'reparație + refacere îmbinări' },
            { label: 'Zone critice', value: 'atice, colțuri, străpungeri, scurgeri' },
            { label: 'Mentenanță', value: 'inspecție 1–2 ori/an' },
          ],
          duration: '1–2 zile intervenție (în funcție de suprafață)',
          challenge: 'Infiltrații recurente la o zonă cu scurgere și racorduri vechi.',
          solution: 'Pregătire corectă, refacere detaliu, verificare etanșare și curățare drenaj.',
          testimonial: {
            name: 'Administrator hală, Bacău',
            text: 'Au identificat rapid cauza și au refăcut zona cu detalii foarte curate. Ne-au dat și un plan de verificare periodică.',
          },
        },
        image: {
          src: img(
            'documentary photo, white TPO membrane flat roof on industrial building, worker in PPE welding seam, realistic texture, natural light, no logos, no text',
            'portrait_4_3',
          ),
          alt: 'Acoperiș industrial cu folie TPO, detalii curate la atice',
          width: 768,
          height: 1024,
        },
        lightbox: {
          src: img(
            'wide documentary photo, TPO membrane roof with parapet details, workers in PPE, realistic textures and seams, no logos, no text',
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
        caseStudy: {
          summary:
            'Montaj acoperiș tablă click pe casă, cu detalii curate la streașină și racorduri. Accent pe aliniere și drenaj corect.',
          specs: [
            { label: 'Material', value: 'tablă click / standing seam' },
            { label: 'Accesorii', value: 'coamă, dolii, borduri, sisteme pluviale' },
            { label: 'Detalii', value: 'etanșări la străpungeri + finisaje curate' },
            { label: 'Siguranță', value: 'lucru pe sisteme de prindere/ancorare' },
          ],
          duration: '3–5 zile (în funcție de suprafață și geometrie)',
          challenge: 'Geometrie complexă (dolie + străpungeri multiple).',
          solution: 'Planificare pe zone, verificare îmbinări, finisaj la muchii și racorduri.',
          testimonial: {
            name: 'Proprietar casă, Suceava',
            text: 'Au făcut un finisaj foarte curat, iar detaliile la streașină și coamă arată impecabil. Comunicare bună pe tot parcursul.',
          },
        },
        image: {
          src: img(
            'documentary close-up photo, standing seam metal roof, installer gloves visible, realistic edges and minor imperfections, natural light, no logos, no text',
            'landscape_4_3',
          ),
          alt: 'Acoperiș din tablă click cu îmbinări standing seam',
          width: 1024,
          height: 768,
        },
        lightbox: {
          src: img(
            'wide documentary photo, modern house with standing seam metal roof, workers in PPE on scaffold, realistic lighting, no logos, no text',
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
        caseStudy: {
          summary:
            'Execuție atice din tablă cu colțuri precise și îmbinări discrete, pentru protecția anvelopei și un aspect curat.',
          specs: [
            { label: 'Lucrare', value: 'atice + elemente de tinichigerie' },
            { label: 'Focus', value: 'muchii, colțuri, îmbinări, fixări discrete' },
            { label: 'Rezultat', value: 'drenaj corect + aspect uniform' },
            { label: 'Opțional', value: 'reparații punctuale / înlocuire locală' },
          ],
          duration: '1–2 zile (în funcție de lungimi și acces)',
          challenge: 'Colțuri expuse la vânt + finisaj vechi degradat.',
          solution: 'Refacere elemente, rigidizare, etanșări unde se aplică și verificare finală.',
          testimonial: {
            name: 'Client comercial, Galați',
            text: 'Ne-a interesat în special finisajul și detaliile. Au făcut colțurile foarte bine și au lăsat totul curat.',
          },
        },
        image: {
          src: img(
            'documentary photo, sheet metal parapet flashing detail, worker in PPE measuring, realistic metal texture and small imperfections, no logos, no text',
            'portrait_4_3',
          ),
          alt: 'Detaliu de atic din tablă cu muchii precise',
          width: 768,
          height: 1024,
        },
        lightbox: {
          src: img(
            'wide documentary photo, parapet flashing on modern building, installer in PPE, realistic seams and corners, natural light, no logos, no text',
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
        location: 'Bârlad',
        caseStudy: {
          summary:
            'Montaj invertor și protecții cu trasee ordonate, etichetare, verificări și predare cu explicații pentru utilizare și siguranță.',
          specs: [
            { label: 'Tablou', value: 'AC/DC + protecții + SPD' },
            { label: 'Trasee', value: 'ordonate, fixate, protejate' },
            { label: 'Verificări', value: 'testare + parametri inițiali + monitorizare' },
            { label: 'Predare', value: 'instrucțiuni utilizare + recomandări mentenanță' },
          ],
          duration: '1 zi (montaj + teste)',
          challenge: 'Spațiu tehnic mic și cablare existentă nealiniată.',
          solution: 'Reorganizare trasee, fixări corecte și verificare finală înainte de pornire.',
          testimonial: {
            name: 'Client rezidențial, Bârlad',
            text: 'Apreciez că au pus totul ordonat și ne-au arătat ce să urmărim în aplicație. Se vede atenția la detalii.',
          },
        },
        image: {
          src: img(
            'documentary photo, clean solar inverter installation with protections, installer hands in gloves, tidy cabling, natural indoor light, realistic details, no logos, no text',
            'portrait_4_3',
          ),
          alt: 'Invertor fotovoltaic și protecții montate curat pe perete',
          width: 768,
          height: 1024,
        },
        lightbox: {
          src: img(
            'wide documentary photo, inverter and protections installation, realistic shadows and textures, no logos, no text',
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
        caseStudy: {
          summary:
            'Intervenție pe zonă critică (dolie/coamă) pentru infiltrații. Diagnostic + refacere elemente și verificare drenaj.',
          specs: [
            { label: 'Zonă', value: 'dolie/coamă + racorduri' },
            { label: 'Problemă', value: 'infiltrații la îmbinări' },
            { label: 'Soluție', value: 'refacere detalii + etanșări unde se aplică' },
            { label: 'Extra', value: 'verificare jgheaburi/burlane' },
          ],
          duration: '0.5–1 zi (în funcție de acces și condiții)',
          challenge: 'Acces dificil + îmbinări vechi cu materiale degradate.',
          solution: 'Refacere dolie, verificare coamă, fixări și curățare zonă de drenaj.',
          testimonial: {
            name: 'Client, Iași',
            text: 'Au venit, au găsit cauza și au rezolvat în aceeași zi. Ne-au explicat exact ce era greșit la detaliu.',
          },
        },
        image: {
          src: img(
            'documentary close-up photo, metal roof valley flashing detail, worker gloves visible, realistic seams and minor imperfections, no logos, no text',
            'landscape_4_3',
          ),
          alt: 'Detaliu dolie la acoperiș metalic, îmbinări curate',
          width: 1024,
          height: 768,
        },
        lightbox: {
          src: img(
            'wide documentary photo, metal roof with valley and ridge details, worker in PPE on roof, natural light, no logos, no text',
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
        caseStudy: {
          summary:
            'Refacere detaliu de străpungere pe TPO (zona cea mai sensibilă), cu îmbinări corecte și verificare finală.',
          specs: [
            { label: 'Detaliu', value: 'străpungere + racord' },
            { label: 'Material', value: 'membrană TPO compatibilă' },
            { label: 'Proces', value: 'pregătire + sudură + verificare' },
            { label: 'Recomandare', value: 'inspecție periodică + curățare scurgeri' },
          ],
          duration: '2–6 ore (în funcție de complexitate)',
          challenge: 'Detaliu vechi cu îmbinare deteriorată și apă stagnată local.',
          solution: 'Refacere racord, corectare drenaj local și verificare etanșare.',
          testimonial: {
            name: 'Client, Bacău',
            text: 'Ne-au explicat că străpungerile sunt zone critice și au refăcut detaliul foarte bine. De atunci nu mai avem infiltrații.',
          },
        },
        image: {
          src: img(
            'documentary close-up photo, TPO roof membrane penetration detail, worker in PPE welding, realistic seam texture, no logos, no text',
            'portrait_4_3',
          ),
          alt: 'Detaliu de etanșare la străpungere în folie TPO',
          width: 768,
          height: 1024,
        },
        lightbox: {
          src: img(
            'wide documentary photo, TPO membrane roof with penetration details and seams, workers in PPE, natural light, no logos, no text',
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
            Studii de caz și imagini orientative pentru a vedea tipul de execuție și atenția la detalii. Fotografiile sunt
            <strong className="text-white/80"> ilustrații reprezentative</strong>, iar studiile de caz sunt exemple realiste (fără date personale).
          </p>
          <div className="mt-7 grid gap-4 sm:grid-cols-3">
            {[
              { label: 'Ce livrează pagina', value: 'Tipuri de lucrări, probleme rezolvate și rezultate așteptate' },
              { label: 'Ce NU pretindem', value: 'Nu mascăm ilustrațiile AI ca fotografii reale; le marcăm explicit' },
              { label: 'Pasul următor', value: 'După portofoliu mergi în serviciu, calculator sau contact' },
            ].map((item) => (
              <div key={item.label} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/50">{item.label}</div>
                <div className="mt-2 text-sm font-semibold leading-relaxed text-white">{item.value}</div>
              </div>
            ))}
          </div>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="/servicii" className="rounded-2xl bg-amber-400 px-6 py-3 text-sm font-black text-black">
              Vezi serviciile
            </a>
            <a href="/calculator" className="rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10">
              Deschide calculatorul
            </a>
            <a href="/contact" className="rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10">
              Cere ofertă
            </a>
          </div>
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
                      <span className="pointer-events-none absolute top-3 right-3 z-[3] rounded-full border border-white/10 bg-black/45 px-3 py-1 text-[10px] font-bold tracking-wide text-white/80 backdrop-blur">
                        Ilustrație reprezentativă
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

        <section className="mt-16" data-reveal>
          <div className="text-xs font-semibold tracking-[0.18em] uppercase text-orange-300/90">Studii de caz</div>
          <h2 className="mt-2 text-2xl md:text-3xl font-bold">Proiecte reprezentative (cazuri realiste)</h2>
          <p className="mt-3 text-sm text-white/65 max-w-3xl">
            Exemple orientative pentru a înțelege nivelul de execuție, procesul și tipul de provocări rezolvate. Pentru poze reale din proiecte similare, trimitem pe WhatsApp.
          </p>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6" data-reveal-stagger>
            {projects.map((p) => (
              <div key={`${p.id}-case`} className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
                <div className="relative">
                  <AppImage
                    src={p.image.src}
                    alt={p.image.alt}
                    width={p.image.width}
                    height={p.image.height}
                    className="w-full h-auto object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <span className="pointer-events-none absolute top-3 left-3 z-[2] rounded-full border border-white/10 bg-black/45 px-3 py-1 text-[10px] font-bold tracking-wide text-white/85 backdrop-blur">
                    Ilustrație reprezentativă
                  </span>
                  <span className="pointer-events-none absolute bottom-3 right-3 z-[2] inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-black/35 backdrop-blur" aria-hidden>
                    <SolarisLogoMark className="h-7 w-7 text-orange-300" />
                  </span>
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-2 text-[11px] font-mono text-white/60">
                    <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">{p.typeLabel}</span>
                    <span className="text-white/35" aria-hidden>
                      ·
                    </span>
                    <span className="text-white/70">{p.location}</span>
                    <span className="ml-auto text-white/60">{p.caseStudy.duration}</span>
                  </div>

                  <div className="mt-3 text-lg font-bold">{p.title}</div>
                  <div className="mt-2 text-sm text-white/70 leading-relaxed">{p.caseStudy.summary}</div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    {p.caseStudy.specs.slice(0, 4).map((x) => (
                      <div key={x.label} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-white/55">{x.label}</div>
                        <div className="mt-1 text-sm text-white/80 font-semibold">{x.value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-white/55">Provocare</div>
                      <div className="mt-2 text-sm text-white/75 leading-relaxed">{p.caseStudy.challenge}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-white/55">Soluție</div>
                      <div className="mt-2 text-sm text-white/75 leading-relaxed">{p.caseStudy.solution}</div>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-white/55">Feedback client</div>
                    <div className="mt-2 text-sm text-white/80 leading-relaxed">“{p.caseStudy.testimonial.text}”</div>
                    <div className="mt-3 text-xs text-white/55">— {p.caseStudy.testimonial.name}</div>
                  </div>

                  <div className="mt-5 flex flex-col sm:flex-row gap-3">
                    <a
                      href={
                        p.tag === 'fotovoltaice'
                          ? '/contact?service=fotovoltaice'
                          : p.tag === 'acoperisuri'
                            ? '/contact?service=acoperisuri'
                            : '/contact?service=atice-fatade'
                      }
                      className="inline-flex items-center justify-center rounded-2xl bg-amber-400 px-6 py-3 text-black font-black"
                    >
                      Cere ofertă
                    </a>
                    <a
                      href={`https://wa.me/40769889721?text=${encodeURIComponent(`Bună! Doresc poze reale din proiecte similare cu: ${p.title} (${p.location}).`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-white font-semibold hover:bg-white/10"
                    >
                      WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
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
            <span className="pointer-events-none fixed bottom-6 left-6 inline-flex items-center rounded-full border border-white/10 bg-black/45 px-4 py-2 text-[11px] font-bold tracking-wide text-white/80 backdrop-blur">
              Ilustrație reprezentativă
            </span>
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
