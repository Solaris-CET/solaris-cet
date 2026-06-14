import { ArrowLeft, Home, Search, Wrench, MessageCircle } from 'lucide-react';
import { useMemo } from 'react';

import { SolarisFooter } from '@/components/company/SolarisFooter';
import { useLanguage } from '@/hooks/useLanguage';
import { localizePathname } from '@/i18n/urlRouting';

export default function NotFoundPage({ attemptedPath, staticRedirectHref }: { attemptedPath?: string; staticRedirectHref?: string }) {
  const { t, lang } = useLanguage();

  const homeHref = localizePathname('/', lang);
  const servicesHref = localizePathname('/servicii', lang);
  const contactHref = localizePathname('/contact', lang);

  const popularServices = useMemo(
    () => [
      { label: 'Fotovoltaice rezidențiale', href: localizePathname('/servicii/fotovoltaice-rezidentiale', lang) },
      { label: 'Acoperișuri tablă / țiglă', href: localizePathname('/servicii/acoperisuri-tabla-tigla', lang) },
      { label: 'Reparații și mentenanță', href: localizePathname('/servicii/reparatii-si-mentenanta', lang) },
    ],
    [lang],
  );

  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-slate-950 pt-24 pb-0 text-white">
      <div className="mx-auto max-w-4xl px-5 sm:px-8 xl:px-12">
        <div className="rounded-3xl border border-white/10 bg-black/30 p-8 sm:p-12 text-center" data-reveal>
          <div className="text-8xl font-black text-amber-400 animate-pulse">404</div>
          <h1 className="mt-4 text-3xl font-bold text-white">Oops! Această pagină s-a dus la soare ☀️</h1>
          <p className="mt-3 text-lg text-slate-300">Pagina nu există sau a fost mutată.</p>

          {staticRedirectHref ? (
            <p className="mt-4 text-sm text-slate-400">
              Încearcă <a href={staticRedirectHref} className="text-amber-400 underline">noua adresă</a>.
            </p>
          ) : null}

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href={homeHref} className="inline-flex items-center gap-2 rounded-2xl bg-amber-400 px-6 py-3 text-sm font-black text-black">
              <Home className="h-4 w-4" aria-hidden />
              🏠 Acasă
            </a>
            <a href={servicesHref} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10">
              <Wrench className="h-4 w-4" aria-hidden />
              🔧 Servicii
            </a>
            <a href={contactHref} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10">
              <ArrowLeft className="h-4 w-4" aria-hidden />
              📞 Contact
            </a>
          </div>

          <div className="mt-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" aria-hidden />
              <input
                type="text"
                placeholder="Caută pe site..."
                className="w-full rounded-2xl border border-white/10 bg-white/5 pl-12 pr-4 py-4 text-white outline-none transition-colors placeholder:text-white/35 focus:border-amber-400"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                    window.location.href = `/search?q=${encodeURIComponent(e.currentTarget.value.trim())}`;
                  }
                }}
              />
            </div>
          </div>

          <div className="mt-8">
            <p className="text-sm text-slate-400 mb-4">Servicii populare:</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {popularServices.map((s) => (
                <a
                  key={s.href}
                  href={s.href}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <a
              href="#chat-widget"
              className="inline-flex items-center gap-2 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-6 py-3 text-sm font-semibold text-amber-200 hover:bg-amber-400/15"
              onClick={(e) => {
                e.preventDefault();
                window.dispatchEvent(new CustomEvent('open-chat-widget'));
              }}
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              Sau întreabă Solarix: 💬
            </a>
          </div>
        </div>
      </div>
      <div className="mt-16">
        <SolarisFooter />
      </div>
    </main>
  );
}
