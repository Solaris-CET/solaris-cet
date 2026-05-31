import { Check } from 'lucide-react';

import { SolarisFooter } from '@/components/company/SolarisFooter';

export default function ThankYouPage() {
  return (
    <main id="main-content" tabIndex={-1} className="pt-24 pb-0 bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 xl:px-12">
        <section className="rounded-3xl border border-white/10 bg-black/30 p-8 sm:p-12">
          <div className="flex items-center gap-4">
            <div className="relative h-14 w-14 rounded-2xl border border-emerald-400/25 bg-emerald-400/10">
              <div className="absolute inset-0 rounded-2xl" style={{ animation: 'pulseRing 1.4s ease-out infinite' }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <Check className="h-7 w-7 text-emerald-300" aria-hidden />
              </div>
            </div>
            <div>
              <h1 className="font-display text-3xl md:text-5xl font-bold">Mulțumim! Vă contactăm în 24 de ore</h1>
              <p className="mt-2 text-slate-300">Am primit cererea. Pentru urgențe: <a className="underline underline-offset-4 decoration-white/20 hover:decoration-white/60" href="tel:+40769889721">+40 769 889 721</a>.</p>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { n: '1', t: 'Confirmăm cererea', d: 'Verificăm detaliile și revenim pentru clarificări.' },
              { n: '2', t: 'Programăm vizita', d: 'Stabilim o evaluare tehnică (după caz).' },
              { n: '3', t: 'Trimitem oferta', d: 'Primești o ofertă clară, cu pașii de execuție.' },
            ].map((s) => (
              <div key={s.n} className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-300 font-black">
                  {s.n}
                </div>
                <div className="mt-4 text-lg font-semibold">{s.t}</div>
                <div className="mt-2 text-sm text-slate-400 leading-relaxed">{s.d}</div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col sm:flex-row gap-3">
            <a href="/" className="inline-flex items-center justify-center rounded-2xl bg-amber-400 px-7 py-4 text-black font-black">Înapoi acasă</a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-2xl border border-white/20 px-7 py-4 text-white font-semibold hover:bg-white/5"
            >
              Urmăriți-ne pe Facebook
            </a>
          </div>
        </section>
      </div>

      <div className="mt-16">
        <SolarisFooter />
      </div>

      <style>{`@keyframes pulseRing{0%{transform:scale(1);opacity:.45;background:rgba(34,197,94,.16)}100%{transform:scale(1.35);opacity:0;background:rgba(34,197,94,0)}}`}</style>
    </main>
  );
}

