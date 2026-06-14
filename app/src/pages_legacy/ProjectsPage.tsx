import { useCallback, useEffect, useMemo, useState } from 'react';

import { SolarisFooter } from '@/components/company/SolarisFooter';
import SolarPanelAnimation from '@/components/animations/SolarPanelAnimation';
import RoofMetalAnimation from '@/components/animations/RoofMetalAnimation';

type ProjectCategory = 'fotovoltaic-rezidential' | 'fotovoltaic-industrial' | 'acoperis-tabla' | 'acoperis-tpo' | 'atice-fatade' | 'reparatii';
type ProjectFilter = 'toate' | 'fotovoltaic' | 'acoperis' | 'industrial' | 'mentenanta';

type ProjectSpecs = {
  panouri?: number;
  invertor?: string;
  baterie?: string;
  suprafata?: string;
  material?: string;
  durata?: string;
};

type ProjectItem = {
  id: number;
  title: string;
  category: ProjectCategory;
  location: string;
  year: number;
  power?: string;
  image: string;
  description: string;
  specs: ProjectSpecs;
};

const projects: ProjectItem[] = [
  {
    id: 1,
    title: "Sistem Fotovoltaic 5kW — Familie Vaslui",
    category: "fotovoltaic-rezidential",
    location: "Vaslui",
    year: 2024,
    power: "5kW",
    image: "/proiecte/fotovoltaic-rezidential.svg",
    description: "Sistem complet cu invertor hibrid și 12 panouri monocristaline 410W",
    specs: { panouri: 12, invertor: "Huawei SUN2000-5KTL", baterie: "Nu", suprafata: "24mp" }
  },
  {
    id: 2,
    title: "Sistem Fotovoltaic 10kW — Vila Iași",
    category: "fotovoltaic-rezidential",
    location: "Iași",
    year: 2024,
    power: "10kW",
    image: "/proiecte/fotovoltaic-rezidential.svg",
    description: "Sistem on-grid cu 24 panouri 420W, invertor trifazat și monitorizare",
    specs: { panouri: 24, invertor: "Solis 10K-5G", baterie: "Nu", suprafata: "48mp" }
  },
  {
    id: 3,
    title: "Sistem Fotovoltaic 50kW — Hală Bacău",
    category: "fotovoltaic-industrial",
    location: "Bacău",
    year: 2024,
    power: "50kW",
    image: "/proiecte/fotovoltaic-industrial.svg",
    description: "Sistem industrial trifazat pe acoperiș TPO, 100 panouri 500W",
    specs: { panouri: 100, invertor: "Huawei SUN2000-50KTL-M3", baterie: "Nu", suprafata: "200mp" }
  },
  {
    id: 4,
    title: "Sistem Fotovoltaic 30kW — Depozit Galați",
    category: "fotovoltaic-industrial",
    location: "Galați",
    year: 2023,
    power: "30kW",
    image: "/proiecte/fotovoltaic-industrial.svg",
    description: "Sistem trifazat cu 60 panouri 500W, montaj pe acoperiș tablă cutată",
    specs: { panouri: 60, invertor: "Growatt 30KTL3-X", baterie: "Nu", suprafata: "120mp" }
  },
  {
    id: 5,
    title: "Acoperiș Tablă Click — Casă Vaslui",
    category: "acoperis-tabla",
    location: "Vaslui",
    year: 2024,
    image: "/proiecte/acoperis-tabla.svg",
    description: "Montaj acoperiș tablă click 0.6mm, 200mp, sistem pluvial complet",
    specs: { material: "Tablă click 0.6mm", suprafata: "200mp", durata: "5 zile" }
  },
  {
    id: 6,
    title: "Acoperiș Țiglă Metalică — Vila Iași",
    category: "acoperis-tabla",
    location: "Iași",
    year: 2023,
    image: "/proiecte/acoperis-tabla.svg",
    description: "Montaj țiglă metalică 350mp, coame, dolii și sistem pluvial",
    specs: { material: "Țiglă metalică 0.5mm", suprafata: "350mp", durata: "7 zile" }
  },
  {
    id: 7,
    title: "Membrană TPO — Hală Industrială Bacău",
    category: "acoperis-tpo",
    location: "Bacău",
    year: 2024,
    image: "/proiecte/acoperis-tpo.svg",
    description: "Hidroizolație acoperiș plat 600mp cu membrană TPO 1.5mm, atice și scurgeri",
    specs: { material: "Membrană TPO 1.5mm", suprafata: "600mp", durata: "10 zile" }
  },
  {
    id: 8,
    title: "Membrană TPO — Depozit Galați",
    category: "acoperis-tpo",
    location: "Galați",
    year: 2023,
    image: "/proiecte/acoperis-tpo.svg",
    description: "Refacere membrană TPO 400mp, reparare atice și străpungeri",
    specs: { material: "Membrană TPO 1.2mm", suprafata: "400mp", durata: "6 zile" }
  },
  {
    id: 9,
    title: "Atice și Fațade Tablă — Clădire Birouri Vaslui",
    category: "atice-fatade",
    location: "Vaslui",
    year: 2024,
    image: "/proiecte/atice-fatade.svg",
    description: "Placare atice și fațade 300mp cu tablă cutată RAL 7016, termoizolație 10cm",
    specs: { material: "Tablă cutată RAL 7016", suprafata: "300mp", durata: "8 zile" }
  },
  {
    id: 10,
    title: "Fațadă Tablă — Hală Industrială Iași",
    category: "atice-fatade",
    location: "Iași",
    year: 2023,
    image: "/proiecte/atice-fatade.svg",
    description: "Placare fațadă 500mp cu tablă nervurată, prindere ascunsă",
    specs: { material: "Tablă nervurată RAL 9006", suprafata: "500mp", durata: "12 zile" }
  },
  {
    id: 11,
    title: "Reparații Acoperiș — Casă Vaslui",
    category: "reparatii",
    location: "Vaslui",
    year: 2025,
    image: "/proiecte/reparatii.svg",
    description: "Diagnostic și reparații infiltrații, înlocuire țiglă deteriorată, etanșări",
    specs: { material: "Țiglă ceramică", suprafata: "50mp", durata: "2 zile" }
  },
  {
    id: 12,
    title: "Mentenanță Sistem Fotovoltaic — Bârlad",
    category: "reparatii",
    location: "Bârlad",
    year: 2025,
    image: "/proiecte/reparatii.svg",
    description: "Curățare profesională panouri, verificare conexiuni, raport producție",
    specs: { panouri: 16, invertor: "Huawei SUN2000-5KTL", baterie: "Da", suprafata: "32mp" }
  },
];

