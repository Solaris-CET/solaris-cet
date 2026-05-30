import HierarchyGraph from '@/components/HierarchyGraph';

export default function SolarIntelligenceSection() {
  return (
    <section id="intelligence" className="py-24 bg-[#070A12]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 xl:px-12">
        <div className="max-w-3xl">
          <h2 className="text-3xl md:text-5xl font-bold text-white">Alegerea sistemului, pe scurt</h2>
          <p className="mt-4 text-slate-300 text-lg">
            O hartă de decizie simplă (Mermaid) care te ajută să înțelegi pașii următori pentru un sistem fotovoltaic.
          </p>
        </div>

        <div className="mt-10 max-w-3xl">
          <HierarchyGraph query="Help me choose a residential solar PV system in Romania. Consider roof type, annual consumption, shading, budget and desired payback. Output a short Mermaid graph." />
        </div>
      </div>
    </section>
  );
}

