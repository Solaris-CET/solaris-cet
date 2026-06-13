import { useMemo, useState } from 'react';

import { SolarisFooter } from '@/components/company/SolarisFooter';

type ProjectCategory = 'fotovoltaic' | 'acoperis' | 'fatada' | 'mentenanta';
type ProjectFilter = 'toate' | ProjectCategory;

type ProjectItem = {
  id: string;
  titlu: string;
  categorie: ProjectCategory;
  locatie: string;
  an: number;
  descriere: string;
  detalii: string[];
};

const proiecte: ProjectItem[] = [
  {
    id: 'fv-rezidential-vaslui-2024',
    titlu: 'Sistem fotovoltaic 8 kWp - Casa familiala',
    categorie: 'fotovoltaic',
    locatie: 'Vaslui, jud. Vaslui',
    an: 2024,
    descriere:
      'Sistem on-grid 8 kWp cu 16 panouri monocristaline 500W, invertor monofazat, montaj acoperis orientat sud. Productie estimata 9.200 kWh/an.',
    detalii: ['16 panouri 500W monocristalin', 'Invertor monofazat 8 kW', 'Montaj acoperis tabla', 'Punere in functiune + instruire'],
  },
  {
    id: 'fv-industrial-barlad-2024',
    titlu: 'Sistem fotovoltaic 50 kWp - Hala productie',
    categorie: 'fotovoltaic',
    locatie: 'Barlad, jud. Vaslui',
    an: 2024,
    descriere:
      'Sistem trifazat 50 kWp pe hala industriala. Invertor central trifazat, monitorizare online, executie in 5 zile fara oprirea productiei.',
    detalii: ['100 panouri 500W', 'Invertor trifazat 50 kW', 'Montaj acoperis tabla cutata', 'Monitorizare online inclusa'],
  },
  {
    id: 'acoperis-click-hala-2024',
    titlu: 'Acoperis tabla click - Hala depozitare',
    categorie: 'acoperis',
    locatie: 'Barlad, jud. Vaslui',
    an: 2024,
    descriere:
      'Montaj acoperis tabla click 0.6mm, 800 mp, sistem complet jgheaburi si burlane. Executie 8 zile lucratoare.',
    detalii: [
      '800 mp tabla click 0.6mm',
      'Jgheaburi si burlane complete',
      'Coame si dolii etanse',
      'Garantie 10 ani etanseitate executie',
    ],
  },
  {
    id: 'tpo-depozit-iasi-2023',
    titlu: 'Membrana TPO - Depozit logistic',
    categorie: 'acoperis',
    locatie: 'Iasi, jud. Iasi',
    an: 2023,
    descriere:
      'Hidroizolatie acoperis plat cu membrana TPO 1.5mm, 600 mp. Sistem complet cu atice, scurgeri si strapungeri instalatii.',
    detalii: ['600 mp membrana TPO 1.5mm', 'Atice tabla complete', 'Scurgeri pluviale', 'Garantie 15 ani'],
  },
  {
    id: 'fatada-birouri-vaslui-2024',
    titlu: 'Fatada tabla cutata - Cladire birouri',
    categorie: 'fatada',
    locatie: 'Vaslui, jud. Vaslui',
    an: 2024,
    descriere:
      'Reabilitare fatada 300 mp cu tabla cutata RAL 7016 antracit, termoizolatie 10cm inclusa in sistem.',
    detalii: ['300 mp tabla cutata', 'Termoizolatie 10cm', 'RAL 7016 antracit', 'Sisteme prindere ascunsa'],
  },
  {
    id: 'mentenanta-fv-negresti-2025',
    titlu: 'Mentenanta sistem fotovoltaic',
    categorie: 'mentenanta',
    locatie: 'Negresti, jud. Vaslui',
    an: 2025,
    descriere:
      'Inspectie, curatare profesionala panouri, identificare si inlocuire 2 module cu randament scazut. Productie recuperata +18%.',
    detalii: [
      'Inspectie vizuala completa',
      'Curatare profesionala panouri',
      'Raport productie inainte/dupa',
      'Plan mentenanta anuala',
    ],
  },
];

const filterButtons: Array<{ value: ProjectFilter; label: string }> = [
  { value: 'toate', label: 'Toate' },
  { value: 'fotovoltaic', label: 'Fotovoltaice' },
  { value: 'acoperis', label: 'Acoperisuri' },
  { value: 'fatada', label: 'Fatade' },
  { value: 'mentenanta', label: 'Mentenanta' },
];