const filterButtons: Array<{ value: ProjectFilter; label: string }> = [
  { value: 'toate', label: 'Toate' },
  { value: 'fotovoltaic', label: 'Fotovoltaic' },
  { value: 'acoperis', label: 'Acoperiș' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'mentenanta', label: 'Mentenanță' },
];

const categoryFilterMap: Record<ProjectFilter, ProjectCategory[]> = {
  toate: ['fotovoltaic-rezidential', 'fotovoltaic-industrial', 'acoperis-tabla', 'acoperis-tpo', 'atice-fatade', 'reparatii'],
  fotovoltaic: ['fotovoltaic-rezidential', 'fotovoltaic-industrial'],
  acoperis: ['acoperis-tabla', 'acoperis-tpo'],
  industrial: ['fotovoltaic-industrial', 'acoperis-tpo'],
  mentenanta: ['reparatii'],
};

const categoryLabels: Record<ProjectCategory, string> = {
  'fotovoltaic-rezidential': 'Fotovoltaic Rezidențial',
  'fotovoltaic-industrial': 'Fotovoltaic Industrial',
  'acoperis-tabla': 'Acoperiș Tablă',
  'acoperis-tpo': 'Acoperiș TPO',
  'atice-fatade': 'Atice/Fațade',
  'reparatii': 'Reparații',
};

