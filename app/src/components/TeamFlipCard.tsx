import { useCallback, useState } from 'react';

import { cn } from '@/lib/utils';

type TeamFlipCardProps = {
  initials: string;
  role: string;
  name: string;
  bio: string;
  linkedinUrl?: string;
  xUrl?: string;
  className?: string;
};

export default function TeamFlipCard({
  initials,
  role,
  name,
  bio,
  linkedinUrl,
  xUrl,
  className,
}: TeamFlipCardProps) {
  const [flipped, setFlipped] = useState(false);

  const toggle = useCallback(() => setFlipped((v) => !v), []);

  return (
    <div
      className={cn('flip-card', className)}
      data-flipped={flipped ? 'true' : 'false'}
    >
      <div className="flip-card-inner">
        <div className="flip-card-face flip-card-front bento-card p-6 border border-white/10">
          <div className="flex flex-col md:flex-row items-center gap-5">
            <div className="shrink-0 w-16 h-16 rounded-2xl overflow-hidden border-2 border-solaris-gold/30 bg-solaris-gold/10 flex items-center justify-center">
              <span className="font-display font-bold text-2xl text-solaris-gold">
                {initials}
              </span>
            </div>
            <div className="flex-1 text-center md:text-left min-w-0">
              <div className="hud-label text-solaris-gold text-[10px] mb-1">{role}</div>
              <div className="font-display font-semibold text-solaris-text text-lg leading-tight mb-0.5 truncate">
                {name}
              </div>
              <div className="text-solaris-muted text-xs font-mono">↻</div>
            </div>
            <button
              type="button"
              onClick={toggle}
              aria-label={`Open bio for ${name}`}
              className="shrink-0 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-solaris-muted text-sm font-medium hover:bg-white/10 transition-colors"
            >
              ↻
            </button>
          </div>
        </div>

        <div className="flip-card-face flip-card-back bento-card p-6 border border-white/10">
          <div className="flex flex-col gap-4">
            <div className="min-w-0">
              <div className="hud-label text-solaris-gold text-[10px] mb-1">{role}</div>
              <div className="font-display font-semibold text-solaris-text text-lg leading-tight truncate">
                {name}
              </div>
            </div>
            <div className="text-solaris-muted text-sm leading-relaxed">
              {bio}
            </div>
            <div className="flex flex-wrap gap-2">
              {linkedinUrl ? (
                <a
                  href={linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="px-4 py-2 rounded-xl bg-[#0A66C2]/20 border border-[#0A66C2]/40 text-[#4FC3F7] text-sm font-medium hover:bg-[#0A66C2]/30 transition-colors"
                >
                  LinkedIn
                </a>
              ) : null}
              {xUrl ? (
                <a
                  href={xUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-solaris-text text-sm font-medium hover:bg-white/10 transition-colors"
                >
                  X
                </a>
              ) : null}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggle();
                }}
                className="px-4 py-2 rounded-xl bg-solaris-gold/10 border border-solaris-gold/25 text-solaris-gold text-sm font-medium hover:bg-solaris-gold/15 transition-colors"
              >
                ↩
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
