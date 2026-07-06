import CetAiSearch from '@/components/CetAiSearch';

export default function SolarAiAssistantSection() {
  return (
    <section id="cet-ai" className="py-24 bg-[#03040A]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 xl:px-12">
        <div className="max-w-3xl">
          <h2 className="text-3xl md:text-5xl font-bold text-white">Asistent rapid</h2>
          <p className="mt-4 text-slate-300 text-lg">
            Întreabă orice despre ofertă, montaj și pașii de execuție. Primești un răspuns clar și o listă de pași următori.
          </p>
        </div>

        <div className="mt-10">
          <CetAiSearch />
        </div>
      </div>
    </section>
  );
}

