import { ArrowRight, Battery, Building2, Home, PlugZap, Settings } from 'lucide-react';
import type { ComponentType } from 'react';

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
  return (
    <section id="produse" className="py-24 bg-slate-950">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 xl:px-12">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {solutions.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.id}
                className="bg-slate-900 border border-white/5 rounded-3xl overflow-hidden hover:scale-[1.01] transition-transform"
              >
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
                      className="p-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-amber-400 hover:text-black transition-colors"
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
