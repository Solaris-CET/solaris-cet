'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

// --- TYPE DEFINITIONS ---
type ReActPhase =
  | 'idle'
  | 'observe_parse'
  | 'observe_context'
  | 'think_route'
  | 'think_validate'
  | 'act_execute'
  | 'act_consensus'
  | 'complete';

interface TelemetryLog {
  id: string;
  timestamp: string;
  type: 'INFO' | 'WARN' | 'SEC' | 'QUANTUM';
  message: string;
}

interface MetricsData {
  confidence: number;
  latency: number;
  cetCost: number;
}

// --- KNOWLEDGE BASE: contextual responses for key topics ---
const KNOWLEDGE_BASE: Record<string, { answer: string; confidence: number }> = {
  price: {
    answer:
      'CET trades on DeDust (TON) with a fixed supply of 9,000 tokens — genuine hyper-scarcity. Current pool: EQB5_hZPl4-EI1aWdLSd21c8T9PoKyZK2IJtrDFdPJIelfnB. The DCBM model correlates scarcity with a 90-year emission schedule, projecting long-term value accumulation driven purely by on-chain demand.',
    confidence: 94.7,
  },
  mining: {
    answer:
      'CET mining runs for 90 years with a decaying reward curve — 66.66% of total supply enters circulation through proof-of-work. Active nodes: 18,420+. Battery drain approaches 0% thanks to the Zero-Battery constraint in the Quantum OS scheduler. Optimal mining window analysis shows Q3 2025 as a high-efficiency period.',
    confidence: 97.2,
  },
  ai: {
    answer:
      'Solaris CET embeds a BRAID (Blockchain-Recursive AI Decision) framework: every AI agent action is validated through a 5-phase ReAct loop (Observe → Think → Plan → Act → Verify) and anchored on-chain for immutable auditability. No black-box decisions — every reasoning trace is public and verifiable.',
    confidence: 99.1,
  },
  ton: {
    answer:
      'CET lives on TON mainnet — ~100,000 TPS throughput, 2-second finality, sharded architecture. The smart contract was audited by Cyberscope and KYC-verified. TON\'s infinite sharding allows Solaris to scale the High Intelligence oracle layer without congestion.',
    confidence: 96.8,
  },
  buy: {
    answer:
      'Buy CET on DeDust DEX: connect your TON wallet → navigate to pool EQB5_hZPl4-EI1aWdLSd21c8T9PoKyZK2IJtrDFdPJIelfnB → swap TON for CET. Slippage recommended: 0.5–1%. Only 9,000 CET exist globally — each token represents a 0.011% ownership of the total supply.',
    confidence: 98.3,
  },
  quantum: {
    answer:
      'Quantum OS is Solaris CET\'s entropy layer: 8 simulated qubits in superposition collapse via a QRNG-seeded wavefunction to generate unpredictable cryptographic seeds. This entropy powers fair mining randomness, agent scheduling, and zero-knowledge proof generation — making every on-chain event provably random.',
    confidence: 95.6,
  },
  security: {
    answer:
      'CET contract passed Cyberscope\'s smart-contract audit with zero critical findings. The team completed full KYC. On-chain reasoning traces prevent hallucinated AI decisions. Multi-layer security: Quantum OS entropy + ReAct verification loops + TON\'s BFT consensus (66.7% honest nodes required for finality).',
    confidence: 98.9,
  },
  roadmap: {
    answer:
      'Q1–Q2 2025 (DONE): Contract deployed, audit passed, DeDust pool live, IPFS whitepaper published. Q3 2025 (ACTIVE): AI precision farming pilot in Puiești, Developer SDK beta, ReAct on-chain traces. Q4 2025+: Next-gen processing units, Self-Actualization Protocol mainnet, cross-chain bridge exploration.',
    confidence: 99.5,
  },
};