export default function ProjectsPage() {
  const [filter, setFilter] = useState<ProjectFilter>('toate');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const visibleProjects = useMemo(
    () => projects.filter((p) => categoryFilterMap[filter].includes(p.category)),
    [filter],
  );

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index);
    document.body.style.overflow = 'hidden';
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null);
    document.body.style.overflow = '';
  }, []);

  const prevProject = useCallback(() => {
    setLightboxIndex((prev) => {
      if (prev === null) return null;
      return (prev - 1 + visibleProjects.length) % visibleProjects.length;
    });
  }, [visibleProjects.length]);

  const nextProject = useCallback(() => {
    setLightboxIndex((prev) => {
      if (prev === null) return null;
      return (prev + 1) % visibleProjects.length;
    });
  }, [visibleProjects.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') prevProject();
      if (e.key === 'ArrowRight') nextProject();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxIndex, closeLightbox, prevProject, nextProject]);

  const currentProject = lightboxIndex !== null ? visibleProjects[lightboxIndex] : null;

  return (
    <main id="main-content" tabIndex={-1} className="bg-slate-950 pt-24 pb-0 text-white">
      <section className="mx-auto max-w-7xl px-5 sm:px-8 xl:px-12" aria-labelledby="titlu-proiecte">
        <div className="max-w-3xl" data-reveal>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-300/85">Portofoliu Solaris CET</p>
          <h1 id="titlu-proiecte" className="mt-3 font-display text-[length:var(--text-h1)] font-bold leading-[var(--lh-display)] tracking-tight">
            Proiecte realizate
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-white/72">
            Lucrări executate de Solaris CET în Vaslui și Moldova. Pentru poze reale din proiecte similare cu ce cauți, scrie-ne pe WhatsApp.
          </p>
        </div>

        <div className="mt-10" role="group" aria-label="Filtrează după categorie" id="filtre" data-reveal>
          <div className="flex flex-wrap gap-3">
            {filterButtons.map((button) => {
              const isActive = button.value === filter;
              return (
                <button
                  key={button.value}
                  type="button"
                  data-filtru={button.value}
                  aria-pressed={isActive}
                  onClick={() => setFilter(button.value)}
                  className={`rounded-full border px-4 py-2 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60 ${
                    isActive
                      ? 'border-amber-400 bg-amber-400 text-black'
                      : 'border-white/10 bg-white/5 text-white/75 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {button.label}
                </button>
              );
            })}
          </div>
        </div>

        <div id="grid-proiecte" className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" data-reveal-stagger>
          {visibleProjects.map((project, idx) => (
            <article
              key={project.id}
              data-categorie={project.category}
              className="group rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_20px_70px_rgba(0,0,0,0.28)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_20px_70px_rgba(245,158,11,0.15)] cursor-pointer"
              onClick={() => openLightbox(idx)}
            >
              <div className="aspect-video rounded-2xl bg-gradient-to-br from-amber-400/20 to-orange-500/20 flex items-center justify-center overflow-hidden">
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                  loading="lazy"
                />
              </div>
              <div className="mt-4 flex items-center justify-between gap-2">
                <span className="rounded-full border border-orange-400/25 bg-orange-400/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-orange-200">
                  {categoryLabels[project.category]}
                </span>
                <time dateTime={String(project.year)} className="text-xs font-medium text-white/60">
                  {project.year}
                </time>
              </div>
              <h2 className="mt-3 text-lg font-bold leading-tight text-white">{project.title}</h2>
              <p className="mt-1 text-sm text-white/60">{project.location}</p>
              <p className="mt-2 text-sm leading-relaxed text-white/70 line-clamp-2">{project.description}</p>
              <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="inline-flex items-center gap-1 rounded-xl bg-amber-400 px-4 py-2 text-xs font-black text-black">
                  Vezi detalii →
                </span>
              </div>
            </article>
          ))}
        </div>

        {/* CTA */}
        <section className="mt-16 rounded-[2rem] border border-white/10 bg-gradient-to-br from-amber-500/10 via-white/5 to-white/0 p-8" aria-labelledby="cta-proiecte" data-reveal>
          <div className="max-w-3xl">
            <h2 id="cta-proiecte" className="text-2xl font-bold text-white md:text-3xl">
              Vrei un proiect similar?
            </h2>
            <p className="mt-4 text-base leading-relaxed text-white/72">
              Completează formularul și revenim cu o ofertă personalizată în maxim 24 de ore.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="/contact"
                className="inline-flex items-center justify-center rounded-2xl bg-amber-400 px-6 py-3 text-sm font-black text-black"
              >
                Cere ofertă gratuită →
              </a>
              <a
                href="https://wa.me/40769889721?text=Buna%20ziua%2C%20vreau%20sa%20vad%20poze%20din%20proiectele%20voastre"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
              >
                Cere poze pe WhatsApp
              </a>
            </div>
          </div>
        </section>
      </section>

      {/* Lightbox */}
      {lightboxIndex !== null && currentProject && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={closeLightbox}
        >
          <div
            className="relative max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-slate-950 p-6 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white hover:bg-white/10"
              aria-label="Închide"
            >
              ✕
            </button>

            <div className="aspect-video rounded-2xl bg-gradient-to-br from-amber-400/20 to-orange-500/20 flex items-center justify-center overflow-hidden mb-6">
              {currentProject.category === 'fotovoltaic-rezidential' || currentProject.category === 'fotovoltaic-industrial' ? (
                <SolarPanelAnimation />
              ) : currentProject.category === 'acoperis-tabla' || currentProject.category === 'acoperis-tpo' ? (
                <RoofMetalAnimation />
              ) : (
                <img
                  src={currentProject.image}
                  alt={currentProject.title}
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            <h2 className="text-2xl font-bold text-white">{currentProject.title}</h2>
            <p className="mt-2 text-sm text-white/60">{currentProject.location} · {currentProject.year}</p>
            <p className="mt-4 text-base leading-relaxed text-white/80">{currentProject.description}</p>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="text-sm font-bold text-white mb-3">Specificații tehnice</div>
              <table className="w-full text-sm text-white/80">
                <tbody>
                  {currentProject.specs.panouri !== undefined && (
                    <tr className="border-b border-white/10">
                      <td className="py-2 font-semibold text-white/60">Panouri</td>
                      <td className="py-2 text-right">{currentProject.specs.panouri} buc</td>
                    </tr>
                  )}
                  {currentProject.specs.invertor && (
                    <tr className="border-b border-white/10">
                      <td className="py-2 font-semibold text-white/60">Invertor</td>
                      <td className="py-2 text-right">{currentProject.specs.invertor}</td>
                    </tr>
                  )}
                  {currentProject.specs.baterie !== undefined && (
                    <tr className="border-b border-white/10">
                      <td className="py-2 font-semibold text-white/60">Baterie</td>
                      <td className="py-2 text-right">{currentProject.specs.baterie}</td>
                    </tr>
                  )}
                  {currentProject.specs.suprafata && (
                    <tr className="border-b border-white/10">
                      <td className="py-2 font-semibold text-white/60">Suprafață</td>
                      <td className="py-2 text-right">{currentProject.specs.suprafata}</td>
                    </tr>
                  )}
                  {currentProject.specs.material && (
                    <tr className="border-b border-white/10">
                      <td className="py-2 font-semibold text-white/60">Material</td>
                      <td className="py-2 text-right">{currentProject.specs.material}</td>
                    </tr>
                  )}
                  {currentProject.specs.durata && (
                    <tr>
                      <td className="py-2 font-semibold text-white/60">Durată execuție</td>
                      <td className="py-2 text-right">{currentProject.specs.durata}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                onClick={prevProject}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
              >
                ← Anterior
              </button>
              <span className="text-xs text-white/50">
                {lightboxIndex + 1} / {visibleProjects.length}
              </span>
              <button
                onClick={nextProject}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
              >
                Următor →
              </button>
            </div>

            <div className="mt-6">
              <a
                href={`/contact?ref=${currentProject.id}`}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-amber-400 px-6 py-3 text-sm font-black text-black"
              >
                Vreau un proiect similar
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="mt-16">
        <SolarisFooter />
      </div>
    </main>
  );
}
