import { Mail, MapPin } from 'lucide-react';
import { useMemo } from 'react';

import { SafeEmailLink } from '@/components/SafeEmailLink';

const SERVICE_OPTIONS = [
  { value: 'fotovoltaic-rezidential', label: 'Fotovoltaice rezidențiale (casă)' },
  { value: 'fotovoltaic-industrial', label: 'Fotovoltaice industriale/comerciale' },
  { value: 'acoperis-tabla', label: 'Acoperiș tablă / țiglă metalică' },
  { value: 'acoperis-tpo', label: 'Acoperiș industrial folie TPO' },
  { value: 'atice-fatade', label: 'Atice și fațade tablă' },
  { value: 'reparatii', label: 'Reparații și mentenanță' },
] as const;

const COUNTY_OPTIONS = ['Vaslui', 'Iași', 'Bacău', 'Galați', 'Vrancea', 'Neamț', 'Botoșani', 'Suceava', 'Alt județ'] as const;

const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit';
const LEAD_ENDPOINT = '/api/lead';
const THANK_YOU_URL = 'https://solaris-cet.com/multumim/';

function mapInitialService(value: string) {
  const normalized = value.trim();
  if (!normalized) return '';
  if (normalized === 'fotovoltaice') return 'fotovoltaic-rezidential';
  if (normalized === 'acoperisuri') return 'acoperis-tabla';
  if (normalized === 'tpo') return 'acoperis-tpo';
  if (normalized === 'atice-si-fatade-tabla') return 'atice-fatade';
  if (normalized === 'atice-fatade') return 'atice-fatade';
  if (normalized === 'reparatii-si-mentenanta') return 'reparatii';
  return SERVICE_OPTIONS.some((option) => option.value === normalized) ? normalized : '';
}

