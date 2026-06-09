import { ArrowRight, Globe, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { useMemo } from 'react';

import AppImage from '@/components/AppImage';
import { companyProfile } from '@/data/companyProfile';
import { useLanguage } from '@/hooks/useLanguage';
import { localizePathname, parseUrlLocaleFromPathname, urlLocaleFromLang } from '@/i18n/urlRouting';
import { cn } from '@/lib/utils';

import { SolarisLogoMark } from '../SolarisLogoMark';

type FooterLink = { label: string; href: string };

export function SolarisFooter({ className }: { className?: string }) {
  const { lang } = useLanguage();
  const urlLocale =
    typeof window === 'undefined'
      ? urlLocaleFromLang(lang)
      : parseUrlLocaleFromPathname(window.location.pathname).locale ?? urlLocaleFromLang(lang);

  const yearLine = useMemo(() => {
    const y = new Date().getFullYear();
    return `© 2025–${y} ${companyProfile.name}. Toate drepturile rezervate.`;
  }, []);

  const homePath = localizePathname('/', urlLocale);
  const serviceLinks: FooterLink[] = [
    { label: 'Fotovoltaice Rezidențiale', href: localizePathname('/servicii/fotovoltaice-rezidentiale', urlLocale) },
    { label: 'Fotovoltaice Industriale', href: localizePathname('/servicii/fotovoltaice-industriale', urlLocale) },
    { label: 'Acoperișuri Tablă/Țiglă', href: localizePathname('/servicii/acoperisuri-tabla-tigla', urlLocale) },
    { label: 'Acoperișuri TPO', href: localizePathname('/servicii/acoperisuri-industriale-tpo', urlLocale) },
    { label: 'Atice și Fațade', href: localizePathname('/servicii/atice-si-fatade-tabla', urlLocale) },
    { label: 'Reparații și Mentenanță', href: localizePathname('/servicii/reparatii-si-mentenanta', urlLocale) },
  ];

  const legalLinks: FooterLink[] = [
    { label: 'Politică Cookies', href: localizePathname('/cookies', urlLocale) },
    { label: 'Confidențialitate', href: localizePathname('/privacy', urlLocale) },
    { label: 'Termeni și Condiții', href: localizePathname('/terms', urlLocale) },
    { label: 'Contact', href: localizePathname('/contact', urlLocale) },
  ];

  const facebookUrl = companyProfile.social.facebook || 'https://facebook.com';
  const whatsappUrl = `https://wa.me/40769889721?text=${encodeURIComponent('Bună! Aș dori o ofertă pentru: ')}`;
  const emailUrl = `mailto:${companyProfile.email}`;
  const recomUrl = companyProfile.cui ? `https://www.recom.ro/?cui=${encodeURIComponent(companyProfile.cui)}` : 'https://www.recom.ro/';

  return (
    <footer id="footer" data-reveal className={cn('bg-[#08101E] text-white', className)}>
      <div className="px-5 sm:px-8 xl:px-12">
        <a
          href={localizePathname('/contact', urlLocale)}
          className="mt-0 block w-full rounded-b-3xl bg-[linear-gradient(90deg,#ea5c0c,#f97316)] px-6 py-7 text-center font-black text-black shadow-[0_18px_60px_rgba(249,115,22,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          Obține oferta ta gratuită <ArrowRight className="inline-block h-4 w-4 align-[-2px]" aria-hidden />
        </a>
      </div>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-orange-400/60 to-transparent" aria-hidden />

      <div className="max-w-7xl mx-auto px-5 sm:px-8 xl:px-12 py-14">
        <div
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[1.5fr_1fr_1fr_1fr] gap-10"
          data-reveal-stagger
          data-reveal-stagger-ms="100"
        >
          <div className="space-y-4">
            <a href={homePath} className="inline-flex items-center gap-3" aria-label={companyProfile.name}>
              <span className="h-11 w-11 rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                <SolarisLogoMark className="h-full w-full" />
              </span>
              <span className="leading-none">
                <span className="block text-base font-black tracking-tight text-white">
                  S<span className="text-orange-300">·</span>CET
                </span>
                <span className="block text-[11px] font-semibold tracking-widest text-white/55">SOLARIS</span>
              </span>
            </a>
            <div className="text-sm font-semibold text-white/80">{companyProfile.tagline}</div>
            <div className="text-sm text-white/55 leading-relaxed max-w-sm">{companyProfile.shortDescription}</div>

            <div className="flex items-center gap-3 pt-2">
              {[
                { label: 'Facebook', href: facebookUrl, icon: <Globe className="h-7 w-7" aria-hidden /> },
                { label: 'WhatsApp', href: whatsappUrl, icon: <MessageCircle className="h-7 w-7" aria-hidden /> },
                { label: 'Email', href: emailUrl, icon: <Mail className="h-7 w-7" aria-hidden /> },
              ].map((x) => (
                <a
                  key={x.label}
                  href={x.href}
                  target={x.href.startsWith('http') ? '_blank' : undefined}
                  rel={x.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/70 transition-transform transition-colors hover:text-orange-300 hover:border-orange-400/40 hover:scale-[1.08]"
                  aria-label={x.label}
                >
                  {x.icon}
                </a>
              ))}
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold text-white/80">Servicii</div>
            <div className="mt-4 grid grid-cols-1 gap-2 text-sm">
              {serviceLinks.map((l) => (
                <a key={l.label} href={l.href} className="text-white/55 hover:text-orange-300 transition-colors">
                  {l.label}
                </a>
              ))}
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold text-white/80">Contact</div>
            <div className="mt-4 space-y-3">
              <a
                className="group inline-flex items-center gap-2 text-[22px] font-semibold text-orange-400 transition-colors hover:text-white"
                href={`tel:${companyProfile.phone}`}
              >
                <Phone className="h-5 w-5 text-white/70 group-hover:text-orange-300 transition-colors" aria-hidden />
                {companyProfile.phoneDisplay}
              </a>
              <a className="block text-sm font-semibold text-white/60 hover:text-orange-300 transition-colors" href={emailUrl}>
                {companyProfile.email}
              </a>
              <div className="text-sm text-white/55">Vaslui & toată România</div>
              <div className="text-xs text-white/45">Program: {companyProfile.program} · {companyProfile.urgent}</div>
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold text-white/80">Adresă</div>
            <div className="mt-4 space-y-3">
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-orange-300">
                    <MapPin className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-black text-white">Vaslui, România</div>
                    <div className="mt-1 text-sm text-white/60">📍 {companyProfile.location}</div>
                    <div className="mt-2 text-xs text-white/45">Adresă operațională și zonă de deplasare confirmate la cerere.</div>
                  </div>
                </div>
                <div
                  className="mt-4 h-24 w-full rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_20%_20%,rgba(249,115,22,0.20)_0%,transparent_55%),radial-gradient(circle_at_80%_70%,rgba(46,231,255,0.12)_0%,transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))]"
                  aria-hidden
                />
              </div>

              <a
                href={localizePathname('/calculator', urlLocale)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-5 py-3 text-sm font-black text-white/85 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60"
              >
                Deschide calculatorul <ArrowRight className="h-4 w-4" aria-hidden />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col gap-6" data-reveal>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="text-xs text-white/45">{yearLine}</div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs">
              {legalLinks.map((l, idx) => (
                <span key={l.label} className="inline-flex items-center gap-3">
                  <a href={l.href} className="text-white/45 hover:text-orange-300 transition-colors">
                    {l.label}
                  </a>
                  {idx < legalLinks.length - 1 ? <span className="text-white/20" aria-hidden>|</span> : null}
                </span>
              ))}
              <span className="inline-flex items-center gap-3">
                <a href="https://anpc.ro" target="_blank" rel="noopener noreferrer" className="text-white/45 hover:text-orange-300 transition-colors">
                  ANPC
                </a>
              </span>
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

            <div className="text-xs text-white/45">
              <a href={recomUrl} target="_blank" rel="noopener noreferrer" className="hover:text-orange-300 transition-colors">
                {companyProfile.cui ? `CUI: ${companyProfile.cui}` : 'Verificare firmă (RECOM)'}
              </a>
              {companyProfile.regCom ? <span className="mx-2 text-white/20">•</span> : null}
              {companyProfile.regCom ? <span>Nr. Reg. Com.: {companyProfile.regCom}</span> : null}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
