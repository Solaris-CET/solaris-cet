import { ArrowRight, Download, Leaf, LineChart, Zap } from 'lucide-react';
import { useMemo, useState } from 'react';

import { SolarisFooter } from '@/components/company/SolarisFooter';

type CountyKey = 'vaslui' | 'iasi' | 'bacau' | 'galati' | 'vrancea' | 'bucuresti' | 'other';
type OrientationKey = 'south' | 'east_west' | 'north';
type RoofKey = 'pitched' | 'flat' | 'ground';

const counties: Array<{ key: CountyKey; label: string; factor: number }> = [
  { key: 'vaslui', label: 'Vaslui', factor: 1.13 },
  { key: 'iasi', label: 'Iași', factor: 1.11 },
  { key: 'bacau', label: 'Bacău', factor: 1.06 },
  { key: 'galati', label: 'Galați', factor: 1.16 },
  { key: 'vrancea', label: 'Vrancea', factor: 1.08 },
  { key: 'bucuresti', label: 'București/Ilfov', factor: 1.14 },
  { key: 'other', label: 'Alt județ', factor: 1.1 },
];

const orientations: Array<{ key: OrientationKey; label: string; factor: number }> = [
  { key: 'south', label: 'Sud (ideal)', factor: 1.0 },
  { key: 'east_west', label: 'Est/Vest (bun)', factor: 0.88 },
  { key: 'north', label: 'Nord (slab)', factor: 0.65 },
];

const roofs: Array<{ key: RoofKey; label: string; factor: number }> = [
  { key: 'pitched', label: 'Acoperiș înclinat', factor: 1.0 },
  { key: 'flat', label: 'Acoperiș plat', factor: 0.98 },
  { key: 'ground', label: 'La sol', factor: 1.03 },
];

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatRon(n: number) {
  return new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'RON', maximumFractionDigits: 0 }).format(n);
}

function formatNumber(n: number) {
  return new Intl.NumberFormat('ro-RO', { maximumFractionDigits: 0 }).format(n);
}