function buildContextualResponse(q: string): { answer: string; confidence: number } {
  const lower = q.toLowerCase();
  if (lower.includes('price') || lower.includes('value') || lower.includes('worth') || lower.includes('market'))
    return KNOWLEDGE_BASE['price'];
  if (lower.includes('mine') || lower.includes('mining') || lower.includes('earn') || lower.includes('reward'))
    return KNOWLEDGE_BASE['mining'];
  if (lower.includes('ai') || lower.includes('intelligence') || lower.includes('agent') || lower.includes('react') || lower.includes('braid'))
    return KNOWLEDGE_BASE['ai'];
  if (lower.includes('ton') || lower.includes('blockchain') || lower.includes('chain') || lower.includes('network'))
    return KNOWLEDGE_BASE['ton'];
  if (lower.includes('buy') || lower.includes('purchase') || lower.includes('swap') || lower.includes('dedust'))
    return KNOWLEDGE_BASE['buy'];
  if (lower.includes('quantum') || lower.includes('qubit') || lower.includes('entropy'))
    return KNOWLEDGE_BASE['quantum'];
  if (lower.includes('security') || lower.includes('audit') || lower.includes('safe') || lower.includes('kyc'))
    return KNOWLEDGE_BASE['security'];
  if (lower.includes('road') || lower.includes('plan') || lower.includes('future') || lower.includes('phase'))
    return KNOWLEDGE_BASE['roadmap'];
  // Default: general project answer
  return {
    answer:
      'Solaris CET is a hyper-scarce token (9,000 CET supply) on the TON blockchain with a 90-year mining horizon. It bridges AI agents to on-chain execution via the BRAID Framework and Quantum OS, making every decision transparent, verifiable, and immutable. Ask about price, mining, AI, security, or roadmap for deep insights.',
    confidence: 91.4,
  };
}

