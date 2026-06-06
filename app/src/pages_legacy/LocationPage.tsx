import { ArrowRight, MapPin } from 'lucide-react';

import AppImage from '@/components/AppImage';
import { SolarisFooter } from '@/components/company/SolarisFooter';

export default function LocationPage({ city, slug }: { city: string; slug: string }) {
  const heading = `Servicii Solaris CET în ${city}`;
  const subtitle =
    'Fotovoltaice, acoperișuri (tablă/țiglă/TPO), atice/fațade tablă și mentenanță. Evaluare → ofertă → execuție.';

  return (
    <main id="main-content" tabIndex={-1} className="pt-24 pb-0 bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 xl:px-12">
        <section className="rounded-3xl border border-white/10 bg-black/30 p-8 sm:p-10" data-reveal-stagger>
          <div className="flex flex-col lg:flex-row lg:items-center gap-8">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-[11px] font-bold tracking-wider text-amber-200">
                <MapPin className="h-4 w-4" aria-hidden />
                {city}, România
              </div>
              <h1 className="mt-5 font-display text-4xl md:text-6xl font-bold tracking-tight">{heading}</h1>
              <p className="mt-4 text-lg text-slate-300 max-w-2xl">{subtitle}</p>
              <div className="mt-7 flex flex-col sm:flex-row gap-3">
                <a
                  href={`/contact?service=fotovoltaice&city=${encodeURIComponent(slug)}`}
                  className="inline-flex items-center justify-center rounded-2xl bg-amber-400 px-7 py-4 text-black font-black"
                >
                  Cere ofertă <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                </a>
                <a
                  href="tel:+40769889721"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/20 px-7 py-4 text-white font-semibold hover:bg-white/5"
                >
                  +40 769 889 721
                </a>
              </div>
            </div>
            <div className="lg:w-[420px]">
              <div className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
                <AppImage
                  src="/images/hero-solaris.svg"
                  alt="Solaris CET"
                  className="w-full h-auto"
                  width={840}
                  height={560}
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8" data-reveal>
            <h2 className="text-2xl md:text-3xl font-bold">Ce facem în {city}</h2>
            <p className="mt-3 text-slate-300 leading-relaxed">
              Ne deplasăm în funcție de proiect și oferim execuție completă: evaluare, ofertă, planificare și punere în funcțiune.
              Trimite consumul (factură) și câteva poze cu acoperișul/locația pentru o estimare rapidă.
            </p>
            <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-4" data-reveal-stagger>
              {[
                {
                  t: 'Fotovoltaice rezidențiale',
                  d: '3–12 kW, hibrid, baterii, monitorizare și optimizare autoconsum.',
                  href: '/servicii/fotovoltaice-rezidentiale',
                },
                {
                  t: 'Fotovoltaice industriale',
                  d: 'Sisteme pentru hale/clădiri comerciale, ROI și monitorizare.',
                  href: '/servicii/fotovoltaice-industriale',
                },
                {
                  t: 'Acoperișuri tablă/țiglă',
                  d: 'Montaj, reparații, etanșări, jgheaburi/burlane, detalii curate.',
                  href: '/servicii/acoperisuri-tabla-tigla',
                },
                {
                  t: 'TPO industrial',
                  d: 'Membrane TPO, îmbinări, atice, scurgeri, intervenții la infiltrații.',
                  href: '/servicii/acoperisuri-industriale-tpo',
                },
              ].map((x) => (
                <a
                  key={x.href}
                  href={x.href}
                  className="rounded-3xl border border-white/10 bg-white/5 p-6 hover:border-amber-400/30 transition-colors"
                >
                  <div className="text-lg font-semibold">{x.t}</div>
                  <div className="mt-2 text-sm text-slate-300 leading-relaxed">{x.d}</div>
                  <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-amber-300">
                    Vezi detalii <ArrowRight className="h-4 w-4" aria-hidden />
                  </div>
                </a>
              ))}
            </div>
          </div>

          <aside className="lg:col-span-4" data-reveal>
            <div className="rounded-3xl border border-white/10 bg-black/30 p-7 sticky top-24">
              <div className="text-sm font-semibold text-white">Evaluare rapidă</div>
              <div className="mt-2 text-sm text-slate-300 leading-relaxed">
                Pentru o ofertă rapidă, trimite: locație, consum (factură), tip acoperiș și câteva poze. Revenim cu pașii următori.
              </div>
              <div className="mt-6 grid gap-3" data-reveal-stagger>
                <a href="/contact?service=fotovoltaice" className="btn-filled-gold inline-flex justify-center">
                  Cere ofertă
                </a>
                <a href={`https://wa.me/40769889721?text=${encodeURIComponent(`Bună! Doresc o ofertă în ${city} pentru: `)}`} target="_blank" rel="noopener noreferrer" className="btn-outline-white inline-flex justify-center">
                  WhatsApp
                </a>
                <a href="tel:+40769889721" className="btn-outline-white inline-flex justify-center">
                  Sună acum
                </a>
              </div>
              <div className="mt-5 text-xs text-slate-400">
                Bază: Cetățuia, Vaslui · Acoperire: România (în funcție de proiect).
              </div>
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

