import { Helmet } from 'react-helmet-async';

export default function Cookies() {
  return (
    <>
      <Helmet>
        <title>Politică Cookie — Solaris CET</title>
        <meta name="description" content="Politica de cookie-uri a Solaris CET." />
      </Helmet>
      <div className="mx-auto max-w-4xl px-4 py-16 text-white">
        <h1 className="text-3xl font-bold text-amber-400 mb-8">Politică Cookie</h1>
        <p className="text-sm text-slate-400 mb-6">Ultima actualizare: 13 iunie 2026</p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-amber-300 mb-3">1. Ce sunt cookie-urile</h2>
          <p className="text-slate-300 leading-relaxed">
            Cookie-urile sunt fișiere text mici stocate pe dispozitiv pentru a reține preferințe.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-amber-300 mb-3">2. Tipuri folosite</h2>
          <ul className="list-disc list-inside text-slate-300 mt-2 space-y-1">
            <li>Cookie-uri esențiale (necesare)</li>
            <li>Cookie-uri analitice (anonime)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-amber-300 mb-3">3. Contact</h2>
          <p className="text-slate-300 leading-relaxed">
            E-mail: solaris-cet@protonmail.com | Telefon: +40 769 889 721
          </p>
        </section>
      </div>
    </>
  );
}
