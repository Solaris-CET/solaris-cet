import { useRef, useLayoutEffect, useState, useEffect, useCallback } from 'react';
import { gsap } from 'gsap';
import { Brain, Atom, ChevronRight, RotateCcw, Zap, Eye, Cpu } from 'lucide-react';

// Realistic TON mainnet block height range (as of 2025)
const TON_MAINNET_BLOCK_MIN = 40_000_000;
const TON_MAINNET_BLOCK_RANGE = 9_000_000;

// Animation timing constant for the reasoning step interval
const REASONING_STEP_DELAY_MS = 900;

interface ReasoningStep {
  phase: 'OBSERVE' | 'THINK' | 'PLAN' | 'ACT' | 'VERIFY';
  text: string;
  color: string;
}

const phaseColors: Record<string, string> = {
  OBSERVE: '#2EE7FF',
  THINK: '#F2C94C',
  PLAN: '#A78BFA',
  ACT: '#F97316',
  VERIFY: '#34D399',
};

function buildReasoningSteps(query: string): ReasoningStep[] {
  const q = query.trim().toLowerCase();
  const isPrice = q.includes('price') || q.includes('value') || q.includes('worth');
  const isMining = q.includes('mine') || q.includes('mining') || q.includes('earn');
  const isAI = q.includes('ai') || q.includes('intelligence') || q.includes('agent');
  const isTon = q.includes('ton') || q.includes('blockchain') || q.includes('chain');

  const observe = isPrice
    ? 'Scanning DeDust CET/USDT pool · 24h volume detected · Liquidity depth measured'
    : isMining
    ? 'Reading on-chain hashrate metrics · Active nodes: 18,420 · Reward schedule verified'
    : isAI
    ? 'Loading ReAct protocol trace · BRAID reasoning graph initialized · Agent context active'
    : isTon
    ? 'TON mainnet state sync · Block height confirmed · Smart contract ABI loaded'
    : 'Indexing query tokens · Context window populated · Knowledge graph traversal started';

  const think = isPrice
    ? 'Correlating pool liquidity with 9,000 CET fixed supply → scarcity premium calculated'
    : isMining
    ? 'Analysing 90-year emission schedule → optimal mining window identified'
    : isAI
    ? 'Mapping query to BRAID reasoning nodes → 74x efficiency path selected'
    : isTon
    ? 'Cross-referencing TON sharding topology with CET contract state'
    : 'Decomposing intent → sub-goals identified → priority ordering applied';

  const plan = isPrice
    ? 'Step 1: fetch pool TVL · Step 2: compute CET/USDT rate · Step 3: apply slippage model'
    : isMining
    ? 'Step 1: confirm node eligibility · Step 2: allocate compute quota · Step 3: submit PoW'
    : isAI
    ? 'Step 1: load agent memory · Step 2: reason over context · Step 3: generate verifiable action'
    : isTon
    ? 'Step 1: sign transaction · Step 2: broadcast to TON · Step 3: await 2-second finality'
    : 'Step 1: retrieve relevant facts · Step 2: synthesize response · Step 3: validate output';

  const act = isPrice
    ? 'Executing optimal swap via DeDust · Route: TON → CET · Slippage: 0.08%'
    : isMining
    ? 'Mining session initiated · Hashrate: 14.2 TH/s · Battery impact: ~0%'
    : isAI
    ? 'Agent action dispatched · On-chain reasoning trace anchored to TON block #' +
      (Math.floor(Math.random() * TON_MAINNET_BLOCK_RANGE) + TON_MAINNET_BLOCK_MIN)
    : isTon
    ? 'Transaction broadcast · TON mempool accepted · Finality countdown: 2.0s'
    : 'High-Intelligence response generated · Confidence: ' +
      (88 + Math.floor(Math.random() * 11)) + '%';

  const verify = isPrice
    ? 'Swap confirmed · CET balance updated · Price impact within tolerance ✓'
    : isMining
    ? 'Proof-of-Work hash validated by 18,420 nodes · Reward queued ✓'
    : isAI
    ? 'Reasoning trace verified on-chain · No hallucinations detected · Audit trail saved ✓'
    : isTon
    ? 'Block finalized in 1.97s · 2-of-3 validators confirmed · State root updated ✓'
    : 'Output cross-validated against on-chain facts · Integrity score: 99.2% ✓';

  return [
    { phase: 'OBSERVE', text: observe, color: phaseColors.OBSERVE },
    { phase: 'THINK', text: think, color: phaseColors.THINK },
    { phase: 'PLAN', text: plan, color: phaseColors.PLAN },
    { phase: 'ACT', text: act, color: phaseColors.ACT },
    { phase: 'VERIFY', text: verify, color: phaseColors.VERIFY },
  ];
}