const categoryLabels: Record<ProjectCategory, string> = {
  fotovoltaic: 'Fotovoltaic',
  acoperis: 'Acoperis',
  fatada: 'Fatada',
  mentenanta: 'Mentenanta',
};

export default function ProjectsPage() {
  const [filter, setFilter] = useState<ProjectFilter>('toate');
  const visibleProjects = useMemo(
    () => (filter === 'toate' ? proiecte : proiecte.filter((project) => project.categorie === filter)),
    [filter],
  );

  return (
    <main id="main-content" tabIndex={-1} className="bg-slate-950 pt-24 pb-0 text-white">
      <section className="mx-auto max-w-7xl px-5 sm:px-8 xl:px-12" aria-labelledby="titlu-proiecte">
        <div className="max-w-3xl" data-reveal>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-300/85">Portofoliu Solaris CET</p>
          <h1 id="titlu-proiecte" className="mt-3 font-display text-[length:var(--text-h1)] font-bold leading-[var(--lh-display)] tracking-tight">
            Proiecte realizate
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-white/72">
            Lucrari executate de Solaris CET in Vaslui si Moldova. Pentru poze reale din proiecte similare cu ce cauti, scrie-ne pe WhatsApp.
          </p>
        </div>

        <div className="mt-10" role="group" aria-label="Filtreaza dupa categorie" id="filtre" data-reveal>
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
                  className={[
                    'rounded-full border px-4 py-2 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60',
                    isActive ? 'border-orange-400/70 bg-orange-400/10 text-white' : 'border-white/10 bg-white/5 text-white/75 hover:bg-white/10 hover:text-white',
                  ].join(' ')}
                >
                  {button.label}
                </button>
              );
            })}
          </div>
        </div>

        <div id="grid-proiecte" className="mt-10 grid gap-6 lg:grid-cols-2" data-reveal-stagger>
          {visibleProjects.map((project) => (
            <article
              key={project.id}
              data-categorie={project.categorie}
              id={project.id}
              className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_70px_rgba(0,0,0,0.28)]"
            >
              <header className="flex items-center justify-between gap-4">
                <span className="rounded-full border border-orange-400/25 bg-orange-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-orange-200">
                  {categoryLabels[project.categorie]}
                </span>
                <time dateTime={String(project.an)} className="text-sm font-medium text-white/60">
                  {project.an}
                </time>
              </header>

              <h2 className="mt-5 text-2xl font-bold leading-tight text-white">{project.titlu}</h2>
              <p className="mt-3 text-sm font-medium text-white/60">Locatie: {project.locatie}</p>
              <p className="mt-4 text-base leading-relaxed text-white/75">{project.descriere}</p>

              <ul className="mt-5 space-y-3 text-sm text-white/80">
                {project.detalii.map((detail) => (
                  <li key={detail} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                    {detail}
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href={`/contact?ref=${project.id}`}
                  className="inline-flex items-center justify-center rounded-2xl bg-amber-400 px-5 py-3 text-sm font-black text-black"
                >
                  Vreau ceva similar
                </a>
                <a
                  href={`https://wa.me/40769889721?text=${encodeURIComponent(`Buna ziua, vreau sa vad poze din proiectele voastre similare cu ${project.titlu}.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
                >
                  Cere poze pe WhatsApp
                </a>
              </div>
            </article>
          ))}
        </div>

        <section className="mt-16 rounded-[2rem] border border-white/10 bg-gradient-to-br from-orange-500/10 via-white/5 to-white/0 p-8" aria-labelledby="cta-proiecte" data-reveal>
          <div className="max-w-3xl">
            <h2 id="cta-proiecte" className="text-2xl font-bold text-white md:text-3xl">
              Vrei poze din lucrarile noastre?
            </h2>
            <p className="mt-4 text-base leading-relaxed text-white/72">
              Trimite-ne un mesaj pe WhatsApp si iti trimitem albumul foto al proiectelor similare cu ce cauti.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="https://wa.me/40769889721?text=Buna%20ziua%2C%20vreau%20sa%20vad%20poze%20din%20proiectele%20voastre"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-2xl bg-amber-400 px-6 py-3 text-sm font-black text-black"
              >
                Cere poze pe WhatsApp
              </a>
              <a
                href="/contact"
                className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
              >
                Solicita oferta gratuita
              </a>
            </div>
          </div>
        </section>
      </section>

      <div className="mt-16">
        <SolarisFooter />
      </div>
    </main>
  );
}
