import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { localizePathname } from '@/i18n/urlRouting';
import { useLanguage } from '@/hooks/useLanguage';

export default function MobileAppNav() {
  const { t, lang } = useLanguage();
  const location = useLocation();

  const navItems = useMemo(() => [
    { label: '🏠 Acasă', href: localizePathname('/', lang) },
    { label: '🔧 Servicii', href: localizePathname('/servicii', lang) },
    { label: '📞 Contact', href: localizePathname('/contact', lang) },
    { label: '💬 Chat', href: '#chat-widget' },
  ], [lang]);

  const isActive = (href: string) => {
    if (href === '#chat-widget') return false;
    return location.pathname === href;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-white/10 bg-gray-900/95 backdrop-blur-md md:hidden" aria-label="Navigație mobilă">
      {navItems.map((item) => (
        <a
          key={item.label}
          href={item.href}
          className={`flex flex-col items-center gap-1 px-3 py-2 text-xs font-semibold transition-colors ${
            isActive(item.href) ? 'text-amber-400' : 'text-white/60 hover:text-white'
          }`}
          onClick={(e) => {
            if (item.href === '#chat-widget') {
              e.preventDefault();
              // Dispatch custom event to open chat widget
              window.dispatchEvent(new CustomEvent('open-chat-widget'));
            }
          }}
        >
          <span className="text-lg">{item.label.split(' ')[0]}</span>
          <span>{item.label.split(' ').slice(1).join(' ')}</span>
        </a>
      ))}
    </nav>
  );
}
