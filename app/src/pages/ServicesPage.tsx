import { ChevronRight, ShieldCheck } from 'lucide-react';

import AppImage from '@/components/AppImage';
import { SolarisFooter } from '@/components/company/SolarisFooter';

type ServiceBlock = {
  id: string;
  title: string;
  lead: string;
  bullets: string[];
};

const blocks: ServiceBlock[] = [
  {
    id: 'fotovoltaice',
    title: 'Instalații fotovoltaice',
    lead: 'Sisteme pentru casă sau industrie, dimensionate corect și montate profesionist.',
    bullets: [
      'Evaluare tehnică și ofertă pe necesarul real',
      'Sisteme on-grid / hibride / cu baterii',
      'Montaj, punere în funcțiune și optimizări',
      'Mentenanță, curățare și intervenții',
    ],
  },
  {
    id: 'constructii',
    title: 'Lucrări de construcții',
    lead: 'Lucrări rezidențiale și industriale cu execuție curată și planificare realistă.',
    bullets: ['Execuție lucrări construcții și reparații', 'Coordonare șantier și etape clare', 'Lucrări la anvelopă și elemente conexe'],
  },
  {
    id: 'acoperisuri',
    title: 'Acoperișuri (tablă / țiglă)',
    lead: 'Montaj și reparații pentru acoperișuri rezidențiale și clădiri mici/medii.',
    bullets: ['Montaj tablă click/fălțuită și țiglă metalică', 'Detalii de etanșare și sisteme pluviale', 'Reparații: coame, dolii, străpungeri, infiltrații'],
  },
  {
    id: 'tpo',
    title: 'Acoperișuri industriale (folie TPO)',
    lead: 'Soluții pentru hale și centre comerciale: montaj, reparații și mentenanță TPO.',
    bullets: ['Montaj și reparații membrane TPO', 'Detalii profesionale la atice, scafe și străpungeri', 'Plan de mentenanță preventivă'],
  },
  {
    id: 'atice-fatade',
    title: 'Atice și fațade tablă',
    lead: 'Montaje atice/fațade cu finisaje rezistente și aspect modern.',
    bullets: ['Montaj atice tablă', 'Placări fațade tablă', 'Reparații și înlocuiri locale'],
  },
  {
    id: 'reparatii',
    title: 'Reparații și mentenanță',
    lead: 'Intervenții rapide pentru infiltrații, detalii defecte, probleme la fotovoltaice și acoperiș.',
    bullets: ['Identificare cauză + remediere', 'Înlocuiri locale (tablă/membrană)', 'Verificări periodice și plan de mentenanță'],
  },
];

const serviceImages: Record<string, { src: string; alt: string }> = {
  fotovoltaice: {
    src: 'https://commons.wikimedia.org/wiki/Special:FilePath/Solar_panels_on_house_roof.jpg',
    alt: 'Panouri fotovoltaice montate pe acoperiș',
  },
  constructii: {
    src: 'https://commons.wikimedia.org/wiki/Special:FilePath/Mario_Kleff_On_Construction_Site_in_Pattaya.jpg',
    alt: 'Șantier și lucrări de construcții',
  },
  acoperisuri: {
    src: 'https://commons.wikimedia.org/wiki/Special:FilePath/Standing_seam_metal_roof_3.jpg',
    alt: 'Acoperiș din tablă tip standing seam',
  },
  tpo: {
    src: 'https://commons.wikimedia.org/wiki/Special:FilePath/FinishedEPDMcoveredRoof.jpg',
    alt: 'Acoperiș tip membrană (industrial)',
  },
  'atice-fatade': {
    src: 'https://commons.wikimedia.org/wiki/Special:FilePath/Installation_of_zink_cladding_on_Kiasma_east_fa%C3%A7ade,_1997_(14117140288).jpg',
    alt: 'Placare fațadă metalică și detalii de anvelopă',
  },
  reparatii: {
    src: 'https://commons.wikimedia.org/wiki/Special:FilePath/Standing_seam_metal_roof_up_close.webp',
    alt: 'Detaliu acoperiș din tablă (reparații/mentenanță)',
  },
};

export default function ServicesPage() {
  return (
    <main id="main-content" tabIndex={-1} className="pt-24 pb-0 bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 xl:px-12">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">Servicii Solaris CET</h1>
          <p className="mt-4 text-lg text-solaris-muted">
            Fotovoltaice, construcții, acoperișuri (tablă/țiglă/TPO), atice și fațade tablă, reparații.
          </p>
          <p className="mt-2 text-sm text-solaris-muted">
            Cetatuia, Vaslui 737429 · acoperire națională · CUI: ***********
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="/contact" className="btn-filled-gold inline-flex items-center gap-2">
              Cere ofertă
              <ChevronRight className="h-4 w-4" aria-hidden />
            </a>
            <a href="tel:+40769889721" className="btn-outline-white inline-flex items-center gap-2">
              +40 769 889 721
            </a>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
          {blocks.map((b) => (
            <a
              key={b.id}
              href={`#${b.id}`}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 hover:bg-white/7 transition-colors"
            >
              <div className="text-sm font-semibold text-solaris-text">{b.title}</div>
              <div className="mt-1 text-xs text-solaris-muted line-clamp-2">{b.lead}</div>
            </a>
          ))}
        </div>

        <div className="mt-14 space-y-16">
          {blocks.map((b) => (
            <section key={b.id} id={b.id} className="scroll-mt-28">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold">{b.title}</h2>
                  <p className="mt-3 text-solaris-muted">{b.lead}</p>
                  <ul className="mt-6 space-y-3">
                    {b.bullets.map((x) => (
                      <li key={x} className="flex items-start gap-2 text-sm text-solaris-text">
                        <ShieldCheck className="h-4 w-4 mt-0.5 text-solaris-gold" aria-hidden />
                        <span>{x}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6">
                    <a href={`/contact?service=${encodeURIComponent(b.id)}`} className="btn-filled-gold inline-flex items-center gap-2">
                      Cere ofertă pentru {b.title}
                      <ChevronRight className="h-4 w-4" aria-hidden />
                    </a>
                  </div>
                </div>
                <div className="rounded-3xl border border-white/10 overflow-hidden bg-black/30">
                  <div className="relative h-[260px] sm:h-[320px] w-full">
                    <AppImage
                      src={serviceImages[b.id]?.src}
                      alt={serviceImages[b.id]?.alt ?? b.title}
                      className="h-full w-full object-cover"
                      width={1280}
                      height={720}
                      referrerPolicy="no-referrer"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" aria-hidden />
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>

      <div className="mt-16">
        <SolarisFooter />
      </div>
    </main>
  );
}
