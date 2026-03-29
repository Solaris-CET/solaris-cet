import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Globe2, Radio } from 'lucide-react';

const NODES = [
  { id: 'web', label: 'Open Web', angle: -90 },
  { id: 'git', label: 'Public Git', angle: -18 },
  { id: 'pkg', label: 'npm / PyPI / crates', angle: 54 },
  { id: 'papers', label: 'arXiv & papers', angle: 126 },
  { id: 'api', label: 'REST & GraphQL APIs', angle: 198 },
  { id: 'chain', label: 'On-chain state', angle: 270 },
] as const;

const R = 38;
const CX = 50;
const CY = 50;

function polar(angleDeg: number, r: number): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

/**
 * SVG diagram: RAV core pulling from internet-scale sources (conceptual).
 */
const RavInternetMesh = () => {
  const reduce = useReducedMotion();

  return (
    <div className="bento-card border border-solaris-gold/20 p-5 sm:p-6 overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <Globe2 className="w-4 h-4 text-solaris-gold" />
        <span className="hud-label text-solaris-gold text-[10px]">RAV PROTOCOL · INTERNET-SCALE ACCESS</span>
      </div>
      <p className="text-solaris-muted text-xs sm:text-sm leading-relaxed mb-5 max-w-2xl">
        Reason · Act · Verify routes every critical path through dual models (Grok × Gemini), while retrieval
        layers fan out across the same surfaces humans use — the public web, package ecosystems, code hosts,
        and APIs — so the mesh can compound evidence instead of guessing in a closed box.
      </p>

      <div className="relative mx-auto max-w-md aspect-square">
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_24px_rgba(242,201,76,0.12)]" aria-hidden>
          <defs>
            <linearGradient id="rav-beam" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2ee7ff" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#f2c94c" stopOpacity="0.85" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="0.6" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {NODES.map((n) => {
            const outer = polar(n.angle, R);
            const inner = polar(n.angle, R * 0.42);
            return (
              <g key={n.id}>
                <line
                  x1={inner.x}
                  y1={inner.y}
                  x2={outer.x}
                  y2={outer.y}
                  stroke="url(#rav-beam)"
                  strokeWidth={0.35}
                  strokeOpacity={reduce ? 0.35 : 0.5}
                  strokeDasharray="1.8 1.4"
                  className={reduce ? '' : 'rav-mesh-beam'}
                />
                <circle cx={outer.x} cy={outer.y} r={1.8} fill="#f2c94c" opacity={0.9} filter="url(#glow)" />
              </g>
            );
          })}

          <circle cx={CX} cy={CY} r={14} fill="rgba(2,6,23,0.92)" stroke="rgba(242,201,76,0.35)" strokeWidth={0.4} />
          <circle
            cx={CX}
            cy={CY}
            r={11}
            fill="none"
            stroke="rgba(46,231,255,0.25)"
            strokeWidth={0.25}
            className={reduce ? '' : 'animate-pulse'}
          />
          <text
            x={CX}
            y={CY - 1.5}
            textAnchor="middle"
            fill="#f2c94c"
            fontSize="3.2"
            fontFamily="monospace"
            fontWeight="bold"
          >
            RAV
          </text>
          <text x={CX} y={CY + 3.8} textAnchor="middle" fill="#a6a9b6" fontSize="2.4" fontFamily="monospace">
            CORE
          </text>
        </svg>

        {/* HTML labels for readability */}
        <div className="absolute inset-0 pointer-events-none">
          {NODES.map((n) => {
            const p = polar(n.angle, 46);
            const left = `${p.x}%`;
            const top = `${p.y}%`;
            return (
              <span
                key={n.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 text-[9px] sm:text-[10px] font-mono text-solaris-muted/90 whitespace-nowrap max-w-[28vw] sm:max-w-none truncate px-1"
                style={{ left, top }}
              >
                {n.label}
              </span>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-[10px] text-solaris-muted">
        <Radio className="w-3.5 h-3.5 text-solaris-cyan shrink-0" />
        <span>
          Dual-AI consensus reduces single-source blind spots; retrieval spans the same open corpus engineers and
          researchers already trust — not a walled garden.
        </span>
      </div>

      <style>{`
        @keyframes rav-mesh-pulse {
          0%, 100% { stroke-opacity: 0.28; }
          50% { stroke-opacity: 0.62; }
        }
        .rav-mesh-beam {
          animation: rav-mesh-pulse 2.4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default RavInternetMesh;
