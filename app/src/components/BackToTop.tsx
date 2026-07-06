import { useEffect, useState } from 'react';

import { useReducedMotion } from '@/hooks/useReducedMotion';
import { shortSkillWhisper, skillSeedFromLabel } from '@/lib/meshSkillFeed';
import { utMeasureToNextFrame } from '@/lib/userTiming';

import { useLanguage } from '../hooks/useLanguage';
import { SolarisLogoMark } from './SolarisLogoMark';

/**
 * BackToTop — floating control after 600px scroll; uses Solaris mark on a dark inset for contrast on gold.
 * Below `xl`, sit above `MobileConversionDock` (z-900): `--back-to-top-bottom` in `index.css`
 * (derived from `--mobile-conversion-dock-reserve`, same as `main` padding-bottom).
 */
const BackToTop = () => {
  const { t } = useLanguage();
  const prefersReducedMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let raf = 0;
    let last: boolean | null = null;
    const apply = () => {
      raf = 0;
      const next = window.scrollY > 600;
      if (last === null || last !== next) {
        last = next;
        setVisible(next);
      }
    };
    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(apply);
    };
    apply();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <button
      onClick={() => {
        utMeasureToNextFrame('ui:back-to-top');
        window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      }}
      aria-label={t.common.backToTop}
      title={shortSkillWhisper(skillSeedFromLabel('backToTop|scrollAnchor'))}
      aria-hidden={!visible}
      className={`
        fixed right-6 z-[999]
        bottom-[var(--back-to-top-bottom)] xl:bottom-6
        w-12 h-12 rounded-full
        bg-gradient-to-br from-solaris-gold to-amber-500
        text-solaris-dark
        flex items-center justify-center
        shadow-[0_0_20px_rgba(242,201,76,0.5),0_0_40px_rgba(242,201,76,0.2)]
        hover:shadow-[0_0_30px_rgba(242,201,76,0.8),0_0_60px_rgba(242,201,76,0.3)]
        hover:scale-110 active:scale-95
        transition-all duration-300 ease-out
        neon-gold
        ${visible
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-6 pointer-events-none'}
      `}
    >
      <span
        className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-slate-950/90 p-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
        aria-hidden
      >
        <SolarisLogoMark className="h-full w-full drop-shadow-[0_0_6px_rgba(242,201,76,0.45)]" />
      </span>
    </button>
  );
};

export default BackToTop;
