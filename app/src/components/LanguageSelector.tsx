import { Globe } from 'lucide-react';
import { useLanguage, SUPPORTED_LANGS, type LangCode } from '../hooks/useLanguage';

const LANG_LABELS: Record<LangCode, string> = {
  en: 'EN',
  es: 'ES',
  zh: '中文',
  ru: 'RU',
  ro: 'RO',
};

const LanguageSelector = () => {
  const { lang, setLang } = useLanguage();

  return (
    <div className="flex items-center gap-1">
      <Globe className="w-3.5 h-3.5 text-solaris-muted" />
      <div className="flex items-center gap-0.5">
        {SUPPORTED_LANGS.map((code) => (
          <button
            key={code}
            onClick={() => setLang(code)}
            aria-label={`Switch language to ${code.toUpperCase()}`}
            className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition-colors duration-150 ${
              lang === code
                ? 'text-solaris-gold bg-solaris-gold/10'
                : 'text-solaris-muted hover:text-solaris-text'
            }`}
          >
            {LANG_LABELS[code]}
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSelector;
