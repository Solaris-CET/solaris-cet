import { useEffect, useRef } from 'react';

import { useDocumentHidden } from '@/hooks/useDocumentHidden';
import { useIsMobile } from '@/hooks/use-mobile';
import { useReducedMotion } from '@/hooks/useReducedMotion';

// Sursa: animație quantum field adaptată din design extern
// Adaptări: reducedMotion gate, ResizeObserver, DPR scaling, cleanup complet, culori aliniate brandului

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
}

interface QParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hue: 'cyan' | 'magenta';
  baseVx: number;
  baseVy: number;
}

export default function QuantumFieldCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = useReducedMotion();
  const isMobile = useIsMobile();
  const isWebDriver = typeof navigator !== 'undefined' && navigator.webdriver;
  const hidden = useDocumentHidden();

  useEffect(() => {
    if (reducedMotion || isMobile || isWebDriver || hidden) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // ── Stare internă ──────────────────────────────────────────────
    let w = 0,
      h = 0,
      dpr = 1;
    let raf = 0;
    let alive = true;
    const stars: Star[] = [];
    const particles: QParticle[] = [];
    const mouse = { x: -9999, y: -9999 };
    let rectLeft = 0;
    let rectTop = 0;

    // ── Resize ─────────────────────────────────────────────────────
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      rectLeft = rect.left;
      rectTop = rect.top;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, Math.floor(rect.width));
      h = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initEntities();
    };

    const ro = new ResizeObserver(() => resize());
    ro.observe(canvas.parentElement ?? canvas);

    // ── Init entități ───────────────────────────────────────────────
    const rand = (a: number, b: number) => a + Math.random() * (b - a);

    const initEntities = () => {
      // Stele — mai puține decât originalul pentru a nu supraîncărca cu SolarRays
      stars.length = 0;
      const starCount = Math.min(320, Math.floor((w * h) / 6000));
      for (let i = 0; i < starCount; i++) {
        stars.push({
          x: rand(0, w),
          y: rand(0, h),
          size: rand(0.4, 1.8),
          speed: rand(0.08, 0.35),
          opacity: rand(0.3, 0.9),
        });
      }

      // Particule cuantice — reduse față de original (60→28) pentru compoziție curată
      particles.length = 0;
      const pCount = Math.min(28, Math.floor((w * h) / 22000));
      for (let i = 0; i < pCount; i++) {
        const bvx = rand(-0.4, 0.4);
        const bvy = rand(-0.4, 0.4);
        particles.push({
          x: rand(0, w),
          y: rand(0, h),
          vx: bvx,
          vy: bvy,
          baseVx: bvx,
          baseVy: bvy,
          radius: rand(1.2, 3.2),
          hue: Math.random() > 0.5 ? 'cyan' : 'magenta',
        });
      }
    };

    // ── Draw ────────────────────────────────────────────────────────
    const CYAN = '#2ee7ff'; // --solaris-cyan
    const MAGENTA = '#d400ff'; // accent cosmic (nu în brand tokens — usage doar la canvas)
    const VIOLET = '#7f00ff'; // entanglement lines

    const drawStar = (s: Star) => {
      ctx.fillStyle = `rgba(255,255,255,${s.opacity})`;
      ctx.fillRect(s.x, s.y, s.size, s.size);
    };

    const drawParticle = (p: QParticle) => {
      const color = p.hue === 'cyan' ? CYAN : MAGENTA;
      ctx.shadowBlur = 16;
      ctx.shadowColor = color;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    };

    // Linii de entanglement — maxDist redus față de original (110→85) pentru claritate
    const drawEntanglement = () => {
      const maxDist = 85;
      ctx.lineWidth = 0.6;
      ctx.save();
      ctx.strokeStyle = VIOLET;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.55;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      ctx.restore();
    };

    // ── Frame loop ──────────────────────────────────────────────────
    const tick = () => {
      if (!alive) return;

      // Trail semi-transparent — întuneric profund, nu negru pur
      ctx.fillStyle = 'rgba(2,5,16,0.18)';
      ctx.fillRect(0, 0, w, h);

      // Stele
      for (const s of stars) {
        s.y += s.speed;
        if (s.y > h) {
          s.y = 0;
          s.x = rand(0, w);
        }
        drawStar(s);
      }

      // Particule
      ctx.globalCompositeOperation = 'screen';
      for (const p of particles) {
        // Mouse repulsion (soft — nu agresiv ca în original)
        const mdx = p.x - mouse.x;
        const mdy = p.y - mouse.y;
        const md = Math.sqrt(mdx * mdx + mdy * mdy);
        if (md < 120 && md > 0) {
          p.vx += (mdx / md) * 0.8;
          p.vy += (mdy / md) * 0.8;
        }
        // Damping spre viteza de bază
        p.vx += (p.baseVx - p.vx) * 0.04;
        p.vy += (p.baseVy - p.vy) * 0.04;
        // Clamp viteza max
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > 2.5) {
          p.vx *= 2.5 / speed;
          p.vy *= 2.5 / speed;
        }

        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;
        drawParticle(p);
      }
      ctx.globalCompositeOperation = 'source-over';

      // Linii entanglement
      drawEntanglement();

      raf = requestAnimationFrame(tick);
    };

    // ── Mouse ───────────────────────────────────────────────────────
    const onMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX - rectLeft;
      mouse.y = e.clientY - rectTop;
    };
    const onMouseLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    canvas.addEventListener('mousemove', onMouseMove, { passive: true });
    canvas.addEventListener('mouseleave', onMouseLeave);

    // ── Start ───────────────────────────────────────────────────────
    resize();
    raf = requestAnimationFrame(tick);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [reducedMotion, isMobile, isWebDriver, hidden]);

  if (reducedMotion || isMobile || isWebDriver || hidden) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ opacity: 0.55, mixBlendMode: 'screen', pointerEvents: 'none' }}
      aria-hidden
    />
  );
}
