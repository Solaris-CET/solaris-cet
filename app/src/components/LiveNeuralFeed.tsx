import { useCallback, useEffect, useRef, useState } from 'react';
import { Activity } from 'lucide-react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { expressSkillForFeed } from '@/lib/skillGenome';

const DEPTS = [
  'customer-ops',
  'engineering',
  'sales',
  'data-intelligence',
  'finance',
  'marketing',
  'product-design',
  'security',
  'legal',
  'research',
] as const;

const SOURCES = [
  'GROK_STREAM',
  'GEMINI_FUSION',
  'WEB_CRAWL',
  'GITHUB_OS',
  'ARXIV',
  'REG_FEEDS',
  'API_MESH',
  'IPFS_AUDIT',
] as const;

function rand<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function makeLine(skillSeqRef: { n: number }): string {
  const t = new Date().toISOString().slice(11, 23);
  const r = Math.random();
  if (r < 0.055) {
    const { line } = expressSkillForFeed(skillSeqRef.n++);
    return line;
  }
  if (r < 0.095) {
    const sparks = ['✦', '◇', '◈', '✧'];
    return `[${t}] [CHIME] mesh_resonance=${rand(sparks)} observer=you latency_ms=0.0 (almost)`;
  }
  const dept = rand(DEPTS);
  const src = rand(SOURCES);
  const batch = 256 + Math.floor(Math.random() * 7936);
  const agents = 180_000 + Math.floor(Math.random() * 20_000);
  const tok = (1.2 + Math.random() * 2.8).toFixed(2);
  const fuse = Math.random() > 0.35 ? 'GROK×GEMINI' : 'GEMINI×GROK';
  const modes = [
    () => `[${t}] [NEURAL] dept=${dept} batch=${batch} src=${src} tok/s=${fuse}:${tok}M`,
    () => `[${t}] [RAV] VERIFY shard=${src} agents=${agents} latency_ms=${(12 + Math.random() * 40).toFixed(1)}`,
    () => `[${t}] [SIM] training_epoch=${1 + Math.floor(Math.random() * 9)} loss↓ grad_sync=OK mesh=${agents}`,
    () => `[${t}] [INGEST] open_web+git+registry vectors=${(batch * 14).toLocaleString()} fused=${fuse}`,
    () => `[${t}] [ROUTER] queue_depth=${Math.floor(Math.random() * 120)} backpressure=GREEN dept=${dept}`,
  ];
  return rand(modes)();
}

const MAX_LINES = 22;

/**
 * Simulated terminal-style stream: 200k-agent mesh consuming Grok × Gemini
 * and global open signals (illustrative, not live backend telemetry).
 */
const LiveNeuralFeed = () => {
  const [lines, setLines] = useState<string[]>(() => [
    `[${new Date().toISOString().slice(11, 23)}] [BOOT] neural_mesh=200000 target=FULL_SPECTRUM_RAV`,
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const skillSeqRef = useRef({ n: 0 });
  const prefersReducedMotion = useReducedMotion();

  const tick = useCallback(() => {
    setLines(prev => {
      const next = [...prev, makeLine(skillSeqRef.current)];
      return next.length > MAX_LINES ? next.slice(-MAX_LINES) : next;
    });
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const ms = 420 + Math.floor(Math.random() * 280);
    const id = window.setInterval(tick, ms);
    return () => window.clearInterval(id);
  }, [tick, prefersReducedMotion]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [lines]);

  return (
    <div
      className="relative bento-card border border-solaris-cyan/25 overflow-hidden shadow-depth bg-[#05060d]/90 neural-feed-crt"
      role="log"
      aria-live="polite"
      aria-label="Live neural feed simulation"
    >
      <div
        className="pointer-events-none absolute inset-0 z-[1] opacity-[0.11] mix-blend-overlay neural-feed-scanlines"
        aria-hidden
      />
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/10 bg-solaris-cyan/5 relative z-[2]">
        <Activity className="w-4 h-4 text-solaris-cyan shrink-0 animate-pulse" />
        <span className="hud-label text-solaris-cyan text-[10px] tracking-wider">
          LIVE NEURAL FEED · DATA TRAINING SIMULATION
        </span>
        <span className="ml-auto font-mono text-[10px] text-emerald-400/90 tabular-nums">
          GROK × GEMINI · 200K MESH
        </span>
      </div>
      <div
        ref={scrollRef}
        className="relative z-[2] h-[min(320px,42vh)] overflow-y-auto px-3 py-2 font-mono text-[10px] sm:text-[11px] leading-relaxed text-solaris-muted scrollbar-thin"
      >
        {lines.map((line, i) => (
          <div
            key={`${i}-${line.slice(0, 24)}`}
            className={
              line.includes('[CHIME]')
                ? 'text-solaris-gold whitespace-pre-wrap break-all drop-shadow-[0_0_8px_rgba(242,201,76,0.35)]'
                : i === lines.length - 1
                  ? 'text-solaris-text whitespace-pre-wrap break-all'
                  : 'text-solaris-muted/85 whitespace-pre-wrap break-all'
            }
          >
            {line}
          </div>
        ))}
      </div>
      <p className="relative z-[2] px-3 pb-2 text-[9px] text-solaris-muted/50 font-mono border-t border-white/5 pt-1.5">
        Illustrative simulation — models the aggregate throughput of the distributed agent mesh, not a live log.
      </p>
      <style>{`
        .neural-feed-scanlines {
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 0, 0, 0.13) 2px,
            rgba(0, 0, 0, 0.13) 3px
          );
        }
        .neural-feed-crt {
          box-shadow: inset 0 0 40px rgba(46, 231, 255, 0.04), 0 0 0 1px rgba(46, 231, 255, 0.08);
        }
      `}</style>
    </div>
  );
};

export default LiveNeuralFeed;
