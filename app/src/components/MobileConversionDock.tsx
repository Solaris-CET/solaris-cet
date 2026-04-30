import { BookOpen, Coins, ExternalLink, MessageCircle, Scale } from 'lucide-react';

import { trackBuyClick, trackSocialClick } from '@/lib/analytics';
import { DEDUST_SWAP_URL } from '@/lib/dedustUrls';
import { mktEvent } from '@/lib/marketing';
import { cn } from '@/lib/utils';

import { useLanguage } from '../hooks/useLanguage';

const TELEGRAM = 'https://t.me/+tKlfzx7IWopmNWQ0';

/**
 * Sticky bottom conversion strip — mobile / small tablet only (PR 378/379: explicit next-step paths).
 */
const MobileConversionDock = () => {
  const { t } = useLanguage();

  const items = [
    {
      href: DEDUST_SWAP_URL,
      external: true,
      label: t.mobileDock.buy,
      icon: Coins,
      className: 'text-solaris-gold',
    },
    {
      href: '#staking',
      external: false,
      label: t.mobileDock.tokenomics,
      icon: BookOpen,
      className: 'text-solaris-cyan',
    },
    {
      href: '#how-to-buy',
      external: false,
      label: t.mobileDock.howToBuy,
      icon: ExternalLink,
      className: 'text-white/90',
    },
    {
      href: '#competition',
      external: false,
      label: t.nav.competition,
      icon: Scale,
      className: 'text-amber-400/95',
    },
    {
      href: TELEGRAM,
      external: true,
      label: t.mobileDock.community,
      icon: MessageCircle,
      className: 'text-emerald-400/95',
    },
  ] as const;

  return (
    <div className={cn('fixed inset-x-0 bottom-0 z-[900] lg:hidden pointer-events-none')}>
      <nav
        data-testid="mobile-conversion-dock"
        className="pointer-events-auto mx-auto max-w-lg px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2"
        aria-label={t.mobileDock.landmarkLabel}
      >
        <div
          className={cn(
            'flex items-stretch justify-between gap-1 rounded-2xl border border-white/10',
            'bg-slate-950/90 backdrop-blur-2xl shadow-[0_-8px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]',
            'px-1 py-1.5',
          )}
        >
          {items.map(({ href, external, label, icon: Icon, className }) => (
            <a
              key={href}
              href={href}
              {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              onClick={() => {
                if (href === DEDUST_SWAP_URL) {
                  trackBuyClick({ destination: href, source: 'mobile_dock' });
                  mktEvent('buy_click', { destination: href, source: 'mobile_dock' });
                }
                if (href === TELEGRAM) {
                  trackSocialClick({ platform: 'telegram', destination: href, source: 'mobile_dock' });
                  mktEvent('social_click', { platform: 'telegram', destination: href, source: 'mobile_dock' });
                }
              }}
              className={cn(
                'flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-2 px-1',
                'text-[10px] sm:text-[11px] font-semibold tracking-tight text-center',
                'text-solaris-muted hover:text-solaris-text active:scale-[0.98] transition-colors',
                className,
              )}
            >
              <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
              <span className="leading-tight line-clamp-2">{label}</span>
            </a>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default MobileConversionDock;
