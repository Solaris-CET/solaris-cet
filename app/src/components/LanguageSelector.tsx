import { ChevronDown, Globe } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  localizePathname,
  parseUrlLocaleFromPathname,
  URL_LOCALES,
  type UrlLocale,
  urlLocaleFromLang,
} from '@/i18n/urlRouting';
import { shortSkillWhisper, skillSeedFromLabel } from '@/lib/meshSkillFeed';
import { cn } from '@/lib/utils';

import { type LangCode,useLanguage } from '../hooks/useLanguage';

const LOCALE_LABELS: Record<UrlLocale, { code: string; flag: string; native: string }> = {
  en: { code: 'EN', flag: '🇬🇧', native: 'English' },
  ro: { code: 'RO', flag: '🇷🇴', native: 'Română' },
  es: { code: 'ES', flag: '🇪🇸', native: 'Español' },
  de: { code: 'DE', flag: '🇩🇪', native: 'Deutsch' },
  pt: { code: 'PT', flag: '🇵🇹', native: 'Português' },
  ru: { code: 'RU', flag: '🇷🇺', native: 'Русский' },
  zh: { code: 'ZH', flag: '🇨🇳', native: '中文' },
};

function getActiveUrlLocale(lang: LangCode): UrlLocale {
  if (typeof window === 'undefined') return urlLocaleFromLang(lang);
  return parseUrlLocaleFromPathname(window.location.pathname).locale ?? urlLocaleFromLang(lang);
}

const LanguageSelector = () => {
  const { lang, setLang, t } = useLanguage();
  const active = getActiveUrlLocale(lang);

  return (
    <div
      className="flex items-center gap-2"
      title={shortSkillWhisper(skillSeedFromLabel(`langSelector|${lang}`))}
    >
      <Globe className="w-4 h-4 text-solaris-muted shrink-0" />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={`${t.common.switchLanguagePrefix} ${LOCALE_LABELS[active].code}`}
            className={cn(
              'min-h-[44px] min-w-[44px] rounded-md px-2.5 py-1.5 text-[11px] font-mono text-solaris-muted hover:text-solaris-text transition-colors',
              'bg-white/[0.03] border border-white/10',
              'inline-flex items-center gap-2',
            )}
          >
            <span aria-hidden className="text-sm leading-none">
              {LOCALE_LABELS[active].flag}
            </span>
            <span>{LOCALE_LABELS[active].code}</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-70" aria-hidden />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[220px]">
          <DropdownMenuRadioGroup
            value={active}
            onValueChange={(next) => {
              if (!(URL_LOCALES as readonly string[]).includes(next)) return;
              const nextLocale = next as UrlLocale;
              setLang(nextLocale as unknown as LangCode);
              const url = new URL(window.location.href);
              const { pathnameNoLocale } = parseUrlLocaleFromPathname(url.pathname);
              url.pathname = localizePathname(pathnameNoLocale, nextLocale);
              url.searchParams.delete('lang');
              window.location.assign(url.toString());
            }}
          >
            {URL_LOCALES.map((locale) => (
              <DropdownMenuRadioItem key={locale} value={locale}>
                <span className="w-5 text-base leading-none" aria-hidden>
                  {LOCALE_LABELS[locale].flag}
                </span>
                <span className="font-medium">{LOCALE_LABELS[locale].native}</span>
                <span className="ml-auto font-mono text-xs text-muted-foreground">{LOCALE_LABELS[locale].code}</span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default LanguageSelector;
