import { ArrowRight } from 'lucide-react';
import { type ReactNode, useMemo } from 'react';

function IconFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#1e293b] bg-black/10 transition-colors duration-300 group-hover:border-amber-400/60 group-hover:bg-white/5">
      {children}
    </div>
  );
}

function SvgIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      className="text-slate-200 transition-colors duration-300 group-hover:text-amber-400"
    >
      <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </g>
    </svg>
  );
}

function IconHouseSolar() {
  return (
    <SvgIcon>
      <path d="M7 20.5L22 9l15 11.5" />
      <path d="M11 19.5V33h22V19.5" />
      <path d="M14 26h9" />
      <path d="M14 29h9" />
      <path d="M25.5 24.5h10v7h-10z" />
      <path d="M25.5 27.5h10" />
      <path d="M30.5 24.5v7" />
      <path d="M11 33h22" />
    </SvgIcon>
  );
}

function IconIndustrialSolar() {
  return (
    <SvgIcon>
      <path d="M8 33h28" />
      <path d="M10 33V20l7-6 6 5 5-4 8 6v12" />
      <path d="M12.5 23.5h10.5" />
      <path d="M12.5 26.5h10.5" />
      <path d="M25.5 24.5h10v7h-10z" />
      <path d="M25.5 27.5h10" />
      <path d="M30.5 24.5v7" />
    </SvgIcon>
  );
}

function IconRoofSlope() {
  return (
    <SvgIcon>
      <path d="M8 28l14-12 14 12" />
      <path d="M10.5 28h23" />
      <path d="M14 22.5l8-7 8 7" />
      <path d="M17 28v-4.5" />
      <path d="M22 28v-7" />
      <path d="M27 28v-3" />
    </SvgIcon>
  );
}

function IconFlatTpo() {
  return (
    <SvgIcon>
      <path d="M9 31h26" />
      <path d="M12 31V20h20v11" />
      <path d="M12 20l6-4h8l6 4" />
      <path d="M15 24h14" />
      <path d="M15 27h14" />
      <path d="M18 14h8" />
      <path d="M22 12v4" />
    </SvgIcon>
  );
}

function IconFacade() {
  return (
    <SvgIcon>
      <path d="M10 33h24" />
      <path d="M12 33V12h20v21" />
      <path d="M16 16v13" />
      <path d="M20 16v13" />
      <path d="M24 16v13" />
      <path d="M28 16v13" />
      <path d="M12 12h20" />
    </SvgIcon>
  );
}

function IconRepair() {
  return (
    <SvgIcon>
      <path d="M9 27l13-11 13 11" />
      <path d="M12 27h20" />
      <path d="M14.5 31.5l6-6" />
      <path d="M22.5 33.5l-6-6" />
      <path d="M26.5 30.5l6-6" />
      <path d="M30.5 24.5l-2 2" />
      <path d="M31.5 23.5l1 1" />
    </SvgIcon>
  );
}

export default function ServicesSection() {
  const services = useMemo(
    () => [
      {
        title: 'Fotovoltaice Rezidențiale',
        id: 'fotovoltaice-rezidentiale',
        icon: <IconHouseSolar />,
        description: 'Sisteme dimensionate pe consum, orientare și umbriri, cu monitorizare și suport post-instalare.',
        href: '/servicii/fotovoltaice-rezidentiale',
      },
      {
        title: 'Fotovoltaice Industriale',
        id: 'fotovoltaice-industriale',
        icon: <IconIndustrialSolar />,
        description: 'Proiectare și execuție pentru hale și spații comerciale, cu focus pe eficiență și siguranță.',
        href: '/servicii/fotovoltaice-industriale',
      },
      {
        title: 'Acoperișuri Tablă/Țiglă',
        id: 'acoperisuri-tabla-tigla',
        icon: <IconRoofSlope />,
        description: 'Montaj, reparații și înlocuiri cu detalii curate, etanșări corecte și accesorii complete.',
        href: '/servicii/acoperisuri-tabla-tigla',
      },
      {
        title: 'Acoperișuri Industriale TPO',
        id: 'acoperisuri-tpo',
        icon: <IconFlatTpo />,
        description: 'Montaj și reparații membrane TPO pentru clădiri industriale, atice și străpungeri fără compromis.',
        href: '/servicii/acoperisuri-industriale-tpo',
      },
      {
        title: 'Atice și Fațade Tablă',
        id: 'atice-fatade-tabla',
        icon: <IconFacade />,
        description: 'Placări moderne, muchii precise și soluții durabile pentru atice, fațade și elemente de anvelopă.',
        href: '/servicii/atice-si-fatade-tabla',
      },
      {
        title: 'Reparații și Mentenanță',
        id: 'reparatii-mentenanta',
        icon: <IconRepair />,
        description: 'Diagnostic rapid, intervenții punctuale și mentenanță preventivă pentru acoperișuri și fotovoltaice.',
        href: '/servicii/reparatii-si-mentenanta',
      },
    ],
    []
  );

  return (
    <section id="servicii" className="relative overflow-hidden bg-[#05060B] py-28">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] opacity-70"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse 80% 100% at 50% 0%, rgba(245,158,11,0.10) 0%, rgba(245,158,11,0) 65%)',
        }}
      />
      <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-8 xl:px-12">
        <div className="mx-auto mb-16 max-w-2xl text-center" data-reveal>
          <div className="solaris-eyebrow justify-center" style={{ justifyContent: 'center' }}>
            Servicii
          </div>
          <h2 className="solaris-headline mt-4 text-white" style={{ fontSize: 'clamp(2rem, 4.4vw, 3.5rem)' }}>
            Soluții <em>complete</em> pentru energie<br className="hidden sm:inline" /> și construcții.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
            Șase tipuri de lucrări într-un singur flux — proiectare, execuție și suport, sub același standard.
          </p>
          <div className="mx-auto mt-7 h-px w-32 solaris-rule" aria-hidden />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3" data-reveal-stagger>
          {services.map((service, idx) => (
            <a
              key={service.id}
              href={service.href}
              className="solaris-card-gold group relative overflow-hidden rounded-3xl border border-[#1e293b] bg-[#0a0e17] p-7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70"
            >
              <div
                className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-amber-400/0 blur-2xl transition-all duration-500 group-hover:bg-amber-400/25"
                aria-hidden
              />
              <div className="relative flex items-start justify-between">
                <IconFrame>{service.icon}</IconFrame>
                <span className="text-[10px] font-extrabold tracking-[0.22em] text-white/30 tabular-nums">
                  {String(idx + 1).padStart(2, '0')}
                </span>
              </div>
              <h3 className="relative mt-6 text-xl font-bold tracking-tight text-white transition-colors duration-300 group-hover:text-amber-50">
                {service.title}
              </h3>
              <p className="relative mt-3 text-sm leading-relaxed text-slate-400 transition-colors duration-300 group-hover:text-slate-300">
                {service.description}
              </p>
              <div className="relative mt-6 inline-flex items-center gap-2 text-sm font-semibold text-amber-300 transition-all duration-300 group-hover:gap-3 motion-reduce:gap-2">
                Află mai mult
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transform-none" aria-hidden />
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