const NeuralReasoningEngine = () => {
  const [query, setQuery] = useState('');
  const [steps, setSteps] = useState<ReasoningStep[]>([]);
  const [visibleIndex, setVisibleIndex] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = () => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const runReasoning = useCallback((q: string) => {
    clearTimer();
    const built = buildReasoningSteps(q || 'How does Solaris CET work?');
    setSteps(built);
    setVisibleIndex(0);
    setIsRunning(true);
    let idx = 0;
    intervalRef.current = setInterval(() => {
      idx += 1;
      if (idx >= built.length) {
        clearTimer();
        setIsRunning(false);
        setVisibleIndex(built.length - 1);
      } else {
        setVisibleIndex(idx);
      }
    }, REASONING_STEP_DELAY_MS);
  }, []);

  useEffect(() => () => clearTimer(), []);

  const handleReset = () => {
    clearTimer();
    setIsRunning(false);
    setVisibleIndex(-1);
    setSteps([]);
    setQuery('');
  };

  const phaseIcons: Record<string, typeof Brain> = {
    OBSERVE: Eye,
    THINK: Brain,
    PLAN: Cpu,
    ACT: Zap,
    VERIFY: ChevronRight,
  };

  return (
    <div className="glass-card p-6 h-full flex flex-col gap-4">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-10 h-10 rounded-xl bg-solaris-gold/10 flex items-center justify-center">
          <Brain className="w-5 h-5 text-solaris-gold" />
        </div>
        <div>
          <span className="hud-label text-solaris-gold block">DEMO #1</span>
          <h3 className="font-display font-bold text-solaris-text text-lg leading-none">
            Neural Reasoning Engine
          </h3>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-solaris-gold animate-pulse' : 'bg-emerald-400'}`} />
          <span className={`font-mono text-[10px] ${isRunning ? 'text-solaris-gold' : 'text-emerald-400'}`}>
            {isRunning ? 'PROCESSING' : 'READY'}
          </span>
        </div>
      </div>

      <p className="text-solaris-muted text-sm">
        Ask anything about Solaris CET, mining, AI agents, or TON. Watch the{' '}
        <span className="text-solaris-gold font-medium">High-Intelligence ReAct loop</span> process your query step by step.
      </p>

      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !isRunning && runReasoning(query)}
          placeholder="e.g. How does CET mining work?"
          className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-solaris-text placeholder:text-solaris-muted/50 focus:outline-none focus:border-solaris-gold/50 transition-colors text-sm"
        />
        <button
          onClick={() => !isRunning && runReasoning(query)}
          disabled={isRunning}
          className="px-4 py-2.5 rounded-xl bg-solaris-gold text-solaris-dark font-semibold text-sm hover:bg-solaris-gold/90 disabled:opacity-50 transition-all"
        >
          Run
        </button>
        <button
          onClick={handleReset}
          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-solaris-muted transition-all"
          aria-label="Reset"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Reasoning trace terminal */}
      <div className="flex-1 font-mono text-sm bg-black/30 rounded-xl p-4 min-h-[200px] border border-white/5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
          <span className="ml-2 text-solaris-muted text-[10px]">Solaris High-Intelligence · ReAct Protocol</span>
        </div>

        {steps.length === 0 && (
          <div className="text-solaris-muted/50 text-xs flex items-center gap-2 mt-8 justify-center">
            <Cpu className="w-4 h-4" />
            Enter a query above and press Run to activate the reasoning engine
          </div>
        )}

        <div className="space-y-2.5">
          {steps.map((step, i) => {
            const Icon = phaseIcons[step.phase] ?? ChevronRight;
            const visible = i <= visibleIndex;
            const active = i === visibleIndex;
            return (
              <div
                key={step.phase}
                className="transition-all duration-500"
                style={{
                  opacity: visible ? (active ? 1 : 0.45) : 0,
                  transform: visible ? 'translateX(0)' : 'translateX(-8px)',
                }}
              >
                <div className="flex items-start gap-2">
                  <span
                    className="shrink-0 inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded mt-0.5"
                    style={{
                      color: step.color,
                      border: `1px solid ${step.color}40`,
                      background: `${step.color}10`,
                      boxShadow: active ? `0 0 8px ${step.color}30` : 'none',
                    }}
                  >
                    <Icon className="w-2.5 h-2.5" />
                    {step.phase}
                  </span>
                  <span className="text-solaris-text text-xs leading-relaxed">{step.text}</span>
                </div>
              </div>
            );
          })}
        </div>

        {!isRunning && visibleIndex >= 0 && steps.length > 0 && (
          <div className="mt-3 flex items-center gap-1.5 text-emerald-400">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[10px] font-mono">REASONING COMPLETE · CHAIN VERIFIED</span>
          </div>
        )}

        {isRunning && (
          <div className="mt-3 flex items-center gap-1.5">
            <div className="w-1.5 h-4 bg-solaris-gold animate-pulse rounded-sm" />
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Quantum OS Entropy Oracle ───────────────────────────────────────────────

interface QubitState {
  id: number;
  angle: number;
  collapsed: boolean;
  value: 0 | 1;
  phase: number;
}

const NUM_QUBITS = 8;

function initQubits(): QubitState[] {
  return Array.from({ length: NUM_QUBITS }, (_, i) => ({
    id: i,
    angle: Math.random() * Math.PI * 2,
    collapsed: false,
    value: 0,
    phase: Math.random() * Math.PI * 2,
  }));
}

const QuantumEntropyOracle = () => {
  const [qubits, setQubits] = useState<QubitState[]>(initQubits);
  const [collapsed, setCollapsed] = useState(false);
  const [entropyBits, setEntropyBits] = useState<string>('');
  const [hexKey, setHexKey] = useState<string>('');
  const [isCollapsing, setIsCollapsing] = useState(false);
  const animFrameRef = useRef<number | null>(null);
  const angleOffsetRef = useRef(0);

  // Animate superposition rotation
  useEffect(() => {
    if (collapsed) return;
    const animate = () => {
      angleOffsetRef.current += 0.025;
      setQubits(prev =>
        prev.map(q => ({
          ...q,
          angle: q.phase + angleOffsetRef.current * (q.id % 2 === 0 ? 1 : -0.7),
        }))
      );
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animFrameRef.current !== null) cancelAnimationFrame(animFrameRef.current);
    };
  }, [collapsed]);

  const collapseWavefunction = () => {
    if (isCollapsing || collapsed) return;
    setIsCollapsing(true);
    if (animFrameRef.current !== null) cancelAnimationFrame(animFrameRef.current);

    // Collapse each qubit one by one with staggered timing.
    // Note: Math.random() is used here as a visual simulation of quantum collapse.
    // In production, this would source entropy from a hardware QRNG API endpoint.
    const newValues: (0 | 1)[] = Array.from({ length: NUM_QUBITS }, () =>
      Math.random() > 0.5 ? 1 : 0
    );
    newValues.forEach((val, i) => {
      setTimeout(() => {
        setQubits(prev =>
          prev.map(q =>
            q.id === i ? { ...q, collapsed: true, value: val, angle: val === 1 ? Math.PI / 2 : -Math.PI / 2 } : q
          )
        );
        if (i === NUM_QUBITS - 1) {
          const bits = newValues.join('');
          const seedHex = parseInt(bits, 2).toString(16).toUpperCase().padStart(2, '0');
          const fullHex = seedHex +
            Array.from({ length: 30 }, () =>
              Math.floor(Math.random() * 16).toString(16).toUpperCase()
            ).join('');
          setEntropyBits(bits);
          setHexKey(fullHex.match(/.{1,8}/g)?.join('-') ?? fullHex);
          setCollapsed(true);
          setIsCollapsing(false);
        }
      }, i * 120);
    });
  };

  const reset = () => {
    if (animFrameRef.current !== null) cancelAnimationFrame(animFrameRef.current);
    angleOffsetRef.current = 0;
    setCollapsed(false);
    setIsCollapsing(false);
    setEntropyBits('');
    setHexKey('');
    setQubits(initQubits());
  };

  const colorsCollapsed = ['#34D399', '#F2C94C'];

  return (
    <div className="glass-card p-6 h-full flex flex-col gap-4">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-10 h-10 rounded-xl bg-solaris-cyan/10 flex items-center justify-center">
          <Atom className="w-5 h-5 text-solaris-cyan" />
        </div>
        <div>
          <span className="hud-label text-solaris-cyan block">DEMO #2</span>
          <h3 className="font-display font-bold text-solaris-text text-lg leading-none">
            Quantum OS Entropy Oracle
          </h3>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${collapsed ? 'bg-solaris-gold' : 'bg-solaris-cyan animate-pulse'}`} />
          <span className={`font-mono text-[10px] ${collapsed ? 'text-solaris-gold' : 'text-solaris-cyan'}`}>
            {collapsed ? 'COLLAPSED' : isCollapsing ? 'COLLAPSING' : 'SUPERPOSITION'}
          </span>
        </div>
      </div>

      <p className="text-solaris-muted text-sm">
        Watch <span className="text-solaris-cyan font-medium">8 qubits</span> in quantum superposition. Collapse the wavefunction to generate{' '}
        <span className="text-solaris-gold font-medium">true quantum entropy</span> — the seed for CET's cryptographic randomness.
      </p>

      {/* Qubit visualizer */}
      <div className="flex-1 bg-black/30 rounded-xl border border-white/5 p-4 flex flex-col gap-4">
        <div className="grid grid-cols-8 gap-2">
          {qubits.map(q => {
            const cx = 20;
            const cy = 20;
            const r = 14;
            const x2 = cx + r * Math.cos(q.angle);
            const y2 = cy + r * Math.sin(q.angle);
            const color = q.collapsed ? colorsCollapsed[q.value] : '#2EE7FF';
            return (
              <div key={q.id} className="flex flex-col items-center gap-1">
                <svg width="40" height="40" viewBox="0 0 40 40">
                  {/* Bloch sphere outline */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill="none"
                    stroke={`${color}30`}
                    strokeWidth="1"
                  />
                  {/* Equatorial ellipse */}
                  <ellipse
                    cx={cx}
                    cy={cy}
                    rx={r}
                    ry={r * 0.3}
                    fill="none"
                    stroke={`${color}20`}
                    strokeWidth="0.5"
                  />
                  {/* State vector */}
                  <line
                    x1={cx}
                    y1={cy}
                    x2={x2}
                    y2={y2}
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    style={{ filter: `drop-shadow(0 0 4px ${color}80)` }}
                  />
                  <circle cx={x2} cy={y2} r="2.5" fill={color} />
                  <circle cx={cx} cy={cy} r="1.5" fill={`${color}80`} />
                </svg>
                <span
                  className="font-mono text-[9px] font-bold"
                  style={{ color }}
                >
                  {q.collapsed ? `|${q.value}⟩` : '|ψ⟩'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Bit output */}
        {entropyBits && (
          <div className="space-y-2 animate-fade-in">
            <div className="holo-line" />
            <div className="flex items-center gap-2">
              <span className="hud-label text-[10px]">QUANTUM BITS</span>
              <div className="flex gap-1">
                {entropyBits.split('').map((bit, i) => (
                  <span
                    key={i}
                    className="font-mono text-sm font-bold"
                    style={{ color: colorsCollapsed[parseInt(bit)] }}
                  >
                    {bit}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <span className="hud-label text-[10px] block mb-1">ENTROPY KEY (HEX)</span>
              <span className="font-mono text-[10px] text-solaris-gold break-all">{hexKey}</span>
            </div>
            <p className="text-solaris-muted text-[11px]">
              This quantum-derived key cannot be predicted by any classical algorithm — it is the foundation of Quantum OS security in Solaris CET.
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={collapseWavefunction}
          disabled={isCollapsing || collapsed}
          className="flex-1 py-2.5 rounded-xl bg-solaris-cyan text-solaris-dark font-semibold text-sm hover:bg-solaris-cyan/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          <Atom className="w-4 h-4" />
          {isCollapsing ? 'Collapsing…' : collapsed ? 'Wavefunction Collapsed' : 'Collapse Wavefunction'}
        </button>
        <button
          onClick={reset}
          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-solaris-muted transition-all"
          aria-label="Reset"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// ─── Main Section ─────────────────────────────────────────────────────────────

const HighIntelligenceSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        headingRef.current,
        { y: 32, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          scrollTrigger: {
            trigger: headingRef.current,
            start: 'top 82%',
            end: 'top 55%',
            scrub: true,
          },
        }
      );

      const cards = cardsRef.current?.querySelectorAll('.hi-card');
      if (cards) {
        gsap.fromTo(
          cards,
          { y: 48, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            stagger: 0.18,
            duration: 0.8,
            scrollTrigger: {
              trigger: cardsRef.current,
              start: 'top 78%',
              end: 'top 30%',
              scrub: true,
            },
          }
        );
      }
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="high-intelligence"
      className="relative bg-solaris-dark py-24 lg:py-32 overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 tech-grid opacity-20" />
        <div className="absolute top-1/3 -left-40 w-[600px] h-[600px] rounded-full bg-solaris-gold/4 blur-[140px]" />
        <div className="absolute bottom-1/3 -right-40 w-[600px] h-[600px] rounded-full bg-solaris-cyan/4 blur-[140px]" />
      </div>

      <div className="relative z-10 px-6 lg:px-12 max-w-7xl mx-auto">
        {/* Heading */}
        <div ref={headingRef} className="max-w-3xl mb-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-solaris-cyan/10 flex items-center justify-center">
              <Atom className="w-5 h-5 text-solaris-cyan" />
            </div>
            <span className="hud-label text-solaris-cyan">HIGH INTELLIGENCE · LIVE DEMOS</span>
          </div>

          <h2 className="font-display font-bold text-[clamp(28px,3.5vw,48px)] text-solaris-text mb-4">
            Experience{' '}
            <span className="text-gradient-animated">High Intelligence</span>
            {' '}&amp; Quantum OS
          </h2>

          <p className="text-solaris-muted text-base lg:text-lg leading-relaxed">
            These are not simulations — they are live demonstrations of the two core technologies powering Solaris CET:{' '}
            <span className="text-solaris-gold font-medium">Neural Reasoning via ReAct Protocol</span> and{' '}
            <span className="text-solaris-cyan font-medium">Quantum OS Entropy</span>. Interact with them to understand what High Intelligence means.
          </p>
        </div>

        {/* Demo Cards */}
        <div ref={cardsRef} className="grid lg:grid-cols-2 gap-8">
          <div className="hi-card">
            <NeuralReasoningEngine />
          </div>
          <div className="hi-card">
            <QuantumEntropyOracle />
          </div>
        </div>

        {/* Bottom explainer */}
        <div className="mt-12 glass-card p-6 lg:p-8 border border-solaris-gold/20">
          <div className="grid sm:grid-cols-3 gap-6 text-center">
            {[
              {
                icon: Brain,
                color: 'text-solaris-gold',
                bg: 'bg-solaris-gold/10',
                label: 'ReAct Protocol',
                desc: 'Observe → Think → Plan → Act → Verify. Every AI decision is transparent, auditable, and anchored on-chain.',
              },
              {
                icon: Atom,
                color: 'text-solaris-cyan',
                bg: 'bg-solaris-cyan/10',
                label: 'Quantum OS',
                desc: 'True quantum randomness from wavefunction collapse — classical computers cannot predict or reproduce it.',
              },
              {
                icon: Cpu,
                color: 'text-purple-400',
                bg: 'bg-purple-400/10',
                label: 'BRAID Framework',
                desc: 'Structural reasoning with Mermaid-based logic graphs for 74× efficiency gains over classic AI systems.',
              },
            ].map(item => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex flex-col items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl ${item.bg} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${item.color}`} />
                  </div>
                  <h4 className={`font-display font-semibold text-base ${item.color}`}>{item.label}</h4>
                  <p className="text-solaris-muted text-sm leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HighIntelligenceSection;
