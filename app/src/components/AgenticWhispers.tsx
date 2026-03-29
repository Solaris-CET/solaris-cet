import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const WHISPERS = [
  'Undeva între Grok și Gemini, un agent tocmai a legat un fir de date de dealul cu pământul din Cetățuia.',
  '200,000 șoapte devin, după RAV, un singur „da” verificabil.',
  'The mesh thinks in shards; you read the poetry in the log tail.',
  'Fiecare linie din feed e o minciună utilă — modelul scalei reale, nu a serverului tău.',
  'Open source nu e decor: e combustibil. Registry-urile respiră odată cu agenții.',
  'Dual-AI nu e ego dublu — e două oglinzi care se corectează până converg.',
  'Pe TON, timpul e scurt; în mesh, paralelismul e infinit doar în poveste — aici, aproape.',
  'Cât timp ești aici, tastatura e un al doilea canal — unii își amintesc un ritual din anii ’80.',
];

/**
 * Rotating micro-poetry strip — human warmth in a technical section.
 */
const AgenticWhispers = () => {
  const [i, setI] = useState(() => Math.floor(Math.random() * WHISPERS.length));
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => {
      setI(prev => (prev + 1) % WHISPERS.length);
    }, 8200);
    return () => window.clearInterval(id);
  }, [reduce]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-br from-solaris-cyan/[0.06] via-transparent to-solaris-gold/[0.05] px-4 py-3 sm:px-5 sm:py-4 mb-8">
      <div className="absolute inset-0 opacity-[0.35] pointer-events-none bg-[linear-gradient(110deg,transparent_40%,rgba(242,201,76,0.08)_50%,transparent_60%)] bg-[length:200%_100%] animate-[whisper-shimmer_7s_ease-in-out_infinite]" />
      <div className="relative flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-solaris-gold shrink-0 mt-0.5 opacity-90" aria-hidden />
        <div className="min-w-0">
          <div className="hud-label text-[9px] text-solaris-gold/90 mb-1 tracking-[0.2em]">MESH WHISPER</div>
          <p
            key={i}
            className="text-sm sm:text-base text-solaris-text/90 leading-snug font-display italic transition-opacity duration-700"
            style={{ animation: reduce ? undefined : 'whisper-in 0.9s ease-out' }}
          >
            {WHISPERS[i]}
          </p>
        </div>
      </div>
      <style>{`
        @keyframes whisper-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes whisper-shimmer {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  );
};

export default AgenticWhispers;
