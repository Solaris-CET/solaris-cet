import { useLanguage } from '@/hooks/useLanguage';
import { localizePathname, parseUrlLocaleFromPathname, urlLocaleFromLang } from '@/i18n/urlRouting';
import { cn } from '@/lib/utils';

import { SolarisLogoMark } from '../SolarisLogoMark';

export function SolarisFooter({ className }: { className?: string }) {
  const { lang, t } = useLanguage();
  const urlLocale =
    typeof window === 'undefined'
      ? urlLocaleFromLang(lang)
      : parseUrlLocaleFromPathname(window.location.pathname).locale ?? urlLocaleFromLang(lang);
  const servicesHref = localizePathname('/servicii', urlLocale);
  return (
    <footer className={cn('border-t border-white/10 bg-slate-950', className)}>
      <div className="max-w-7xl mx-auto px-5 sm:px-8 xl:px-12 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="space-y-3">
            <a href={localizePathname('/', urlLocale)} className="inline-flex items-center gap-3" aria-label="Solaris CET">
              <span className="h-10 w-10 rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                <SolarisLogoMark className="h-full w-full" />
              </span>
              <span className="text-solaris-text font-semibold">
                Solaris <span className="text-solaris-gold">CET</span>
              </span>
            </a>
            <div className="text-sm text-solaris-muted leading-relaxed">
              Instalații fotovoltaice, construcții și acoperișuri (tablă/țiglă/TPO), atice și fațade tablă, reparații.
            </div>
            <div className="text-xs text-solaris-muted leading-relaxed space-y-1">
              <div>
                <span className="text-solaris-text/90 font-semibold">CUI:</span> ***********
              </div>
              <div>
                <span className="text-solaris-text/90 font-semibold">Adresă:</span> Cetatuia, Vaslui, 737429, România
              </div>
              <div>
                <span className="text-solaris-text/90 font-semibold">Acoperire:</span> toate județele
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-semibold text-solaris-text">Servicii</div>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <a className="text-solaris-muted hover:text-solaris-text" href={`${servicesHref}#fotovoltaice`}>
                Fotovoltaice
              </a>
              <a className="text-solaris-muted hover:text-solaris-text" href={`${servicesHref}#constructii`}>
                Construcții
              </a>
              <a className="text-solaris-muted hover:text-solaris-text" href={`${servicesHref}#acoperisuri`}>
                Acoperișuri tablă/țiglă
              </a>
              <a className="text-solaris-muted hover:text-solaris-text" href={`${servicesHref}#tpo`}>
                Acoperișuri TPO
              </a>
              <a className="text-solaris-muted hover:text-solaris-text" href={`${servicesHref}#atice-fatade`}>
                Atice & fațade tablă
              </a>
              <a className="text-solaris-muted hover:text-solaris-text" href={`${servicesHref}#reparatii`}>
                Reparații
              </a>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-semibold text-solaris-text">Contact</div>
            <div className="space-y-2 text-sm">
              <a className="inline-flex items-center gap-2 text-solaris-muted hover:text-solaris-text" href="tel:+40769889721">
                <span className="h-4 w-4 text-solaris-gold inline-flex items-center justify-center" aria-hidden>
                  ☎
                </span>
                +40 769 889 721
              </a>
              <a className="inline-flex items-center gap-2 text-solaris-muted hover:text-solaris-text" href="mailto:solaris-cet@protonmail.com">
                <span className="h-4 w-4 text-solaris-gold inline-flex items-center justify-center" aria-hidden>
                  ✉
                </span>
                solaris-cet@protonmail.com
              </a>
              <a
                className="inline-flex items-center gap-2 text-solaris-muted hover:text-solaris-text"
                href="https://www.facebook.com/STARTUPSOLARCOMPANY/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="h-4 w-4 text-solaris-gold inline-flex items-center justify-center font-black" aria-hidden>
                  f
                </span>
                Facebook
              </a>
              <a className="text-solaris-muted hover:text-solaris-text" href={localizePathname('/token-cet', urlLocale)}>
                Token CET
              </a>
              <a className="text-solaris-muted hover:text-solaris-text" href={localizePathname('/about', urlLocale)}>
                {t.nav.about}
              </a>
              <a className="text-solaris-muted hover:text-solaris-text" href={localizePathname('/faq', urlLocale)}>
                {t.nav.faq}
              </a>
              <a className="text-solaris-muted hover:text-solaris-text" href={localizePathname('/privacy', urlLocale)}>
                Confidențialitate
              </a>
              <a className="text-solaris-muted hover:text-solaris-text" href={localizePathname('/terms', urlLocale)}>
                Termeni
              </a>
              <a className="text-solaris-muted hover:text-solaris-text" href={localizePathname('/cookies', urlLocale)}>
                Cookie-uri
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 text-xs text-solaris-muted flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          <div>© {new Date().getFullYear()} Solaris CET. Toate drepturile rezervate.</div>
          <div>România</div>
        </div>
      </div>
    </footer>
  );
}
