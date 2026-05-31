import { BadgeCheck, CalendarDays, CheckCircle2, FileText, HelpCircle } from 'lucide-react';

import { SolarisFooter } from '@/components/company/SolarisFooter';
import { FaqAccordion, type FaqItem } from '@/components/FaqAccordion';

const updatedLabel = 'Actualizat mai 2026';

const faq: FaqItem[] = [
  {
    question: 'Pot aplica dacă am deja panouri?',
    answer:
      'Depinde de regulile ediției. Unele programe finanțează sisteme noi, altele permit extinderi. Verifică ghidul AFM pentru ediția curentă.',
  },
  {
    question: 'Cât durează procesul?',
    answer:
      'Depinde de calendarul oficial și de completitudinea dosarului. Pregătirea documentelor din timp reduce întârzierile.',
  },
  {
    question: 'Ce include un sistem corect dimensionat?',
    answer:
      'Analiză consum, orientare/umbriri, structură acoperiș și alegerea echipamentelor potrivite (invertor, protecții, structură).',
  },
];

export default function FinancingCasaVerde2025Page() {
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

          <h1 className="mt-6 font-display text-4xl md:text-6xl font-bold tracking-tight">Casa Verde 2025 — Ghid orientativ pentru fotovoltaice</h1>
          <p className="mt-4 text-lg text-slate-300 max-w-3xl">
            Explicații clare despre program, eligibilitate și pașii de urmat. Pentru condițiile oficiale, consultați AFM.
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
                Programul Casa Verde (AFM) sprijină instalarea de sisteme fotovoltaice pentru a reduce costurile cu energia și
                pentru a crește autoconsumul. Condițiile și bugetele se pot modifica între ediții.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-7">
              <div className="flex items-center gap-3">
                <BadgeCheck className="h-5 w-5 text-emerald-300" aria-hidden />
                <h2 className="text-xl font-bold">Cine poate beneficia</h2>
              </div>
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  'Eligibilitate conform ghidului AFM (ediția curentă)',
                  'Imobil și documente conforme',
                  'Dosar complet și corect',
                  'Alegerea unui instalator și a echipamentelor potrivite',
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
                <h2 className="text-xl font-bold">Documente și pași (simplificat)</h2>
              </div>
              <FaqAccordion
                className="mt-5"
                items={[
                  {
                    question: 'Ce documente apar cel mai des?',
                    answer:
                      'Acte de identitate, documente de proprietate/folosință, formulare specifice programului și declarații (în funcție de ghid).',
                  },
                  {
                    question: 'Pașii de urmat',
                    answer:
                      '1) Discuție și evaluare tehnică. 2) Pregătire documente. 3) Depunere în perioada oficială. 4) Implementare și punere în funcțiune.',
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
              <div className="text-sm font-semibold text-white">Vă ajutăm cu dosarul</div>
              <div className="mt-2 text-sm text-slate-300 leading-relaxed">
                Îți oferim o listă clară de pași, verificăm documentele și îți recomandăm o soluție tehnică potrivită.
              </div>
              <a href="/contact" className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-emerald-500 px-6 py-4 text-black font-black">
                Contactați-ne
              </a>
              <div className="mt-4 text-xs text-slate-400">Informațiile sunt orientative. Verificați condițiile actuale pe afm.ro.</div>
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

