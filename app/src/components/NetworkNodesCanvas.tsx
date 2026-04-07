import React, { useRef, useEffect } from 'react';

type NodeParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
};

const NetworkNodesCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const connection = (navigator as unknown as { connection?: { effectiveType?: string; saveData?: boolean } }).connection;
    const saveData = connection?.saveData === true;
    const effectiveType = connection?.effectiveType ?? '';

    const applyCanvasSize = () => {
      dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    applyCanvasSize();

    let particles: NodeParticle[] = [];
    const isDesktop = () => window.innerWidth >= 768;
    const shouldRun =
      () => isDesktop()
        && !prefersReducedMotion
        && !saveData
        && effectiveType !== '2g'
        && effectiveType !== 'slow-2g';

    const maxParticles = (() => {
      const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 8 : 8;
      if (cores <= 4) return 55;
      return 80;
    })();

    const pointer = { x: width * 0.5, y: height * 0.5, active: false };

    const createParticle = (): NodeParticle => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
    });

    const init = () => {
      particles = [];
      if (!shouldRun()) return;
      for (let i = 0; i < maxParticles; i += 1) particles.push(createParticle());
    };

    let animationFrame: number;
    let running = false;
    const animate = () => {
      running = true;
      ctx.clearRect(0, 0, width, height);
      
      particles.forEach((p, i) => {
        if (pointer.active) {
          const dxp = pointer.x - p.x;
          const dyp = pointer.y - p.y;
          const dp = Math.sqrt(dxp * dxp + dyp * dyp);
          if (dp > 0 && dp < 200) {
            const pull = (1 - dp / 200) * 0.012;
            p.vx += (dxp / dp) * pull;
            p.vy += (dyp / dp) * pull;
          }
        }

        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
        p.vx *= 0.995;
        p.vy *= 0.995;

        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(46, 231, 255, 0.4)';
        ctx.fill();
        
        for (let j = i + 1; j < particles.length; j++) {
          const dx = p.x - particles[j].x;
          const dy = p.y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 130) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(46, 231, 255, ${0.15 - dist / 130 * 0.15})`;
            ctx.lineWidth = 1;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }

        if (pointer.active) {
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 160) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(242, 201, 76, ${0.18 - dist / 160 * 0.18})`;
            ctx.lineWidth = 1;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(pointer.x, pointer.y);
            ctx.stroke();
          }
        }
      });

      if (pointer.active) {
        ctx.beginPath();
        ctx.arc(pointer.x, pointer.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(242, 201, 76, 0.35)';
        ctx.fill();
      }
      animationFrame = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      applyCanvasSize();
      init();
      if (!shouldRun() && running) {
        cancelAnimationFrame(animationFrame);
        running = false;
      }
      if (shouldRun() && !running && particles.length > 0) {
        animate();
      }
    };

    init();
    if (particles.length > 0) animate();

    window.addEventListener('resize', handleResize);
    const handleMouseMove = (e: MouseEvent) => {
      pointer.active = true;
      pointer.x = e.clientX;
      pointer.y = e.clientY;
    };
    const handleMouseLeave = () => {
      pointer.active = false;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      if (running) cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <>
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 z-0 hidden md:block opacity-70 pointer-events-none" 
        style={{ mixBlendMode: 'screen' }}
        aria-hidden="true" 
      />
      <div className="md:hidden absolute inset-0 z-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PGNpcmNsZSBjeD0iMTAiIGN5PSIxMCIgcj0iMiIgZmlsbD0iIzJlZTdmZiIgLz48L3N2Zz4=')] pointer-events-none" />
    </>
  );
};

export default NetworkNodesCanvas;
