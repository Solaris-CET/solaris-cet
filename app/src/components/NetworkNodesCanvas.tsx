import React, { useRef, useEffect } from 'react';

const NetworkNodesCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    let particles: Particle[] = [];
    const maxParticles = width < 768 ? 0 : 70;

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = (Math.random() - 0.5) * 0.3;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(46, 231, 255, 0.4)';
        ctx.fill();
      }
    }

    const init = () => {
      particles = [];
      for (let i = 0; i < maxParticles; i++) {
        particles.push(new Particle());
      }
    };

    let animationFrame: number;
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      particles.forEach((p, i) => {
        p.update();
        p.draw();
        
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
      });
      animationFrame = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      if (width < 768) {
         particles = [];
      } else if (particles.length === 0) {
         init();
         animate();
      }
    };

    init();
    if (particles.length > 0) animate();

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrame);
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
