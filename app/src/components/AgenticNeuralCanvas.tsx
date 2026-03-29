import { useEffect, useRef } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { shortSkillWhisper, skillSeedFromLabel } from '@/lib/meshSkillFeed';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: number;
}

/**
 * Ambient synaptic field — subtle nodes + edges, pointer parallax. Decorative only.
 */
const AgenticNeuralCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();
  const mouse = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    if (reduce) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let nodes: Node[] = [];
    let raf = 0;
    let w = 0;
    let h = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(48, Math.floor((w * h) / 22000));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        phase: Math.random() * Math.PI * 2,
      }));
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.current = {
        x: (e.clientX - rect.left) / Math.max(rect.width, 1),
        y: (e.clientY - rect.top) / Math.max(rect.height, 1),
      };
    };
    window.addEventListener('pointermove', onMove, { passive: true });

    const tick = (t: number) => {
      const time = t * 0.001;
      ctx.clearRect(0, 0, w, h);

      const mx = mouse.current.x * w;
      const my = mouse.current.y * h;

      for (const n of nodes) {
        n.x += n.vx + Math.sin(time + n.phase) * 0.08;
        n.y += n.vy + Math.cos(time * 0.8 + n.phase) * 0.06;
        const dx = mx - n.x;
        const dy = my - n.y;
        n.x += dx * 0.00025;
        n.y += dy * 0.00025;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
        n.x = Math.max(0, Math.min(w, n.x));
        n.y = Math.max(0, Math.min(h, n.y));
      }

      const linkDist = Math.min(120, w * 0.14);
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i]!;
          const b = nodes[j]!;
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < linkDist) {
            const alpha = (1 - d / linkDist) * 0.22;
            ctx.strokeStyle = `rgba(46, 231, 255, ${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      for (const n of nodes) {
        const pulse = 0.45 + Math.sin(time * 2 + n.phase) * 0.2;
        ctx.fillStyle = `rgba(242, 201, 76, ${pulse * 0.35})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, 1.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(46, 231, 255, ${pulse * 0.5})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, 0.45, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('pointermove', onMove);
    };
  }, [reduce]);

  const meshCaption = (
    <p
      className="absolute bottom-2 left-2 right-2 z-[1] text-center text-[8px] font-mono text-fuchsia-200/35 line-clamp-1"
      aria-hidden
    >
      {shortSkillWhisper(skillSeedFromLabel('neuralCanvas|synapse'))}
    </p>
  );

  if (reduce) {
    return (
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute inset-0 opacity-[0.07] bg-[radial-gradient(ellipse_at_50%_40%,rgba(46,231,255,0.5),transparent_55%),radial-gradient(ellipse_at_70%_70%,rgba(242,201,76,0.35),transparent_50%)]" />
        {meshCaption}
      </div>
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full opacity-[0.55] mix-blend-screen"
        aria-hidden
      />
      {meshCaption}
    </div>
  );
};

export default AgenticNeuralCanvas;
