import { BadgeCheck, ShieldCheck } from 'lucide-react';

import { useLanguage } from '@/hooks/useLanguage';
import { localizePathname, urlLocaleFromLang } from '@/i18n/urlRouting';

export default function SolarSecuritySection() {
  const { lang } = useLanguage();
  const urlLocale = urlLocaleFromLang(lang);

  const items = [
    {
      title: 'Garanție și responsabilitate',
      body: 'Lucrăm cu echipe verificate, materiale conforme și detalii de execuție controlate.',
      icon: <ShieldCheck className="h-5 w-5 text-emerald-400" aria-hidden />,
    },
    {
      title: 'Conformitate & trasabilitate',
      body: 'Îți oferim documente clare, comunicare rapidă și un proces transparent de ofertare și execuție.',
      icon: <BadgeCheck className="h-5 w-5 text-amber-400" aria-hidden />,
    },
  ];

  const links = [
    { label: 'Politică de confidențialitate', href: localizePathname('/privacy', urlLocale) },
    { label: 'Politică cookies', href: localizePathname('/cookies', urlLocale) },
    { label: 'Termeni și condiții', href: localizePathname('/terms', urlLocale) },
    { label: 'Contact', href: localizePathname('/contact', urlLocale) },
    { label: 'Sună acum', href: 'tel:+40769889721' },
  ];

  return (
    <section id="security" className="py-24 bg-slate-950">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 xl:px-12">
        <div className="max-w-3xl">
          <h2 className="text-3xl md:text-5xl font-bold text-white">Siguranță, garanții, conformitate</h2>
          <p className="mt-4 text-slate-300 text-lg">
            Pentru proiecte de fotovoltaice și acoperișuri contează calitatea execuției, documentația și garanțiile.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          {items.map((x) => (
            <div key={x.title} className="rounded-3xl border border-white/10 bg-black/25 p-6">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center">
                  {x.icon}
                </div>
                <div className="text-lg font-semibold text-white">{x.title}</div>
              </div>
              <div className="mt-4 text-sm text-slate-300 leading-relaxed">{x.body}</div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-amber-400/50 hover:text-amber-200 transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
