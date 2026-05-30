import { BadgeCheck, ShieldCheck } from 'lucide-react';

export default function TrustSignalsStrip() {
  return (
    <section className="relative z-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 xl:px-12 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-10 items-center">
          <div>
            <div className="text-sm font-semibold text-slate-600">Încredere & conformitate</div>
            <div className="mt-2 text-2xl md:text-3xl font-black text-slate-950">Semnale clare pentru o decizie rapidă</div>
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { label: 'ANRE', icon: <BadgeCheck className="h-4 w-4" aria-hidden /> },
                { label: 'AFM', icon: <BadgeCheck className="h-4 w-4" aria-hidden /> },
                { label: 'Garanție', icon: <ShieldCheck className="h-4 w-4" aria-hidden /> },
                { label: 'Asigurat', icon: <ShieldCheck className="h-4 w-4" aria-hidden /> },
              ].map((x) => (
                <div
                  key={x.label}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800"
                >
                  <span className="text-amber-600">{x.icon}</span>
                  {x.label}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { value: '5+', label: 'ani experiență' },
              { value: '50+', label: 'proiecte' },
              { value: '750 kW', label: 'instalați' },
              { value: '12', label: 'județe' },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="text-2xl font-black text-slate-950 tabular-nums">{s.value}</div>
                <div className="mt-1 text-sm font-semibold text-slate-600">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

