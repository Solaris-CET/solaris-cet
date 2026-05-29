import { CheckCircle2, Clock, MapPin, ShieldCheck } from 'lucide-react';

import { SolarisFooter } from '@/components/company/SolarisFooter';
import { useLanguage } from '@/hooks/useLanguage';

type Card = {
  title: string;
  body: string;
  icon: typeof CheckCircle2;
};

export default function AboutPage() {
  const { lang } = useLanguage();
  const isRo = lang === 'ro';

  const cards: Card[] = [
    {
      title: isRo ? 'Execuție profesionistă' : 'Professional execution',
      body: isRo
        ? 'Lucrăm etapizat, cu detalii curate și soluții corecte pentru situația din teren.'
        : 'We work in clear stages, with clean detailing and solutions adapted to the site.',
      icon: ShieldCheck,
    },
    {
      title: isRo ? 'Termene clare' : 'Clear timelines',
      body: isRo
        ? 'Stabilim pașii și termenele în ofertă: evaluare, ofertare, execuție și predare.'
        : 'We define steps and timelines: survey, offer, execution, and handover.',
      icon: Clock,
    },
    {
      title: isRo ? 'Acoperire națională' : 'Nationwide coverage',
      body: isRo
        ? 'Suntem în Cetatuia, Vaslui, dar lucrăm în toate județele, în funcție de proiect.'
        : 'Based in Cetatuia, Vaslui, we work nationwide depending on the project.',
      icon: MapPin,
    },
    {
      title: isRo ? 'Mentenanță & intervenții' : 'Maintenance & interventions',
      body: isRo
        ? 'Oferim mentenanță și intervenții pentru fotovoltaice și acoperișuri, inclusiv reparații punctuale.'
        : 'We provide maintenance and interventions for PV systems and roofs, including targeted repairs.',
      icon: CheckCircle2,
    },
  ];

  const steps = isRo
    ? [
        { title: '1) Discuție', body: 'Ne spui ce vrei să faci și ce constrângeri ai (buget, timp, locație).' },
        { title: '2) Evaluare', body: 'Verificăm situația din teren: acoperiș, structură, umbriri, acces, detalii.' },
        { title: '3) Ofertă', body: 'Primești o ofertă clară, cu opțiuni și pașii de execuție.' },
        { title: '4) Execuție', body: 'Lucrăm curat și organizat, cu atenție la etanșare și detalii.' },
        { title: '5) Predare', body: 'Predăm lucrarea și îți explicăm întreținerea/recomandările.' },
      ]
    : [
        { title: '1) Call', body: 'You share your goals and constraints (budget, timing, location).' },
        { title: '2) Survey', body: 'We check the site: roof, structure, shading, access, critical details.' },
        { title: '3) Offer', body: 'You get a clear offer with options and a delivery plan.' },
        { title: '4) Execution', body: 'We work cleanly and methodically, focusing on sealing and details.' },
        { title: '5) Handover', body: 'We hand over the work and explain maintenance/recommendations.' },
      ];

  return (
    <main id="main-content" tabIndex={-1} className="pt-24 pb-0 bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 xl:px-12">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            {isRo ? 'Despre Solaris CET' : 'About Solaris CET'}
          </h1>
          <p className="mt-4 text-lg text-solaris-muted">
            {isRo
              ? 'Executăm instalații fotovoltaice, lucrări de construcții și acoperișuri (tablă/țiglă/folie TPO), plus montaje atice și fațade de tablă.'
              : 'We deliver PV installations, construction works, and roofing (metal/tiles/TPO membrane), plus metal parapets and facades.'}
          </p>
          <div className="mt-3 text-sm text-solaris-muted">
            {isRo ? 'Cetatuia, Vaslui 737429 · acoperire națională · CUI: ***********' : 'Cetatuia, Vaslui 737429 · nationwide · VAT: ***********'}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <a href="/contact" className="btn-filled-gold inline-flex items-center gap-2">
              {isRo ? 'Cere ofertă' : 'Request an offer'}
            </a>
            <a href="tel:+40769889721" className="btn-outline-white inline-flex items-center gap-2">
              +40 769 889 721
            </a>
            <a href="/token-cet" className="btn-outline-white inline-flex items-center gap-2">
              {isRo ? 'Token CET' : 'CET token'}
            </a>
          </div>
        </div>

        <section className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.title} className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <div className="h-12 w-12 rounded-2xl border border-white/10 bg-black/20 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-solaris-gold" aria-hidden />
                </div>
                <div className="mt-4 text-lg font-semibold">{c.title}</div>
                <div className="mt-2 text-sm text-solaris-muted leading-relaxed">{c.body}</div>
              </div>
            );
          })}
        </section>

        <section className="mt-16">
          <h2 className="text-2xl md:text-3xl font-bold">{isRo ? 'Cum lucrăm' : 'How we work'}</h2>
          <p className="mt-3 text-solaris-muted max-w-3xl">
            {isRo
              ? 'Proces simplu, orientat pe rezultate: evaluare, ofertă, execuție, predare și mentenanță.'
              : 'A simple, results-driven process: survey, offer, execution, handover, and maintenance.'}
          </p>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {steps.map((s) => (
              <div key={s.title} className="rounded-3xl border border-white/10 bg-black/30 p-6">
                <div className="text-sm font-mono text-solaris-gold">{s.title}</div>
                <div className="mt-2 text-sm text-solaris-muted leading-relaxed">{s.body}</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-16">
        <SolarisFooter />
      </div>
    </main>
  );
}