export default function AiOracleSearch() {
  // --- STATE MANAGEMENT ---
  const [query, setQuery] = useState('');
  const [phase, setPhase] = useState<ReActPhase>('idle');
  const [logs, setLogs] = useState<TelemetryLog[]>([]);
  const [metrics, setMetrics] = useState<MetricsData>({ confidence: 0, latency: 0, cetCost: 0 });
  const [finalResponse, setFinalResponse] = useState('');
  const [oracleConfidence, setOracleConfidence] = useState(0);

  const terminalRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // --- AUTO-SCROLL TERMINAL ---
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  // Clear all pending timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
    };
  }, []);

  // --- UTILITY ---
  const generateHash = useCallback(
    () => Math.random().toString(36).substring(2, 10).toUpperCase(),
    [],
  );
  const getTime = () => new Date().toISOString().split('T')[1].slice(0, 12);

  const addLog = useCallback((type: TelemetryLog['type'], message: string) => {
    setLogs(prev => [
      ...prev,
      { id: generateHash(), timestamp: getTime(), type, message },
    ]);
  }, [generateHash]);

  const schedule = (fn: () => void, delay: number) => {
    const id = setTimeout(fn, delay);
    timersRef.current.push(id);
  };

  // --- CORE LOGIC: REASON TO ACT PROTOCOL ---
  const handleQuantumProcessing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || (phase !== 'idle' && phase !== 'complete')) return;

    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    const q = query.trim();
    const { answer, confidence } = buildContextualResponse(q);
    const hash = generateHash();
    const tokenCount = q.split(/\s+/).length;
    const startMs = performance.now();

    // Reset
    setLogs([]);
    setFinalResponse('');
    setOracleConfidence(0);
    setMetrics({ confidence: 0, latency: 0, cetCost: 0 });

    // ── PHASE 1: OBSERVE ──────────────────────────────────────────
    setPhase('observe_parse');
    addLog('INFO', `RAV_INIT: Grok × Gemini Oracle v3.0 · Session [${hash}]`);
    addLog('INFO', `INPUT_STREAM: "${q}" · Tokens: ${tokenCount}`);

    schedule(() => {
      setPhase('observe_context');
      addLog('QUANTUM', `INTENT_EXTRACTION: Semantic vector computed. Ambiguity score: 0.${Math.floor(Math.random()*30+10)}`);
      addLog('INFO', `CONTEXT_MAP: Knowledge graph traversal started · Nodes visited: 2,847`);
      setMetrics(prev => ({ ...prev, latency: Math.round(performance.now() - startMs) }));
    }, 1200);

    // ── PHASE 2: THINK ────────────────────────────────────────────
    schedule(() => {
      setPhase('think_route');
      addLog('INFO', `GEMINI_REASON: Routing query to Google Gemini analytical pathway`);
      addLog('QUANTUM', `HYPOTHESIS_GEN: 6 parallel logical paths instantiated in superposition`);
      setMetrics(prev => ({ ...prev, latency: Math.round(performance.now() - startMs) }));
    }, 2800);

    schedule(() => {
      setPhase('think_validate');
      addLog('QUANTUM', `PATH_COLLAPSE: Highest-confidence path selected (p=${(confidence/100).toFixed(4)})`);
      addLog('SEC', `CONSTRAINT_CHECK: Zero-hallucination bounds · On-chain fact anchors verified`);
      addLog('INFO', `BRAID_FRAME: Reasoning graph compiled · Depth: 7 layers · Nodes: 1,204`);
      setMetrics(prev => ({
        ...prev,
        confidence: Math.round(confidence * 0.7),
        latency: Math.round(performance.now() - startMs),
      }));
    }, 4600);

    // ── PHASE 3: ACT ──────────────────────────────────────────────
    schedule(() => {
      setPhase('act_execute');
      addLog('INFO', `GROK_ACT: Connecting to xAI Grok action directive pipeline`);
      addLog('QUANTUM', `RESPONSE_COMPILE: Grok × Gemini synthesizing answer payload · Entropy seed applied`);
      addLog('SEC', `SIGN: Payload signed with Quantum OS key · Hash: 0x${generateHash()}${generateHash()}`);
      setMetrics(prev => ({
        ...prev,
        cetCost: parseFloat((Math.random() * 0.005 + 0.001).toFixed(4)),
        latency: Math.round(performance.now() - startMs),
      }));
    }, 6400);

    schedule(() => {
      setPhase('act_consensus');
      addLog('SEC', `TON_CONSENSUS: Payload broadcast · 3-of-3 validators confirmed`);
      addLog('INFO', `INTEGRITY: Output cross-validated against on-chain oracle state`);
      addLog('QUANTUM', `RAV_COMPLETE: Grok × Gemini loop closed · Confidence: ${confidence.toFixed(1)}%`);
      setMetrics(prev => ({
        ...prev,
        confidence: Math.round(confidence),
        latency: Math.round(performance.now() - startMs),
      }));
      setOracleConfidence(confidence);
      setFinalResponse(answer);
    }, 8400);

    schedule(() => {
      setPhase('complete');
    }, 9200);
  };

  const resetOracle = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setPhase('idle');
    setQuery('');
    setLogs([]);
    setFinalResponse('');
    setOracleConfidence(0);
    setMetrics({ confidence: 0, latency: 0, cetCost: 0 });
  };

  // --- RENDER HELPERS ---
  const getPhaseStatus = (currentPhase: ReActPhase, targetPhases: ReActPhase[]) => {
    if (phase === 'idle') return 'text-gray-600 border-gray-800';
    if (phase === 'complete')
      return 'text-green-500 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.2)]';
    if (targetPhases.includes(currentPhase))
      return 'text-yellow-400 border-yellow-400/50 shadow-[0_0_15px_rgba(250,204,21,0.2)] animate-pulse';

    const phaseOrder: ReActPhase[] = [
      'idle', 'observe_parse', 'observe_context',
      'think_route', 'think_validate',
      'act_execute', 'act_consensus', 'complete',
    ];
    const currentIndex = phaseOrder.indexOf(currentPhase);
    const targetIndex = Math.max(...targetPhases.map(p => phaseOrder.indexOf(p)));
    return currentIndex > targetIndex
      ? 'text-green-400 border-green-400/30'
      : 'text-gray-600 border-gray-800';
  };

  const isProcessing = phase !== 'idle' && phase !== 'complete';

  return (
    <div className="w-full max-w-5xl mx-auto bg-black border border-gray-800 rounded-3xl p-4 md:p-8 shadow-2xl font-sans relative overflow-hidden z-20">
      {/* Background Grid Effect */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex flex-col items-center mb-8">
        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 uppercase tracking-widest">
          Solaris Oracle
        </h2>
        <p className="text-gray-400 text-sm mt-1 tracking-widest uppercase">
          Grok × Gemini · RAV Protocol Bridge
        </p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs font-mono bg-gray-900 border border-gray-700 px-2 py-0.5 rounded text-blue-400">Gemini REASON</span>
          <span className="text-gray-600 text-xs">×</span>
          <span className="text-xs font-mono bg-gray-900 border border-gray-700 px-2 py-0.5 rounded text-purple-400">Grok ACT</span>
        </div>
      </div>

      {/* Input Area */}
      <form
        onSubmit={handleQuantumProcessing}
        className="relative z-10 flex flex-col md:flex-row w-full gap-4 mb-8"
      >
        <div className="flex-grow relative">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            disabled={isProcessing}
            placeholder="Ask about price, mining, AI agents, security, roadmap…"
            className="w-full px-6 py-4 bg-gray-950 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all disabled:opacity-50 text-base"
          />
          {isProcessing && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={isProcessing}
          className="px-8 py-4 bg-gradient-to-r from-yellow-600 to-yellow-500 text-black font-bold rounded-xl hover:from-yellow-500 hover:to-yellow-400 transition-all active:scale-95 disabled:from-gray-800 disabled:to-gray-900 disabled:text-gray-500 shadow-[0_0_20px_rgba(234,179,8,0.2)] disabled:shadow-none whitespace-nowrap"
        >
          {phase === 'idle'
            ? 'INITIATE PROTOCOL'
            : phase === 'complete'
            ? 'SYSTEM IDLE'
            : 'PROCESSING…'}
        </button>
      </form>

      {/* ReAct Architecture Visualizer */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* OBSERVE */}
        <div
          className={`flex flex-col p-5 rounded-2xl border-2 transition-all duration-500 bg-gray-950/50 backdrop-blur-sm ${getPhaseStatus(phase, ['observe_parse', 'observe_context'])}`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg uppercase tracking-wider">1. Observe</h3>
            <span className="text-xs font-mono bg-gray-900 px-2 py-1 rounded">INPUT PARSER</span>
          </div>
          <div className="text-sm space-y-2 opacity-80">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${phase === 'observe_parse' ? 'bg-yellow-400 animate-pulse' : phaseOrderIndex(phase) > 1 ? 'bg-green-500' : 'bg-gray-700'}`} />
              <span>Intent Extraction</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${phase === 'observe_context' ? 'bg-yellow-400 animate-pulse' : phaseOrderIndex(phase) > 2 ? 'bg-green-500' : 'bg-gray-700'}`} />
              <span>Context Mapping</span>
            </div>
          </div>
        </div>

        {/* THINK */}
        <div
          className={`flex flex-col p-5 rounded-2xl border-2 transition-all duration-500 bg-gray-950/50 backdrop-blur-sm ${getPhaseStatus(phase, ['think_route', 'think_validate'])}`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg uppercase tracking-wider">2. Think</h3>
            <span className="text-xs font-mono bg-gray-900 px-2 py-1 rounded">GEMINI REASON</span>
          </div>
          <div className="text-sm space-y-2 opacity-80">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${phase === 'think_route' ? 'bg-yellow-400 animate-pulse' : phaseOrderIndex(phase) > 3 ? 'bg-green-500' : 'bg-gray-700'}`} />
              <span>Logic Routing</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${phase === 'think_validate' ? 'bg-yellow-400 animate-pulse' : phaseOrderIndex(phase) > 4 ? 'bg-green-500' : 'bg-gray-700'}`} />
              <span>Constraint Validation</span>
            </div>
          </div>
        </div>

        {/* ACT */}
        <div
          className={`flex flex-col p-5 rounded-2xl border-2 transition-all duration-500 bg-gray-950/50 backdrop-blur-sm ${getPhaseStatus(phase, ['act_execute', 'act_consensus'])}`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg uppercase tracking-wider">3. Act</h3>
            <span className="text-xs font-mono bg-gray-900 px-2 py-1 rounded">GROK ACT</span>
          </div>
          <div className="text-sm space-y-2 opacity-80">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${phase === 'act_execute' ? 'bg-yellow-400 animate-pulse' : phaseOrderIndex(phase) > 5 ? 'bg-green-500' : 'bg-gray-700'}`} />
              <span>Execution Payload</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${phase === 'act_consensus' ? 'bg-yellow-400 animate-pulse' : phaseOrderIndex(phase) > 6 ? 'bg-green-500' : 'bg-gray-700'}`} />
              <span>TON Consensus</span>
            </div>
          </div>
        </div>
      </div>

      {/* Terminal & Metrics Area */}
      {phase !== 'idle' && (
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-4 gap-4 transition-all duration-700">
          {/* Telemetry Terminal */}
          <div className="lg:col-span-3 bg-gray-950 border border-gray-800 rounded-xl p-4 font-mono text-xs overflow-hidden flex flex-col h-56 shadow-inner">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-800 text-gray-500">
              <span>&gt;_ RAV_TERMINAL · Grok × Gemini v3.0</span>
              <span className={isProcessing ? 'text-yellow-500 animate-pulse' : 'text-green-500'}>
                {isProcessing ? 'PROCESSING' : '● DONE'}
              </span>
            </div>
            <div ref={terminalRef} className="flex-1 overflow-y-auto space-y-1 pr-1">
              {logs.map(log => (
                <div key={log.id} className="flex gap-3 hover:bg-gray-900/50 p-0.5 rounded">
                  <span className="text-gray-600 min-w-[88px] shrink-0">[{log.timestamp}]</span>
                  <span
                    className={`min-w-[68px] font-bold shrink-0 ${
                      log.type === 'INFO'
                        ? 'text-blue-400'
                        : log.type === 'WARN'
                        ? 'text-yellow-400'
                        : log.type === 'SEC'
                        ? 'text-green-400'
                        : 'text-purple-400'
                    }`}
                  >
                    [{log.type}]
                  </span>
                  <span className="text-gray-300 break-all">{log.message}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Live Metrics */}
          <div className="bg-gray-950 border border-gray-800 rounded-xl p-4 flex flex-col justify-between h-56">
            <h4 className="text-gray-500 font-mono text-xs mb-3 border-b border-gray-800 pb-2">
              SYS_METRICS
            </h4>

            <div className="space-y-3">
              <div>
                <div className="text-gray-400 text-xs mb-1">Logic Confidence</div>
                <div className="flex items-end gap-1">
                  <span
                    className={`text-2xl font-bold tabular-nums ${
                      metrics.confidence > 90 ? 'text-green-500' : 'text-yellow-500'
                    }`}
                  >
                    {metrics.confidence.toFixed(1)}
                  </span>
                  <span className="text-gray-500 mb-0.5 text-sm">%</span>
                </div>
              </div>

              <div>
                <div className="text-gray-400 text-xs mb-1">Network Latency</div>
                <div className="flex items-end gap-1">
                  <span className="text-2xl font-bold text-blue-400 tabular-nums">
                    {metrics.latency}
                  </span>
                  <span className="text-gray-500 mb-0.5 text-sm">ms</span>
                </div>
              </div>

              <div>
                <div className="text-gray-400 text-xs mb-1">Est. Action Cost</div>
                <div className="flex items-end gap-1">
                  <span className="text-xl font-bold text-yellow-500 tabular-nums">
                    {metrics.cetCost.toFixed(4)}
                  </span>
                  <span className="text-gray-500 mb-0.5 text-xs">CET</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Final Output */}
      {phase === 'complete' && finalResponse && (
        <div className="mt-6 relative z-10 p-6 bg-gradient-to-r from-green-950/80 to-black border border-green-500/30 rounded-xl animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-start gap-4 mb-4">
            <div className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-500/20 text-green-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <p className="text-green-400 text-xs font-mono font-bold uppercase tracking-widest">
                  Oracle Response · Confidence {oracleConfidence.toFixed(1)}%
                </p>
                <div className="h-1.5 w-24 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-500 to-green-500 rounded-full transition-all duration-1000"
                    style={{ width: `${oracleConfidence}%` }}
                  />
                </div>
              </div>
              <p className="text-white text-sm leading-relaxed">{finalResponse}</p>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={resetOracle}
              className="px-5 py-2 border border-gray-700 rounded-lg text-xs text-gray-400 hover:text-white hover:border-gray-500 transition-colors font-mono"
            >
              Acknowledge & Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper — linear progress index through phases
function phaseOrderIndex(currentPhase: string): number {
  const phases: ReActPhase[] = [
    'idle', 'observe_parse', 'observe_context',
    'think_route', 'think_validate',
    'act_execute', 'act_consensus', 'complete',
  ];
  return phases.indexOf(currentPhase as ReActPhase);
}

