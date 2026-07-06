import { useLanguage } from '../hooks/useLanguage';

export default function AccessibilityPage() {
  const { t } = useLanguage();

  return (
    <main id="main-content" tabIndex={-1} className="relative z-10 px-6 py-16">
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="font-display text-2xl md:text-3xl text-white">{t.seo.accessibilityTitle}</h1>
        <p className="mt-4 text-sm text-white/70 leading-relaxed">{t.seo.accessibilityDescription}</p>

        <section className="mt-10 rounded-2xl border border-white/10 bg-black/30 p-6">
          <div className="text-sm font-semibold text-white">Status</div>
          <p className="mt-2 text-sm text-white/70 leading-relaxed">
            This page is a lightweight accessibility statement for the Solaris CET SPA.
          </p>
        </section>
      </div>
    </main>
  );
}

