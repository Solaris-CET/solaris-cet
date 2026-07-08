export default function TokenCetPage() {
  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-solaris-offblack text-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16" data-reveal-stagger>
          <div className="inline-flex items-center gap-2 bg-solar-yellow/20 text-solar-yellow px-4 py-2 rounded-full mb-6 border border-solar-yellow/30">
            <span className="text-lg font-black" aria-hidden>
              CET
            </span>
            <span className="font-mono font-bold">TOKEN</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-solar-yellow via-white to-solar-yellow bg-clip-text text-transparent">
            Tokenul CET (loialitate & beneficii)
          </h1>
          <p className="mt-4 text-xl text-solaris-muted max-w-2xl mx-auto">
            CET este un token de loialitate folosit în relația cu clienții Solaris CET: reduceri, bonusuri și beneficii la servicii.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="/contact" className="btn-filled-gold text-sm px-6 py-3">
              Cere ofertă
            </a>
            <a href="tel:+40769889721" className="btn-outline-white text-sm px-6 py-3 font-mono">
              +40 769 889 721
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20" data-reveal-stagger>
          {[
            {
              title: 'Reduceri & prioritizare',
              text: 'CET poate fi folosit pentru reduceri la pachete selectate și pentru prioritizarea intervențiilor de mentenanță (în funcție de disponibilitate).',
              icon: '⚡',
            },
            {
              title: 'Bonus la proiecte',
              text: 'La anumite proiecte, oferim bonusuri CET după finalizarea lucrării și recepție (condiții comunicate în ofertă).',
              icon: '🎁',
            },
            {
              title: 'Garanții & transparență',
              text: 'CET este asociat cu istoricul proiectului: ofertă, etape, recepție și recomandări de mentenanță.',
              icon: '🛡',
            },
          ].map((x) => (
            <div key={x.title} className="bg-black/40 p-8 rounded-3xl border border-white/10 hover:border-solar-yellow/35 transition-colors">
              <div className="bg-solar-yellow/20 w-14 h-14 rounded-2xl flex items-center justify-center text-solar-yellow mb-6">
                <span className="text-2xl font-black" aria-hidden>
                  {x.icon}
                </span>
              </div>
              <h3 className="text-xl font-bold mb-4">{x.title}</h3>
              <p className="text-solaris-muted leading-relaxed">{x.text}</p>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-br from-solar-yellow/10 to-transparent p-10 sm:p-12 rounded-[3rem] border border-solar-yellow/20 relative overflow-hidden" data-reveal>
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Cum funcționează CET</h2>
              <div className="space-y-4 text-lg text-solaris-muted leading-relaxed">
                <p>
                  CET este un instrument de loialitate: îl poți primi în cadrul unor oferte și îl poți folosi pentru reduceri sau beneficii la servicii.
                </p>
                <p>
                  Condițiile se stabilesc transparent în ofertă (ce primești, când, pentru ce servicii se aplică).
                </p>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="/contact?service=ofertare" className="bg-solar-yellow text-black px-7 py-3 rounded-full font-bold hover:bg-amber-500 transition-colors">
                  Cere o ofertă cu CET
                </a>
                <a href="/servicii" className="btn-outline-white px-7 py-3 rounded-full font-bold">
                  Vezi servicii
                </a>
              </div>
            </div>
            <div className="hidden lg:flex justify-center">
              <div className="relative w-64 h-64">
                <div className="absolute inset-0 bg-solar-yellow/20 rounded-full blur-3xl" />
                <div className="relative bg-black rounded-full p-4 border border-solar-yellow/30 shadow-[0_0_50px_rgba(251,191,36,0.1)]">
                  <div className="w-56 h-56 rounded-full bg-gradient-to-tr from-solar-yellow to-amber-600 flex items-center justify-center">
                    <span className="text-6xl font-black text-black">CET</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
