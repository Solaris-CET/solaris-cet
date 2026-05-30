import { ArrowRight, BadgeCheck, CheckCircle2 } from 'lucide-react';
import { useMemo } from 'react';

import { SolarisFooter } from '@/components/company/SolarisFooter';
import { FaqAccordion, type FaqItem } from '@/components/FaqAccordion';

type ServiceDetail = {
  slug: string;
  title: string;
  subtitle: string;
  bullets: string[];
  faq: FaqItem[];
  contactServiceParam: string;
};

const services: ServiceDetail[] = [
  {
    slug: 'fotovoltaice-rezidentiale',
    title: 'Fotovoltaice Rezidențiale',
    subtitle: 'Sistem dimensionat pe consum, montaj curat și suport post-instalare.',
    bullets: [
      'Evaluare tehnică: consum, orientare, umbriri, structură acoperiș',
      'Componente potrivite (invertor, protecții, structură)',
      'Montaj ordonat + etanșări corecte la străpungeri',
      'Punere în funcțiune + monitorizare',
    ],
    faq: [
      {
        question: 'Cât durează montajul pentru o casă?',
        answer: 'De obicei 1–3 zile, în funcție de acces, tip acoperiș și complexitate.',
      },
      {
        question: 'Funcționează sistemul și iarna?',
        answer: 'Da. Producția diferă sezonier, dar sistemul generează energie și pe vreme rece/înnorată.',
      },
      {
        question: 'E nevoie de baterie?',
        answer: 'Nu obligatoriu. Bateria ajută la autoconsum seara și backup (parțial), dar depinde de obiectiv și buget.',
      },
      {
        question: 'Ce include oferta?',
        answer: 'Listă echipamente, protecții, montaj, punere în funcțiune și pași de execuție, pe înțeles.',
      },
      {
        question: 'Se poate monta pe țiglă sau tablă click?',
        answer: 'Da. Alegem prinderi și soluții potrivite pentru tipul de învelitoare și detalii.',
      },
      {
        question: 'Cum se face mentenanța?',
        answer: 'Verificări periodice + curățare la nevoie. Recomandăm minim 1 verificare/an.',
      },
    ],
    contactServiceParam: 'fotovoltaice',
  },
  {
    slug: 'fotovoltaice-industriale',
    title: 'Fotovoltaice Industriale',
    subtitle: 'Proiectare și execuție pentru hale și spații comerciale, cu focus pe siguranță.',
    bullets: [
      'Analiză consum și profil de utilizare',
      'Configurație optimă pentru autoconsum și amortizare',
      'Detalii la acoperiș plat / atice / străpungeri',
      'Plan de mentenanță și monitorizare',
    ],
    faq: [
      { question: 'Se poate monta pe TPO?', answer: 'Da, cu detalii și proceduri corecte pentru etanșare și protecție.' },
      { question: 'Aveți soluții de monitorizare?', answer: 'Da. Configurăm monitorizare și alerte pentru performanță.' },
      { question: 'Cum evitați infiltrațiile?', answer: 'Etanșări corecte la străpungeri + verificări înainte de predare.' },
      { question: 'Se poate face pe etape?', answer: 'Da. Planificăm în funcție de operațiunile locației.' },
    ],
    contactServiceParam: 'fotovoltaice',
  },
  {
    slug: 'acoperisuri-tabla-tigla',
    title: 'Acoperișuri Tablă/Țiglă',
    subtitle: 'Montaj și reparații cu detalii curate și etanșări corecte.',
    bullets: ['Montaj tablă/țiglă metalică', 'Reparații infiltrații', 'Dolii, coame, borduri, accesorii', 'Sisteme pluviale'],
    faq: [
      { question: 'Tablă click sau țiglă metalică?', answer: 'Depinde de arhitectură, buget și geometria acoperișului; îți recomandăm după evaluare.' },
      { question: 'Cât durează o reparație?', answer: 'De la intervenții punctuale în aceeași zi până la reparații mai ample, în funcție de situație.' },
      { question: 'Ce zone sunt cele mai sensibile?', answer: 'Dolii, coame, străpungeri (coș, aerisiri) și racorduri la atice.' },
      { question: 'Includeți și jgheaburi/burlane?', answer: 'Da, dacă sunt necesare pentru drenaj corect.' },
      { question: 'Puteți lucra iarna?', answer: 'Depinde de vreme și siguranță. Recomandăm ferestre meteo potrivite.' },
    ],
    contactServiceParam: 'acoperisuri',
  },
  {
    slug: 'acoperisuri-industriale-tpo',
    title: 'Acoperișuri Industriale TPO',
    subtitle: 'Membrane TPO pentru hale și clădiri comerciale: montaj, reparații, mentenanță.',
    bullets: ['Montaj membrane TPO', 'Reparații punctuale', 'Detalii la atice și străpungeri', 'Inspecție + recomandări'],
    faq: [
      { question: 'Ce este TPO?', answer: 'O membrană termoplastică folosită frecvent la acoperișuri plate industriale.' },
      { question: 'Cum se repară o infiltrație?', answer: 'Identificăm cauza, pregătim zona și aplicăm soluția potrivită conform sistemului.' },
      { question: 'Cât de des e nevoie de inspecție?', answer: 'Recomandăm minim 1–2 inspecții/an pentru acoperișuri industriale.' },
      { question: 'Se poate monta PV peste TPO?', answer: 'Da, cu soluții compatibile și detalii corecte de fixare/etanșare.' },
    ],
    contactServiceParam: 'tpo',
  },
  {
    slug: 'atice-si-fatade-tabla',
    title: 'Atice și Fațade Tablă',
    subtitle: 'Placări moderne, muchii precise și detalii rezistente la intemperii.',
    bullets: ['Montaj atice', 'Placări fațade', 'Reparații locale', 'Înlocuiri elemente'],
    faq: [
      { question: 'Ce materiale folosiți?', answer: 'În funcție de proiect: tablă cutată/panouri/elemente de anvelopă compatibile.' },
      { question: 'Se pot repara doar zonele afectate?', answer: 'Da. Facem reparații locale sau înlocuiri punctuale unde e realist.' },
      { question: 'Cum arată finisajul?', answer: 'Punem accent pe linii curate, muchii și elemente de fixare discrete.' },
      { question: 'Includeți și etanșări?', answer: 'Da, acolo unde sunt necesare pentru protecția anvelopei.' },
    ],
    contactServiceParam: 'atice-fatade',
  },
  {
    slug: 'reparatii-si-mentenanta',
    title: 'Reparații și Mentenanță',
    subtitle: 'Intervenții rapide și mentenanță preventivă pentru fotovoltaice și acoperișuri.',
    bullets: ['Diagnostic + soluție', 'Verificări periodice', 'Intervenții punctuale', 'Plan mentenanță'],
    faq: [
      { question: 'În cât timp interveniți?', answer: 'Depinde de locație și urgență; îți confirmăm rapid disponibilitatea.' },
      { question: 'Reparați și lucrări făcute de alții?', answer: 'Da, după evaluare și dacă soluția este tehnic corectă.' },
      { question: 'Faceți mentenanță PV?', answer: 'Da: verificări, curățare la nevoie, diagnostic și remediere.' },
      { question: 'Ce include un plan de mentenanță?', answer: 'Inspecții periodice, checklist, recomandări și intervenții prioritizate.' },
    ],
    contactServiceParam: 'reparatii',
  },
];

