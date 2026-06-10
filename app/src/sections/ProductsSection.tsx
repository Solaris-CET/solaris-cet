import { ArrowRight, Battery, Building2, Home, PlugZap, Settings } from 'lucide-react';
import type { ComponentType } from 'react';

import AppImage from '@/components/AppImage';
import { SolarisLogoMark } from '@/components/SolarisLogoMark';

type Solution = {
  id: string;
  title: string;
  category: string;
  tag: string;
  description: string;
  bullets: string[];
  icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  href: string;
};

function img(prompt: string, image_size: string) {
  return `https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=${encodeURIComponent(image_size)}`;
}

const solutions: Solution[] = [
  {
    id: 'pv-res',
    title: 'Pachet prosumator 3–6 kW (rezidențial)',
    category: 'Fotovoltaice',
    tag: 'Cel mai cerut',
    description: 'Potrivit pentru case, optimizat pe consum real și condițiile acoperișului.',
    bullets: ['Evaluare + dimensionare corectă', 'Montaj + punere în funcțiune', 'Monitorizare și optimizări'],
    icon: PlugZap,
    href: '/contact?service=fotovoltaice',
  },
  {
    id: 'pv-casa-verde',
    title: 'Pachet prosumator + suport documentație (Casa Verde / dosar)',
    category: 'Fotovoltaice',
    tag: 'Program',
    description: 'Ajutăm cu pașii și documentația necesară, iar soluția finală o adaptăm pe consum și locație.',
    bullets: ['Evaluare + dimensionare', 'Config opțiuni (on-grid / hibrid)', 'Execuție + punere în funcțiune'],
    icon: PlugZap,
    href: '/contact?service=fotovoltaice',
  },
  {
    id: 'pv-3ph',
    title: 'Pachet 6–12 kW (trifazat / consum mare)',
    category: 'Fotovoltaice',
    tag: 'Putere mare',
    description: 'Pentru consum ridicat, pompe de căldură, ateliere sau mici business-uri.',
    bullets: ['Dimensionare pe profilul de consum', 'Compatibilitate trifazat', 'Execuție curată + documentație'],
    icon: Building2,
    href: '/contact?service=fotovoltaice',
  },
  {
    id: 'pv-hybrid',
    title: 'Sistem hibrid + baterie (5–15 kWh)',
    category: 'Fotovoltaice',
    tag: 'Independență',
    description: 'Mai mult autoconsum și flexibilitate (în funcție de soluția tehnică aleasă).',
    bullets: ['Stocare modulară', 'Consum inteligent', 'Integrare pe proiect'],
    icon: Battery,
    href: '/contact?service=fotovoltaice',
  },
  {
    id: 'ev',
    title: 'Încărcător EV + optimizare consum',
    category: 'Fotovoltaice',
    tag: 'Smart',
    description: 'Încărcare mașină electrică cu prioritizare solară și monitorizare.',
    bullets: ['Setări pe consum și producție', 'Programare încărcare', 'Integrare în tabloul electric'],
    icon: PlugZap,
    href: '/contact?service=fotovoltaice',
  },
  {
    id: 'pv-industrial',
    title: 'Fotovoltaice industriale (hale / acoperișuri mari)',
    category: 'Fotovoltaice',
    tag: 'Business',
    description: 'Soluții pentru reducerea costurilor operaționale și stabilitate pe termen lung.',
    bullets: ['Analiză suprafață + structură', 'Plan de execuție etapizat', 'Mentenanță și intervenții'],
    icon: Building2,
    href: '/contact?service=fotovoltaice',
  },
  {
    id: 'tpo',
    title: 'Acoperiș industrial cu folie TPO',
    category: 'Acoperișuri',
    tag: 'Industrial',
    description: 'Montaj, reparații și mentenanță pentru terase industriale (supermarket/hală).',
    bullets: ['Detalii la atice/străpungeri', 'Reparații infiltrații', 'Plan de întreținere preventivă'],
    icon: Building2,
    href: '/contact?service=tpo',
  },
  {
    id: 'tpo-inspect',
    title: 'Inspecție acoperiș TPO + raport (prevenție infiltrații)',
    category: 'Acoperișuri',
    tag: 'Audit',
    description: 'Pentru hale și clădiri mari: identificăm punctele sensibile și recomandăm intervenții.',
    bullets: ['Verificare atice/străpungeri/scurgeri', 'Recomandări și prioritizare', 'Plan de mentenanță'],
    icon: Building2,
    href: '/contact?service=tpo',
  },
  {
    id: 'roof',
    title: 'Acoperiș tablă / țiglă metalică',
    category: 'Acoperișuri',
    tag: 'Rezidențial',
    description: 'Montaj curat, accesorii corecte și detalii de etanșare durabile.',
    bullets: ['Tablă click / fălțuită', 'Țiglă metalică', 'Sisteme pluviale și finisaje'],
    icon: Home,
    href: '/contact?service=acoperisuri',
  },
  {
    id: 'service',
    title: 'Mentenanță & reparații (PV + acoperiș)',
    category: 'Service',
    tag: 'Rapid',
    description: 'Intervenții rapide, verificări periodice și prevenirea problemelor costisitoare.',
    bullets: ['Diagnostic + soluție', 'Înlocuiri locale', 'Verificări programate'],
    icon: Settings,
    href: '/contact?service=reparatii',
  },
];

