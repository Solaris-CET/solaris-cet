import { useLanguage } from '@/hooks/useLanguage';
import {
  PUBLIC_CYBERSCOPE_URL,
  PUBLIC_FRESHCOINS_URL,
  PUBLIC_WHITEPAPER_IPFS_URL,
} from '@/lib/publicTrustLinks';
import { cn } from '@/lib/utils';

type Props = {
  className?: string;
  /** Desktop header: end-align with TonConnect; mobile sheet: center. */
  align?: 'end' | 'center';
};

/**
 * Compact audit / verification links surfaced next to TonConnect (B2B trust).
 * Full detail remains in `SecuritySection`.
 */
export function HeaderTrustStrip({ className, align = 'end' }: Props) {
  const { t } = useLanguage();
  const suffix = ` ${t.nav.opensInNewWindow}`;
  const linkClass =
    'text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-solaris-muted hover:text-solaris-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solaris-gold/70 rounded-sm transition-colors whitespace-nowrap py-1.5 px-2';

  return (
    <nav
      aria-label={t.nav.trustStripAria}
      className={cn(
        'flex flex-wrap items-center gap-x-2 gap-y-0.5 max-w-[min(100%,14rem)]',
        align === 'end' ? 'justify-end' : 'justify-center',
        className,
      )}
    >
      <a
        href={PUBLIC_CYBERSCOPE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass}
        aria-label={`${t.nav.trustLinkCyberscope}${suffix}`}
      >
        {t.nav.trustLinkCyberscope}
      </a>
      <span className="text-solaris-muted/40 text-[10px] select-none" aria-hidden>
        ·
      </span>
      <a
        href={PUBLIC_FRESHCOINS_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass}
        aria-label={`${t.nav.trustLinkFreshcoins}${suffix}`}
      >
        {t.nav.trustLinkFreshcoins}
      </a>
      <span className="text-solaris-muted/40 text-[10px] select-none" aria-hidden>
        ·
      </span>
      <a
        href={PUBLIC_WHITEPAPER_IPFS_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass}
        aria-label={`${t.nav.trustLinkKycPaper}${suffix}`}
      >
        {t.nav.trustLinkKycPaper}
      </a>
    </nav>
  );
}