export function getServiceDetail(slug: string) {
  return services.find((s) => s.slug === slug) ?? null;
}

export default function ServiceDetailPage({ slug }: { slug: string }) {
  const service = useMemo(() => getServiceDetail(slug), [slug]);

  if (!service) {
    return (
      <main id="main-content" tabIndex={-1} className="pt-24 pb-0 bg-slate-950 text-white">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 xl:px-12">
          <div className="rounded-3xl border border-white/10 bg-black/30 p-8">
            <h1 className="text-3xl font-bold">Serviciu indisponibil</h1>
            <p className="mt-3 text-slate-300">Pagina nu există. Revino la lista de servicii.</p>
            <a href="/servicii" className="mt-6 inline-flex rounded-2xl bg-amber-400 px-7 py-4 text-black font-black">Vezi servicii</a>
          </div>
        </div>
        <div className="mt-16"><SolarisFooter /></div>
      </main>
    );
  }

  const contactHref = `/contact?service=${encodeURIComponent(service.contactServiceParam)}`;

  return (
    <main id="main-content" tabIndex={-1} className="pt-24 pb-0 bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 xl:px-12">
        <section className="rounded-3xl border border-white/10 bg-black/30 p-8 sm:p-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/10 px-4 py-2 text-[11px] font-bold tracking-wider text-amber-300">
            <BadgeCheck className="h-4 w-4" aria-hidden />
            SERVICIU
          </div>
          <h1 className="mt-5 font-display text-4xl md:text-6xl font-bold tracking-tight">{service.title}</h1>
          <p className="mt-4 text-lg text-slate-300 max-w-3xl">{service.subtitle}</p>
          <div className="mt-7 flex flex-col sm:flex-row gap-3">
            <a href={contactHref} className="inline-flex items-center justify-center rounded-2xl bg-amber-400 px-7 py-4 text-black font-black">
              Cere ofertă gratuită <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </a>
            <a href="tel:+40769889721" className="inline-flex items-center justify-center rounded-2xl border border-white/20 px-7 py-4 text-white font-semibold hover:bg-white/5">
              ☎ Sună acum
            </a>
          </div>
        </section>

        <section className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-7">
              <h2 className="text-2xl font-bold">Ce include</h2>
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {service.bullets.map((x) => (
                  <div key={x} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                    <CheckCircle2 className="h-5 w-5 text-amber-300 mt-0.5" aria-hidden />
                    <div className="text-sm text-slate-200 leading-relaxed">{x}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-7">
              <h2 className="text-2xl font-bold">FAQ</h2>
              <div className="mt-5">
                <FaqAccordion items={service.faq} />
              </div>
            </div>
          </div>

          <aside className="lg:col-span-4">
            <div className="sticky top-24 rounded-3xl border border-white/10 bg-black/30 p-7">
              <div className="text-sm font-semibold text-white">Vă contactăm în 24 de ore</div>
              <div className="mt-2 text-sm text-slate-300 leading-relaxed">Trimite cererea și revenim cu pașii următori.</div>
              <a href={contactHref} className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-amber-400 px-6 py-4 text-black font-black">
                Cere ofertă
              </a>
              <div className="mt-4 text-xs text-slate-400">Preferi să suni? +40 769 889 721</div>
            </div>
          </aside>
        </section>
      </div>

      <div className="mt-16">
        <SolarisFooter />
      </div>
    </main>
  );
}

