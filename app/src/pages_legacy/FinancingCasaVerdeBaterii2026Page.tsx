import { BadgeCheck, CalendarDays, CheckCircle2, CircleDollarSign, FileText, HelpCircle, ShieldCheck } from 'lucide-react';

import { SolarisFooter } from '@/components/company/SolarisFooter';
import { FaqAccordion, type FaqItem } from '@/components/FaqAccordion';

const updatedLabel = 'Actualizat mai 2026';

const faq: FaqItem[] = [
  {
    question: 'Cine poate beneficia de Casa Verde Baterii?',
    answer:
      'Eligibilitatea depinde de ghidul oficial AFM și de condițiile programului la momentul lansării. Verifică afm.ro și, dacă vrei, te ajutăm să clarifici criteriile pentru cazul tău.',
  },
  {
    question: 'Care este suma maximă acordată?',
    answer:
      'Suma maximă poate fi diferită de la o ediție la alta. În această pagină folosim valori orientative pentru informare. Pentru cifra exactă, consultă ghidul AFM.',
  },
  {
    question: 'În cât timp se depune dosarul?',
    answer:
      'Perioadele de înscriere sunt anunțate de AFM. Pregătirea documentelor din timp te ajută să prinzi fereastra de depunere fără stres.',
  },
  {
    question: 'Se poate combina cu un sistem fotovoltaic existent?',
    answer:
      'În multe cazuri, da, dar depinde de specificațiile tehnice și de regulile programului. Putem evalua la fața locului și îți spunem ce e realist.',
  },
  {
    question: 'Ce se întâmplă dacă apar schimbări în ghid?',
    answer:
      'Ghidurile se pot actualiza. Noi lucrăm pe versiunea curentă și îți comunicăm rapid dacă apar modificări care îți afectează dosarul.',
  },
];

