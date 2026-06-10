import { ArrowRight, Calculator, CheckCircle2, Clock, FileText, Phone } from 'lucide-react';
import type { ReactElement } from 'react';

import { SolarisFooter } from '@/components/company/SolarisFooter';
import { useTiltCard } from '@/hooks/useTiltCard';
import TrustProcessSection from '@/sections/TrustProcessSection';

import styles from './ServicesCardMatrix.module.css';

type ServiceCard = {
  slug: string;
  anchorId: string;
  title: string;
  intro: string;
  bullets: string[];
  bestFor: string;
  priceHint: string;
  contactParam: string;
  icon: (props: { className?: string }) => ReactElement;
};

const cards: ServiceCard[] = [
  {
    slug: 'fotovoltaice-rezidentiale',
    anchorId: 'fotovoltaice-rezidentiale',
    title: 'Fotovoltaice Rezidențiale',
    intro: 'Sisteme pentru case și vile, dimensionate pe consumul real și pe potențialul acoperișului.',
    bullets: [
      'Dimensionare pe consum + evaluare acoperiș',
      'Montaj curat + etanșări corecte',
      'Punere în funcțiune + monitorizare',
      'Suport post-instalare',
    ],
    bestFor: 'Case cu consum lunar stabil, familii care vor să reducă factura și să înțeleagă clar amortizarea.',
    priceHint: 'De la aproximativ 4.500–6.000 EUR pentru pachete frecvente de 5–6 kW.',
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
    anchorId: 'fotovoltaice-industriale',
    title: 'Fotovoltaice Industriale',
    intro: 'Soluții pentru hale, spații comerciale și clădiri cu consum mare, gândite pe ROI și continuitate operațională.',
    bullets: ['Analiză consum + profil de utilizare', 'Execuție pe hale / clădiri comerciale', 'Detalii la acoperiș plat / atice', 'Plan mentenanță'],
    bestFor: 'Companii care au consum zilnic constant și vor să transforme factura în investiție controlată.',
    priceHint: 'Dimensionare personalizată; intervalele depind de putere, acoperiș și tablourile existente.',
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
    anchorId: 'acoperisuri-tabla-tigla',
    title: 'Acoperișuri Tablă & Țiglă',
    intro: 'Montaj, refaceri și detalii de tinichigerie pentru locuințe și clădiri comerciale ușoare.',
    bullets: ['Tablă click / fălțuită / țiglă metalică', 'Detalii curate: coame, dolii, borduri', 'Sisteme pluviale + etanșări', 'Reparații infiltrații'],
    bestFor: 'Proprietari care vor un acoperiș corect executat, fără improvizații la zonele critice.',
    priceHint: 'Prețul variază după suprafață, pantă și detalii; estimarea rapidă se face după poze + dimensiuni.',
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
    anchorId: 'acoperisuri-industriale-tpo',
    title: 'Acoperișuri TPO Industrial',
    intro: 'Montaj, reparații și refaceri pe acoperișuri industriale plate, cu accent pe scurgeri și străpungeri.',
    bullets: ['Membrană TPO pentru hale & clădiri comerciale', 'Detalii la atice și străpungeri', 'Reparații punctuale + inspecții', 'Mentenanță preventivă'],
    bestFor: 'Hale și spații comerciale unde infiltrațiile sau detaliile slabe pun în pericol operațiunea.',
    priceHint: 'Estimarea depinde de suprafață și complexitatea detaliilor; intervențiile locale pot fi separate de refacerea completă.',
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
    anchorId: 'atice-si-fatade-tabla',
    title: 'Atice & Fațade Tablă',
    intro: 'Placări și detalii metalice pentru muchii curate, protecție și aspect coerent al anvelopei.',
    bullets: ['Placări moderne + linii curate', 'Muchii precise + detalii rezistente', 'Reparații/înlocuiri locale', 'Etanșări unde este necesar'],
    bestFor: 'Clădiri care au nevoie de finisaj bun, protecție și rezolvare corectă a muchiilor expuse.',
    priceHint: 'Bugetul este influențat de lungimi, colțuri, acces și tipul de tablă/finisaj.',
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
    anchorId: 'reparatii-si-mentenanta',
    title: 'Reparații & Mentenanță',
    intro: 'Intervenții rapide pentru infiltrații, verificări periodice și planuri preventive pentru acoperișuri și PV.',
    bullets: ['Diagnostic + soluție realistă', 'Intervenții rapide pentru infiltrații', 'Verificări periodice PV/acoperiș', 'Plan mentenanță preventivă'],
    bestFor: 'Proiecte unde problema trebuie diagnosticată corect înainte să se transforme într-o cheltuială mare.',
    priceHint: 'Pentru urgențe, ofertăm după poze și context; pentru mentenanță, putem propune plan periodic.',
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
  const calculatorHref = card.contactParam === 'fotovoltaice' ? '/calculator' : '/contact';

  return (
    <article
      id={card.anchorId}
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

      <p className="mt-3 text-sm leading-relaxed text-slate-300">{card.intro}</p>

      <ul className="mt-4 space-y-2 text-sm text-slate-200/90">
        {card.bullets.map((b) => (
          <li key={b} className="flex items-start gap-2">
            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-orange-400/80" aria-hidden />
            <span className="leading-relaxed">{b}</span>
          </li>
        ))}
      </ul>

      <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="text-[10px] font-bold uppercase tracking-widest text-white/55">Potrivit pentru</div>
        <div className="mt-2 text-sm text-slate-200 leading-relaxed">{card.bestFor}</div>
      </div>

      <div className="mt-4 rounded-2xl border border-amber-400/15 bg-amber-400/5 p-4">
        <div className="text-[10px] font-bold uppercase tracking-widest text-amber-200/75">Reper de buget</div>
        <div className="mt-2 text-sm font-semibold text-white/90">{card.priceHint}</div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <a
          href={contactHref}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/0 px-4 py-2 text-sm font-bold text-white/85 hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60"
        >
          Cere ofertă <ArrowRight className="h-4 w-4" aria-hidden />
        </a>
        <div className="flex items-center gap-3">
          <a href={calculatorHref} className="text-sm font-semibold text-amber-300/80 hover:text-amber-200">
            {card.contactParam === 'fotovoltaice' ? 'Calculator' : 'Contact rapid'}
          </a>
          <a href={detailHref} className="text-sm font-semibold text-white/60 hover:text-white">
            Detalii
          </a>
        </div>
      </div>
    </article>
  );
}

export default function ServicesPage() {
  const anchors = cards.map((card) => ({
    label: card.title,
    href: `#${card.anchorId}`,
  }));

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
            Alege serviciul potrivit și vezi repere clare despre execuție, buget orientativ și următorul pas. Pagina aceasta există ca să
            nu mai fii nevoit să „cere ofertă” fără context.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="/contact" className="btn-filled-gold inline-flex items-center gap-2">
              Cere ofertă
              <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
            <a href="/calculator" className="btn-outline-white inline-flex items-center gap-2">
              Deschide calculatorul
              <Calculator className="h-4 w-4" aria-hidden />
            </a>
            <a href="tel:+40769889721" className="btn-outline-white inline-flex items-center gap-2">
              +40 769 889 721
            </a>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3" data-reveal-stagger>
          {[
            { label: 'Tipuri de lucrări', value: '6 servicii clare, fiecare cu pagină dedicată' },
            { label: 'Timp de răspuns', value: 'Confirmare rapidă pentru ofertă și pașii următori' },
            { label: 'Scop comercial', value: 'Filtrare corectă: buget, tip lucrare, urgență, fezabilitate' },
          ].map((item) => (
            <div key={item.label} className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/50">{item.label}</div>
              <div className="mt-2 text-base font-semibold text-white">{item.value}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-black/20 p-5" data-reveal>
          <div className="text-sm font-black text-white">Navigare rapidă</div>
          <div className="mt-4 flex flex-wrap gap-2">
            {anchors.map((anchor) => (
              <a
                key={anchor.href}
                href={anchor.href}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/75 hover:border-amber-400/40 hover:text-white"
              >
                {anchor.label}
              </a>
            ))}
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" data-reveal-stagger>
          {cards.map((c) => (
            <ServiceCardItem key={c.slug} card={c} />
          ))}
        </div>

        <section className="mt-16 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]" data-reveal-stagger>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-7">
            <h2 className="text-2xl font-bold text-white">Cum alegi serviciul potrivit</h2>
            <div className="mt-5 grid gap-3">
              {[
                {
                  title: 'Vrei să scazi factura de energie',
                  body: 'Începe cu `Fotovoltaice rezidențiale` sau `Fotovoltaice industriale`, apoi folosește calculatorul ca să vezi dacă bugetul și amortizarea au sens.',
                  icon: Calculator,
                },
                {
                  title: 'Ai infiltrații, zone slabe sau detalii defecte',
                  body: 'Intră pe `Reparații & mentenanță` sau pe serviciul specific de acoperiș. Pentru urgențe, pozele și contextul scurtează mult timpul până la ofertă.',
                  icon: Clock,
                },
                {
                  title: 'Vrei lucrare nouă, nu reparație',
                  body: 'Alege serviciul specific lucrării. O ofertă bună vine mai repede dacă trimiți suprafață aproximativă, poze și localitatea.',
                  icon: FileText,
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="flex items-start gap-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/25">
                      <Icon className="h-5 w-5 text-amber-300" aria-hidden />
                    </span>
                    <div>
                      <div className="text-base font-semibold text-white">{item.title}</div>
                      <div className="mt-1 text-sm leading-relaxed text-slate-300">{item.body}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/25 p-7">
            <h2 className="text-2xl font-bold text-white">Ce ne trimiți pentru ofertă bună</h2>
            <div className="mt-5 space-y-3">
              {[
                'Locația proiectului și tipul proprietății',
                'Poze cu acoperișul, zona afectată sau spațiul tehnic',
                'Consum lunar ori suprafață estimativă',
                'Termenul dorit și dacă este urgență',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-amber-300" aria-hidden />
                  <div className="text-sm leading-relaxed text-slate-200">{item}</div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-col gap-3">
              <a href="/contact" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-400 px-6 py-4 font-black text-black">
                Trimite cererea
                <ArrowRight className="h-4 w-4" aria-hidden />
              </a>
              <a href="tel:+40769889721" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-4 font-semibold text-white hover:bg-white/10">
                <Phone className="h-4 w-4" aria-hidden />
                Sună pentru clarificare rapidă
              </a>
            </div>
          </div>
        </section>

        <div className="mt-16" data-reveal>
          <TrustProcessSection />
        </div>

        <section className="mt-16 mb-16 rounded-3xl border border-amber-400/20 bg-amber-400/10 p-8 sm:p-10" data-reveal-stagger>
          <div className="max-w-3xl">
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-200/80">Următorul pas corect</div>
            <h2 className="mt-4 text-3xl font-black text-white sm:text-4xl">Nu știi încă dacă merită? Folosește calculatorul sau trimite o cerere scurtă.</h2>
            <p className="mt-4 text-base leading-relaxed text-slate-200">
              Dacă proiectul este fotovoltaic, calculatorul te ajută să înțelegi instant ordinul de mărime pentru buget și amortizare. Dacă este
              acoperiș/TPO/reparație, trimite poze și primești pașii următori fără discuții inutile.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="/calculator" className="inline-flex items-center gap-2 rounded-2xl bg-amber-400 px-6 py-4 font-black text-black">
                Deschide calculatorul
                <Calculator className="h-4 w-4" aria-hidden />
              </a>
              <a href="/proiecte" className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-4 font-semibold text-white hover:bg-white/10">
                Vezi portofoliul
                <ArrowRight className="h-4 w-4" aria-hidden />
              </a>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-16">
        <SolarisFooter />
      </div>
    </main>
  );
}
