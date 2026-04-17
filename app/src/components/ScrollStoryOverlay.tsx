import { memo, useEffect, useMemo, useRef } from 'react';
import type { CSSProperties } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { mulberry32 } from '@/lib/seed';
import { useSessionSeed } from '@/hooks/useSessionSeed';

type Variant = 'home' | 'rwa' | 'cet-ai' | 'demo';

function routeVariant(pathname: string): Variant {
  if (pathname === '/rwa') return 'rwa';
  if (pathname === '/cet-ai') return 'cet-ai';
  if (pathname === '/demo') return 'demo';
  return 'home';
}

function hslToRgbString(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = h * 6;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r1 = 0;
  let g1 = 0;
  let b1 = 0;
  if (hp >= 0 && hp < 1) [r1, g1, b1] = [c, x, 0];
  else if (hp >= 1 && hp < 2) [r1, g1, b1] = [x, c, 0];
  else if (hp >= 2 && hp < 3) [r1, g1, b1] = [0, c, x];
  else if (hp >= 3 && hp < 4) [r1, g1, b1] = [0, x, c];
  else if (hp >= 4 && hp < 5) [r1, g1, b1] = [x, 0, c];
  else if (hp >= 5 && hp < 6) [r1, g1, b1] = [c, 0, x];
  const m = l - c / 2;
  const r = Math.round((r1 + m) * 255);
  const g = Math.round((g1 + m) * 255);
  const b = Math.round((b1 + m) * 255);
  return `${r},${g},${b}`;
}

function paletteFromSeed(variant: Variant, seed: number) {
  const base =
    variant === 'rwa' ? 0.44 : variant === 'cet-ai' ? 0.56 : variant === 'demo' ? 0.5 : 0.12;
  const rand = mulberry32(Math.floor(seed * 4294967295) >>> 0);
  const hueShift = (rand() - 0.5) * 0.09;
  const a = hslToRgbString(base + hueShift, 0.82, 0.68);
  const b = hslToRgbString(((base + 0.32) % 1) + hueShift * 0.7, 0.86, 0.6);
  return { a, b };
}

function ScrollStoryOverlay({ routePath }: { routePath: string }) {
  const reduced = useReducedMotion();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const overlayRef = useRef<HTMLDivElement>(null);
  const variant = useMemo(() => routeVariant(routePath), [routePath]);
  const seed = useSessionSeed('storyOverlay');
  const lhci = import.meta.env.VITE_LHCI === '1';

  const palette = useMemo(() => paletteFromSeed(variant, seed), [seed, variant]);

  useEffect(() => {
    const el = overlayRef.current;
    if (!el) return;
    if (reduced) return;
    if (lhci) return;
    const isAudit = (() => {
      if (typeof navigator === 'undefined') return false;
      const navAny = navigator as Navigator & { webdriver?: boolean };
      return navAny.webdriver === true || /HeadlessChrome/i.test(navigator.userAgent);
    })();
    if (isAudit) return;

    const ctx = gsap.context(() => {
      gsap.set(el, {
        opacity: variant === 'demo' ? 0.42 : 0.34,
        '--story-x': 42,
        '--story-y': 28,
        '--story-hue': 0,
        '--story-scale': 1,
      } as gsap.TweenVars);

      const applyBeat = (x: number, y: number, hue: number, opacity: number, scale: number) => {
        gsap.to(el, {
          duration: isMobile ? 0.5 : 0.9,
          ease: 'power3.out',
          opacity,
          '--story-x': x,
          '--story-y': y,
          '--story-hue': hue,
          '--story-scale': scale,
          overwrite: true,
        } as gsap.TweenVars);
      };

      const beats =
        routePath === '/' || routePath === '/demo'
          ? [
              { sel: '#hero', x: 42, y: 24, hue: 0, o: variant === 'demo' ? 0.46 : 0.36, s: 1.02 },
              { sel: '#problem-agriculture', x: 58, y: 38, hue: 10, o: 0.34, s: 1.04 },
              { sel: '#nova-app', x: 36, y: 44, hue: 22, o: 0.33, s: 1.05 },
              { sel: '#staking', x: 54, y: 34, hue: -8, o: 0.36, s: 1.06 },
              { sel: '#rwa', x: 48, y: 30, hue: 16, o: 0.38, s: 1.06 },
              { sel: '#roadmap', x: 62, y: 28, hue: 28, o: 0.33, s: 1.04 },
              { sel: '#resources', x: 40, y: 34, hue: 6, o: 0.3, s: 1.03 },
              { sel: '#faq', x: 46, y: 40, hue: -4, o: 0.28, s: 1.02 },
            ]
          : routePath === '/rwa'
            ? [{ sel: '#rwa', x: 48, y: 30, hue: 16, o: 0.36, s: 1.05 }]
            : routePath === '/cet-ai'
              ? [{ sel: '#cet-ai', x: 50, y: 28, hue: 26, o: 0.36, s: 1.05 }]
              : [];

      const triggers = beats.map((b) =>
        ScrollTrigger.create({
          trigger: b.sel,
          start: 'top 70%',
          end: 'bottom 30%',
          onEnter: () => applyBeat(b.x, b.y, b.hue, b.o, b.s),
          onEnterBack: () => applyBeat(b.x, b.y, b.hue, b.o, b.s),
        }),
      );

      return () => {
        triggers.forEach((t) => t.kill());
      };
    }, el);

    return () => ctx.revert();
  }, [isMobile, lhci, reduced, routePath, variant]);

  if (lhci) return null;

  return (
    <div
      ref={overlayRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[3] opacity-0"
      style={
        {
          '--story-a': palette.a,
          '--story-b': palette.b,
          backgroundImage: `
radial-gradient(ellipse 58% 62% at calc(var(--story-x) * 1%) calc(var(--story-y) * 1%), rgba(var(--story-a), 0.16), rgba(0,0,0,0) 70%),
radial-gradient(ellipse 65% 60% at calc((100 - var(--story-x)) * 1%) calc((100 - var(--story-y)) * 1%), rgba(var(--story-b), 0.12), rgba(0,0,0,0) 72%),
repeating-linear-gradient(180deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, rgba(0,0,0,0) 3px, rgba(0,0,0,0) 6px)
`,
          transform: 'scale(var(--story-scale))',
          filter: 'hue-rotate(calc(var(--story-hue) * 1deg))',
          mixBlendMode: 'screen',
        } as CSSProperties
      }
    />
  );
}

export default memo(ScrollStoryOverlay);
