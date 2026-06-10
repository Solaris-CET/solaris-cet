import { ArrowRight, Battery, Pickaxe, PlugZap, Sun } from 'lucide-react';
import type { ComponentType } from 'react';
import { useMemo } from 'react';

import AppImage from '@/components/AppImage';

type Equipment = {
  title: string;
  description: string;
  icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  tag: string;
};

type BrandGroup = {
  label: string;
  items: string[];
};

type ShowcaseItem = {
  title: string;
  subtitle: string;
  img: string;
  alt: string;
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

function defaultBrandGroups(): BrandGroup[] {
  return [
    {
      label: 'Panouri fotovoltaice (criterii)',
      items: ['N-type TOPCon', 'Half-cut', 'All-black (opțional)', 'Bifacial (opțional)', 'Garanții producător'],
    },
    {
      label: 'Invertoare (criterii)',
      items: ['On-grid 1F / 3F', 'Hibrid (opțional)', 'Monitorizare online', 'Optimizare consum', 'Protecții integrate'],
    },
    {
      label: 'Baterii (criterii)',
      items: ['LiFePO4', 'Modularitate', 'Putere descărcare', 'Garanție', 'Integrare invertor'],
    },
    {
      label: 'Structură & prinderi',
      items: ['Șine aluminiu', 'Elemente inox', 'Etanșări corecte', 'Compatibilitate învelitoare', 'Protecție anticorozivă'],
    },
    {
      label: 'Protecții & tablouri',
      items: ['SPD DC/AC', 'Siguranțe corecte', 'Împământare', 'Etichetare', 'Documentație'],
    },
  ];
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
  const groups = useMemo(() => defaultBrandGroups(), []);
  const marqueeBrands = useMemo(() => {
    const picked = groups.flatMap((g) => g.items);
    const unique = Array.from(new Set(picked));
    return unique.slice(0, 14);
  }, [groups]);

  const showcase = useMemo<ShowcaseItem[]>(
    () => [
      {
        title: 'Panouri',
        subtitle: 'Montaj curat',
        img: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=realistic%20professional%20photo%20of%20a%20modern%20roof%20with%20black%20monocrystalline%20solar%20panels%20installed%2C%20clean%20cable%20management%2C%20golden%20hour%20light%2C%20high%20detail%2C%20no%20people%2C%20no%20logos%2C%20no%20text&image_size=landscape_16_9',
        alt: 'Panouri fotovoltaice monocristaline montate pe acoperiș',
      },
      {
        title: 'Invertor',
        subtitle: 'Monitorizare',
        img: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=realistic%20professional%20photo%20of%20a%20modern%20solar%20inverter%20installed%20on%20a%20utility%20room%20wall%2C%20neat%20cabling%2C%20breaker%20panel%20nearby%2C%20clean%20industrial%20look%2C%20high%20detail%2C%20no%20people%2C%20no%20logos%2C%20no%20text&image_size=landscape_16_9',
        alt: 'Invertor fotovoltaic montat într-o cameră tehnică, cu cablare ordonată',
      },
      {
        title: 'Baterie',
        subtitle: 'Autoconsum',
        img: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=realistic%20professional%20photo%20of%20a%20home%20energy%20storage%20battery%20unit%20installed%20in%20a%20garage%20or%20utility%20room%2C%20clean%20setup%2C%20premium%20look%2C%20high%20detail%2C%20no%20people%2C%20no%20logos%2C%20no%20text&image_size=landscape_16_9',
        alt: 'Sistem de stocare energie (baterie) instalat în spațiu tehnic',
      },
    ],
    [],
  );

  return (
    <section id="echipamente" className="relative overflow-hidden bg-slate-950 py-24">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-gradient-to-br from-amber-400/12 via-orange-500/6 to-transparent blur-3xl animate-hero-aurora" />
        <div className="absolute -bottom-44 right-[-80px] h-[520px] w-[520px] rounded-full bg-gradient-to-br from-sky-400/10 via-cyan-400/5 to-transparent blur-3xl animate-hero-aurora" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_30%,rgba(255,255,255,0.06),transparent_55%),radial-gradient(circle_at_72%_24%,rgba(242,201,76,0.08),transparent_52%),radial-gradient(circle_at_56%_78%,rgba(46,231,255,0.06),transparent_56%)]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8 xl:px-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between" data-reveal-stagger>
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

        <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12" data-reveal-stagger>
          <div className="lg:col-span-5" data-reveal-stagger>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-7 backdrop-blur">
              <div className="text-sm font-semibold uppercase tracking-wider text-white/80">Branduri / furnizori</div>
              <div className="mt-3 text-sm leading-relaxed text-slate-300">
                Afișăm criterii tehnice și standarde de echipare. Brandurile concrete se confirmă la ofertă, în funcție de
                disponibilitate, garanții și proiect.
              </div>

              {brands ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {brands.map((b) => (
                    <span
                      key={b}
                      className="inline-flex items-center rounded-full border border-white/10 bg-black/30 px-4 py-2 text-sm font-semibold text-white/85"
                    >
                      {b}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="mt-5 space-y-5">
                  {groups.map((g) => (
                    <div key={g.label}>
                      <div className="text-xs font-bold uppercase tracking-wider text-white/70">{g.label}</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {g.items.map((b) => (
                          <span
                            key={b}
                            className="inline-flex items-center rounded-full border border-white/10 bg-black/30 px-4 py-2 text-sm font-semibold text-white/85"
                          >
                            {b}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {!brands ? (
              <div className="mt-6 rounded-3xl border border-white/10 bg-black/25 p-7">
                <div className="text-sm font-semibold uppercase tracking-wider text-white/80">Specificații uzuale (vizual)</div>
                <div className="mt-4 solaris-marquee overflow-hidden">
                  <div className="solaris-marquee-track flex items-center gap-3 pr-6">
                    {[...marqueeBrands, ...marqueeBrands].map((b, idx) => (
                      <span
                        key={`${b}-${idx}`}
                        className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/85"
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3" data-reveal-stagger>
              {showcase.map((x) => (
                <div key={x.title} className="group relative overflow-hidden rounded-3xl border border-white/10 bg-black/20">
                  <div className="aspect-[16/10] w-full overflow-hidden">
                    <AppImage
                      src={x.img}
                      alt={x.alt}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                      width={1280}
                      height={800}
                      loading="lazy"
                    />
                  </div>
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/70 via-black/10 to-transparent" aria-hidden />
                  <div className="absolute left-4 top-4 rounded-2xl border border-white/10 bg-black/45 px-4 py-3 backdrop-blur">
                    <div className="text-sm font-bold text-white">{x.title}</div>
                    <div className="text-xs font-semibold text-white/70">{x.subtitle}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2" data-reveal-stagger>
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
