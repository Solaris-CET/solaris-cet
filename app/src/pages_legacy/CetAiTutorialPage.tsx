import { useLanguage } from '@/hooks/useLanguage';

export default function CetAiTutorialPage() {
  const { t } = useLanguage();

  return (
    <main id="main-content" tabIndex={-1} className="relative mx-auto w-full max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-bold text-white">{t.cetAi.title} — Tutorial</h1>
      <p className="mt-3 text-white/70 leading-relaxed">
        Ghid rapid pentru a folosi AI Oracle (CET AI) eficient: selecție de model, regenerare, export, voice input și pin-uri.
      </p>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold text-white">1) Întrebări bune</h2>
        <ul className="list-disc pl-5 text-white/75 space-y-2">
          <li>Spune ce vrei: "pași", "tabel", "bullet points".</li>
          <li>Include contextul minim: sumă, pool, deadline, ce ai încercat.</li>
          <li>Cere verificare: "arată presupunerile" sau "fără prețuri dacă nu ai live data".</li>
        </ul>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold text-white">2) Model + ton + mod</h2>
        <ul className="list-disc pl-5 text-white/75 space-y-2">
          <li>Model: Auto (routing) / Grok / Gemini.</li>
          <li>Tone: Brand / Neutral / Fun.</li>
          <li>Mode: Default / Read (articol) / ELI5.</li>
        </ul>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold text-white">3) Regenerează fără să pierzi istoricul</h2>
        <p className="text-white/75 leading-relaxed">
          Folosește butonul de regenerare pentru a crea o variantă nouă a răspunsului. Variantele vechi rămân în istoric.
        </p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold text-white">4) Pin-uri + export</h2>
        <ul className="list-disc pl-5 text-white/75 space-y-2">
          <li>Pin: salvează răspunsurile importante în lista "Pins".</li>
          <li>Export: descarcă istoricul în JSON sau Markdown.</li>
        </ul>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold text-white">5) Voice</h2>
        <p className="text-white/75 leading-relaxed">
          Activează input vocal (speech-to-text) din butonul de microfon și ascultă răspunsul cu text-to-speech.
        </p>
      </section>
    </main>
  );
}

