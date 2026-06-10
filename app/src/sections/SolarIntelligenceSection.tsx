import HierarchyGraph from '@/components/HierarchyGraph';

export default function SolarIntelligenceSection() {
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

        <div className="mt-10 max-w-3xl">
          <HierarchyGraph query="Help me choose a residential solar PV system in Romania. Consider roof type, annual consumption, shading, budget and desired payback. Output a short Mermaid graph." />
        </div>
      </div>
    </section>
  );
}
