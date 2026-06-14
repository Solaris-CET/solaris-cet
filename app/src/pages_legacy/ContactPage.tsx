import { Mail, MapPin } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

import { SafeEmailLink } from '@/components/SafeEmailLink';


// ── QuoteForm component ─────────────────────────────────────────────────────
const SERVICE_TYPES = [
  { value: 'fotovoltaic-rezidential', label: 'Panouri fotovoltaice rezidențiale' },
  { value: 'fotovoltaic-industrial', label: 'Panouri fotovoltaice industriale' },
  { value: 'acoperis-tabla', label: 'Acoperiș tablă/țiglă metalică' },
  { value: 'acoperis-tpo', label: 'Acoperiș industrial TPO' },
  { value: 'reparatii', label: 'Reparații și mentenanță' },
  { value: 'atice-fatade', label: 'Atice și fațade tablă' },
] as const;

const POWER_OPTIONS = [
  { value: 'sub-5kw', label: 'Sub 5 kW (rezidențial mic)' },
  { value: '5-10kw', label: '5-10 kW (rezidențial mare)' },
  { value: '10-50kw', label: '10-50 kW (semi-industrial)' },
  { value: 'peste-50kw', label: 'Peste 50 kW (industrial)' },
] as const;

const ROOF_OPTIONS = [
  { value: 'tabla-plata', label: 'Tablă plată' },
  { value: 'tigla', label: 'Țiglă' },
  { value: 'bitum', label: 'Bitum' },
  { value: 'membrana', label: 'Membrană existentă' },
  { value: 'altul', label: 'Altul' },
] as const;

