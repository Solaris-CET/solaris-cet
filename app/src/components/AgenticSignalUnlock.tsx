import { useEffect } from 'react';
import { useKonamiState } from '@/hooks/useKonami';

interface AgenticSignalUnlockProps {
  /** Konami listener only while this is true (e.g. Agentic section intersecting). */
  active: boolean;
}

/**
 * Konami (↑↑↓↓←→←→BA) while the section is visible → brief celebratory overlay.
 */
const AgenticSignalUnlock = ({ active }: AgenticSignalUnlockProps) => {
  const { unlocked, reset } = useKonamiState(active);

  useEffect(() => {
    if (!unlocked) return;
    const t = window.setTimeout(() => reset(), 5200);
    return () => window.clearTimeout(t);
  }, [unlocked, reset]);

  if (!unlocked) return null;

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center p-6 pointer-events-none animate-[signal-fade_5.2s_ease-out_forwards]"
      role="status"
      aria-live="polite"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(242,201,76,0.22),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {Array.from({ length: 24 }).map((_, i) => (
          <span
            key={i}
            className="absolute left-1/2 top-1/2 h-[2px] w-[min(42vw,220px)] origin-left opacity-0 rounded-full"
            style={{
              transform: `rotate(${i * 15}deg)`,
              background: `linear-gradient(90deg, rgba(46,231,255,0.95), transparent)`,
              animation: `signal-ray 0.85s ease-out ${i * 0.025}s forwards`,
            }}
          />
        ))}
      </div>
      <div className="relative text-center max-w-md border border-solaris-gold/40 rounded-2xl bg-slate-950/92 backdrop-blur-xl px-6 py-8 shadow-[0_0_60px_rgba(242,201,76,0.18)]">
        <p className="font-display text-solaris-gold text-lg sm:text-xl font-bold mb-2 tracking-tight">
          Semnal recunoscut
        </p>
        <p className="text-solaris-text/95 text-sm sm:text-base leading-relaxed">
          200.000 de noduri au clipit o dată, în sincron imperfect, doar pentru tine. RAV îți urează spor la
          explorare.
        </p>
        <p className="mt-4 font-mono text-[10px] text-solaris-cyan/80">↑↑↓↓←→←→BA · mesh handshake OK</p>
      </div>
      <style>{`
        @keyframes signal-ray {
          from { opacity: 0; filter: blur(4px); }
          40% { opacity: 0.9; filter: blur(0); }
          to { opacity: 0.2; filter: blur(1px); }
        }
        @keyframes signal-fade {
          0% { opacity: 0; }
          10% { opacity: 1; }
          76% { opacity: 1; }
          100% { opacity: 0; visibility: hidden; }
        }
      `}</style>
    </div>
  );
};

export default AgenticSignalUnlock;
