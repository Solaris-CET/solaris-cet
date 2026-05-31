import { BadgeCheck, ChevronRight, MapPin, ShieldCheck, Sparkles, Users } from 'lucide-react';

import AppImage from '@/components/AppImage';
import { SolarisFooter } from '@/components/company/SolarisFooter';

export default function AboutPage() {
  return (
    <main id="main-content" tabIndex={-1} className="pt-24 pb-0 bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 xl:px-12">
        <section className="rounded-3xl border border-white/10 bg-black/30 p-8 sm:p-10">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <a href="/" className="hover:text-white">Acasă</a>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            <span className="text-slate-200">Despre noi</span>
          </div>
          <h1 className="mt-4 font-display text-4xl md:text-6xl font-bold tracking-tight">Despre Solaris CET</h1>
          <p className="mt-4 text-lg text-slate-300 max-w-3xl">
            Specialiști în energie solară și construcții din inima Moldovei. Livrăm proiecte curate, sigure și durabile:
            fotovoltaice, acoperișuri și lucrări de construcții.
          </p>
        </section>

        <section className="mt-14 space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6">
              <h2 className="text-2xl md:text-3xl font-bold">Povestea noastră</h2>
              <p className="mt-3 text-slate-300 leading-relaxed">
                Solaris CET a pornit din nevoia reală de execuție corectă: detalii, etanșări, siguranță electrică și lucrări
                care arată impecabil la predare. Punem accent pe comunicare clară, materiale potrivite și proces de lucru
                ordonat.
              </p>
              <p className="mt-3 text-slate-300 leading-relaxed">
                Pentru noi, o lucrare bună se vede în timp: fără improvizații, fără compromisuri la zonele critice și cu
                mentenanță simplă. Fie că e vorba de fotovoltaice sau anvelopă, tratăm proiectul ca pe unul al nostru.
              </p>
            </div>
            <div className="lg:col-span-6">
              <div className="rounded-3xl overflow-hidden border border-white/10 bg-white/5">
                <AppImage
                  src="/images/team-placeholder.svg"
                  alt="Echipă Solaris CET (imagine demonstrativă)"
                  className="w-full h-full object-cover"
                  width={1200}
                  height={800}
                  loading="lazy"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 lg:order-2">
              <h2 className="text-2xl md:text-3xl font-bold">Misiunea noastră</h2>
              <p className="mt-3 text-slate-300 leading-relaxed">
                Misiunea Solaris CET este să aducă soluții eficiente și durabile: proiecte fotovoltaice corect dimensionate
                și execuție de construcții/învelitori care rezistă în timp. Preferăm calitatea, transparența și responsabilitatea.
              </p>
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10 border border-amber-400/20">
                    <Sparkles className="h-5 w-5 text-amber-400" aria-hidden />
                  </div>
                  <div className="mt-3 font-semibold">Calitate</div>
                  <div className="mt-1 text-sm text-slate-400">Materiale potrivite și standarde ridicate.</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10 border border-amber-400/20">
                    <ShieldCheck className="h-5 w-5 text-amber-400" aria-hidden />
                  </div>
                  <div className="mt-3 font-semibold">Eficiență</div>
                  <div className="mt-1 text-sm text-slate-400">Planificare și execuție la termen.</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10 border border-amber-400/20">
                    <Users className="h-5 w-5 text-amber-400" aria-hidden />
                  </div>
                  <div className="mt-3 font-semibold">Încredere</div>
                  <div className="mt-1 text-sm text-slate-400">Suport post-instalare și comunicare clară.</div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-6 lg:order-1">
              <div className="rounded-3xl border border-white/10 bg-black/30 p-6 sm:p-8">
                <h3 className="text-lg font-semibold">Zona noastră de activitate</h3>
                <p className="mt-2 text-sm text-slate-400">
                  Suntem bazați în Cetățuia (Vaslui) și deplasăm echipele în raza de 200km, în funcție de proiect.
                </p>
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs text-slate-400">Județe deservite frecvent</div>
                    <ul className="mt-3 space-y-2 text-sm text-slate-200">
                      {['Vaslui', 'Bacău', 'Iași', 'Galați', 'Vrancea', 'Botoșani'].map((x) => (
                        <li key={x} className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden />
                          {x}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs text-slate-400">Hartă simplificată</div>
                    <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/60 p-3">
                      <svg viewBox="0 0 220 180" className="w-full h-auto" aria-hidden>
                        <path
                          d="M30 120l18-30 18-8 14-22 24-10 26 8 18 18 26 2 18 18-8 30-24 22-34 6-30-10-22 14-18-6-10-14z"
                          fill="#111827"
                          stroke="#1e293b"
                          strokeWidth="2"
                        />
                        <path
                          d="M70 110l14-18 22-8 18 8 16 16-8 18-24 10-20-6-18 6z"
                          fill="rgba(245,158,11,0.18)"
                          stroke="rgba(245,158,11,0.55)"
                          strokeWidth="2"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-2xl md:text-3xl font-bold">Certificări și acreditări</h2>
          <p className="mt-3 text-slate-300 max-w-3xl">
            Folosim practici corecte și ne aliniem cerințelor de siguranță și calitate. Putem furniza documentația necesară la cerere.
          </p>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: 'ANRE', body: 'Atestat / conformitate pentru lucrări PV (unde se aplică).' },
              { title: 'AFM', body: 'Suport pentru programe de finanțare (Casa Verde / ghiduri).' },
              { title: 'Garanție manoperă', body: 'Execuție atentă și suport post-instalare.' },
              { title: 'Asigurare', body: 'Responsabilitate și proceduri de lucru în siguranță.' },
            ].map((c) => (
              <div key={c.title} className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/20">
                  <BadgeCheck className="h-5 w-5 text-amber-400" aria-hidden />
                </div>
                <div className="mt-4 text-lg font-semibold">{c.title}</div>
                <div className="mt-2 text-sm text-slate-400 leading-relaxed">{c.body}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-2xl md:text-3xl font-bold">Echipa</h2>
          <p className="mt-3 text-slate-300 max-w-3xl">O echipă compactă, orientată pe execuție și detalii.</p>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: 'Coordonator proiect', role: 'Planificare, ofertare, calitate execuție' },
              { name: 'Tehnician fotovoltaic', role: 'Montaj, punere în funcțiune, verificări' },
              { name: 'Specialist acoperișuri', role: 'Tablă/țiglă/TPO, detalii la atice și străpungeri' },
            ].map((p) => (
              <div key={p.name} className="rounded-3xl border border-white/10 bg-black/30 p-6">
                <div className="h-12 w-12 rounded-2xl border border-white/10 bg-white/5" aria-hidden />
                <div className="mt-4 text-lg font-semibold">{p.name}</div>
                <div className="mt-1 text-sm text-slate-400">{p.role}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 mb-16 rounded-3xl border border-white/10 bg-amber-400 p-10 text-black">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 text-sm font-bold">
              <MapPin className="h-4 w-4" aria-hidden />
              Cetățuia, Vaslui · deplasare 200km
            </div>
            <h2 className="mt-3 text-3xl md:text-4xl font-black">Vrei o ofertă rapidă?</h2>
            <p className="mt-3 text-black/80 text-lg">
              Spune-ne ce ai nevoie (fotovoltaice / acoperiș / mentenanță) și revenim cu pașii următori.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <a href="/contact" className="inline-flex items-center justify-center rounded-2xl bg-black px-7 py-4 text-white font-bold">
                Cere ofertă
              </a>
              <a href="tel:+40769889721" className="inline-flex items-center justify-center rounded-2xl border border-black/25 px-7 py-4 font-bold">
                +40 769 889 721
              </a>
            </div>
          </div>
        </section>
      </div>

      <SolarisFooter />
    </main>
  );
}
