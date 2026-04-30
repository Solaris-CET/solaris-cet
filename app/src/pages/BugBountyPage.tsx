import { useLanguage } from '../hooks/useLanguage';

export default function BugBountyPage() {
  const { lang, t } = useLanguage();
  const isRo = lang === 'ro';

  return (
    <main id="main-content" tabIndex={-1} className="relative z-10 px-6 py-16">
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="font-display text-2xl md:text-3xl text-white">{t.seo.bugBountyTitle}</h1>
        <p className="mt-4 text-sm text-white/70 leading-relaxed">{t.seo.bugBountyDescription}</p>

        <section className="mt-10 rounded-2xl border border-white/10 bg-black/30 p-6">
          <div className="text-sm font-semibold text-white">{isRo ? 'Status program' : 'Program status'}</div>
          <p className="mt-2 text-sm text-white/70 leading-relaxed">
            {isRo
              ? 'Program pilot. Recompensele sunt discreționare și depind de severitate, calitatea raportului și reproductibilitate.'
              : 'Pilot program. Rewards are discretionary and depend on severity, report quality, and reproducibility.'}
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-6">
          <div className="text-sm font-semibold text-white">{isRo ? 'Severitate & recompense' : 'Severity & rewards'}</div>
          <div className="mt-3 grid gap-3">
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="text-sm text-white">{isRo ? 'Critic' : 'Critical'}</div>
              <div className="mt-1 text-sm text-white/70">
                {isRo
                  ? 'Execuție de cod, bypass auth, exfiltrare date sensibile, impact sistemic.'
                  : 'RCE, auth bypass, sensitive data exfiltration, systemic impact.'}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="text-sm text-white">{isRo ? 'Înalt' : 'High'}</div>
              <div className="mt-1 text-sm text-white/70">
                {isRo
                  ? 'IDOR, bypass rate limit, XSS exploatabil, escaladare privilegii.'
                  : 'IDOR, rate-limit bypass, exploitable XSS, privilege escalation.'}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="text-sm text-white">{isRo ? 'Mediu' : 'Medium'}</div>
              <div className="mt-1 text-sm text-white/70">
                {isRo
                  ? 'Leak de informații non-critice, misconfig de headers, probleme logice.'
                  : 'Non-critical info leak, security header misconfig, logic issues.'}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="text-sm text-white">{isRo ? 'Scăzut' : 'Low'}</div>
              <div className="mt-1 text-sm text-white/70">
                {isRo ? 'Hardening, best-practice, informativ.' : 'Hardening, best-practice, informational.'}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-6">
          <div className="text-sm font-semibold text-white">{isRo ? 'Reguli' : 'Rules'}</div>
          <ul className="mt-3 text-sm text-white/70 leading-relaxed list-disc pl-5">
            <li>
              {isRo
                ? 'Testați doar pe conturile dumneavoastră și pe date non-sensibile.'
                : 'Test only against your own accounts and non-sensitive data.'}
            </li>
            <li>
              {isRo
                ? 'Nu executați DoS, nu faceți brute-force agresiv și nu scanați infrastructura terță fără acord.'
                : 'No DoS, no aggressive brute-force, and no scanning of third-party infrastructure without consent.'}
            </li>
            <li>
              {isRo
                ? 'Raportați imediat și păstrați confidențialitatea până la fix / disclosure coordonat.'
                : 'Report promptly and keep details confidential until fixed / coordinated disclosure.'}
            </li>
          </ul>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-6">
          <div className="text-sm font-semibold text-white">{isRo ? 'Cum aplici' : 'How to apply'}</div>
          <p className="mt-2 text-sm text-white/70 leading-relaxed">
            {isRo
              ? 'Trimiteți raportul prin pagina de Dezvăluire responsabilă. Pentru bug bounty, includeți severitatea propusă și o descriere clară a impactului.'
              : 'Submit your report via the Responsible Disclosure page. For bug bounty consideration, include your proposed severity and a clear impact description.'}
          </p>
          <div className="mt-3">
            <a className="text-solaris-gold hover:underline" href="/responsible-disclosure">
              {isRo ? 'Deschide Responsible Disclosure' : 'Open Responsible Disclosure'}
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}

