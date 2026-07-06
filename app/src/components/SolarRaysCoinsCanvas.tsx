import { useEffect, useRef } from 'react';

import { useIsMobile } from '@/hooks/use-mobile';
import { useReducedMotion } from '@/hooks/useReducedMotion';

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  a: number;
  drift: number;
};

export default function SolarRaysCoinsCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = useReducedMotion();
  const isMobile = useIsMobile();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (reducedMotion || isMobile) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const particles: Particle[] = [];
    const maxParticles = 56;
    let raf = 0;
    let w = 0;
    let h = 0;
    let dpr = 1;
    const start = performance.now();

    const resize = () => {
      const parent = canvas.parentElement;
      const rect = parent?.getBoundingClientRect();
      if (!rect) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, Math.floor(rect.width));
      h = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const rand = (min: number, max: number) => min + Math.random() * (max - min);

    const spawn = (hardReset = false) => {
      if (hardReset) particles.length = 0;
      while (particles.length < maxParticles) {
        const y = rand(-h * 0.1, h * 1.1);
        const x = rand(-w * 0.1, w * 1.1);
        const speed = rand(0.08, 0.35);
        const angle = rand(-Math.PI * 0.1, Math.PI * 0.55);
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          r: rand(2.2, 6.2),
          a: rand(0.25, 0.85),
          drift: rand(-0.75, 0.75),
        });
      }
    };

    const drawBackground = (t: number) => {
      const g = ctx.createRadialGradient(w * 0.2, h * 0.25, 0, w * 0.2, h * 0.25, Math.max(w, h) * 0.95);
      g.addColorStop(0, 'rgba(242, 201, 76, 0.12)');
      g.addColorStop(0.22, 'rgba(242, 201, 76, 0.06)');
      g.addColorStop(0.55, 'rgba(46, 231, 255, 0.04)');
      g.addColorStop(1, 'rgba(2, 5, 16, 0)');
      ctx.fillStyle = 'rgba(2, 5, 16, 0.22)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      const centerX = w * 0.18;
      const centerY = h * 0.28;
      const rays = 10;
      const base = t * 0.00018;
      for (let i = 0; i < rays; i += 1) {
        const ang = base + i * (Math.PI / (rays + 2)) + Math.sin(t * 0.0007 + i) * 0.02;
        const len = Math.max(w, h) * rand(0.75, 1.15);
        const x2 = centerX + Math.cos(ang) * len;
        const y2 = centerY + Math.sin(ang) * len;
        const lg = ctx.createLinearGradient(centerX, centerY, x2, y2);
        lg.addColorStop(0, 'rgba(242, 201, 76, 0.24)');
        lg.addColorStop(0.2, 'rgba(242, 201, 76, 0.08)');
        lg.addColorStop(1, 'rgba(242, 201, 76, 0)');
        ctx.strokeStyle = lg;
        ctx.lineWidth = rand(1, 2.5);
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    };

    const drawCoin = (p: Particle, t: number) => {
      const sparkle = 0.55 + Math.sin(t * 0.004 + p.drift) * 0.25;
      const gx = p.x - p.r * 0.35;
      const gy = p.y - p.r * 0.35;
      const grd = ctx.createRadialGradient(gx, gy, 0, p.x, p.y, p.r * 1.25);
      grd.addColorStop(0, `rgba(255, 248, 220, ${0.55 * p.a})`);
      grd.addColorStop(0.25, `rgba(242, 201, 76, ${0.55 * p.a})`);
      grd.addColorStop(1, `rgba(212, 175, 55, ${0.12 * p.a})`);
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = `rgba(242, 201, 76, ${0.22 * p.a})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r + 0.6, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = `rgba(255, 255, 255, ${sparkle * 0.25 * p.a})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p.x - p.r * 0.2, p.y - p.r * 0.45);
      ctx.lineTo(p.x + p.r * 0.55, p.y + p.r * 0.15);
      ctx.stroke();
    };

    const step = (t: number) => {
      drawBackground(t);
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < particles.length; i += 1) {
        const p = particles[i];
        p.x += p.vx + Math.sin((t + i * 31) * 0.0012) * 0.06 * p.drift;
        p.y += p.vy + Math.cos((t + i * 27) * 0.0011) * 0.06 * p.drift;
        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20;
        if (p.y > h + 20) p.y = -20;
        drawCoin(p, t);
      }
      ctx.globalCompositeOperation = 'source-over';
      raf = window.requestAnimationFrame(step);
    };

    resize();
    spawn(true);
    raf = window.requestAnimationFrame(step);

    const onResize = () => {
      resize();
      spawn(true);
    };

    window.addEventListener('resize', onResize);
    const warm = window.setTimeout(() => {
      if (performance.now() - start > 0) return;
    }, 0);

    return () => {
      window.clearTimeout(warm);
      window.removeEventListener('resize', onResize);
      window.cancelAnimationFrame(raf);
    };
  }, [reducedMotion, isMobile]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full opacity-90"
      aria-hidden="true"
    />
  );
}

