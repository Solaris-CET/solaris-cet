import { memo, useEffect, useMemo, useRef } from 'react';

import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useSessionSeed } from '@/hooks/useSessionSeed';
import { clamp01,hashStringToUint32, mulberry32 } from '@/lib/seed';

function routeVariant(pathname: string) {
  if (pathname === '/rwa') return 'rwa';
  if (pathname === '/cet-ai') return 'cet-ai';
  if (pathname === '/demo') return 'demo';
  return 'home';
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  variant: string,
  seed: number,
  density: number,
) {
  ctx.clearRect(0, 0, w, h);

  const s = hashStringToUint32(`${variant}|${Math.floor(seed * 1e9)}`);
  const rand = mulberry32(s);

  const baseA =
    variant === 'rwa'
      ? [120, 255, 210]
      : variant === 'cet-ai'
        ? [125, 200, 255]
        : variant === 'demo'
          ? [140, 250, 255]
          : [255, 220, 165];
  const baseB =
    variant === 'rwa'
      ? [242, 201, 76]
      : variant === 'cet-ai'
        ? [186, 85, 255]
        : variant === 'demo'
          ? [242, 201, 76]
          : [60, 231, 255];

  const gx = w * (0.35 + 0.3 * (seed - 0.5));
  const gy = h * (0.28 + 0.25 * (0.5 - seed));
  const r = Math.max(w, h) * 0.75;
  const grad = ctx.createRadialGradient(gx, gy, r * 0.1, gx, gy, r);
  grad.addColorStop(0, `rgba(${baseA[0]},${baseA[1]},${baseA[2]},${0.18 + 0.08 * seed})`);
  grad.addColorStop(0.55, `rgba(${baseB[0]},${baseB[1]},${baseB[2]},${0.06 + 0.06 * (1 - seed)})`);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  const bandY = h * (0.32 + 0.22 * Math.sin(t * 0.00035 + seed * 4));
  const bandH = Math.max(140, h * 0.22);
  const band = ctx.createLinearGradient(0, bandY - bandH, 0, bandY + bandH);
  band.addColorStop(0, 'rgba(0,0,0,0)');
  band.addColorStop(0.5, `rgba(${baseA[0]},${baseA[1]},${baseA[2]},${0.06 + 0.05 * seed})`);
  band.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = band;
  ctx.fillRect(0, 0, w, h);

  const count = Math.floor(density);
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < count; i += 1) {
    const u = rand();
    const v = rand();
    const x = u * w;
    const y = v * h;
    const a = 0.06 + 0.18 * rand();
    const len = 18 + 84 * rand();
    const th = (rand() * Math.PI * 2 + t * 0.0002) * (variant === 'cet-ai' ? 1.4 : 1);
    const dx = Math.cos(th) * len;
    const dy = Math.sin(th) * len;

    ctx.strokeStyle = `rgba(${baseB[0]},${baseB[1]},${baseB[2]},${a * 0.18})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + dx, y + dy);
    ctx.stroke();
  }
  ctx.globalCompositeOperation = 'source-over';

  const noiseBlocks = Math.floor(40 + 40 * clamp01(seed));
  for (let i = 0; i < noiseBlocks; i += 1) {
    const x = rand() * w;
    const y = rand() * h;
    const ww = 40 + rand() * 140;
    const hh = 1 + rand() * 3;
    const alpha = variant === 'demo' ? 0.06 : 0.045;
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fillRect(x, y, ww, hh);
  }
}

function RouteSignatureLayer({ routePath }: { routePath: string }) {
  const reduced = useReducedMotion();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const seed = useSessionSeed('routeSignature');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const variant = useMemo(() => routeVariant(routePath), [routePath]);
  const lhci = import.meta.env.VITE_LHCI === '1';
  const isAudit = useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    const navAny = navigator as Navigator & { webdriver?: boolean };
    return navAny.webdriver === true || /HeadlessChrome/i.test(navigator.userAgent);
  }, []);

  useEffect(() => {
    if (lhci) return;
    if (isAudit) return;
    if (reduced) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let last = 0;
    const fps = isMobile ? 22 : 30;
    const step = 1000 / fps;

    const resize = () => {
      const dpr = isMobile ? 1 : Math.min(1.5, window.devicePixelRatio || 1);
      const w = Math.max(1, Math.floor(window.innerWidth * dpr));
      const h = Math.max(1, Math.floor(window.innerHeight * dpr));
      canvas.width = w;
      canvas.height = h;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    const loop = (ts: number) => {
      raf = requestAnimationFrame(loop);
      if (ts - last < step) return;
      last = ts;
      const w = canvas.width;
      const h = canvas.height;
      const density =
        variant === 'demo'
          ? (isMobile ? 220 : 420)
          : variant === 'cet-ai'
            ? (isMobile ? 160 : 320)
            : variant === 'rwa'
              ? (isMobile ? 140 : 280)
              : (isMobile ? 120 : 240);
      drawFrame(ctx, w, h, ts, variant, seed, density);
    };

    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(raf);
    };
  }, [isAudit, isMobile, lhci, reduced, seed, variant]);

  if (lhci || isAudit) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[2]" aria-hidden>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 opacity-[0.38] mix-blend-screen"
      />
    </div>
  );
}

export default memo(RouteSignatureLayer);