export default function ProductsSection() {
  const productImages: Record<string, { src: string; alt: string; width: number; height: number }> = {
    'pv-res': {
      src: img(
        'realistic professional photo of a modern Romanian house roof with black monocrystalline solar panels installed, clean mounting rails, golden hour light, high detail, no people, no other logos, no text',
        'landscape_4_3',
      ),
      alt: 'Panouri fotovoltaice montate pe acoperiș rezidențial',
      width: 1024,
      height: 768,
    },
    'pv-casa-verde': {
      src: img(
        'realistic professional photo of a close-up black solar panel array detail with clean cabling and mounting hardware, premium look, high detail, no people, no other logos, no text',
        'landscape_4_3',
      ),
      alt: 'Detaliu panouri fotovoltaice, montaj curat',
      width: 1024,
      height: 768,
    },
    'pv-3ph': {
      src: img(
        'realistic professional photo of an industrial warehouse rooftop solar installation in neat rows, clean walkway paths, modern industrial background, high detail, no people, no other logos, no text',
        'landscape_4_3',
      ),
      alt: 'Instalație fotovoltaică pe hală industrială',
      width: 1024,
      height: 768,
    },
    'pv-hybrid': {
      src: img(
        'realistic professional photo of a home solar battery storage cabinet and inverter system installed neatly on an interior wall, tidy cabling, modern look, high detail, no people, no other logos, no text',
        'landscape_4_3',
      ),
      alt: 'Sistem hibrid cu baterie și invertor, montaj curat',
      width: 1024,
      height: 768,
    },
    ev: {
      src: img(
        'realistic professional photo of an electric vehicle wallbox charger installed on a clean exterior wall near a modern house, evening light, high detail, no people, no other logos, no text',
        'landscape_4_3',
      ),
      alt: 'Încărcător EV montat la exterior, lângă locuință',
      width: 1024,
      height: 768,
    },
    'pv-industrial': {
      src: img(
        'realistic professional wide photo of large scale solar panels installation on industrial rooftops, clean arrangement, high detail, no people, no other logos, no text',
        'landscape_16_9',
      ),
      alt: 'Sistem fotovoltaic industrial pe acoperișuri mari',
      width: 1536,
      height: 864,
    },
    tpo: {
      src: img(
        'realistic professional photo of a white TPO membrane flat roof installation on an industrial building, clean seams and parapet details, high detail, no people, no other logos, no text',
        'landscape_4_3',
      ),
      alt: 'Acoperiș industrial cu membrană TPO, detalii curate',
      width: 1024,
      height: 768,
    },
    'tpo-inspect': {
      src: img(
        'realistic professional close-up photo of TPO roof membrane detail around a penetration, clean sealing, high detail, no people, no other logos, no text',
        'landscape_4_3',
      ),
      alt: 'Detaliu acoperiș TPO la străpungere, etanșare profesională',
      width: 1024,
      height: 768,
    },
    roof: {
      src: img(
        'realistic professional close-up photo of a standing seam metal roof (tabla click) on a modern house, clean lines, premium finish, high detail, no people, no other logos, no text',
        'landscape_4_3',
      ),
      alt: 'Acoperiș din tablă click cu îmbinări standing seam',
      width: 1024,
      height: 768,
    },
    service: {
      src: img(
        'realistic professional photo of a technician hands checking rooftop solar panel connections and electrical protections, clean tools, high detail, no face, no other logos, no text',
        'landscape_4_3',
      ),
      alt: 'Verificare mentenanță sistem fotovoltaic',
      width: 1024,
      height: 768,
    },
  };

  return (
    <section id="produse" className="py-24 bg-slate-950">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 xl:px-12">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6" data-reveal>
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Soluții Recomandate</h2>
            <p className="text-slate-400 text-lg">
              Pachete și servicii cu cerere ridicată în România, configurate în funcție de locație și necesar.
            </p>
          </div>
          <a href="/contact" className="text-amber-400 font-bold flex items-center gap-2 hover:underline">
            Cere ofertă <ArrowRight size={16} />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" data-reveal-stagger>
          {solutions.map((s) => {
            const Icon = s.icon;
            const image = productImages[s.id];
            return (
              <div
                key={s.id}
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 transition-transform hover:-translate-y-0.5"
              >
                {image ? (
                  <div className="relative aspect-[16/10] w-full overflow-hidden">
                    <AppImage
                      src={image.src}
                      alt={image.alt}
                      width={image.width}
                      height={image.height}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" aria-hidden />
                    <div className="pointer-events-none absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-black/35 backdrop-blur">
                      <SolarisLogoMark className="h-7 w-7 text-orange-300" aria-hidden />
                    </div>
                  </div>
                ) : null}
                <div
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  aria-hidden
                >
                  <div className="absolute -inset-20 bg-[conic-gradient(from_200deg_at_50%_50%,rgba(242,201,76,0.16),rgba(46,231,255,0.10),rgba(242,201,76,0.16))] blur-3xl animate-hero-conic-drift" />
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/55 via-transparent to-transparent" />
                </div>
                <div className="p-8">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <span className="text-amber-400 text-xs font-mono mb-2 block uppercase tracking-widest">
                        {s.category}
                      </span>
                      <h3 className="text-xl font-bold text-white mb-2">{s.title}</h3>
                      <p className="text-slate-400 text-sm leading-relaxed">{s.description}</p>
                    </div>
                    <span className="shrink-0 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                      <Icon className="h-5 w-5 text-amber-400" aria-hidden />
                    </span>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="bg-amber-400 text-black text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      {s.tag}
                    </span>
                  </div>

                  <ul className="mt-5 space-y-2 text-sm text-slate-300">
                    {s.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2">
                        <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-amber-400/90" aria-hidden />
                        <span className="min-w-0">{b}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 flex items-center justify-between">
                    <span className="text-white font-semibold">Cere ofertă</span>
                    <a
                      href={s.href}
                      className="p-3 bg-white/5 border border-white/10 rounded-xl text-white transition-colors hover:bg-amber-400 hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70"
                      aria-label="Cere ofertă"
                    >
                      <ArrowRight size={18} />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
