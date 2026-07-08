import { ArrowRight, BadgeCheck, CalendarDays, CircleDollarSign, ClipboardList, FileCheck, Wallet } from 'lucide-react';

import { SolarisFooter } from '@/components/company/SolarisFooter';

const cards = [
  {
    title: 'Casa Verde 2025',
    href: '/finantare/casa-verde-2025',
    icon: <BadgeCheck className="h-5 w-5" aria-hidden />,
    body: 'Ghid orientativ + pași de urmat și ce documente sunt necesare.',
  },
  {
    title: 'Casa Verde Baterii 2026',
    href: '/finantare/casa-verde-baterii-2026',
    icon: <CircleDollarSign className="h-5 w-5" aria-hidden />,
    body: 'Până la 20.000 lei (orientativ) — eligibilitate, documente și pași.',
  },
  {
    title: 'REPowerEU',
    href: '/finantare/repowereu',
    icon: <CalendarDays className="h-5 w-5" aria-hidden />,
    body: 'Explicații clare despre program și cum te putem ajuta cu dosarul.',
  },
];

export default function FinancingHubPage() {
  return (
    <main id="main-content" tabIndex={-1} className="pt-24 pb-0 bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 xl:px-12">
        <section className="rounded-3xl border border-white/10 bg-black/30 p-8 sm:p-10" data-reveal-stagger>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-[11px] font-bold tracking-wider text-emerald-300">
            FINANȚARE
          </div>
          <h1 className="mt-5 font-display text-4xl md:text-6xl font-bold tracking-tight">Beneficiați de fonduri nerambursabile pentru instalații fotovoltaice</h1>
          <p className="mt-4 text-lg text-slate-300 max-w-3xl">
            Pagini orientative despre programe populare de finanțare. Scopul lor este să te ajute să înțelegi rapid dacă are sens să începi
            acum, ce documente contează și ce pași urmează înainte de montaj.
          </p>
          <div className="mt-7 flex flex-col sm:flex-row gap-3">
            <a href="/contact" className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-7 py-4 text-black font-black">
              Vă ajutăm cu dosarul — Contactați-ne
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </a>
            <a href="/calculator" className="inline-flex items-center justify-center rounded-2xl border border-white/20 px-7 py-4 text-white font-semibold hover:bg-white/5">
              Verifică întâi amortizarea
            </a>
            <a
              href="https://afm.ro"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-2xl border border-white/20 px-7 py-4 text-white font-semibold hover:bg-white/5"
            >
              afm.ro
            </a>
          </div>
        </section>

        <section className="mt-10 grid gap-4 md:grid-cols-3" data-reveal-stagger>
          {[
            { label: 'Ce rezolvi aici', value: 'Clarifici dacă merită să începi și ce pregătire administrativă ai de făcut' },
            { label: 'Ce nu promitem', value: 'Nu garantăm finanțare; te ajutăm să înțelegi condițiile și să pregătești baza corect' },
            { label: 'Pasul sănătos', value: 'Întâi vezi fezabilitatea tehnică și amortizarea, apoi intri în dosar' },
          ].map((item) => (
            <div key={item.label} className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/50">{item.label}</div>
              <div className="mt-2 text-base font-semibold text-white">{item.value}</div>
            </div>
          ))}
        </section>

        <section className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6" data-reveal-stagger>
          {cards.map((c) => (
            <a
              key={c.href}
              href={c.href}
              className="rounded-3xl border border-white/10 bg-white/5 p-7 hover:border-emerald-400/50 transition-colors"
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
                {c.icon}
              </div>
              <div className="mt-5 text-xl font-bold text-white">{c.title}</div>
              <div className="mt-2 text-sm text-slate-300 leading-relaxed">{c.body}</div>
              <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-300">
                Vezi detalii <ArrowRight className="h-4 w-4" aria-hidden />
              </div>
            </a>
          ))}
        </section>

        <section className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-3" data-reveal-stagger>
          {[
            {
              title: '1. Verifici fezabilitatea',
              body: 'Înainte de dosar, trebuie să știi dacă proiectul tehnic are sens pentru consumul tău și pentru acoperiș.',
              icon: ClipboardList,
            },
            {
              title: '2. Pregătești documentele',
              body: 'Actele se adună mai repede când ai deja claritatea minimă: cine e proprietar, unde se montează, ce vrei să obții.',
              icon: FileCheck,
            },
            {
              title: '3. Compari cu scenariul fără finanțare',
              body: 'Un client bun ia decizia și cu, și fără subvenție. Dacă ROI-ul este bun oricum, nu rămâi blocat în așteptare.',
              icon: Wallet,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="rounded-3xl border border-white/10 bg-black/20 p-7">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <div className="mt-5 text-xl font-bold text-white">{item.title}</div>
                <div className="mt-2 text-sm leading-relaxed text-slate-300">{item.body}</div>
              </div>
            );
          })}
        </section>

        <section className="mt-16 mb-16 rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-8 sm:p-10" data-reveal-stagger>
          <div className="max-w-3xl">
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-300/85">Decizie practică</div>
            <h2 className="mt-4 text-3xl font-black text-white sm:text-4xl">Înainte să alergi după finanțare, verifică dacă proiectul este bun și fără ea.</h2>
            <p className="mt-4 text-base leading-relaxed text-slate-200">
              Asta elimină două riscuri mari: să te blochezi într-un program care întârzie și să alegi o soluție prost dimensionată doar
              pentru că „intră la dosar”. Calculatorul și discuția de ofertare te ajută să vezi imaginea completă.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="/calculator" className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-4 font-black text-black">
                Deschide calculatorul
                <ArrowRight className="h-4 w-4" aria-hidden />
              </a>
              <a href="/contact" className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-4 font-semibold text-white hover:bg-white/10">
                Cere consultanță
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
