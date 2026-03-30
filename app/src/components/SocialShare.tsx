import { Share2, X } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useTelegram } from '../hooks/useTelegram';
import { shortSkillWhisper, skillSeedFromLabel } from '@/lib/meshSkillFeed';

const SITE_URL = 'https://solaris-cet.vercel.app/';
const SHARE_TEXT =
  '🚀 Just discovered $CET on #TON blockchain! Fixed supply of 9,000 CET — mine, trade & stake. Check it out 👇';

const SocialShare = () => {
  const { t } = useLanguage();
  const { haptic } = useTelegram();

  const shareToX = () => {
    haptic('light');
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      SHARE_TEXT
    )}&url=${encodeURIComponent(SITE_URL)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const shareNative = async () => {
    haptic('light');
    if (navigator.share) {
      try {
        await navigator.share({
          title: t.social.nativeShareTitle,
          text: SHARE_TEXT,
          url: SITE_URL,
        });
      } catch {
        // user cancelled or error — do nothing
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${SHARE_TEXT} ${SITE_URL}`);
        alert(t.social.linkCopied);
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
        onClick={shareNative}
        aria-label={t.social.shareOrCopyAria}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-solaris-muted hover:text-solaris-text hover:border-white/20 transition-all duration-200 text-xs"
      >
        <Share2 className="w-3.5 h-3.5" />
        <span>{t.social.shareLink}</span>
      </button>
      </div>
      <p
        className="text-[9px] font-mono text-fuchsia-200/55 leading-snug line-clamp-2 border-t border-fuchsia-500/10 pt-2 text-center sm:text-left max-w-md"
        title={shortSkillWhisper(skillSeedFromLabel('socialShare|mesh'))}
      >
        {shortSkillWhisper(skillSeedFromLabel('socialShare|mesh'))}
      </p>
    </div>
  );
};

export default SocialShare;
