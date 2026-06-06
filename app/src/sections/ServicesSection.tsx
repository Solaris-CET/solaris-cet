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
    <section id="servicii" className="py-24 relative overflow-hidden bg-[#05060B]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 xl:px-12 relative z-10">
        <div className="text-center mb-16" data-reveal>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Serviciile noastre</h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">Soluții complete pentru energie și construcții</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-reveal-stagger>
          {services.map((service) => (
            <a
              key={service.id}
              href={service.href}
              className="group rounded-3xl border border-[#1e293b] bg-[#0d1117] p-7 transition-all duration-300 hover:scale-[1.02] hover:border-amber-400 hover:bg-[#101826] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 motion-reduce:transform-none"
            >
              <IconFrame>{service.icon}</IconFrame>
              <h3 className="mt-5 text-xl font-medium text-white">{service.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">{service.description}</p>
              <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-amber-300 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1 motion-reduce:opacity-100 motion-reduce:translate-x-0">
                Află mai mult
                <ArrowRight className="h-4 w-4" aria-hidden />
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
