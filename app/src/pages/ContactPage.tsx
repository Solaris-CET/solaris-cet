import { Mail, MapPin, Send } from 'lucide-react';
import { useMemo, useState } from 'react';

import { DownloadAppButton } from '@/components/company/DownloadAppButton';

export default function ContactPage() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-solaris-offblack text-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-solar-yellow to-amber-500 bg-clip-text text-transparent">
            Contactați Solaris Cet
          </h1>
          <p className="mt-4 text-xl text-solaris-muted max-w-2xl mx-auto">
            Suntem aici să vă ajutăm cu proiectul dumneavoastră de energie regenerabilă sau construcții.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Contact Information */}
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
                <p className="text-lg font-medium">Cetatuia, Vaslui, 737429, România</p>
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
                  setError('Te rog completează numele.');
                  return;
                }
                if (!em && !ph) {
                  setError('Te rog completează email sau telefon.');
                  return;
                }
                if (!msg) {
                  setError('Te rog completează mesajul.');
                  return;
                }
                if (!consent) {
                  setError('Te rog confirmă consimțământul pentru prelucrarea datelor.');
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
                    }),
                  });
                  if (!res.ok) {
                    setError('Nu am putut trimite mesajul.');
                    return;
                  }
                  setDone(true);
                  setName('');
                  setEmail('');
                  setPhone('');
                  setMessage('');
                } catch {
                  setError('Conexiunea a eșuat. Te rog încearcă din nou.');
                } finally {
                  setBusy(false);
                }
              }}
            >
              <div>
                <label className="block text-sm font-medium text-solaris-muted mb-1">Nume complet</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  type="text"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-solar-yellow outline-none transition-colors"
                  placeholder="Popescu Ion"
                  autoComplete="name"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-solaris-muted mb-1">Email</label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-solar-yellow outline-none transition-colors"
                    placeholder="exemplu@email.com"
                    autoComplete="email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-solaris-muted mb-1">Telefon</label>
                  <input
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
                <label className="block text-sm font-medium text-solaris-muted mb-1">Serviciu</label>
                <select
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
                <label className="block text-sm font-medium text-solaris-muted mb-1">Mesaj</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-solar-yellow outline-none transition-colors"
                  placeholder="Detaliile proiectului: locație, tip clădire, suprafață, termen, preferințe…"
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
