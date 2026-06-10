import { CheckCircle, ClipboardList, Clock, FileText, ShieldCheck } from 'lucide-react';

const steps = [
  {
    title: 'Evaluare la locație',
    body: 'Măsurăm, verificăm umbririle, structura și traseele. Stabilim necesarul real, nu „după ureche”.',
    icon: ClipboardList,
  },
  {
    title: 'Ofertă clară',
    body: 'Primești o soluție tehnică explicată, termene realiste și opțiuni (on-grid / hibrid / baterie).',
    icon: FileText,
  },
  {
    title: 'Execuție curată',
    body: 'Montaj ordonat, detalii de etanșare corecte și protecții electrice dimensionate corect.',
    icon: ShieldCheck,
  },
  {
    title: 'Punere în funcțiune',
    body: 'Testare, setări, monitorizare și recomandări de exploatare. Rămânem disponibili pentru mentenanță.',
    icon: CheckCircle,
  },
];

const promiseCards = [
  {
    title: 'Răspuns rapid',
    body: 'De regulă răspundem în aceeași zi lucrătoare sau cel târziu în următoarea.',
    icon: Clock,
  },
  {
    title: 'Transparență',
    body: 'Comunicăm clar ce este inclus, ce este opțional și ce depinde de proiect.',
    icon: FileText,
  },
  {
    title: 'Fără surprize',
    body: 'Planificare pe etape, coordonare și verificări înainte de finalizarea lucrării.',
    icon: ShieldCheck,
  },
];

export default function TrustProcessSection() {
  return (
    <section id="incredere" className="relative overflow-hidden bg-slate-950 py-20">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -top-20 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-gradient-to-br from-amber-400/10 via-orange-500/5 to-transparent blur-3xl animate-hero-aurora" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(242,201,76,0.10),transparent_55%),radial-gradient(circle_at_72%_30%,rgba(46,231,255,0.08),transparent_55%)]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8 xl:px-12">
        <div className="max-w-3xl" data-reveal>
          <h2 className="text-3xl font-bold text-white md:text-5xl">Proces simplu. Execuție curată.</h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-300">
            Îți arătăm pașii, apoi livrăm: fotovoltaice și acoperișuri cu detalii corecte, fără improvizații.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4" data-reveal-stagger>
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.title} className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-7 backdrop-blur">
                <div
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  aria-hidden
                >
                  <div className="absolute -inset-20 bg-[conic-gradient(from_200deg_at_50%_50%,rgba(242,201,76,0.16),rgba(46,231,255,0.10),rgba(242,201,76,0.16))] blur-3xl animate-hero-conic-drift" />
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/55 via-transparent to-transparent" />
                </div>
                <div className="relative">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/25">
                    <Icon className="h-5 w-5 text-amber-400" aria-hidden />
                  </span>
                  <div className="mt-4 text-lg font-bold text-white">{s.title}</div>
                  <div className="mt-2 text-sm leading-relaxed text-slate-300">{s.body}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3" data-reveal-stagger>
          {promiseCards.map((p) => {
            const Icon = p.icon;
            return (
              <div key={p.title} className="rounded-3xl border border-white/10 bg-black/20 p-7">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                    <Icon className="h-5 w-5 text-amber-400" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-white">{p.title}</div>
                    <div className="mt-1 text-sm text-slate-300">{p.body}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 flex flex-wrap gap-3" data-reveal>
          <a href="/contact" className="btn-filled-gold inline-flex items-center gap-2">
            Cere ofertă
            <span aria-hidden>→</span>
          </a>
          <a href="/servicii" className="btn-outline-white inline-flex items-center gap-2">
            Vezi serviciile
            <span aria-hidden>→</span>
          </a>
        </div>
      </div>
    </section>
  );
}
