import { useMemo } from 'react';
import { useLanguageState } from '@/hooks/useLanguage';

export default function AccessibilityPage() {
  const lang = useLanguageState();
  const title = useMemo(() => {
    const seo = (lang.t as unknown as { seo?: Record<string, string> }).seo ?? {};
    return seo.accessibilityTitle ?? seo.homeTitle ?? 'Accessibility';
  }, [lang.t]);

  return (
    <main id="main-content" tabIndex={-1} className="relative z-10 px-6 py-16">
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="font-display text-2xl md:text-3xl text-white tracking-tight">{title}</h1>
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-6 text-sm text-white/80 leading-relaxed">
          <p>
            If you need an alternate format or assistance using this site, contact us via the links in the footer.
          </p>
          <p className="mt-3">Keyboard: use Tab/Shift+Tab to navigate, Enter to activate controls.</p>
        </div>
      </div>
    </main>
  );
}