export default function FinancingCasaVerdeBaterii2026Page() {
  return (
    <main id="main-content" tabIndex={-1} className="pt-24 pb-0 bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 xl:px-12">
        <section className="rounded-3xl border border-white/10 bg-black/30 p-8 sm:p-10">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-[11px] font-bold tracking-wider text-emerald-300">
              <CalendarDays className="h-4 w-4" aria-hidden />
              {updatedLabel}
            </span>
            <a
              href="/finantare"
              className="text-sm text-slate-300 hover:text-white underline underline-offset-4 decoration-white/20"
            >
              Înapoi la finanțare
            </a>
          </div>

          <h1 className="mt-6 font-display text-4xl md:text-6xl font-bold tracking-tight">Casa Verde Baterii 2026 — Obțineți până la 20.000 lei</h1>
          <p className="mt-4 text-lg text-slate-300 max-w-3xl">
            Ghid orientativ despre program, pași și documente. Pentru condițiile oficiale, consultați întotdeauna AFM.
          </p>

          <div className="mt-7 flex flex-col sm:flex-row gap-3">
            <a href="/contact" className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-7 py-4 text-black font-black">
              Cere consultanță gratuită
            </a>
            <a
              href="https://afm.ro"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-2xl border border-white/20 px-7 py-4 text-white font-semibold hover:bg-white/5"
            >
              Sursă: afm.ro
            </a>
          </div>
        </section>

        <section className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-10">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-7">
              <div className="flex items-center gap-3">
                <HelpCircle className="h-5 w-5 text-emerald-300" aria-hidden />
                <h2 className="text-xl font-bold">Ce este programul</h2>
              </div>
              <p className="mt-4 text-slate-300 leading-relaxed">
                Casa Verde (inclusiv edițiile care includ baterii) este un program de finanțare care urmărește creșterea
                autoconsumului și reducerea dependenței de rețea. În practică, bateriile pot ajuta la stocarea energiei produse
                ziua și folosirea ei seara.
              </p>
              <p className="mt-3 text-slate-300 leading-relaxed">
                Condițiile, sumele și documentele se pot schimba în funcție de ediție. Noi îți explicăm pe scurt ce se aplică
                pentru situația ta și te ajutăm cu pașii de implementare.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-7">
              <div className="flex items-center gap-3">
                <BadgeCheck className="h-5 w-5 text-emerald-300" aria-hidden />
                <h2 className="text-xl font-bold">Cine poate beneficia</h2>
              </div>
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  'Persoane fizice (conform ghidului AFM)',
                  'Drept de proprietate / folosință (după caz)',
                  'Imobil eligibil (după condițiile programului)',
                  'Documente complete la momentul depunerii',
                ].map((x) => (
                  <div key={x} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                    <CheckCircle2 className="h-5 w-5 text-emerald-300 mt-0.5" aria-hidden />
                    <div className="text-sm text-slate-200 leading-relaxed">{x}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-7">
              <div className="flex items-center gap-3">
                <CircleDollarSign className="h-5 w-5 text-emerald-300" aria-hidden />
                <h2 className="text-xl font-bold">Suma maximă acordată</h2>
              </div>
              <div className="mt-4 text-5xl font-black text-white tabular-nums">20.000 lei</div>
              <div className="mt-2 text-sm text-slate-200/90">
                Valoare orientativă. Confirmă suma și plafonul din ghidul oficial.
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-7">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-emerald-300" aria-hidden />
                <h2 className="text-xl font-bold">Pașii de urmat</h2>
              </div>
              <ol className="mt-5 space-y-3">
                {[
                  'Discuție inițială: consum, obiectiv, tip acoperiș/instalație existentă.',
                  'Evaluare tehnică: compatibilitate, spațiu, protecții și configurare.',
                  'Documente: listă + verificare (să fie complete și corecte).',
                  'Depunere dosar (în fereastra oficială).',
                  'Implementare: montaj + punere în funcțiune + instructaj.',
                ].map((x, i) => (
                  <li key={x} className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-[11px] font-black text-emerald-200">
                      {i + 1}
                    </span>
                    <span className="text-sm text-slate-200 leading-relaxed">{x}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-7">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-emerald-300" aria-hidden />
                <h2 className="text-xl font-bold">Ce documente sunt necesare</h2>
              </div>
              <FaqAccordion
                className="mt-5"
                items={[
                  {
                    question: 'Documente de identitate',
                    answer:
                      'De regulă, act de identitate și documente de proprietate/folosință (în funcție de cerințe). Verifică lista oficială pentru ediția curentă.',
                  },
                  {
                    question: 'Documente imobil',
                    answer:
                      'Extras / acte care dovedesc dreptul asupra imobilului și eventual documente cadastrale, dacă sunt cerute în ghid.',
                  },
                  {
                    question: 'Declarații / formulare',
                    answer:
                      'Formulare specifice programului, completate corect și semnate unde este cazul.',
                  },
                  {
                    question: 'Altele (după caz)',
                    answer:
                      'Pot exista cerințe suplimentare. Noi îți oferim o listă clară pentru cazul tău înainte de depunere.',
                  },
                ]}
              />
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-7">
              <h2 className="text-xl font-bold">FAQ rapid</h2>
              <FaqAccordion className="mt-5" items={faq} />
            </div>
          </div>

          <aside className="lg:col-span-4">
            <div className="sticky top-24 rounded-3xl border border-white/10 bg-black/30 p-7">
              <div className="text-sm font-semibold text-white">Solaris CET vă ajută cu întregul dosar</div>
              <div className="mt-2 text-sm text-slate-300 leading-relaxed">
                Îți clarificăm pașii, verificăm documentele și îți spunem ce e realist din punct de vedere tehnic.
              </div>
              <a href="/contact" className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-emerald-500 px-6 py-4 text-black font-black">
                Cere consultanță gratuită
              </a>
              <div className="mt-4 text-xs text-slate-400">Notă: informațiile sunt orientative. Verifică condițiile actuale pe afm.ro.</div>
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
