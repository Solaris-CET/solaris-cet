import { useLanguage } from '../hooks/useLanguage';

export default function ResponsibleDisclosurePage() {
  const { lang, t } = useLanguage();
  const isRo = lang === 'ro';

  return (
    <main id="main-content" tabIndex={-1} className="relative z-10 px-6 py-16">
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="font-display text-2xl md:text-3xl text-white">{t.seo.responsibleDisclosureTitle}</h1>
        <p className="mt-4 text-sm text-white/70 leading-relaxed">{t.seo.responsibleDisclosureDescription}</p>

        <section className="mt-10 rounded-2xl border border-white/10 bg-black/30 p-6">
          <div className="text-sm font-semibold text-white">{isRo ? 'Contact' : 'Contact'}</div>
          <ul className="mt-3 text-sm text-white/70 leading-relaxed list-disc pl-5">
            <li>
              Email: <a className="text-solaris-gold hover:underline" href="mailto:security@solaris-cet.com">security@solaris-cet.com</a>
            </li>
            <li>
              Telegram: <a className="text-solaris-gold hover:underline" href="https://t.me/SolarisCET" target="_blank" rel="noopener noreferrer">t.me/SolarisCET</a>
            </li>
            <li>
              GitHub advisories:{' '}
              <a
                className="text-solaris-gold hover:underline"
                href="https://github.com/Solaris-CET/solaris-cet/security/advisories/new"
                target="_blank"
                rel="noopener noreferrer"
              >
                Private report form
              </a>
            </li>
          </ul>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-6">
          <div className="text-sm font-semibold text-white">{isRo ? 'Scope' : 'Scope'}</div>
          <p className="mt-2 text-sm text-white/70 leading-relaxed">
            {isRo
              ? 'Includeți vulnerabilități legate de site-ul Solaris CET, rutele /api, configurația de securitate, și integrările (ex: TON Connect) atunci când impactul este demonstrabil.'
              : 'Include vulnerabilities related to the Solaris CET website, /api routes, security configuration, and integrations (e.g., TON Connect) when the impact is demonstrable.'}
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-6">
          <div className="text-sm font-semibold text-white">{isRo ? 'Cum raportezi' : 'How to report'}</div>
          <ul className="mt-3 text-sm text-white/70 leading-relaxed list-disc pl-5">
            <li>
              {isRo
                ? 'Trimiteți pași de reproducere, request/response (fără secrete), impact și, dacă e posibil, un PoC minim.'
                : 'Send reproduction steps, request/response (no secrets), impact, and a minimal PoC if possible.'}
            </li>
            <li>
              {isRo
                ? 'Nu includeți date personale ale utilizatorilor și nu exfiltrați date. Demonstrăm impactul cu minim de acces.'
                : 'Do not include user personal data and do not exfiltrate data. Demonstrate impact with minimal access.'}
            </li>
            <li>
              {isRo
                ? 'Evitați testele de tip DoS, spam, inginerie socială sau scanări agresive fără acord.'
                : 'Avoid DoS, spam, social engineering, or aggressive scanning without prior consent.'}
            </li>
          </ul>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-6">
          <div className="text-sm font-semibold text-white">{isRo ? 'Timp de răspuns' : 'Response timeline'}</div>
          <ul className="mt-3 text-sm text-white/70 leading-relaxed list-disc pl-5">
            <li>{isRo ? 'Confirmare primire: în 72h (de regulă).' : 'Acknowledgement: within 72 hours (typically).'}</li>
            <li>{isRo ? 'Update status: la fiecare 7–14 zile pentru cazuri active.' : 'Status updates: every 7–14 days for active cases.'}</li>
            <li>{isRo ? 'Remediere: în funcție de severitate și complexitate.' : 'Fix: depends on severity and complexity.'}</li>
          </ul>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-6">
          <div className="text-sm font-semibold text-white">{isRo ? 'Safe harbor' : 'Safe harbor'}</div>
          <p className="mt-2 text-sm text-white/70 leading-relaxed">
            {isRo
              ? 'Dacă acționați cu bună credință, evitați accesul la date ale altor utilizatori și raportați rapid, Solaris CET va trata raportul ca responsible disclosure și nu va iniția acțiuni împotriva cercetătorului pentru testarea autorizată implicit.'
              : 'If you act in good faith, avoid accessing other users’ data, and report promptly, Solaris CET will treat your report as responsible disclosure and will not pursue action against the researcher for implicitly authorized testing.'}
          </p>
        </section>
      </div>
    </main>
  );
}