export default function ContactPage() {
  const accessKey = String(import.meta.env.VITE_WEB3FORMS_KEY ?? '').trim();
  const useInternalEndpoint = accessKey.length === 0;
  const formEndpoint = useInternalEndpoint ? LEAD_ENDPOINT : WEB3FORMS_ENDPOINT;
  const initialService = useMemo(() => {
    if (typeof window === 'undefined') return '';
    try {
      const url = new URL(window.location.href);
      return mapInitialService(url.searchParams.get('service') ?? '');
    } catch {
      return '';
    }
  }, []);

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="min-h-screen bg-solaris-offblack px-4 pb-12 pt-24 text-white sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center" data-reveal>
          <h1 className="font-display text-[length:var(--text-h1)] font-bold leading-[var(--lh-display)] text-transparent bg-gradient-to-r from-solar-yellow to-amber-500 bg-clip-text">
            Contact Solaris CET
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-xl text-solaris-muted">
            Spune-ne ce vrei să construiești. Formularul de mai jos funcționează direct în browser, inclusiv fără JavaScript.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
          <section
            className="space-y-8 rounded-3xl border border-white/10 bg-black/40 p-8 backdrop-blur-sm"
            data-reveal-stagger
            aria-labelledby="contact-details-title"
          >
            <div>
              <h2 id="contact-details-title" className="mb-3 text-2xl font-semibold">
                Informații de contact
              </h2>
              <p className="text-solaris-muted">
                Pentru urgențe ne poți suna direct. Pentru ofertă completă, folosește formularul și revino imediat după trimitere în pagina de confirmare.
              </p>
            </div>

            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-solar-yellow/20 p-3 text-solar-yellow">
                <span className="text-lg font-bold" aria-hidden>
                  ☎
                </span>
              </div>
              <div>
                <p className="text-sm text-solaris-muted">Telefon</p>
                <a href="tel:+40769889721" className="text-lg font-medium transition-colors hover:text-solar-yellow">
                  +40 769 889 721
                </a>
                <div className="mt-1">
                  <a
                    href="https://wa.me/40769889721?text=Bun%C4%83!%20A%C8%99%20dori%20o%20ofert%C4%83%20pentru%20Solaris%20CET."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-solaris-muted transition-colors hover:text-solar-yellow"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-solar-yellow/20 p-3 text-solar-yellow">
                <Mail size={24} />
              </div>
              <div>
                <p className="text-sm text-solaris-muted">Email</p>
                <SafeEmailLink anchorClassName="text-lg font-medium transition-colors hover:text-solar-yellow" />
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-solar-yellow/20 p-3 text-solar-yellow">
                <MapPin size={24} />
              </div>
              <div>
                <p className="text-sm text-solaris-muted">Locație</p>
                <p className="text-lg font-medium">Vaslui, județul Vaslui, România</p>
                <p className="mt-1 text-sm text-solaris-muted">Acoperire: Moldova și proiecte selectate la nivel național</p>
              </div>
            </div>

            <address className="pt-2 not-italic text-solaris-muted">
              <strong className="block text-base text-white">Solaris CET</strong>
              <span className="mt-2 block">Vaslui, județul Vaslui, România</span>
              <span className="mt-2 block">
                <abbr title="Program de lucru" className="no-underline">
                  L-V:
                </abbr>{' '}
                08:00 - 18:00
              </span>
              <a href="tel:+40769889721" className="mt-2 block transition-colors hover:text-solar-yellow">
                +40 769 889 721
              </a>
              <SafeEmailLink anchorClassName="mt-1 block transition-colors hover:text-solar-yellow" />
            </address>

            <section className="pt-2" aria-labelledby="titlu-harta">
              <h3 id="titlu-harta" className="mb-4 text-lg font-medium text-white">
                Zona de activitate
              </h3>
              <div className="overflow-hidden rounded-2xl border border-slate-700 bg-black/30">
                <iframe
                  title="Localizare Solaris CET - Vaslui, Romania"
                  src="https://www.openstreetmap.org/export/embed.html?bbox=27.6276%2C46.5407%2C27.8276%2C46.7407&layer=mapnik&marker=46.6407%2C27.7276"
                  className="block h-[300px] w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <p className="mt-2 text-xs text-solaris-muted">
                <a
                  href="https://www.openstreetmap.org/?mlat=46.6407&mlon=27.7276#map=12/46.6407/27.7276"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-solar-yellow"
                >
                  Deschide harta completă →
                </a>
              </p>
            </section>
          </section>

          <section
            className="rounded-3xl border border-white/10 bg-black/40 p-8 backdrop-blur-sm"
            data-reveal
            aria-labelledby="offer-form-title"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 id="offer-form-title" className="text-2xl font-semibold">
                  Cere ofertă
                </h2>
                <p className="mt-2 text-sm text-solaris-muted">
                  Completează datele esențiale și te contactăm în maxim 24 de ore.
                </p>
              </div>
              <a
                href="#form-oferta"
                className="inline-flex items-center justify-center rounded-full border border-amber-400/30 bg-amber-400/10 px-5 py-2.5 text-sm font-semibold text-amber-200 transition-colors hover:bg-amber-400/15"
              >
                Completează formularul ↓
              </a>
            </div>

            <form
              action={formEndpoint}
              method="POST"
              id="form-oferta"
              className="mt-6 space-y-5 rounded-3xl border border-white/10 bg-white/5 p-6"
            >
              {!useInternalEndpoint ? <input type="hidden" name="access_key" value={accessKey} /> : null}
              <input type="hidden" name="subject" value="Cerere ofertă nouă — Solaris CET" />
              <input type="hidden" name="from_name" value="Site Solaris CET" />
              <input type="hidden" name="redirect" value={THANK_YOU_URL} />
              <input type="checkbox" name="botcheck" className="hidden" tabIndex={-1} autoComplete="off" />

              <div>
                <label htmlFor="f-nume" className="mb-2 block text-sm font-medium text-white/80">
                  Nume și prenume *
                </label>
                <input
                  type="text"
                  id="f-nume"
                  name="name"
                  required
                  placeholder="Ion Popescu"
                  autoComplete="name"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition-colors placeholder:text-white/35 focus:border-amber-400"
                />
              </div>

              <div>
                <label htmlFor="f-tel" className="mb-2 block text-sm font-medium text-white/80">
                  Telefon *
                </label>
                <input
                  type="tel"
                  id="f-tel"
                  name="telefon"
                  required
                  placeholder="07XX XXX XXX"
                  pattern="[0-9+\s\-]{10,15}"
                  autoComplete="tel"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition-colors placeholder:text-white/35 focus:border-amber-400"
                />
              </div>

              <div>
                <label htmlFor="f-email" className="mb-2 block text-sm font-medium text-white/80">
                  Email
                </label>
                <input
                  type="email"
                  id="f-email"
                  name="email"
                  placeholder="email@exemplu.ro"
                  autoComplete="email"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition-colors placeholder:text-white/35 focus:border-amber-400"
                />
              </div>

              <div>
                <label htmlFor="f-serviciu" className="mb-2 block text-sm font-medium text-white/80">
                  Serviciu dorit *
                </label>
                <select
                  id="f-serviciu"
                  name="serviciu"
                  required
                  defaultValue={initialService}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition-colors focus:border-amber-400"
                >
                  <option value="">— Alege —</option>
                  {SERVICE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="f-judet" className="mb-2 block text-sm font-medium text-white/80">
                  Județ *
                </label>
                <select
                  id="f-judet"
                  name="judet"
                  required
                  defaultValue=""
                  className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition-colors focus:border-amber-400"
                >
                  <option value="">— Județ —</option>
                  {COUNTY_OPTIONS.map((county) => (
                    <option key={county} value={county}>
                      {county}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="f-detalii" className="mb-2 block text-sm font-medium text-white/80">
                  Descriere scurtă
                </label>
                <textarea
                  id="f-detalii"
                  name="detalii"
                  rows={4}
                  placeholder="Ex: casă 150mp, consum 400 kWh/lună, acoperiș orientat sud..."
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition-colors placeholder:text-white/35 focus:border-amber-400"
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-2xl bg-amber-400 px-6 py-3 text-sm font-black text-black transition-transform hover:scale-[1.01]"
              >
                Trimite cererea →
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
