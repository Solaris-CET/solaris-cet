import { ArrowRight, Download, Leaf, LineChart, Zap, Brain, TreePine, TrendingUp, Home, Building2, Factory, Sun, Battery, MapPin, DollarSign, Percent, BarChart3 } from 'lucide-react';
import { useMemo, useState, useCallback } from 'react';

import { SolarisFooter } from '@/components/company/SolarisFooter';

// ── Romanian counties ───────────────────────────────────────────────────────
const ALL_COUNTIES = [
  'Alba', 'Arad', 'Argeș', 'Bacău', 'Bihor', 'Bistrița-Năsăud', 'Botoșani', 'Brașov',
  'Brăila', 'Buzău', 'Caraș-Severin', 'Călărași', 'Cluj', 'Constanța', 'Covasna',
  'Dâmbovița', 'Dolj', 'Galați', 'Giurgiu', 'Gorj', 'Harghita', 'Hunedoara',
  'Ialomița', 'Iași', 'Ilfov', 'Maramureș', 'Mehedinți', 'Mureș', 'Neamț', 'Olt',
  'Prahova', 'Satu Mare', 'Sălaj', 'Sibiu', 'Suceava', 'Teleorman', 'Timiș',
  'Tulcea', 'Vaslui', 'Vâlcea', 'Vrancea', 'București',
] as const;

