import { ArrowRight, Battery, Pickaxe, PlugZap, Sun } from 'lucide-react';
import type { ComponentType } from 'react';
import { useMemo } from 'react';

type Equipment = {
  title: string;
  description: string;
  icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  tag: string;
};

function parseBrandsEnv(): string[] | null {
  const raw = (import.meta.env.VITE_EQUIPMENT_BRANDS_JSON as string | undefined)?.trim();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const items = parsed.map((x) => (typeof x === 'string' ? x.trim() : '')).filter(Boolean);
    return items.length ? items : null;
  } catch {
    return null;
  }
}

export default function EquipmentPartnersSection() {
  const equipment = useMemo<Equipment[]>(
    () => [
      {
        title: 'Panouri fotovoltaice',
        description: 'Selectate pe randament, garanții și compatibilitate cu acoperișul.',
        icon: Sun,
        tag: 'Tier-1 / premium',
      },
      {
        title: 'Invertoare & optimizare',
        description: 'On-grid sau hibrid, cu monitorizare și prioritizare consum.',
        icon: PlugZap,
        tag: 'Monitorizare',
      },
      {
        title: 'Baterii (opțional)',
        description: 'Pentru autoconsum mai mare și flexibilitate, în funcție de proiect.',
        icon: Battery,
        tag: 'LiFePO4',
      },
      {
        title: 'Structură, protecții, execuție',
        description: 'Prinderi corecte + protecții electrice + detalii curate la învelitoare.',
        icon: Pickaxe,
        tag: 'Montaj curat',
      },
    ],
    [],
  );

  const brands = useMemo(() => parseBrandsEnv(), []);

  return (
    <section id="echipamente" className="relative overflow-hidden bg-slate-950 py-24">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-gradient-to-br from-amber-400/12 via-orange-500/6 to-transparent blur-3xl animate-hero-aurora" />
        <div className="absolute -bottom-44 right-[-80px] h-[520px] w-[520px] rounded-full bg-gradient-to-br from-sky-400/10 via-cyan-400/5 to-transparent blur-3xl animate-hero-aurora" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_30%,rgba(255,255,255,0.06),transparent_55%),radial-gradient(circle_at_72%_24%,rgba(242,201,76,0.08),transparent_52%),radial-gradient(circle_at_56%_78%,rgba(46,231,255,0.06),transparent_56%)]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8 xl:px-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold text-white md:text-5xl">Echipamente & parteneri</h2>
            <p className="mt-5 text-lg leading-relaxed text-slate-300">
              Îți propunem configurații clare (panouri, invertor, protecții, structură), apoi alegem echiparea finală în
              funcție de stoc, garanții și proiect.
            </p>
          </div>
          <a
            href="/contact?service=fotovoltaice"
            className="inline-flex items-center gap-2 font-bold text-amber-400 hover:underline"
          >
            Cere ofertă <ArrowRight size={16} aria-hidden />
          </a>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-7 backdrop-blur">
              <div className="text-sm font-semibold uppercase tracking-wider text-white/80">Branduri / furnizori</div>
              <div className="mt-3 text-sm leading-relaxed text-slate-300">
                Listă configurabilă (îți pot pune exact brandurile cu care lucrezi). Dacă nu e setată încă, afișăm categorii
                generice.
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {(brands ?? [
                  'Panouri fotovoltaice (Tier-1)',
                  'Invertoare on-grid / hibrid',
                  'Baterii (opțional)',
                  'Structură & accesorii',
                ]).map((b) => (
                  <span
                    key={b}
                    className="inline-flex items-center rounded-full border border-white/10 bg-black/30 px-4 py-2 text-sm font-semibold text-white/85"
                  >
                    {b}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-white/10 bg-black/25 p-7">
              <div className="text-sm font-semibold uppercase tracking-wider text-white/80">Ce primești</div>
              <ul className="mt-4 space-y-2 text-sm text-slate-300">
                {[
                  'Dimensionare pe consum + orientare + umbriri',
                  'Montaj ordonat (cablu, trasee, protecții)',
                  'Monitorizare și optimizări după punerea în funcțiune',
                ].map((x) => (
                  <li key={x} className="flex items-start gap-2">
                    <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-amber-400/90" aria-hidden />
                    <span>{x}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {equipment.map((e) => {
                const Icon = e.icon;
                return (
                  <div
                    key={e.title}
                    className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-7 backdrop-blur transition-transform hover:-translate-y-0.5"
                  >
                    <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" aria-hidden>
                      <div className="absolute -inset-16 bg-[conic-gradient(from_180deg_at_50%_50%,rgba(242,201,76,0.22),rgba(46,231,255,0.12),rgba(242,201,76,0.22))] blur-3xl animate-hero-conic-drift" />
                      <div className="absolute inset-0 bg-gradient-to-tr from-black/55 via-transparent to-transparent" />
                    </div>

                    <div className="relative flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold uppercase tracking-widest text-amber-400">{e.tag}</div>
                        <h3 className="mt-2 text-xl font-bold text-white">{e.title}</h3>
                        <p className="mt-3 text-sm leading-relaxed text-slate-300">{e.description}</p>
                      </div>
                      <span className="shrink-0 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/30">
                        <Icon className="h-5 w-5 text-amber-400" aria-hidden />
                      </span>
                    </div>

                    <div className="relative mt-5 h-2 w-full overflow-hidden rounded-full bg-white/10" aria-hidden>
                      <div className="h-full w-[55%] rounded-full bg-gradient-to-r from-amber-400/70 via-orange-400/60 to-transparent animate-shimmer" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
