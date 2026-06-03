import { Mail, MapPin, Send } from 'lucide-react';
import { useMemo, useState } from 'react';

import { DownloadAppButton } from '@/components/company/DownloadAppButton';
import { localizePathname, parseUrlLocaleFromPathname } from '@/i18n/urlRouting';

export default function ContactPage() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const utm = useMemo(() => {
    try {
      const u = new URL(window.location.href);
      const pick = (k: string) => (u.searchParams.get(k) ?? '').trim() || null;
      const ref = (document.referrer ?? '').trim();
      return {
        source: pick('utm_source'),
        medium: pick('utm_medium'),
        campaign: pick('utm_campaign'),
        term: pick('utm_term'),
        content: pick('utm_content'),
        gclid: pick('gclid'),
        fbclid: pick('fbclid'),
        referrer: ref ? ref.slice(0, 300) : null,
        landingPath: `${u.pathname}${u.search}${u.hash}`.slice(0, 300),
      };
    } catch {
      return null;
    }
  }, []);

  const initialService = useMemo(() => {
    try {
      const u = new URL(window.location.href);
      return (u.searchParams.get('service') ?? '').trim();
    } catch {
      return '';
    }
  }, []);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [service, setService] = useState(initialService);
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(false);

  const serviceOptions = useMemo(
    () => [
      { value: 'fotovoltaice', label: 'Instalații fotovoltaice' },
      { value: 'constructii', label: 'Lucrări de construcții' },
      { value: 'acoperisuri', label: 'Acoperișuri (tablă / țiglă)' },
      { value: 'tpo', label: 'Acoperișuri TPO (industrial)' },
      { value: 'atice-fatade', label: 'Atice & fațade tablă' },
      { value: 'reparatii', label: 'Reparații & mentenanță' },
    ],
    [],
  );

  const serviceQuick = useMemo(
    () => serviceOptions.filter((x) => x.value !== 'constructii').slice(0, 4),
    [serviceOptions],
  );

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-solaris-offblack text-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-solar-yellow to-amber-500 bg-clip-text text-transparent">
            Contact Solaris Engineering
          </h1>
          <p className="mt-4 text-xl text-solaris-muted max-w-2xl mx-auto">
            Spune-ne ce vrei să construiești. Revenim rapid cu pașii următori: evaluare, ofertă și planificare execuție.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-8 bg-black/40 p-8 rounded-3xl border border-white/10 backdrop-blur-sm">
            <h2 className="text-2xl font-semibold mb-6">Informații de Contact</h2>
            
            <div className="flex items-start gap-4">
              <div className="bg-solar-yellow/20 p-3 rounded-xl text-solar-yellow">
                <span className="text-lg font-bold" aria-hidden>☎</span>
              </div>
              <div>
                <p className="text-sm text-solaris-muted">Telefon</p>
                <a href="tel:+40769889721" className="text-lg font-medium hover:text-solar-yellow transition-colors">
                  +40 769 889 721
                </a>
                <div className="mt-1">
                  <a
                    href={`https://wa.me/40769889721?text=${encodeURIComponent(
                      "Bună ziua Solaris Engineering! Doresc o ofertă pentru: " +
                      (serviceOptions.find((o) => o.value === service)?.label || "construcții/fotovoltaice") +
                      "."
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-solaris-muted hover:text-solar-yellow transition-colors"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-emerald-500/20 p-3 rounded-xl text-emerald-500">
                <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </div>
              <div>
                <p className="text-sm text-solaris-muted">WhatsApp</p>
                <a
                  href={`https://wa.me/40769889721?text=${encodeURIComponent(
                    "Bună ziua Solaris Engineering! Doresc o ofertă pentru servicii de " +
                    (serviceOptions.find((o) => o.value === service)?.label || "construcții/fotovoltaice") +
                    "."
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg font-medium hover:text-emerald-400 transition-colors"
                >
                  Mesaj Rapid
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-solar-yellow/20 p-3 rounded-xl text-solar-yellow">
                <Mail size={24} />
              </div>
              <div>
                <p className="text-sm text-solaris-muted">Email</p>
                <a href="mailto:solaris-cet@protonmail.com" className="text-lg font-medium hover:text-solar-yellow transition-colors">
                  solaris-cet@protonmail.com
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-solar-yellow/20 p-3 rounded-xl text-solar-yellow">
                <MapPin size={24} />
              </div>
              <div>
                <p className="text-sm text-solaris-muted">Locație</p>
                <p className="text-lg font-medium">Cetățuia, Vaslui, 737429, România</p>
                <p className="mt-1 text-sm text-solaris-muted">Acoperire: toate județele</p>
              </div>
            </div>

            <div className="pt-8">
              <h3 className="text-lg font-medium mb-4">Program de lucru</h3>
              <p className="text-solaris-muted">Luni - Vineri: 08:00 - 18:00</p>
              <p className="text-solaris-muted">Sâmbătă: 09:00 - 14:00</p>
              <p className="text-solaris-muted">Duminică: Închis</p>
            </div>
          </div>

          <div className="bg-black/40 p-8 rounded-3xl border border-white/10 backdrop-blur-sm">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-2xl font-semibold mb-2">Trimiteți-ne un mesaj</h2>
              <div className="shrink-0">
                <DownloadAppButton />
              </div>
            </div>

            <div className="mt-2 text-sm text-solaris-muted">
              Dacă nu ai timp de formular, trimite direct pe WhatsApp sau sună. Pentru ofertă, ne ajută locația și câteva detalii.
            </div>

            {done ? (
              <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3">
                <div className="text-sm font-semibold text-white">Mesaj trimis</div>
                <div className="mt-1 text-sm text-solaris-muted">Revenim cât mai curând. Pentru urgențe: +40 769 889 721.</div>
              </div>
            ) : null}

            {error ? (
              <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3">
                <div className="text-sm font-semibold text-white">Eroare</div>
                <div className="mt-1 text-sm text-solaris-muted">{error}</div>
              </div>
            ) : null}

            <form
              className="space-y-4 mt-6"
              onSubmit={async (e) => {
                e.preventDefault();
                if (busy) return;
                setError(null);
                setDone(false);

                const n = name.trim();
                const em = email.trim();
                const ph = phone.trim();
                const msg = message.trim();
                if (!n) {
                  setError('Completează numele.');
                  return;
                }
                if (!em && !ph) {
                  setError('Completează email sau telefon.');
                  return;
                }
                if (!msg) {
                  setError('Completează mesajul.');
                  return;
                }
                if (!consent) {
                  setError('Confirmă acordul pentru prelucrarea datelor, ca să te putem contacta.');
                  return;
                }

                setBusy(true);
                try {
                  const pageUrl = typeof window !== 'undefined' ? window.location.href : '/contact';
                  const serviceLabel = serviceOptions.find((o) => o.value === service)?.label ?? service;
                  const fullMessage = [
                    `Serviciu: ${serviceLabel || 'n/a'}`,
                    ph ? `Telefon: ${ph}` : null,
                    em ? `Email: ${em}` : null,
                    utm?.referrer ? `Referrer: ${utm.referrer}` : null,
                    '',
                    msg,
                  ]
                    .filter((x) => typeof x === 'string' && x)
                    .join('\n');

                  const res = await fetch('/api/support/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      name: n,
                      email: em || null,
                      message: fullMessage,
                      pageUrl,
                      utm,
                    }),
                  });
                  if (!res.ok) {
                    setError('Nu am putut trimite mesajul.');
                    return;
                  }
                  try {
                    const dataLayer = (window as unknown as { dataLayer?: Array<Record<string, unknown>> }).dataLayer;
                    dataLayer?.push?.({ event: 'conversion', source: 'contact_form' });
                  } catch {
                    void 0;
                  }

                  const urlLocale = parseUrlLocaleFromPathname(window.location.pathname).locale ?? 'ro';
                  window.location.href = localizePathname('/multumim', urlLocale);
                } catch {
                  setError('Conexiunea a eșuat. Te rog încearcă din nou.');
                } finally {
                  setBusy(false);
                }
              }}
            >
              <div>
                <label htmlFor="contact-name" className="block text-sm font-medium text-solaris-muted mb-1">
                  Nume complet
                </label>
                <input
                  id="contact-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  type="text"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-solar-yellow outline-none transition-colors"
                  placeholder="Ion Popescu"
                  autoComplete="name"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="contact-email" className="block text-sm font-medium text-solaris-muted mb-1">
                    Email
                  </label>
                  <input
                    id="contact-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-solar-yellow outline-none transition-colors"
                    placeholder="exemplu@email.com"
                    autoComplete="email"
                  />
                </div>
                <div>
                  <label htmlFor="contact-phone" className="block text-sm font-medium text-solaris-muted mb-1">
                    Telefon
                  </label>
                  <input
                    id="contact-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    type="tel"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-solar-yellow outline-none transition-colors"
                    placeholder="+40 7xx xxx xxx"
                    autoComplete="tel"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-end justify-between gap-3">
                  <label htmlFor="contact-service" className="block text-sm font-medium text-solaris-muted mb-1">
                    Serviciu (opțional)
                  </label>
                  <div className="hidden sm:flex items-center gap-2">
                    {serviceQuick.map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => setService(o.value)}
                        className={`rounded-full border px-3 py-1 text-xs font-bold transition-colors ${
                          service === o.value
                            ? 'border-amber-400/40 bg-amber-400/15 text-amber-200'
                            : 'border-white/10 bg-white/5 text-white/70 hover:text-white'
                        }`}
                      >
                        {o.label.replace('Instalații ', '').replace('Acoperișuri ', 'Acoperiș')}
                      </button>
                    ))}
                  </div>
                </div>
                <select
                  id="contact-service"
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-solar-yellow outline-none transition-colors appearance-none"
                >
                  <option className="bg-solaris-offblack" value="">Alege…</option>
                  {serviceOptions.map((o) => (
                    <option key={o.value} className="bg-solaris-offblack" value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="contact-message" className="block text-sm font-medium text-solaris-muted mb-1">
                  Mesaj
                </label>
                <textarea
                  id="contact-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-solar-yellow outline-none transition-colors"
                  placeholder="Detalii utile: locație, tip clădire, suprafață, consum/putere dorită, termen, preferințe…"
                />
              </div>

              <label className="flex items-start gap-3 text-sm text-solaris-muted">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-white/20 bg-white/10"
                />
                <span>
                  Sunt de acord cu prelucrarea datelor pentru a fi contactat în legătură cu solicitarea mea.
                  <span className="ml-2">
                    <a href="/privacy" className="underline underline-offset-4 decoration-white/20 hover:decoration-white/60 hover:text-white">
                      Politica de confidențialitate
                    </a>
                  </span>
                </span>
              </label>

              <button
                type="submit"
                disabled={busy}
                className="w-full bg-solar-yellow hover:bg-amber-500 disabled:opacity-60 text-black font-bold py-4 rounded-xl transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
              >
                <Send size={20} />
                {busy ? 'Se trimite…' : 'Trimite mesajul'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