type RoofType = 'plan' | 'inclinat' | 'terasa';
type PropertyType = 'casa' | 'bloc' | 'firma';
type BatteryToggle = 'da' | 'nu';

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
  const [monthlyKwh, setMonthlyKwh] = useState(350);
  const [county, setCounty] = useState('Vaslui');
  const [roof, setRoof] = useState<RoofType>('inclinat');
  const [propertyType, setPropertyType] = useState<PropertyType>('casa');
  const [budget, setBudget] = useState(50000);
  const [battery, setBattery] = useState<BatteryToggle>('nu');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiExpanded, setAiExpanded] = useState(false);

  const model = useMemo(() => {
    const m = clamp(monthlyKwh, 100, 5000);
    const kw = Math.round((m / 120) * 10) / 10;
    const pricePerKw = battery === 'da' ? 11000 : 7500;
    const price = Math.round(kw * pricePerKw);
    const annualSavings = Math.round(kw * 120 * 0.9);
    const paybackYears = price / Math.max(1, annualSavings);
    const co2Kg = Math.round(kw * 120 * 0.35 * 12);
    const casaVerde = Math.min(kw * 7500, 20000);
    const treesEquivalent = Math.round(co2Kg / 21);
    const tenYearSavings = Math.round(annualSavings * 10 - price);
    const currentCost10y = Math.round(m * 12 * 0.9 * 10);
    const solarCost10y = Math.round(price + m * 12 * 0.9 * 10 * 0.3);
    const paybackPercent = Math.min(100, Math.round((paybackYears / 25) * 100));

    return {
      kw,
      price,
      annualSavings,
      paybackYears,
      co2Kg,
      casaVerde,
      treesEquivalent,
      tenYearSavings,
      currentCost10y,
      solarCost10y,
      paybackPercent,
    };
  }, [monthlyKwh, battery]);

  const handleAiExplain = useCallback(async () => {
    setAiLoading(true);
    setAiResponse(null);
    setAiExpanded(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `Bazat pe: consum ${monthlyKwh}kWh/lună, județ ${county}, tip proprietate ${propertyType === 'casa' ? 'casă' : propertyType === 'bloc' ? 'bloc' : 'firmă'}, sistem recomandat ${model.kw}kW, preț ${model.price}RON, recuperare ${model.paybackYears.toFixed(1)} ani. Explică în română simplu, max 200 cuvinte, de ce acest sistem e potrivit și care sunt pașii următori pentru clientul nostru.`,
            },
          ],
        }),
      });
      const data = await res.json();
      setAiResponse(data.content || 'Ne pare rău, nu am putut genera explicația.');
    } catch {
      setAiResponse('Momentan serviciul AI nu e disponibil. Încearcă mai târziu.');
    } finally {
      setAiLoading(false);
    }
  }, [monthlyKwh, county, propertyType, model]);

  const surveyUrl = useMemo(
    () =>
      `/survey?${new URLSearchParams({
        from: 'calculator',
        judet: county,
        consum: String(monthlyKwh),
        putere: String(model.kw),
      }).toString()}`,
    [monthlyKwh, county, model.kw],
  );

  const contactUrl = useMemo(() => {
    const params = new URLSearchParams({
      service: 'fotovoltaice',
      consum: String(monthlyKwh),
      judet: county,
      tip: propertyType,
      baterie: battery,
      putere: String(model.kw),
      pret: String(model.price),
    });
    return `/contact?${params.toString()}`;
  }, [monthlyKwh, county, propertyType, battery, model]);

  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-solaris-offblack text-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12" data-reveal>
          <h1 className="font-display font-bold bg-gradient-to-r from-solar-yellow to-amber-500 bg-clip-text text-transparent text-[length:var(--text-h1)] leading-[var(--lh-display)]">
            Calculator solar avansat
          </h1>
          <p className="mt-4 text-lg text-solaris-muted max-w-3xl mx-auto">
            Estimează rapid sistemul potrivit pentru tine. Rezultatele se actualizează în timp real.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* ── Inputs column ─────────────────────────────────────────────── */}
          <section className="lg:col-span-5 rounded-3xl border border-white/10 bg-black/40 p-7" data-reveal-stagger>
            <div className="text-sm font-black text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-amber-400" aria-hidden />
              Date de intrare
            </div>
            <div className="mt-5 space-y-6">
              {/* Consum lunar */}
              <div>
                <label htmlFor="consum-slider" className="flex items-center justify-between text-sm font-semibold text-white/70">
                  <span>Consum lunar (kWh)</span>
                  <span className="text-amber-400 font-bold">{monthlyKwh} kWh</span>
                </label>
                <input
                  id="consum-slider"
                  type="range"
                  min={100}
                  max={5000}
                  step={50}
                  value={monthlyKwh}
                  onChange={(e) => setMonthlyKwh(Number(e.target.value))}
                  className="mt-2 w-full accent-amber-400"
                />
                <div className="flex justify-between text-xs text-white/40 mt-1">
                  <span>100</span>
                  <span>5000</span>
                </div>
              </div>

              {/* Județ */}
              <div>
                <label htmlFor="county-select" className="flex items-center gap-2 text-sm font-semibold text-white/70">
                  <MapPin className="h-4 w-4 text-amber-400" aria-hidden />
                  Județ
                </label>
                <select
                  id="county-select"
                  value={county}
                  onChange={(e) => setCounty(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-amber-400"
                >
                  {ALL_COUNTIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tip acoperiș */}
              <div>
                <label htmlFor="roof-select" className="flex items-center gap-2 text-sm font-semibold text-white/70">
                  <Home className="h-4 w-4 text-amber-400" aria-hidden />
                  Tip acoperiș
                </label>
                <select
                  id="roof-select"
                  value={roof}
                  onChange={(e) => setRoof(e.target.value as RoofType)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-amber-400"
                >
                  <option value="plan">Plan</option>
                  <option value="inclinat">Înclinat</option>
                  <option value="terasa">Terasă</option>
                </select>
              </div>

              {/* Tip proprietate */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-white/70 mb-2">
                  <Building2 className="h-4 w-4 text-amber-400" aria-hidden />
                  Tip proprietate
                </label>
                <div className="flex gap-3">
                  {[
                    { value: 'casa' as const, label: 'Casă', icon: Home },
                    { value: 'bloc' as const, label: 'Bloc', icon: Building2 },
                    { value: 'firma' as const, label: 'Firmă', icon: Factory },
                  ].map((opt) => {
                    const Icon = opt.icon;
                    const selected = propertyType === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setPropertyType(opt.value)}
                        className={`flex-1 flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors ${
                          selected
                            ? 'border-amber-400 bg-amber-400/20 text-amber-300'
                            : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                        }`}
                      >
                        <Icon className="h-4 w-4" aria-hidden />
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Buget */}
              <div>
                <label htmlFor="budget-slider" className="flex items-center justify-between text-sm font-semibold text-white/70">
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-amber-400" aria-hidden />
                    Buget aproximativ
                  </span>
                  <span className="text-amber-400 font-bold">{formatRon(budget)}</span>
                </label>
                <input
                  id="budget-slider"
                  type="range"
                  min={5000}
                  max={200000}
                  step={1000}
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="mt-2 w-full accent-amber-400"
                />
                <div className="flex justify-between text-xs text-white/40 mt-1">
                  <span>5.000 RON</span>
                  <span>200.000 RON</span>
                </div>
              </div>

              {/* Baterie toggle */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-white/70 mb-2">
                  <Battery className="h-4 w-4 text-amber-400" aria-hidden />
                  Dorești baterie?
                </label>
                <div className="flex gap-3">
                  {(['nu', 'da'] as BatteryToggle[]).map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setBattery(val)}
                      className={`flex-1 rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors ${
                        battery === val
                          ? 'border-amber-400 bg-amber-400/20 text-amber-300'
                          : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      {val === 'da' ? 'Da' : 'Nu'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <a
                href={surveyUrl}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-500/15 px-6 py-3 text-sm font-bold text-emerald-100 hover:bg-emerald-500/25"
              >
                Raport șantier AI <ArrowRight className="h-4 w-4" aria-hidden />
              </a>
              <a
                href={contactUrl}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-amber-400 px-6 py-3 text-sm font-black text-black"
              >
                Cere ofertă cu aceste date <ArrowRight className="h-4 w-4" aria-hidden />
              </a>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-bold text-white hover:bg-white/10"
              >
                <Download className="h-4 w-4" aria-hidden />
                Descarcă
              </button>
            </div>
          </section>

          {/* ── Results column ────────────────────────────────────────────── */}
          <section className="lg:col-span-7 space-y-6">
            {/* Main result card */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-7" data-reveal-stagger>
              <div className="text-sm font-black text-white flex items-center gap-2">
                <Sun className="h-5 w-5 text-amber-400" aria-hidden />
                Rezultat
              </div>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-white/55">Sistem recomandat</div>
                  <div className="mt-1 text-lg font-black text-amber-400">{model.kw} kW</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-white/55">Preț estimat</div>
                  <div className="mt-1 text-lg font-black text-white">{formatRon(model.price)}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-white/55">Economie anuală</div>
                  <div className="mt-1 text-lg font-black text-emerald-400">{formatRon(model.annualSavings)}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-white/55">Recuperare</div>
                  <div className="mt-1 text-lg font-black text-white">{model.paybackYears.toFixed(1)} ani</div>
                </div>
              </div>

              {/* Payback progress bar */}
              <div className="mt-5">
                <div className="flex justify-between text-xs text-white/50 mb-1">
                  <span>Recuperare investiție</span>
                  <span>{model.paybackYears.toFixed(1)} / 25 ani</span>
                </div>
                <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all duration-300"
                    style={{ width: `${Math.min(100, model.paybackPercent)}%` }}
                  />
                </div>
              </div>

              {/* 10-year comparison bar chart */}
              <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/60 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-amber-400" aria-hidden />
                  Cost curent vs. Cu panouri (10 ani)
                </div>
                <div className="mt-4 flex items-end gap-4 h-24">
                  <div className="flex-1 flex flex-col items-center">
                    <div className="text-xs font-bold text-white/70 mb-1">{formatRon(model.currentCost10y)}</div>
                    <div
                      className="w-full rounded-t-lg bg-red-500/60 transition-all duration-300"
                      style={{ height: `${Math.min(100, (model.currentCost10y / Math.max(model.currentCost10y, model.solarCost10y)) * 100)}%` }}
                    />
                    <div className="text-[10px] text-white/50 mt-1">Fără panouri</div>
                  </div>
                  <div className="flex-1 flex flex-col items-center">
                    <div className="text-xs font-bold text-amber-400 mb-1">{formatRon(model.solarCost10y)}</div>
                    <div
                      className="w-full rounded-t-lg bg-amber-400/60 transition-all duration-300"
                      style={{ height: `${Math.min(100, (model.solarCost10y / Math.max(model.currentCost10y, model.solarCost10y)) * 100)}%` }}
                    />
                    <div className="text-[10px] text-white/50 mt-1">Cu panouri</div>
                  </div>
                </div>
              </div>

              {/* Badges */}
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4 flex items-center gap-3">
                  <Zap className="h-6 w-6 text-emerald-400" aria-hidden />
                  <div>
                    <div className="text-xs text-emerald-300">Economisești</div>
                    <div className="text-sm font-bold text-white">{formatRon(model.tenYearSavings)} în 10 ani</div>
                  </div>
                </div>
                <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4 flex items-center gap-3">
                  <TreePine className="h-6 w-6 text-emerald-400" aria-hidden />
                  <div>
                    <div className="text-xs text-emerald-300">CO₂ echivalent</div>
                    <div className="text-sm font-bold text-white">{model.treesEquivalent} copaci plantați/an</div>
                  </div>
                </div>
              </div>

              {/* Casa Verde */}
              <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 flex items-center gap-3">
                <Percent className="h-6 w-6 text-amber-400" aria-hidden />
                <div>
                  <div className="text-xs text-amber-300">Finanțare disponibilă</div>
                  <div className="text-sm font-bold text-white">Casa Verde: {formatRon(model.casaVerde)}</div>
                </div>
              </div>
            </div>

            {/* AI Explanation */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-7" data-reveal>
              <button
                type="button"
                onClick={() => {
                  if (!aiResponse && !aiLoading) {
                    handleAiExplain();
                  } else {
                    setAiExpanded(!aiExpanded);
                  }
                }}
                className="w-full flex items-center justify-between gap-2 text-sm font-black text-white"
              >
                <span className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-amber-400" aria-hidden />
                  {aiLoading ? 'Se generează explicația...' : aiResponse ? '🤖 Explicația AI' : '🤖 Explică-mi rezultatele (AI)'}
                </span>
                <span className="text-amber-400">{aiExpanded ? '▲' : '▼'}</span>
              </button>
              {aiLoading && (
                <div className="mt-4 flex items-center gap-2 text-sm text-white/60">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Se analizează datele...
                </div>
              )}
              {aiExpanded && aiResponse && (
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-relaxed text-white/80">
                  {aiResponse}
                </div>
              )}
              {aiResponse && (
                <div className="mt-4">
                  <a
                    href={contactUrl}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-400 px-6 py-3 text-sm font-black text-black"
                  >
                    Cere ofertă cu aceste date <ArrowRight className="h-4 w-4" aria-hidden />
                  </a>
                </div>
              )}
            </div>

            {/* Quick budget references */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-7" data-reveal-stagger>
              <div className="text-sm font-black text-white">Repere rapide de buget (2026)</div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  { title: '3–4 kW', body: 'Potrivit pentru consum mic / casă eficientă', price: 'aprox. 22.500–30.000 RON' },
                  { title: '5–6 kW', body: 'Cel mai comun pachet rezidențial', price: 'aprox. 37.500–45.000 RON' },
                  { title: '8–10 kW', body: 'Consum mare / pompă de căldură / extindere', price: 'aprox. 60.000–75.000 RON' },
                ].map((pack) => (
                  <div key={pack.title} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="text-sm font-bold text-white">{pack.title}</div>
                    <div className="mt-1 text-sm leading-relaxed text-slate-300">{pack.body}</div>
                    <div className="mt-3 text-sm font-semibold text-amber-300">{pack.price}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-xs leading-relaxed text-white/55">
                Intervalele sunt orientative și nu includ toate particularitățile din teren. Prețul final depinde de structură, trasee, protecții,
                acces, branduri și eventuale cerințe speciale.
              </div>
            </div>
          </section>
        </div>

        <div className="mt-16">
          <SolarisFooter />
        </div>
      </div>
    </main>
  );
}
