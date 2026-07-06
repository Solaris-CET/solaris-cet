export default function SolarIntelligenceSection() {
  const decisionPaths = [
    {
      title: 'Casă + consum clar',
      text: 'Dacă ai consumul lunar și câteva poze cu acoperișul, următorul pas bun este calculatorul sau o ofertă rapidă.',
      ctaLabel: 'Deschide calculatorul',
      href: '/calculator',
    },
    {
      title: 'Acoperiș cu probleme',
      text: 'Dacă există infiltrații, atice sensibile sau detalii neclare, merită evaluare la locație înainte de orice ofertă finală.',
      ctaLabel: 'Solicită evaluare',
      href: '/contact',
    },
    {
      title: 'Hală / business',
      text: 'Pentru hale, TPO și proiecte industriale, intrăm direct în discuția tehnică despre structură, acces și etapizare.',
      ctaLabel: 'Cere ofertă',
      href: '/contact?service=fotovoltaice',
    },
  ] as const;

  return (
    <section id="intelligence" className="py-24 bg-[#070A12]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 xl:px-12">
        <div className="max-w-3xl">
          <h2 className="text-3xl md:text-5xl font-bold text-white">Alegerea sistemului, pe scurt</h2>
          <p className="mt-4 text-slate-300 text-lg">
            O hartă de decizie simplă care te ajută să vezi dacă are sens să mergi spre calculator, evaluare la locație sau ofertă directă.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3" data-reveal-stagger>
          {[
            { label: 'Întrebarea corectă', value: 'Nu „cât costă orice”, ci „ce sistem are sens pentru consumul și acoperișul meu?”' },
            { label: 'Ce filtrezi', value: 'Consumul real, tipul clientului, bateria, orientarea și nivelul de complexitate.' },
            { label: 'Rezultatul util', value: 'Un pas următor clar: calculator, serviciu dedicat sau evaluare la locație.' },
          ].map((item) => (
            <div key={item.label} className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/50">{item.label}</div>
              <div className="mt-2 text-sm leading-relaxed font-semibold text-white">{item.value}</div>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3" data-reveal-stagger>
          {decisionPaths.map((path) => (
            <article key={path.title} className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/50">Pas urmator clar</div>
              <h3 className="mt-3 text-xl font-bold text-white">{path.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">{path.text}</p>
              <a
                href={path.href}
                className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-amber-400/40 bg-amber-400/10 px-4 text-sm font-bold text-amber-200 transition-colors hover:bg-amber-400 hover:text-black"
              >
                {path.ctaLabel}
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
