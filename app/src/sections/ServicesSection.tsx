import { Building2, Home, PlugZap, Settings, ShieldCheck } from 'lucide-react';

const services = [
  {
    title: 'Instalații fotovoltaice',
    id: 'fotovoltaice',
    icon: PlugZap,
    accent: 'text-amber-400',
    description: 'Sisteme rezidențiale și industriale: proiectare, montaj, punere în funcțiune și mentenanță.',
    features: ['Evaluare tehnică', 'Dimensionare corectă', 'Montaj profesionist', 'Monitorizare și optimizări'],
    href: '/contact?service=fotovoltaice',
  },
  {
    title: 'Lucrări de construcții',
    id: 'constructii',
    icon: Building2,
    accent: 'text-sky-300',
    description: 'Lucrări rezidențiale și industriale, structură, reparații și finisaje, după necesități.',
    features: ['Execuție pe etape', 'Coordonare șantier', 'Detalii curate', 'Termene clare în ofertă'],
    href: '/contact?service=constructii',
  },
  {
    title: 'Acoperișuri (tablă / țiglă)',
    id: 'acoperisuri',
    icon: Home,
    accent: 'text-emerald-300',
    description: 'Montaj, reparații și înlocuiri: tablă, țiglă metalică și accesorii pentru etanșeitate.',
    features: ['Detalii de etanșare', 'Sisteme pluviale', 'Reparații infiltrații', 'Finisaje rezistente'],
    href: '/contact?service=acoperisuri',
  },
  {
    title: 'Acoperișuri industriale (folie TPO)',
    id: 'tpo',
    icon: Building2,
    accent: 'text-cyan-300',
    description: 'Membrane TPO pentru hale și centre comerciale: montaj, reparații și mentenanță.',
    features: ['Detalii la atice/străpungeri', 'Reparații punctuale', 'Inspecție + recomandări', 'Întreținere preventivă'],
    href: '/contact?service=tpo',
  },
  {
    title: 'Atice și fațade tablă',
    id: 'atice-fatade',
    icon: Building2,
    accent: 'text-violet-300',
    description: 'Montaje atice și fațade din tablă, finisaje curate și detalii rezistente.',
    features: ['Montaj atice', 'Placări fațade', 'Reparații locale', 'Înlocuiri elemente'],
    href: '/contact?service=atice-fatade',
  },
  {
    title: 'Reparații și mentenanță',
    id: 'reparatii',
    icon: Settings,
    accent: 'text-rose-300',
    description: 'Intervenții rapide și mentenanță pentru fotovoltaice și acoperișuri.',
    features: ['Diagnostic + soluție', 'Verificări periodice', 'Înlocuiri locale', 'Plan de mentenanță'],
    href: '/contact?service=reparatii',
  },
];

export default function ServicesSection() {
  return (
    <section className="py-24 bg-slate-900/50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 xl:px-12 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Serviciile Noastre</h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Solaris CET oferă servicii complete: fotovoltaice, construcții, acoperișuri tablă/țiglă/TPO, atice și fațade tablă, reparații.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => {
            const Icon = service.icon;
            return (
            <a
              key={service.id}
              href={service.href}
              className="bg-black/30 border border-white/10 p-7 rounded-3xl hover:border-solaris-gold/40 transition-colors group hover:bg-black/40"
            >
              <div className="mb-6 p-4 bg-white/5 rounded-2xl w-fit group-hover:scale-110 transition-transform">
                <Icon className={`h-8 w-8 ${service.accent}`} aria-hidden />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">{service.title}</h3>
              <p className="text-slate-400 mb-6 text-sm leading-relaxed">
                {service.description}
              </p>
              <ul className="space-y-3">
                {service.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-[13px] text-slate-300">
                    <ShieldCheck size={16} className="text-amber-400" />
                    {feature}
                  </li>
                ))}
              </ul>
            </a>
          )})}
        </div>
      </div>
    </section>
  );
}
