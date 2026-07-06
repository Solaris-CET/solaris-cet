import type { LangCode } from '@/i18n/translations';

/** BCP 47 locale for `Intl` / `toLocaleString` (numbers, dates) per UI language. */
const LANG_TO_LOCALE: Record<LangCode, string> = {
  en: 'en-US',
  es: 'es-ES',
  zh: 'zh-CN',
  ru: 'ru-RU',
  ro: 'ro-RO',
  pt: 'pt-PT',
  de: 'de-DE',
};

export function localeForLang(lang: LangCode): string {
  return LANG_TO_LOCALE[lang];
}
