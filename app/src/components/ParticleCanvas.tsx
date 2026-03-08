import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
  pulse: number;
  pulseSpeed: number;
}

/**
 * Props accepted by {@link ParticleCanvas}.
 */
interface ParticleCanvasProps {
  /** Number of particles to render (default: `80`). */
  count?: number;
  /** Additional Tailwind/CSS class names applied to the `<canvas>`. */
  className?: string;
  /**
   * Maximum distance in pixels at which two particles are connected by a
   * faint line (default: `120`).
   */
  connectionRadius?: number;
  /**
   * When `true`, particles near the cursor are pushed away, creating an
   * interactive repulsion effect (default: `true`).
   */
  mouseInteraction?: boolean;
}

const COLORS = ['#F2C94C', '#2EE7FF', '#F4F6FF', '#F2C94C', '#2EE7FF'];

/**
 * Converts a CSS hex colour string to an `rgba(…)` value with the given alpha.
 *
 * @param hex   - 6-digit hex colour, e.g. `'#F2C94C'`.
 * @param alpha - Opacity in the range `[0, 1]`.
 * @returns A CSS `rgba(…)` string.
 */
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * ParticleCanvas — a full-size `<canvas>` that renders an animated field of
 * drifting particles connected by faint lines when within
 * {@link ParticleCanvasProps.connectionRadius} of each other.
 *
 * Particles pulse in opacity and, when `mouseInteraction` is enabled, are
 * repelled by the cursor within a 100 px radius.
 *
 * The canvas automatically resizes to match its CSS dimensions via a
 * `ResizeObserver` and the animation loop is cleaned up on unmount.
 *
 * @param props - {@link ParticleCanvasProps}
 * @returns A `<canvas>` element.
 */
const ParticleCanvas = ({
  count = 80,
  className = '',
  connectionRadius = 120,
  mouseInteraction = true,
}: ParticleCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    particlesRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 2.5 + 0.5,
      opacity: Math.random() * 0.6 + 0.1,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.01 + Math.random() * 0.02,
    }));

    const handleMouseMove = (e: MouseEvent) => {
      if (!mouseInteraction) return;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const particles = particlesRef.current;
      const mouse = mouseRef.current;

      particles.forEach((p) => {
        // Mouse repulsion
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120 && mouseInteraction) {
          const force = (120 - dist) / 120;
          p.vx += (dx / dist) * force * 0.25;
          p.vy += (dy / dist) * force * 0.25;
        }

        // Velocity dampening
        p.vx *= 0.98;
        p.vy *= 0.98;
        p.x += p.vx;
        p.y += p.vy;

        // Pulse animation
        p.pulse += p.pulseSpeed;
        const pulseFactor = 0.5 + 0.5 * Math.sin(p.pulse);

        // Wrap around edges
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // Draw particle with glow
        const size = p.size * (0.8 + 0.4 * pulseFactor);
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity * pulseFactor;
        ctx.fill();

        // Tiny glow
        if (size > 1.5) {
          const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 3);
          grd.addColorStop(0, hexToRgba(p.color, 0.25));
          grd.addColorStop(1, 'transparent');
          ctx.beginPath();
          ctx.arc(p.x, p.y, size * 3, 0, Math.PI * 2);
          ctx.fillStyle = grd;
          ctx.globalAlpha = 0.3 * pulseFactor;
          ctx.fill();
        }
      });

      ctx.globalAlpha = 1;

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < connectionRadius) {
            const alpha = (1 - dist / connectionRadius) * 0.15;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            // Use gold for connections close to cursor
            const cdx = (particles[i].x + particles[j].x) / 2 - mouse.x;
            const cdy = (particles[i].y + particles[j].y) / 2 - mouse.y;
            const cdist = Math.sqrt(cdx * cdx + cdy * cdy);
            ctx.strokeStyle = cdist < 150 ? '#F2C94C' : '#2EE7FF';
            ctx.globalAlpha = alpha * (cdist < 150 ? 2 : 1);
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;

      rafRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('mousemove', handleMouseMove);
      ro.disconnect();
    };
  }, [count, connectionRadius, mouseInteraction]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full ${className}`}
      style={{ display: 'block' }}
    />
  );
};

export default ParticleCanvas;
