import { Building2, Mail, Share2, X } from 'lucide-react';
import { toast } from 'sonner';

import { useJwtSession } from '@/hooks/useJwtSession';
import { productionSiteUrl } from '@/lib/brandAssets';
import { shortSkillWhisper, skillSeedFromLabel } from '@/lib/meshSkillFeed';

import { useLanguage } from '../hooks/useLanguage';
import { useTelegram } from '../hooks/useTelegram';

/** Canonical link in shares — matches `index.html`; override in Coolify / `.env` via `VITE_PUBLIC_SITE_URL`. */
const SITE_URL = (() => {
  const raw = import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined;
  if (raw?.trim()) return raw.trim().replace(/\/?$/, '/');
  return productionSiteUrl();
})();

type SocialShareProps = {
  url?: string;
  title?: string;
  text?: string;
  variant?: 'default' | 'compact';
};

const SocialShare = ({ url, title, text, variant = 'default' }: SocialShareProps) => {
  const { t } = useLanguage();
  const { haptic } = useTelegram();
  const { token } = useJwtSession();

  const shareUrl = (url ?? SITE_URL).trim();
  const shareText = (text ?? t.social.shareBody).trim();
  const shareTitle = (title ?? t.social.nativeShareTitle).trim();

  const trackShare = async (platform: string) => {
    if (!token) return;
    try {
      await fetch('/api/social/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ platform, url: shareUrl }),
        cache: 'no-store',
      });
    } catch {
      void 0;
    }
  };

  const shareToX = () => {
    haptic('light');
    void trackShare('x');
    const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(intent, '_blank', 'noopener,noreferrer');
  };

  const shareToLinkedIn = () => {
    haptic('light');
    void trackShare('linkedin');
    const intent = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(intent, '_blank', 'noopener,noreferrer');
  };

  const shareByEmail = () => {
    haptic('light');
    void trackShare('email');
    const subject = shareTitle;
    const body = `${shareText}\n\n${shareUrl}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const shareNative = async () => {
    haptic('light');
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        await trackShare('native');
      } catch {
        // user cancelled or error — do nothing
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        await trackShare('copy');
        toast.success(t.social.linkCopied);
      } catch {
        // clipboard unavailable
      }
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full sm:w-auto">
      <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={shareToX}
        aria-label={t.social.shareOnX}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-solaris-muted hover:text-solaris-text hover:border-white/20 transition-all duration-200 text-xs"
      >
        <X className="w-3.5 h-3.5" />
        <span>{t.social.shareOnX}</span>
      </button>
      <button
        onClick={shareToLinkedIn}
        aria-label="Share on LinkedIn"
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-solaris-muted hover:text-solaris-text hover:border-white/20 transition-all duration-200 text-xs"
      >
        <Building2 className="w-3.5 h-3.5" />
        <span>LinkedIn</span>
      </button>
      <button
        onClick={shareByEmail}
        aria-label="Send via email"
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-solaris-muted hover:text-solaris-text hover:border-white/20 transition-all duration-200 text-xs"
      >
        <Mail className="w-3.5 h-3.5" />
        <span>Trimite</span>
      </button>
      <button
        onClick={shareNative}
        aria-label={t.social.shareOrCopyAria}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-solaris-muted hover:text-solaris-text hover:border-white/20 transition-all duration-200 text-xs"
      >
        <Share2 className="w-3.5 h-3.5" />
        <span>{t.social.shareLink}</span>
      </button>
      </div>
      {variant === 'default' ? (
        <p
          className="text-[9px] font-mono text-fuchsia-200/55 leading-snug line-clamp-2 border-t border-fuchsia-500/10 pt-2 text-center sm:text-left max-w-md"
          title={shortSkillWhisper(skillSeedFromLabel('socialShare|mesh'))}
        >
          {shortSkillWhisper(skillSeedFromLabel('socialShare|mesh'))}
        </p>
      ) : null}
    </div>
  );
};

export default SocialShare;
