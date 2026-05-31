import { Camera, Globe, Play } from 'lucide-react';
import { useMemo } from 'react';

import AppImage from '@/components/AppImage';
import { companyProfile } from '@/data/companyProfile';
import { useLanguage } from '@/hooks/useLanguage';
import { localizePathname, parseUrlLocaleFromPathname, urlLocaleFromLang } from '@/i18n/urlRouting';
import { cn } from '@/lib/utils';

import { SolarisLogoMark } from '../SolarisLogoMark';

type FooterLink = { label: string; href: string };

function pickSocialUrl(kind: 'facebook' | 'instagram' | 'youtube'): string {
  const v = companyProfile.social[kind];
  if (v) return v;
  if (kind === 'facebook') return 'https://facebook.com';
  if (kind === 'instagram') return 'https://instagram.com';
  return 'https://youtube.com';
}

export function SolarisFooter({ className }: { className?: string }) {
  const { lang, t } = useLanguage();
  const urlLocale =
    typeof window === 'undefined'
      ? urlLocaleFromLang(lang)
      : parseUrlLocaleFromPathname(window.location.pathname).locale ?? urlLocaleFromLang(lang);

  const yearLine = useMemo(() => {
    const y = new Date().getFullYear();
    return `© 2025–${y} ${companyProfile.name}. Toate drepturile rezervate.`;
  }, []);

  const homePath = localizePathname('/', urlLocale);
  const servicesHref = localizePathname('/servicii', urlLocale);

  const serviceLinks: FooterLink[] = [
    { label: 'Fotovoltaice Rezidențiale', href: `${servicesHref}#fotovoltaice` },
    { label: 'Fotovoltaice Industriale', href: `${servicesHref}#fotovoltaice` },
    { label: 'Acoperișuri Tablă/Țiglă', href: `${servicesHref}#acoperisuri` },
    { label: 'Acoperișuri TPO', href: `${servicesHref}#tpo` },
    { label: 'Atice și Fațade', href: `${servicesHref}#atice-fatade` },
    { label: 'Reparații și Mentenanță', href: `${servicesHref}#reparatii` },
  ];

  const companyLinks: FooterLink[] = [
    { label: t.nav.about, href: localizePathname('/despre', urlLocale) },
    { label: t.nav.portfolio, href: `${homePath}#proiecte` },
    { label: t.nav.blog, href: localizePathname('/blog', urlLocale) },
    { label: `${t.nav.financing} (Casa Verde)`, href: localizePathname('/finantare/casa-verde-2025', urlLocale) },
    { label: t.nav.contact, href: localizePathname('/contact', urlLocale) },
    { label: t.nav.requestOffer, href: localizePathname('/contact', urlLocale) },
  ];

  const legalLinks: FooterLink[] = [
    { label: 'Politică Cookies', href: localizePathname('/cookies', urlLocale) },
    { label: 'Confidențialitate', href: localizePathname('/privacy', urlLocale) },
    { label: 'Termeni și Condiții', href: localizePathname('/terms', urlLocale) },
  ];

  return (
    <footer id="footer" className={cn('bg-[#020617] text-white', className)}>
      <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-400/70 to-transparent" aria-hidden />

      <div className="max-w-7xl mx-auto px-5 sm:px-8 xl:px-12 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-10">
          <div className="space-y-4">
            <a href={homePath} className="inline-flex items-center gap-3" aria-label={companyProfile.name}>
              <span className="h-11 w-11 rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                <SolarisLogoMark className="h-full w-full" />
              </span>
              <span className="text-white font-semibold">
                Solaris <span className="text-amber-400">CET</span>
              </span>
            </a>
            <div className="text-sm font-semibold text-slate-200">{companyProfile.tagline}</div>
            <div className="text-sm text-slate-400 leading-relaxed max-w-sm">{companyProfile.shortDescription}</div>

            <div className="flex items-center gap-3 pt-2">
              {[{
                label: 'Facebook',
                href: pickSocialUrl('facebook'),
                icon: <Globe className="h-4 w-4" aria-hidden />,
              },
              {
                label: 'Instagram',
                href: pickSocialUrl('instagram'),
                icon: <Camera className="h-4 w-4" aria-hidden />,
              },
              {
                label: 'YouTube',
                href: pickSocialUrl('youtube'),
                icon: <Play className="h-4 w-4" aria-hidden />,
              }].map((x) => (
                <a
                  key={x.label}
                  href={x.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300 hover:text-amber-400 hover:border-amber-400/50 transition-colors"
                  aria-label={x.label}
                >
                  {x.icon}
                </a>
              ))}
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold text-slate-200">Servicii</div>
            <div className="mt-4 grid grid-cols-1 gap-2 text-sm">
              {serviceLinks.map((l) => (
                <a key={l.label} href={l.href} className="text-slate-400 hover:text-amber-400 transition-colors">
                  {l.label}
                </a>
              ))}
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold text-slate-200">Companie</div>
            <div className="mt-4 grid grid-cols-1 gap-2 text-sm">
              {companyLinks.map((l) => (
                <a key={l.label} href={l.href} className="text-slate-400 hover:text-amber-400 transition-colors">
                  {l.label}
                </a>
              ))}
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold text-slate-200">Contact</div>
            <div className="mt-4 space-y-2 text-sm">
              <a className="text-slate-400 hover:text-amber-400 transition-colors" href={`tel:${companyProfile.phone}`}>
                ☎ {companyProfile.phoneDisplay}
              </a>
              <a className="text-slate-400 hover:text-amber-400 transition-colors" href={`mailto:${companyProfile.email}`}>
                📧 {companyProfile.email}
              </a>
              <div className="text-slate-400">📍 {companyProfile.location}</div>
              <div className="text-slate-400">Program: {companyProfile.program}</div>
              <div className="text-slate-400">⚡ {companyProfile.urgent}</div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col gap-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="text-xs text-slate-500">{yearLine}</div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs">
              {legalLinks.map((l, idx) => (
                <span key={l.label} className="inline-flex items-center gap-3">
                  <a href={l.href} className="text-slate-500 hover:text-amber-400 transition-colors">
                    {l.label}
                  </a>
                  {idx < legalLinks.length - 1 ? <span className="text-slate-700" aria-hidden>|</span> : null}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex flex-wrap items-center gap-3">
              <a href="https://anpc.ro" target="_blank" rel="noopener noreferrer" className="inline-flex">
                <AppImage src="/images/anpc-sal.svg" alt="ANPC-SAL" width={220} height={70} className="h-14 w-auto" />
              </a>
              <a href="https://anpc.ro" target="_blank" rel="noopener noreferrer" className="inline-flex">
                <AppImage src="/images/anpc-sol.svg" alt="ANPC-SOL" width={220} height={70} className="h-14 w-auto" />
              </a>
            </div>

            <div className="text-xs text-slate-500">
              {companyProfile.cui ? <span>CUI: {companyProfile.cui}</span> : null}
              {companyProfile.cui && companyProfile.regCom ? <span className="mx-2 text-slate-700">•</span> : null}
              {companyProfile.regCom ? <span>Nr. Reg. Com.: {companyProfile.regCom}</span> : null}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
