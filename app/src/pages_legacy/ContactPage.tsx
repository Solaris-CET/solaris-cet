import { ArrowRight, Mail, MapPin } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { DownloadAppButton } from '@/components/company/DownloadAppButton';

import styles from './ContactWizard.module.css';

type ServiceOption = {
  value: string;
  label: string;
  icon: (props: { className?: string }) => React.ReactElement;
};

function formatRoPhone(input: string) {
  const raw = input.replace(/\D/g, '').slice(0, 16);
  if (!raw) return '';

  let digits = raw;
  if (digits.startsWith('0')) digits = `40${digits.slice(1)}`;
  if (digits.startsWith('0040')) digits = digits.slice(2);
  if (!digits.startsWith('40')) digits = `40${digits}`;
  digits = digits.slice(0, 11);

  const local = digits.slice(2);
  const a = local.slice(0, 3);
  const b = local.slice(3, 6);
  const c = local.slice(6, 9);
  const parts = [a, b, c].filter(Boolean);
  return `+40 ${parts.join(' ')}`.trim();
}

function isEmailValid(v: string) {
  const s = v.trim();
  if (!s) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(s);
}

export default function ContactPage() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [shakeKey, setShakeKey] = useState<string | null>(null);
  const shakeTimerRef = useRef<number>(0);

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
  const initialServiceChoice = useMemo(() => {
    const s = (initialService ?? '').trim();
    if (!s) return '';
    if (s === 'fotovoltaice') return 'fotovoltaice-rezidentiale';
    if (s === 'acoperisuri') return 'acoperisuri-tabla-tigla';
    if (s === 'tpo') return 'acoperisuri-industriale-tpo';
    if (s === 'atice-fatade') return 'atice-si-fatade-tabla';
    if (s === 'reparatii') return 'reparatii-si-mentenanta';
    return s;
  }, [initialService]);

  const [serviceChoice, setServiceChoice] = useState(initialServiceChoice);
  const [details, setDetails] = useState('');
  const [location, setLocation] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [consent, setConsent] = useState(false);
  const [hp, setHp] = useState('');
  const [mathAnswer, setMathAnswer] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [antiSpam, setAntiSpam] = useState(() => ({ a: 4, b: 7, sum: 11 }));

  const draftKey = 'solaris_offer_draft_v1';
  const draftTimerRef = useRef<number>(0);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(draftKey);
      if (!raw) return;
      const data = JSON.parse(raw) as Partial<{
        step: number;
        serviceChoice: string;
        details: string;
        location: string;
        urgent: boolean;
        name: string;
        email: string;
        phone: string;
        consent: boolean;
        mathAnswer: string;
        antiSpamA: number;
        antiSpamB: number;
      }>;
      if (typeof data.step === 'number') setStep(Math.max(0, Math.min(2, data.step)));
      if (typeof data.serviceChoice === 'string') setServiceChoice(data.serviceChoice);
      if (typeof data.details === 'string') setDetails(data.details);
      if (typeof data.location === 'string') setLocation(data.location);
      if (typeof data.urgent === 'boolean') setUrgent(data.urgent);
      if (typeof data.name === 'string') setName(data.name);
      if (typeof data.email === 'string') setEmail(data.email);
      if (typeof data.phone === 'string') setPhone(data.phone);
      if (typeof data.consent === 'boolean') setConsent(data.consent);
      if (typeof data.mathAnswer === 'string') setMathAnswer(data.mathAnswer);
      if (typeof data.antiSpamA === 'number' && typeof data.antiSpamB === 'number') {
        const a = Math.max(2, Math.min(9, Math.round(data.antiSpamA)));
        const b = Math.max(2, Math.min(9, Math.round(data.antiSpamB)));
        setAntiSpam({ a, b, sum: a + b });
      }
    } catch {
      void 0;
    }
  }, []);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(draftKey);
      if (raw) return;
    } catch {
      void 0;
    }

    try {
      const buf = new Uint32Array(2);
      window.crypto.getRandomValues(buf);
      const a = 2 + (buf[0] % 8);
      const b = 2 + (buf[1] % 8);
      setAntiSpam({ a, b, sum: a + b });
    } catch {
      void 0;
    }
  }, []);

  useEffect(() => {
    if (done) return;
    window.clearTimeout(draftTimerRef.current);
    draftTimerRef.current = window.setTimeout(() => {
      try {
        window.localStorage.setItem(
          draftKey,
          JSON.stringify({
            step,
            serviceChoice,
            details,
            location,
            urgent,
            name,
            email,
            phone,
            consent,
            mathAnswer,
            antiSpamA: antiSpam.a,
            antiSpamB: antiSpam.b,
          }),
        );
      } catch {
        void 0;
      }
    }, 150);
  }, [antiSpam.a, antiSpam.b, consent, details, done, email, location, mathAnswer, name, phone, serviceChoice, step, urgent]);

  const serviceOptions = useMemo<ServiceOption[]>(
    () => [
      {
        value: 'fotovoltaice-rezidentiale',
        label: 'Fotovoltaice Rezidențiale',
        icon: ({ className }) => (
          <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden>
            <path d="M10 20h28M12 28h24M14 36h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M16 12l4 6M24 10v8M32 12l-4 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <rect x="12" y="18" width="24" height="22" rx="4" stroke="currentColor" strokeWidth="2" opacity="0.9" />
          </svg>
        ),
      },
      {
        value: 'fotovoltaice-industriale',
        label: 'Fotovoltaice Industriale',
        icon: ({ className }) => (
          <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden>
            <path d="M10 36V20l8-6 8 6v16H10Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M24 36V16l8-6 8 6v20H24Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M16 26h6M30 24h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M28 8l-2 4M34 6v6M40 8l2 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ),
      },
      {
        value: 'acoperisuri-tabla-tigla',
        label: 'Acoperișuri Tablă & Țiglă',
        icon: ({ className }) => (
          <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden>
            <path d="M8 22l16-12 16 12" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M12 22v16h24V22" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M16 28h16M16 32h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.9" />
          </svg>
        ),
      },
      {
        value: 'acoperisuri-industriale-tpo',
        label: 'Acoperișuri TPO Industrial',
        icon: ({ className }) => (
          <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden>
            <path d="M10 18h28v20H10V18Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M14 22h20M14 26h20M14 30h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M36 12l-4 4M24 10v6M12 12l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ),
      },
      {
        value: 'atice-si-fatade-tabla',
        label: 'Atice & Fațade Tablă',
        icon: ({ className }) => (
          <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden>
            <path d="M14 38V10h20v28" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M18 16h12M18 22h12M18 28h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M10 38h28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ),
      },
      {
        value: 'reparatii-si-mentenanta',
        label: 'Reparații & Mentenanță',
        icon: ({ className }) => (
          <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden>
            <path d="M16 10h16l4 6v22H12V16l4-6Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M18 22h12M18 28h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M24 14v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.9" />
          </svg>
        ),
      },
    ],
    [],
  );

  const selectedServiceLabel = useMemo(
    () => serviceOptions.find((o) => o.value === serviceChoice)?.label ?? '',
    [serviceChoice, serviceOptions],
  );
  const progressPct = ((Math.min(2, Math.max(0, step)) + 1) / 3) * 100;

  const shake = (k: string) => {
    window.clearTimeout(shakeTimerRef.current);
    setShakeKey(k);
    shakeTimerRef.current = window.setTimeout(() => setShakeKey(null), 520);
  };

  const resetAll = () => {
    setStep(0);
    setBusy(false);
    setDone(false);
    setError(null);
    setServiceChoice(initialServiceChoice);
    setDetails('');
    setLocation('');
    setUrgent(false);
    setName('');
    setEmail('');
    setPhone('');
    setConsent(false);
    setHp('');
    setMathAnswer('');
    setTouched({});
    try {
      window.localStorage.removeItem(draftKey);
    } catch {
      void 0;
    }
  };

  const canNextStep1 = Boolean(serviceChoice);
  const canNextStep2 = Boolean(details.trim());
  const phoneDigits = phone.replace(/\D/g, '');
  const isPhoneValid = phone.trim() ? (phoneDigits.startsWith('40') ? phoneDigits.length >= 11 : phoneDigits.length >= 9) : false;
  const emailOk = email.trim() ? isEmailValid(email) : true;
  const isMathOk = mathAnswer.trim() ? Number(mathAnswer.trim()) === antiSpam.sum : false;
  const canSubmit = Boolean(name.trim()) && Boolean(phone.trim() || email.trim()) && isPhoneValid && emailOk && consent && isMathOk;

  const dynamicWaText = useMemo(() => {
    const s = serviceOptions.find((o) => o.value === service);
    const label = s?.label || 'construcții/fotovoltaice';
    let extra = '';
    if (service === 'fotovoltaice') extra = ' Locația este ... și consumul mediu lunar ... kWh.';
    if (service === 'tpo') extra = ' Suprafața acoperișului este de aprox. ... mp în localitatea ...';
    if (service === 'acoperisuri') extra = ' Doresc ofertă pentru (tablă/țiglă) în localitatea ...';
    if (service === 'reparatii') extra = ' Am o problemă cu infiltrațiile în zona ...';

    return `Bună ziua Solaris Engineering! Doresc o ofertă pentru ${label}.${extra}`;
  }, [service, serviceOptions]);

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-solaris-offblack text-white"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16" data-reveal>
          <h1 className="font-display font-bold bg-gradient-to-r from-solar-yellow to-amber-500 bg-clip-text text-transparent text-[length:var(--text-h1)] leading-[var(--lh-display)]">
            Contact Solaris CET
          </h1>
          <p className="mt-4 text-xl text-solaris-muted max-w-2xl mx-auto">
            Spune-ne ce vrei să construiești. Revenim rapid cu pașii următori: evaluare, ofertă și planificare execuție.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-8 bg-black/40 p-8 rounded-3xl border border-white/10 backdrop-blur-sm" data-reveal-stagger>
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
                    href={`https://wa.me/40769889721?text=${encodeURIComponent('Bună ziua Solaris Engineering! Aș dori o ofertă pentru servicii de: ')}`}
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
                    "Bună ziua Solaris CET, doresc o ofertă pentru servicii de " +
                      (selectedServiceLabel || "construcții/fotovoltaice") +
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

            <div className="pt-2">
              <div className="rounded-3xl border border-white/10 overflow-hidden bg-black/30">
                <iframe
                  title="Hartă Vaslui, România"
                  src="https://www.google.com/maps?q=Vaslui%2C%20Romania&output=embed"
                  className="h-[260px] w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>

          <div className="bg-black/40 p-8 rounded-3xl border border-white/10 backdrop-blur-sm" data-reveal>
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-2xl font-semibold mb-2">Cere ofertă</h2>
              <div className="shrink-0">
                <DownloadAppButton />
              </div>
            </div>

            <div className="mt-2 text-sm text-solaris-muted">Formular rapid în 3 pași. Pentru urgențe: sună sau scrie pe WhatsApp.</div>

            <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
              <div className="h-[2px] bg-white/10">
                <div className={`h-[2px] bg-orange-400 ${styles.progressFill}`} style={{ width: `${progressPct}%` }} />
              </div>

              <div className="px-6 pt-5 pb-4 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-white">Pasul {step + 1} din 3</div>
                  <div className="flex items-center gap-2" aria-label="Progres">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className={`h-2.5 w-2.5 rounded-full ${styles.dot} ${
                          i <= step ? 'bg-orange-400 opacity-100' : 'bg-white/20 opacity-70'
                        }`}
                        style={i === step ? { transform: 'scale(1.12)' } : undefined}
                        aria-hidden
                      />
                    ))}
                  </div>
                </div>
                <div className="mt-2 text-sm text-white/70">{step === 0 ? 'Alege serviciul' : step === 1 ? 'Detalii proiect' : 'Date de contact'}</div>
              </div>

              <div className="relative px-6 py-6">
                {done ? (
                  <div className="relative rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-6 overflow-hidden">
                    <div className={styles.confetti} aria-hidden>
                      {Array.from({ length: 40 }).map((_, i) => {
                        const dx = `${(i % 10) * 20 - 90}px`;
                        const dy = `${140 + (i % 6) * 26}px`;
                        const d = `${(i % 8) * 30}ms`;
                        const r = `${(i * 37) % 360}deg`;
                        const c = i % 4 === 0 ? '#f97316' : i % 4 === 1 ? '#fbbf24' : i % 4 === 2 ? '#22c55e' : '#60a5fa';
                        return (
                          <div
                            key={i}
                            className={styles.confettiPiece}
                            style={{
                              ['--dx' as never]: dx,
                              ['--dy' as never]: dy,
                              ['--d' as never]: d,
                              ['--r' as never]: r,
                              ['--c' as never]: c,
                            }}
                          />
                        );
                      })}
                    </div>
                    <div className="text-sm font-black text-white">Solicitare trimisă</div>
                    <div className="mt-2 text-sm text-white/80">Vă vom contacta în 24h. Pentru urgențe: +40 769 889 721.</div>
                    <button
                      type="button"
                      onClick={resetAll}
                      className="mt-5 inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-bold text-white hover:bg-white/10"
                    >
                      Trimite o altă solicitare
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={async (e) => {
                        e.preventDefault();
                        if (busy) return;
                        setError(null);

                        if (hp.trim()) {
                          setDone(true);
                          try {
                            window.localStorage.removeItem(draftKey);
                          } catch {
                            void 0;
                          }
                          return;
                        }

                        if (!serviceChoice) {
                          setStep(0);
                          shake('service');
                          setError('Alege serviciul.');
                          return;
                        }
                        if (!details.trim()) {
                          setStep(1);
                          shake('details');
                          setError('Adaugă câteva detalii despre proiect.');
                          return;
                        }
                        if (!name.trim()) {
                          setStep(2);
                          shake('name');
                          setError('Completează numele.');
                          return;
                        }
                        if (!phone.trim() && !email.trim()) {
                          setStep(2);
                          shake('phone');
                          setError('Completează telefon sau email.');
                          return;
                        }
                        if (!isPhoneValid) {
                          setStep(2);
                          shake('phone');
                          setError('Număr de telefon invalid.');
                          return;
                        }
                        if (!emailOk) {
                          setStep(2);
                          shake('email');
                          setError('Email invalid.');
                          return;
                        }
                        if (!consent) {
                          shake('consent');
                          setError('Confirmă acordul pentru prelucrarea datelor, ca să te putem contacta.');
                          return;
                        }
                        if (!isMathOk) {
                          setStep(2);
                          shake('math');
                          setError('Verificare anti-spam: răspuns greșit.');
                          return;
                        }

                        setBusy(true);
                        try {
                          const pageUrl = typeof window !== 'undefined' ? window.location.href : '/contact';
                          const serviceLabel = selectedServiceLabel || serviceChoice;
                          const serviceParam = serviceChoice.startsWith('fotovoltaice')
                            ? 'fotovoltaice'
                            : serviceChoice === 'acoperisuri-tabla-tigla'
                              ? 'acoperisuri'
                              : serviceChoice === 'acoperisuri-industriale-tpo'
                                ? 'tpo'
                                : serviceChoice === 'atice-si-fatade-tabla'
                                  ? 'atice-fatade'
                                  : serviceChoice === 'reparatii-si-mentenanta'
                                    ? 'reparatii'
                                    : serviceChoice;

                          const fullMessage = [
                            `Serviciu: ${serviceLabel}`,
                            `Param: ${serviceParam}`,
                            location.trim() ? `Locație: ${location.trim()}` : null,
                            urgent ? 'Urgență: da' : null,
                            phone.trim() ? `Telefon: ${phone.trim()}` : null,
                            email.trim() ? `Email: ${email.trim()}` : null,
                            '',
                            details.trim(),
                          ]
                            .filter((x) => typeof x === 'string' && x)
                            .join('\n');

                          const endpoint = String((import.meta as unknown as { env?: Record<string, unknown> }).env?.VITE_FORMSPREE_ENDPOINT ?? '').trim();
                          if (endpoint) {
                            const fd = new FormData();
                            fd.set('name', name.trim());
                            if (email.trim()) fd.set('email', email.trim());
                            if (phone.trim()) fd.set('phone', phone.trim());
                            fd.set('service', serviceLabel);
                            fd.set('service_param', serviceParam);
                            if (location.trim()) fd.set('location', location.trim());
                            fd.set('urgent', urgent ? 'yes' : 'no');
                            fd.set('message', details.trim());
                            fd.set('pageUrl', pageUrl);
                            if (utm) fd.set('utm', JSON.stringify(utm));

                            const res = await fetch(endpoint, { method: 'POST', headers: { Accept: 'application/json' }, body: fd });
                            if (!res.ok) {
                              setError('Nu am putut trimite solicitarea.');
                              return;
                            }
                          } else {
                            const res = await fetch('/api/support/start', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                name: name.trim(),
                                email: email.trim() || null,
                                message: fullMessage,
                                pageUrl,
                                utm,
                              }),
                            });
                            if (!res.ok) {
                              const mailto = `mailto:solaris-cet@protonmail.com?subject=${encodeURIComponent(
                                'Solicitare ofertă — Solaris CET',
                              )}&body=${encodeURIComponent(fullMessage)}`;
                              window.location.href = mailto;
                              return;
                            }
                          }

                          try {
                            const dataLayer = (window as unknown as { dataLayer?: Array<Record<string, unknown>> }).dataLayer;
                            dataLayer?.push?.({ event: 'conversion', source: 'offer_form' });
                          } catch {
                            void 0;
                          }

                          setDone(true);
                          try {
                            window.localStorage.removeItem(draftKey);
                          } catch {
                            void 0;
                          }
                        } catch {
                          setError('Conexiunea a eșuat. Te rog încearcă din nou.');
                        } finally {
                          setBusy(false);
                        }
                      }}
                  >
                    {error ? (
                      <div className="mb-4 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3">
                        <div className="text-sm font-semibold text-white">Verifică</div>
                        <div className="mt-1 text-sm text-solaris-muted">{error}</div>
                      </div>
                    ) : null}

                    <div className="overflow-hidden">
                      <div className={styles.track} style={{ transform: `translateX(-${step * 33.3333}%)` }}>
                        <section className="w-1/3 pr-4">
                          <div className={`grid grid-cols-2 gap-3 ${shakeKey === 'service' ? styles.shake : ''}`}>
                            {serviceOptions.map((o) => {
                              const Icon = o.icon;
                              const selected = serviceChoice === o.value;
                              return (
                                <button
                                  key={o.value}
                                  type="button"
                                  onClick={() => setServiceChoice(o.value)}
                                  className={`group rounded-2xl border px-4 py-4 text-left transition-colors ${
                                    selected ? 'border-orange-400/70 bg-orange-400/10' : 'border-white/10 bg-black/20 hover:bg-white/5 hover:border-white/20'
                                  }`}
                                >
                                  <div className="flex items-start gap-3">
                                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-orange-400">
                                      <Icon className="h-7 w-7" />
                                    </span>
                                    <div className="min-w-0">
                                      <div className="text-sm font-black text-white leading-tight">{o.label}</div>
                                      <div className="mt-1 text-xs text-white/55">Alege</div>
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>

                          <div className="mt-5 flex items-center justify-between">
                            <div className="text-xs text-white/55">Selectează un serviciu ca să continui</div>
                            <button
                              type="button"
                              disabled={!canNextStep1}
                              onClick={() => {
                                if (!canNextStep1) {
                                  shake('service');
                                  return;
                                }
                                setStep(1);
                              }}
                              className="inline-flex items-center gap-2 rounded-2xl bg-orange-400 px-5 py-3 text-sm font-black text-black disabled:opacity-50"
                            >
                              Continuă <ArrowRight className="h-4 w-4" aria-hidden />
                            </button>
                          </div>
                        </section>

                          <section className="w-1/3 px-2">
                            <div className="text-sm font-bold text-white">Detalii proiect</div>
                            <div className="mt-1 text-sm text-white/60">Cu cât avem mai multe detalii, cu atât oferta este mai precisă.</div>

                            <div className={`mt-5 ${shakeKey === 'details' ? styles.shake : ''}`}>
                              <label htmlFor="offer-details" className="block text-sm font-medium text-white/70 mb-1">
                                Descriere
                              </label>
                              <textarea
                                id="offer-details"
                                value={details}
                                onChange={(e) => setDetails(e.target.value)}
                                rows={5}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:border-orange-400 outline-none transition-colors"
                                placeholder="Ex: locație, tip acoperiș, suprafață, consum, putere dorită, termen, preferințe…"
                              />
                            </div>

                            <div className="mt-4">
                              <label htmlFor="offer-location" className="block text-sm font-medium text-white/70 mb-1">
                                Locație (opțional)
                              </label>
                              <input
                                id="offer-location"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                type="text"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:border-orange-400 outline-none transition-colors"
                                placeholder="Vaslui / Iași / Bacău…"
                                autoComplete="address-level2"
                              />
                            </div>

                            <div className="mt-4">
                              <div className="text-sm font-medium text-white/70 mb-2">Urgență</div>
                              <button
                                type="button"
                                onClick={() => setUrgent((v) => !v)}
                                className={`inline-flex items-center justify-between w-full rounded-2xl border px-4 py-3 transition-colors ${
                                  urgent ? 'border-orange-400/60 bg-orange-400/10' : 'border-white/10 bg-black/20 hover:bg-white/5'
                                }`}
                              >
                                <span className="text-sm font-semibold text-white">Am nevoie cât mai repede</span>
                                <span className={`h-5 w-9 rounded-full p-[2px] transition-colors ${urgent ? 'bg-orange-400' : 'bg-white/20'}`} aria-hidden>
                                  <span className={`block h-4 w-4 rounded-full bg-black transition-transform ${urgent ? 'translate-x-4' : 'translate-x-0'}`} />
                                </span>
                              </button>
                            </div>

                            <div className="mt-5 flex items-center justify-between">
                              <button type="button" onClick={() => setStep(0)} className="text-sm font-semibold text-white/70 hover:text-white">
                                Înapoi
                              </button>
                              <button
                                type="button"
                                disabled={!canNextStep2}
                                onClick={() => {
                                  if (!canNextStep2) {
                                    shake('details');
                                    return;
                                  }
                                  setStep(2);
                                }}
                                className="inline-flex items-center gap-2 rounded-2xl bg-orange-400 px-5 py-3 text-sm font-black text-black disabled:opacity-50"
                              >
                                Continuă <ArrowRight className="h-4 w-4" aria-hidden />
                              </button>
                            </div>
                          </section>

                          <section className="w-1/3 pl-4">
                            <div className="text-sm font-bold text-white">Date de contact</div>
                            <div className="mt-1 text-sm text-white/60">Te contactăm în 24h pentru confirmare și pașii următori.</div>

                            <div className={`mt-5 ${shakeKey === 'name' ? styles.shake : ''}`}>
                              <label htmlFor="offer-name" className="block text-sm font-medium text-white/70 mb-1">
                                Nume
                              </label>
                              <input
                                id="offer-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                                type="text"
                                className={`w-full bg-white/5 border rounded-2xl px-4 py-3 outline-none transition-colors ${
                                  name.trim() ? 'border-emerald-400/50 focus:border-emerald-400' : 'border-white/10 focus:border-orange-400'
                                }`}
                                placeholder="Ion Popescu"
                                autoComplete="name"
                              />
                              {touched.name && !name.trim() ? (
                                <div className="mt-2 text-xs text-red-300">Completează numele.</div>
                              ) : null}
                            </div>

                            <div className={`mt-4 ${shakeKey === 'phone' ? styles.shake : ''}`}>
                              <label htmlFor="offer-phone" className="block text-sm font-medium text-white/70 mb-1">
                                Telefon
                              </label>
                              <input
                                id="offer-phone"
                                value={phone}
                                onChange={(e) => setPhone(formatRoPhone(e.target.value))}
                                onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
                                type="tel"
                                className={`w-full bg-white/5 border rounded-2xl px-4 py-3 outline-none transition-colors ${
                                  phone.trim()
                                    ? isPhoneValid
                                      ? 'border-emerald-400/50 focus:border-emerald-400'
                                      : 'border-red-400/50 focus:border-red-400'
                                    : 'border-white/10 focus:border-orange-400'
                                }`}
                                placeholder="+40 7xx xxx xxx"
                                autoComplete="tel"
                              />
                              {touched.phone && phone.trim() && !isPhoneValid ? (
                                <div className="mt-2 text-xs text-red-300">Număr invalid. Exemplu: +40 769 889 721</div>
                              ) : null}
                            </div>

                            <div className={`mt-4 ${shakeKey === 'email' ? styles.shake : ''}`}>
                              <label htmlFor="offer-email" className="block text-sm font-medium text-white/70 mb-1">
                                Email (opțional)
                              </label>
                              <div className="relative">
                                <input
                                  id="offer-email"
                                  value={email}
                                  onChange={(e) => setEmail(e.target.value)}
                                  onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                                  type="email"
                                  className={`w-full bg-white/5 border rounded-2xl px-4 py-3 pr-10 outline-none transition-colors ${
                                    email.trim()
                                      ? isEmailValid(email)
                                        ? 'border-emerald-400/50 focus:border-emerald-400'
                                        : 'border-red-400/50 focus:border-red-400'
                                      : 'border-white/10 focus:border-orange-400'
                                  }`}
                                  placeholder="exemplu@email.com"
                                  autoComplete="email"
                                />
                                <svg viewBox="0 0 24 24" className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-400" aria-hidden>
                                  <path
                                    d="M20 7L10.5 16.5L4 10"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className={`${styles.checkPath} ${isEmailValid(email) ? styles.checkValid : ''}`}
                                  />
                                </svg>
                              </div>
                              {touched.email && email.trim() && !emailOk ? (
                                <div className="mt-2 text-xs text-red-300">Email invalid.</div>
                              ) : null}
                            </div>

                            <div className="mt-4">
                              <label htmlFor="offer-hp" className="sr-only">
                                Website
                              </label>
                              <input
                                id="offer-hp"
                                value={hp}
                                onChange={(e) => setHp(e.target.value)}
                                type="text"
                                tabIndex={-1}
                                autoComplete="off"
                                className="absolute left-[-9999px] top-auto h-px w-px opacity-0"
                                aria-hidden
                              />
                            </div>

                            <div className={`mt-4 ${shakeKey === 'math' ? styles.shake : ''}`}>
                              <label htmlFor="offer-math" className="block text-sm font-medium text-white/70 mb-1">
                                Verificare anti-spam: cât face {antiSpam.a} + {antiSpam.b}?
                              </label>
                              <input
                                id="offer-math"
                                value={mathAnswer}
                                onChange={(e) => setMathAnswer(e.target.value.replace(/[^\d]/g, '').slice(0, 3))}
                                onBlur={() => setTouched((t) => ({ ...t, math: true }))}
                                inputMode="numeric"
                                className={`w-full bg-white/5 border rounded-2xl px-4 py-3 outline-none transition-colors ${
                                  mathAnswer.trim()
                                    ? isMathOk
                                      ? 'border-emerald-400/50 focus:border-emerald-400'
                                      : 'border-red-400/50 focus:border-red-400'
                                    : 'border-white/10 focus:border-orange-400'
                                }`}
                                placeholder="Răspuns"
                              />
                              {touched.math && !mathAnswer.trim() ? (
                                <div className="mt-2 text-xs text-red-300">Completează verificarea anti-spam.</div>
                              ) : touched.math && mathAnswer.trim() && !isMathOk ? (
                                <div className="mt-2 text-xs text-red-300">Răspuns greșit.</div>
                              ) : null}
                            </div>

                            <label className={`mt-5 flex items-start gap-3 text-sm text-white/70 ${shakeKey === 'consent' ? styles.shake : ''}`}>
                              <input
                                type="checkbox"
                                checked={consent}
                                onChange={(e) => setConsent(e.target.checked)}
                                className="mt-1 h-4 w-4 rounded border-white/20 bg-white/10"
                              />
                              <span>
                                Sunt de acord cu prelucrarea datelor pentru a fi contactat.
                                <span className="ml-2">
                                  <a href="/privacy" className="underline underline-offset-4 decoration-white/20 hover:decoration-white/60 hover:text-white">
                                    Politica de confidențialitate
                                  </a>
                                </span>
                              </span>
                            </label>

                            <div className="mt-5 flex items-center justify-between gap-3">
                              <button type="button" onClick={() => setStep(1)} className="text-sm font-semibold text-white/70 hover:text-white">
                                Înapoi
                              </button>
                              <button
                                type="submit"
                                disabled={busy || !canSubmit}
                                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-400 px-6 py-3 text-sm font-black text-black disabled:opacity-50"
                              >
                                {busy ? 'Se trimite…' : 'Trimite'} <ArrowRight className="h-4 w-4" aria-hidden />
                              </button>
                            </div>

                            <div className="mt-4 text-xs text-white/55">
                              Serviciu: <span className="text-white/80">{selectedServiceLabel || '—'}</span>
                            </div>
                          </section>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
