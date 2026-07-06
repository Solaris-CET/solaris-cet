import { CheckCircle2, XCircle } from 'lucide-react';

function Mark({ ok }: { ok: boolean }) {
  return ok ? (
    <CheckCircle2 className="h-5 w-5 text-emerald-400" aria-hidden />
  ) : (
    <XCircle className="h-5 w-5 text-red-400/70" aria-hidden />
  );
}

export default function SolarCompetitionSection() {
  const rows = [
    { label: 'Clarificare tip lucrare și obiectiv comercial', us: true, others: false },
    { label: 'Repere de buget și următorul pas potrivit', us: true, others: false },
    { label: 'Explicații despre documente / finanțare (când se aplică)', us: true, others: false },
    { label: 'Detalii tehnice minime cerute pentru ofertă bună', us: true, others: false },
    { label: 'Variantă pentru mentenanță / reparații / urgențe', us: true, others: false },
    { label: 'Trimitere către calculator, serviciu sau contact corect', us: true, others: false },
  ];

  return (
    <section id="competition" className="py-24 bg-[#05060B]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 xl:px-12">
        <div className="max-w-3xl" data-reveal>
          <h2 className="text-3xl md:text-5xl font-bold text-white">Comparație rapidă</h2>
          <p className="mt-4 text-slate-300 text-lg">
            Nu comparăm promisiuni vagi cu alte firme. Comparăm o ofertare clară, ghidată comercial, cu o cerere generică în care clientul nu știe ce urmează.
          </p>
        </div>

        <div
          className="mt-10 overflow-x-auto rounded-3xl border border-white/10 bg-black/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05060B]"
          data-reveal
          role="region"
          aria-label="Tabel de comparație Solaris CET vs. concurență"
          tabIndex={0}
        >
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr className="border-b border-white/10">
                <th scope="col" className="p-5 text-left text-sm font-semibold text-slate-200">
                  Criteriu
                </th>
                <th scope="col" className="p-5 text-center text-sm font-black text-amber-300">
                  Solaris CET
                </th>
                <th scope="col" className="p-5 text-center text-sm font-semibold text-slate-200">
                  Cerere generică
                </th>
              </tr>
            </thead>
            <tbody data-reveal-stagger>
              {rows.map((r) => (
                <tr key={r.label} className="border-b border-white/5 last:border-b-0">
                  <th scope="row" className="p-5 text-left text-sm text-slate-200">
                    {r.label}
                  </th>
                  <td className="p-5">
                    <div className="flex justify-center">
                      <Mark ok={r.us} />
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex justify-center">
                      <Mark ok={r.others} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4" data-reveal>
          <a
            href="/contact?service=fotovoltaice"
            className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-7 py-4 text-base font-black text-black"
          >
            Solicită evaluare gratuită
          </a>
          <a href="tel:+40769889721" className="text-slate-300 hover:text-white underline underline-offset-4">
            +40 769 889 721
          </a>
        </div>
      </div>
    </section>
  );
}
