import { Share2, X } from 'lucide-react';
import { useTelegram } from '../hooks/useTelegram';

const SITE_URL = 'https://solaris-cet.vercel.app/';
const SHARE_TEXT =
  '🚀 Just discovered $CET on #TON blockchain! Fixed supply of 9,000 CET — mine, trade & stake. Check it out 👇';

const SocialShare = () => {
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
          title: 'Solaris CET — Next-Gen TON Token',
          text: SHARE_TEXT,
          url: SITE_URL,
        });
      } catch {
        // user cancelled or error — do nothing
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${SHARE_TEXT} ${SITE_URL}`);
        alert('Link copied to clipboard!');
      } catch {
        // clipboard unavailable
      }
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={shareToX}
        aria-label="Share on X / X"
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-solaris-muted hover:text-solaris-text hover:border-white/20 transition-all duration-200 text-xs"
      >
        <X className="w-3.5 h-3.5" />
        <span>Share on X</span>
      </button>
      <button
        onClick={shareNative}
        aria-label="Share or copy link"
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-solaris-muted hover:text-solaris-text hover:border-white/20 transition-all duration-200 text-xs"
      >
        <Share2 className="w-3.5 h-3.5" />
        <span>Share</span>
      </button>
    </div>
  );
};

export default SocialShare;
