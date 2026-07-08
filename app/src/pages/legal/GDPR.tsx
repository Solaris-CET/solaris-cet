export default function GDPR() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 text-white">
      <h1 className="text-3xl font-bold text-amber-400 mb-8">Politică de Confidențialitate</h1>
      <p className="text-sm text-slate-400 mb-6">Ultima actualizare: 13 iunie 2026</p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-amber-300 mb-3">1. Cine suntem</h2>
        <p className="text-slate-300 leading-relaxed">
          Solaris CET este o companie specializată în instalații fotovoltaice, lucrări de construcții și acoperișuri, cu sediul în Cetățuia, Vaslui, România.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-amber-300 mb-3">2. Ce date colectăm</h2>
        <ul className="list-disc list-inside text-slate-300 mt-2 space-y-1">
          <li>Nume și prenume</li>
          <li>Adresă de e-mail</li>
          <li>Număr de telefon</li>
          <li>Adresă poștală</li>
          <li>Informații despre proprietate</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-amber-300 mb-3">3. Drepturile tale</h2>
        <p className="text-slate-300 leading-relaxed">
          Conform GDPR, ai dreptul de acces, rectificare, ștergere, portabilitate și opoziție.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-amber-300 mb-3">4. Contact</h2>
        <p className="text-slate-300 leading-relaxed">
          E-mail: solaris-cet@protonmail.com | Telefon: +40 769 889 721
        </p>
      </section>
    </div>
  );
}
