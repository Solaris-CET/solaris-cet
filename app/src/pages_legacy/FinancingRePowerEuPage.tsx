import { BadgeCheck, CalendarDays, CheckCircle2, FileText, HelpCircle } from 'lucide-react';

import { SolarisFooter } from '@/components/company/SolarisFooter';
import { FaqAccordion, type FaqItem } from '@/components/FaqAccordion';

const updatedLabel = 'Actualizat mai 2026';

const faq: FaqItem[] = [
  {
    question: 'Este REPowerEU disponibil pentru toată lumea?',
    answer:
      'Eligibilitatea și criteriile depind de implementarea locală și de ghidurile oficiale. Verifică sursele instituțiilor și te ajutăm să înțelegi dacă te încadrezi.',
  },
  {
    question: 'Ce tipuri de lucrări sunt de obicei eligibile?',
    answer:
      'În funcție de schemă, pot fi incluse măsuri de eficiență energetică și/sau instalații regenerabile. Detaliile se confirmă din ghidul curent.',
  },
  {
    question: 'Cum vă ajută Solaris CET?',
    answer:
      'Îți explicăm pașii, verificăm documentele și îți propunem o soluție tehnică realistă pentru locația ta.',
  },
];

export default function FinancingRePowerEuPage() {
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

          <h1 className="mt-6 font-display text-4xl md:text-6xl font-bold tracking-tight">REPowerEU — Ghid orientativ și pași</h1>
          <p className="mt-4 text-lg text-slate-300 max-w-3xl">
            Pagină orientativă pentru informare. Pentru condițiile oficiale, consultați sursele instituțiilor și ghidurile curente.
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
              Referință: afm.ro
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
                REPowerEU este un cadru de măsuri la nivel european care susține independența energetică și accelerarea
                investițiilor în eficiență energetică și surse regenerabile. Implementarea concretă poate diferi în funcție de
                ghidurile locale.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-7">
              <div className="flex items-center gap-3">
                <BadgeCheck className="h-5 w-5 text-emerald-300" aria-hidden />
                <h2 className="text-xl font-bold">Cine poate beneficia</h2>
              </div>
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  'Eligibilitate conform ghidului curent',
                  'Documente complete și corecte',
                  'Imobil/locație conformă',
                  'Soluție tehnică potrivită pentru consum și infrastructură',
                ].map((x) => (
                  <div key={x} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                    <CheckCircle2 className="h-5 w-5 text-emerald-300 mt-0.5" aria-hidden />
                    <div className="text-sm text-slate-200 leading-relaxed">{x}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-7">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-emerald-300" aria-hidden />
                <h2 className="text-xl font-bold">Pași și documente</h2>
              </div>
              <FaqAccordion
                className="mt-5"
                items={[
                  {
                    question: 'Pași tipici',
                    answer:
                      '1) Clarificare program și eligibilitate. 2) Evaluare tehnică. 3) Pregătire documente. 4) Depunere. 5) Implementare + verificări.',
                  },
                  {
                    question: 'Documente (orientativ)',
                    answer:
                      'Acte de identitate, documente de proprietate/folosință, formulare specifice și declarații. Confirmă lista din ghidul curent.',
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
              <div className="text-sm font-semibold text-white">Solaris CET — consultanță și implementare</div>
              <div className="mt-2 text-sm text-slate-300 leading-relaxed">
                Te ajutăm să înțelegi programul și să alegi o soluție tehnică eficientă (fotovoltaic, acoperiș, optimizări).
              </div>
              <a href="/contact" className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-emerald-500 px-6 py-4 text-black font-black">
                Cere consultanță gratuită
              </a>
              <div className="mt-4 text-xs text-slate-400">Informațiile sunt orientative. Verificați condițiile actuale în sursele oficiale.</div>
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