function QuoteForm() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [locality, setLocality] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [power, setPower] = useState('');
  const [roofType, setRoofType] = useState('');
  const [message, setMessage] = useState('');
  const [gdpr, setGdpr] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);

  const isFotovoltaic = serviceType === 'fotovoltaic-rezidential' || serviceType === 'fotovoltaic-industrial';
  const isAcoperis = serviceType === 'acoperis-tabla' || serviceType === 'acoperis-tpo';

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (name.trim().length < 2) errors.name = 'Minim 2 caractere';
    const phoneClean = phone.replace(/[\s\-]/g, '');
    if (!/^(07\d{8}|\+407\d{8})$/.test(phoneClean)) errors.phone = 'Format: 07xx xxx xxx sau +407xx xxx xxx';
    if (locality.trim().length < 2) errors.locality = 'Introdu localitatea';
    if (!serviceType) errors.serviceType = 'Alege un serviciu';
    if (!gdpr) errors.gdpr = 'Trebuie să fii de acord';
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setError('');
    setSuccess(false);

    try {
      const res = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          locality: locality.trim(),
          serviceType,
          power: isFotovoltaic ? power : undefined,
          roofType: isAcoperis ? roofType : undefined,
          message: message.trim() || undefined,
          gdpr,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Eroare la trimitere');
      }

      setSuccess(true);
      // Reset form after 3 seconds
      setTimeout(() => {
        setName('');
        setPhone('');
        setEmail('');
        setLocality('');
        setServiceType('');
        setPower('');
        setRoofType('');
        setMessage('');
        setGdpr(false);
        setSuccess(false);
      }, 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Eroare necunoscută';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5 rounded-3xl border border-white/10 bg-white/5 p-6">
      {success && (
        <div className="rounded-xl bg-green-600/20 px-4 py-3 text-sm text-green-300">
          ✅ Oferta a fost trimisă! Vă contactăm în maxim 24 ore.
        </div>
      )}
      {error && (
        <div className="rounded-xl bg-red-600/20 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Nume */}
      <div>
        <label htmlFor="qf-nume" className="mb-2 block text-sm font-medium text-white/80">
          Nume complet *
        </label>
        <input
          type="text"
          id="qf-nume"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ion Popescu"
          autoComplete="name"
          className={`w-full rounded-2xl border bg-white/5 px-4 py-3 text-white outline-none transition-colors placeholder:text-white/35 focus:border-amber-400 ${
            validationErrors.name ? 'border-red-500' : 'border-white/10'
          }`}
        />
        {validationErrors.name && <p className="mt-1 text-xs text-red-400">{validationErrors.name}</p>}
      </div>

      {/* Telefon */}
      <div>
        <label htmlFor="qf-tel" className="mb-2 block text-sm font-medium text-white/80">
          Telefon *
        </label>
        <input
          type="tel"
          id="qf-tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="07XX XXX XXX"
          autoComplete="tel"
          className={`w-full rounded-2xl border bg-white/5 px-4 py-3 text-white outline-none transition-colors placeholder:text-white/35 focus:border-amber-400 ${
            validationErrors.phone ? 'border-red-500' : 'border-white/10'
          }`}
        />
        {validationErrors.phone && <p className="mt-1 text-xs text-red-400">{validationErrors.phone}</p>}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="qf-email" className="mb-2 block text-sm font-medium text-white/80">
          Email
        </label>
        <input
          type="email"
          id="qf-email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@exemplu.ro"
          autoComplete="email"
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition-colors placeholder:text-white/35 focus:border-amber-400"
        />
      </div>

      {/* Localitate */}
      <div>
        <label htmlFor="qf-localitate" className="mb-2 block text-sm font-medium text-white/80">
          Localitate *
        </label>
        <input
          type="text"
          id="qf-localitate"
          value={locality}
          onChange={(e) => setLocality(e.target.value)}
          placeholder="Vaslui"
          className={`w-full rounded-2xl border bg-white/5 px-4 py-3 text-white outline-none transition-colors placeholder:text-white/35 focus:border-amber-400 ${
            validationErrors.locality ? 'border-red-500' : 'border-white/10'
          }`}
        />
        {validationErrors.locality && <p className="mt-1 text-xs text-red-400">{validationErrors.locality}</p>}
      </div>

      {/* Tip serviciu */}
      <div>
        <label htmlFor="qf-serviciu" className="mb-2 block text-sm font-medium text-white/80">
          Tip serviciu *
        </label>
        <select
          id="qf-serviciu"
          value={serviceType}
          onChange={(e) => {
            setServiceType(e.target.value);
            setPower('');
            setRoofType('');
          }}
          className={`w-full rounded-2xl border bg-slate-950 px-4 py-3 text-white outline-none transition-colors focus:border-amber-400 ${
            validationErrors.serviceType ? 'border-red-500' : 'border-white/10'
          }`}
        >
          <option value="">— Alege —</option>
          {SERVICE_TYPES.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {validationErrors.serviceType && <p className="mt-1 text-xs text-red-400">{validationErrors.serviceType}</p>}
      </div>

      {/* Putere estimată (doar fotovoltaic) */}
      {isFotovoltaic && (
        <div>
          <label htmlFor="qf-putere" className="mb-2 block text-sm font-medium text-white/80">
            Putere estimată
          </label>
          <select
            id="qf-putere"
            value={power}
            onChange={(e) => setPower(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition-colors focus:border-amber-400"
          >
            <option value="">— Alege —</option>
            {POWER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Tip acoperiș (doar acoperiș) */}
      {isAcoperis && (
        <div>
          <label htmlFor="qf-acoperis" className="mb-2 block text-sm font-medium text-white/80">
            Tip acoperiș
          </label>
          <select
            id="qf-acoperis"
            value={roofType}
            onChange={(e) => setRoofType(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition-colors focus:border-amber-400"
          >
            <option value="">— Alege —</option>
            {ROOF_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Mesaj */}
      <div>
        <label htmlFor="qf-mesaj" className="mb-2 block text-sm font-medium text-white/80">
          Mesaj (max 500 caractere)
        </label>
        <textarea
          id="qf-mesaj"
          value={message}
          onChange={(e) => {
            if (e.target.value.length <= 500) setMessage(e.target.value);
          }}
          rows={4}
          placeholder="Ex: casă 150mp, consum 400 kWh/lună, acoperiș orientat sud..."
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition-colors placeholder:text-white/35 focus:border-amber-400"
        />
        <p className="mt-1 text-right text-xs text-solaris-muted">{message.length}/500</p>
      </div>

      {/* GDPR */}
      <div>
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={gdpr}
            onChange={(e) => setGdpr(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-white/10 bg-white/5 text-amber-400 focus:ring-amber-400"
          />
          <span className="text-sm text-white/80">
            Sunt de acord cu prelucrarea datelor personale *
          </span>
        </label>
        {validationErrors.gdpr && <p className="mt-1 text-xs text-red-400">{validationErrors.gdpr}</p>}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="inline-flex w-full items-center justify-center rounded-2xl bg-amber-400 px-6 py-3 text-sm font-black text-black transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {submitting ? (
          <>
            <svg
              className="-ml-1 mr-2 h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Se trimite...
          </>
        ) : (
          'Trimite Cererea →'
        )}
      </button>
    </form>
  );
}

export default function ContactPage() {

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
                  Calculează și Cere Oferta Ta
                </h2>
                <p className="mt-2 text-sm text-solaris-muted">
                  Gratuit, fără obligații
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-sm font-medium text-amber-200">
                🌞 Răspundem în 24 ore
              </span>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-2">
              {/* Formular */}
              <QuoteForm />

              {/* Card "De ce Solaris CET?" */}
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h3 className="mb-4 text-lg font-semibold text-white">De ce Solaris CET?</h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 text-amber-400">✅</span>
                    <div>
                      <p className="font-medium text-white">Experiență locală</p>
                      <p className="text-sm text-solaris-muted">Peste 10 ani în construcții și fotovoltaice în Moldova.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 text-amber-400">🔧</span>
                    <div>
                      <p className="font-medium text-white">Montaj rapid</p>
                      <p className="text-sm text-solaris-muted">1-3 zile pentru sisteme rezidențiale, 3-7 zile industriale.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 text-amber-400">💰</span>
                    <div>
                      <p className="font-medium text-white">Finanțare garantată</p>
                      <p className="text-sm text-solaris-muted">Te ajutăm cu dosarul Casa Verde și RePowerEU.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 text-amber-400">🛡️</span>
                    <div>
                      <p className="font-medium text-white">Garanție completă</p>
                      <p className="text-sm text-solaris-muted">10 ani panouri, 5 ani invertor, 2 ani montaj.</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