export default function SolarCalculatorPage() {
  const [monthlyKwh, setMonthlyKwh] = useState('350');
  const [county, setCounty] = useState<CountyKey>('vaslui');
  const [roof, setRoof] = useState<RoofKey>('pitched');
  const [orientation, setOrientation] = useState<OrientationKey>('south');

  const model = useMemo(() => {
    const m = clamp(Number(monthlyKwh || 0), 50, 6000);
    const annualConsumption = m * 12;
    const countyFactor = counties.find((c) => c.key === county)?.factor ?? 1.1;
    const roofFactor = roofs.find((r) => r.key === roof)?.factor ?? 1.0;
    const orientationFactor = orientations.find((o) => o.key === orientation)?.factor ?? 1.0;

    const baselineYield = 1200;
    const yieldKwhPerKw = baselineYield * countyFactor * roofFactor * orientationFactor;
    const neededKw = annualConsumption / Math.max(600, yieldKwhPerKw);
    const kwRounded = Math.max(2.0, Math.round(neededKw * 10) / 10);

    const panelW = 0.45;
    const panels = Math.max(6, Math.ceil(kwRounded / panelW));
    const kwFinal = Math.round(panels * panelW * 10) / 10;

    const pricePerKw = kwFinal <= 6 ? 5200 : kwFinal <= 12 ? 4800 : 4400;
    const estimatePrice = Math.round(kwFinal * pricePerKw);

    const energyPrice = 1.1;
    const selfConsumption = kwFinal <= 6 ? 0.62 : 0.55;
    const annualSavings = Math.round(annualConsumption * energyPrice * selfConsumption);
    const paybackYears = clamp(estimatePrice / Math.max(1, annualSavings), 2.5, 14);
    const co2Kg = Math.round(annualConsumption * 0.35);

    const monthlyShape = [0.36, 0.46, 0.62, 0.8, 0.96, 1.05, 1.08, 1.0, 0.82, 0.62, 0.45, 0.34];
    const annualProd = Math.round(kwFinal * yieldKwhPerKw);
    const raw = monthlyShape.map((x) => x / monthlyShape.reduce((a, b) => a + b, 0));
    const monthlyProd = raw.map((x) => Math.round(x * annualProd));

    return {
      annualConsumption,
      kwFinal,
      panels,
      estimatePrice,
      annualSavings,
      paybackYears,
      co2Kg,
      yieldKwhPerKw,
      annualProd,
      monthlyProd,
    };
  }, [county, monthlyKwh, orientation, roof]);

  const maxMonthly = Math.max(1, ...model.monthlyProd);

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-solaris-offblack text-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12" data-reveal>
          <h1 className="font-display font-bold bg-gradient-to-r from-solar-yellow to-amber-500 bg-clip-text text-transparent text-[length:var(--text-h1)] leading-[var(--lh-display)]">
            Calculator fotovoltaic (estimare)
          </h1>
          <p className="mt-4 text-lg text-solaris-muted max-w-3xl mx-auto">
            Estimare orientativă pe baza consumului și a condițiilor. Pentru ofertă exactă, trimite consumul și poze cu acoperișul.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <section className="lg:col-span-5 rounded-3xl border border-white/10 bg-black/40 p-7" data-reveal-stagger>
            <div className="text-sm font-black text-white">Date de intrare</div>
            <div className="mt-5 grid gap-4">
              <div>
                <label htmlFor="kwh" className="block text-sm font-semibold text-white/70">
                  Consum lunar (kWh)
                </label>
                <input
                  id="kwh"
                  value={monthlyKwh}
                  onChange={(e) => setMonthlyKwh(e.target.value.replace(/[^\d]/g, '').slice(0, 4))}
                  inputMode="numeric"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-orange-400"
                  placeholder="Ex: 350"
                />
              </div>

              <div>
                <label htmlFor="county" className="block text-sm font-semibold text-white/70">
                  Județ
                </label>
                <select
                  id="county"
                  value={county}
                  onChange={(e) => setCounty(e.target.value as CountyKey)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-orange-400"
                >
                  {counties.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="roof" className="block text-sm font-semibold text-white/70">
                  Tip montaj
                </label>
                <select
                  id="roof"
                  value={roof}
                  onChange={(e) => setRoof(e.target.value as RoofKey)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-orange-400"
                >
                  {roofs.map((r) => (
                    <option key={r.key} value={r.key}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="orientation" className="block text-sm font-semibold text-white/70">
                  Orientare
                </label>
                <select
                  id="orientation"
                  value={orientation}
                  onChange={(e) => setOrientation(e.target.value as OrientationKey)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-orange-400"
                >
                  {orientations.map((o) => (
                    <option key={o.key} value={o.key}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <a
                href={`/contact?service=fotovoltaice`}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-orange-400 px-6 py-3 text-sm font-black text-black"
              >
                Cere ofertă <ArrowRight className="h-4 w-4" aria-hidden />
              </a>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-bold text-white hover:bg-white/10"
              >
                Descarcă PDF <Download className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </section>

          <section className="lg:col-span-7 space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-7" data-reveal-stagger>
              <div className="text-sm font-black text-white">Rezultat</div>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-white/55">Sistem recomandat</div>
                  <div className="mt-1 text-sm font-black text-white">
                    {model.kwFinal} kW
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-white/55">Panouri</div>
                  <div className="mt-1 text-sm font-black text-white">{model.panels} × 450W</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-white/55">Preț estimat</div>
                  <div className="mt-1 text-sm font-black text-white">{formatRon(model.estimatePrice)}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-white/55">Amortizare</div>
                  <div className="mt-1 text-sm font-black text-white">{model.paybackYears.toFixed(1)} ani</div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-white/70">
                    <Zap className="h-4 w-4 text-orange-300" aria-hidden />
                    Economie anuală (estimare)
                  </div>
                  <div className="mt-2 text-lg font-black text-white">{formatRon(model.annualSavings)}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-white/70">
                    <LineChart className="h-4 w-4 text-orange-300" aria-hidden />
                    Producție anuală (estimare)
                  </div>
                  <div className="mt-2 text-lg font-black text-white">{formatNumber(model.annualProd)} kWh</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-white/70">
                    <Leaf className="h-4 w-4 text-emerald-300" aria-hidden />
                    CO₂ evitat (estimare)
                  </div>
                  <div className="mt-2 text-lg font-black text-white">{formatNumber(model.co2Kg)} kg/an</div>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/60">Producție lunară (estimare)</div>
                <div className="mt-4">
                  <svg viewBox="0 0 264 72" className="w-full h-16" role="img" aria-label="Producție lunară estimată" preserveAspectRatio="none">
                    {model.monthlyProd.map((v, i) => {
                      const h = Math.max(2, Math.round((v / maxMonthly) * 64));
                      const x = i * 22 + 6;
                      const y = 70 - h;
                      return <rect key={i} x={x} y={y} width={12} height={h} rx={4} fill="rgba(245,158,11,0.65)" />;
                    })}
                  </svg>
                  <div className="mt-2 grid grid-cols-6 sm:grid-cols-12 gap-2 text-[10px] text-white/55 font-mono">
                    {['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m) => (
                      <div key={m} className="text-center">
                        {m}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 text-xs text-white/55 leading-relaxed">
                Estimare orientativă. Prețul final depinde de evaluare (acoperiș/structură, distanțe cabluri, protecții, acces, configurație), iar economia depinde de autoconsum și tarifele de energie.
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/30 p-7" data-reveal>
              <div className="text-sm font-black text-white">Ce ne trimiți pentru ofertă exactă</div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  'Consumul (facturi sau kWh/lună)',
                  'Poze acoperiș (față + detalii)',
                  'Poze tablou electric / spațiu tehnic',
                  'Locația și eventualele umbre',
                ].map((x) => (
                  <div key={x} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/75">
                    {x}
                  </div>
                ))}
              </div>
              <div className="mt-5">
                <a
                  href={`https://wa.me/40769889721?text=${encodeURIComponent(
                    `Bună! Vreau ofertă fotovoltaic. Consum ~${monthlyKwh || '—'} kWh/lună, județ: ${counties.find((c) => c.key === county)?.label ?? '—'}.`,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-bold text-white hover:bg-white/10"
                >
                  Trimite pe WhatsApp <ArrowRight className="h-4 w-4" aria-hidden />
                </a>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-16">
          <SolarisFooter />
        </div>
      </div>
    </div>
  );
}

