import { ArrowRight } from 'lucide-react';
import type { ReactElement } from 'react';

import { SolarisFooter } from '@/components/company/SolarisFooter';
import { useTiltCard } from '@/hooks/useTiltCard';
import TrustProcessSection from '@/sections/TrustProcessSection';

import styles from './ServicesCardMatrix.module.css';

type ServiceCard = {
  slug: string;
  title: string;
  bullets: string[];
  contactParam: string;
  icon: (props: { className?: string }) => ReactElement;
};

const cards: ServiceCard[] = [
  {
    slug: 'fotovoltaice-rezidentiale',
    title: 'Fotovoltaice Rezidențiale',
    bullets: [
      'Dimensionare pe consum + evaluare acoperiș',
      'Montaj curat + etanșări corecte',
      'Punere în funcțiune + monitorizare',
      'Suport post-instalare',
    ],
    contactParam: 'fotovoltaice',
    icon: ({ className }) => (
      <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden>
        <path d="M8 20h32M10 28h28M12 36h24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path
          d="M14 12l4 6M24 10v8M34 12l-4 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <rect x="10" y="18" width="28" height="22" rx="4" stroke="currentColor" strokeWidth="2" opacity="0.9" />
      </svg>
    ),
  },
  {
    slug: 'fotovoltaice-industriale',
    title: 'Fotovoltaice Industriale',
    bullets: ['Analiză consum + profil de utilizare', 'Execuție pe hale / clădiri comerciale', 'Detalii la acoperiș plat / atice', 'Plan mentenanță'],
    contactParam: 'fotovoltaice',
    icon: ({ className }) => (
      <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden>
        <path
          d="M8 36V20l8-6 8 6v16H8Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M24 36V16l8-6 8 6v20H24Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M14 26h6M30 24h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M28 8l-2 4M34 6v6M40 8l2 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    slug: 'acoperisuri-tabla-tigla',
    title: 'Acoperișuri Tablă & Țiglă',
    bullets: ['Tablă click / fălțuită / țiglă metalică', 'Detalii curate: coame, dolii, borduri', 'Sisteme pluviale + etanșări', 'Reparații infiltrații'],
    contactParam: 'acoperisuri',
    icon: ({ className }) => (
      <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden>
        <path d="M8 22l16-12 16 12" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M12 22v16h24V22" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M16 28h16M16 32h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.9" />
      </svg>
    ),
  },
  {
    slug: 'acoperisuri-industriale-tpo',
    title: 'Acoperișuri TPO Industrial',
    bullets: ['Membrană TPO pentru hale & clădiri comerciale', 'Detalii la atice și străpungeri', 'Reparații punctuale + inspecții', 'Mentenanță preventivă'],
    contactParam: 'tpo',
    icon: ({ className }) => (
      <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden>
        <path d="M10 18h28v20H10V18Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M14 22h20M14 26h20M14 30h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M36 12l-4 4M24 10v6M12 12l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    slug: 'atice-si-fatade-tabla',
    title: 'Atice & Fațade Tablă',
    bullets: ['Placări moderne + linii curate', 'Muchii precise + detalii rezistente', 'Reparații/înlocuiri locale', 'Etanșări unde este necesar'],
    contactParam: 'atice-fatade',
    icon: ({ className }) => (
      <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden>
        <path d="M14 38V10h20v28" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M18 16h12M18 22h12M18 28h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M10 38h28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    slug: 'reparatii-si-mentenanta',
    title: 'Reparații & Mentenanță',
    bullets: ['Diagnostic + soluție realistă', 'Intervenții rapide pentru infiltrații', 'Verificări periodice PV/acoperiș', 'Plan mentenanță preventivă'],
    contactParam: 'reparatii',
    icon: ({ className }) => (
      <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden>
        <path d="M16 10h16l4 6v22H12V16l4-6Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M18 22h12M18 28h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M24 14v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.9" />
      </svg>
    ),
  },
];

function ServiceCardItem({ card }: { card: ServiceCard }) {
  const tiltRef = useTiltCard({ maxDeg: 8, perspective: 600 });
  const Icon = card.icon;
  const detailHref = `/servicii/${card.slug}`;
  const contactHref = `/contact?service=${encodeURIComponent(card.contactParam)}`;

  return (
    <article
      ref={tiltRef}
      className={`relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0d1b2a] p-7 ${styles.card}`}
    >
      <div className="flex items-start justify-between gap-4">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-orange-400/20 bg-black/20 text-orange-400">
          <Icon className="h-7 w-7" />
        </span>
      </div>

      <h3 className="mt-5 font-black tracking-tight text-white font-display text-[length:var(--text-h3)] leading-[var(--lh-display)]">
        <a href={detailHref} className="hover:underline underline-offset-4 decoration-white/20 hover:decoration-white/60">
          {card.title}
        </a>
      </h3>

      <ul className="mt-4 space-y-2 text-sm text-slate-200/90">
        {card.bullets.map((b) => (
          <li key={b} className="flex items-start gap-2">
            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-orange-400/80" aria-hidden />
            <span className="leading-relaxed">{b}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex items-center justify-between gap-3">
        <a
          href={contactHref}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/0 px-4 py-2 text-sm font-bold text-white/85 hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60"
        >
          Cere ofertă <ArrowRight className="h-4 w-4" aria-hidden />
        </a>
        <a href={detailHref} className="text-sm font-semibold text-white/60 hover:text-white">
          Detalii
        </a>
      </div>
    </article>
  );
}

export default function ServicesPage() {
  return (
    <main id="main-content" tabIndex={-1} className="pt-24 pb-0 bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 xl:px-12">
        <div className="max-w-3xl" data-reveal>
          <h1 className="font-display font-bold tracking-tight text-[length:var(--text-h1)] leading-[var(--lh-display)]">
            <span className="text-white">Servicii</span>
            <span className="mx-3 text-white/20" aria-hidden>
              /
            </span>
            <span className="text-white/70">Solaris CET</span>
          </h1>
          <div className="mt-5 h-px w-full max-w-[32rem] bg-gradient-to-r from-white/20 via-white/10 to-transparent" aria-hidden />
          <p className="mt-5 text-lg text-solaris-muted">
            Alege serviciul potrivit și cere o ofertă clară. Îți confirmăm rapid pașii următori și planificăm realist execuția.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="/contact" className="btn-filled-gold inline-flex items-center gap-2">
              Cere ofertă
              <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
            <a href="tel:+40769889721" className="btn-outline-white inline-flex items-center gap-2">
              +40 769 889 721
            </a>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" data-reveal-stagger>
          {cards.map((c) => (
            <ServiceCardItem key={c.slug} card={c} />
          ))}
        </div>

        <div className="mt-16" data-reveal>
          <TrustProcessSection />
        </div>
      </div>

      <div className="mt-16">
        <SolarisFooter />
      </div>
    </main>
  );
}
