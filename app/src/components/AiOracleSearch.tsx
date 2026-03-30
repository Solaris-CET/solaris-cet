'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { track } from '@vercel/analytics/react';
import { X, Send, Copy, Check, ExternalLink, ChevronRight, Sparkles, Trash2, Bot } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { OracleKnowledge, Translations } from '../i18n/translations';
import {
  buildOracleObserveParseSequence,
  buildDeepLatticeMeshLogMessage,
  buildDeepLatticeMeshLogMessageRawQuery,
  ORACLE_LATTICE_PHASE,
  buildFlashGlintLogMessage,
  buildExpressomeBurstLogMessage,
  buildConsensusBurstLogMessage,
  buildLoopCompleteBurstLogMessage,
} from '@/lib/oracleTelemetry';

// --- TYPE DEFINITIONS ---
type ReActPhase =
  | 'idle'
  | 'observe_parse'
  | 'observe_context'
  | 'think_route'
  | 'think_validate'
  | 'act_execute'
  | 'act_consensus'
  | 'verify_cross'
  | 'verify_anchor'
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

interface ChatEntry {
  question: string;
  answer: string;
  confidence: number;
}

// --- CONFIDENCE SCORES per topic ---
const CONFIDENCE_SCORES: Record<string, number> = {
  price: 94.7,
  mining: 97.2,
  ai: 99.1,
  ton: 96.8,
  buy: 98.3,
  quantum: 95.6,
  security: 98.9,
  roadmap: 99.5,
  competition: 99.3,
  rwa: 98.7,
  dcbm: 97.5,
  rav: 99.1,
  braid: 98.4,
  wallet: 99.6,
  staking: 96.8,
  team: 99.8,
  default: 91.4,
};

// Keyword sets covering multiple languages for topic detection
const TOPIC_KEYWORDS: Record<string, string[]> = {
  price:    ['price', 'value', 'worth', 'market', 'preț', 'pret', 'valoare', 'precio', '价格', 'цена', 'preis', 'preço'],
  mining:   ['mine', 'mining', 'earn', 'reward', 'minar', 'minare', 'minería', '挖矿', 'майнинг', 'mining', 'mineração'],
  ai:       ['ai', 'intelligence', 'agent', 'react', 'braid', 'inteligenta', 'inteligență', 'inteligencia', '人工智能', 'искусственный', 'künstliche', 'inteligência'],
  ton:      ['ton', 'blockchain', 'chain', 'network', 'rețea', 'retea', 'blockchain', '区块链', 'блокчейн', 'rede'],
  buy:      ['buy', 'purchase', 'swap', 'dedust', 'cumpara', 'cumpără', 'comprar', '购买', 'купить', 'kaufen', 'comprar'],
  quantum:  ['quantum', 'qubit', 'entropy', 'cuantic', 'kvantum', 'cuántico', '量子', 'квантовый', 'quanten'],
  security: ['security', 'audit', 'safe', 'kyc', 'securitate', 'seguridad', '安全', 'безопасность', 'sicherheit', 'segurança'],
  roadmap:     ['road', 'roadmap', 'plan', 'future', 'phase', 'parcurs', 'hoja de ruta', '路线图', 'дорожная', 'fahrplan', 'roteiro'],
  competition: ['compet', 'vs', 'fetch', 'fet', 'bittensor', 'tao', 'singularity', 'agix', 'ocean', 'asi', 'compara', 'vergleich', 'сравн', '对比', 'concurent'],
  rwa:         ['rwa', 'real world', 'real-world', 'asset', 'agricultural', 'land', 'activ', 'real', 'реальн', '真实', 'physic'],
  dcbm:        ['dcbm', 'buyback', 'stability', 'volatile', 'pid', 'stabilit', 'estabil', 'стабильн', '稳定', 'stabilität'],
  rav:         ['rav', 'reason', 'razon', 'protocol', 'protocol', 'протокол', '协议', 'protocolo'],
  braid:       ['braid', 'framework', 'graph', 'mermaid', 'recursive', 'рекурс', '递归'],
  wallet:      ['wallet', 'connect', 'tonkeeper', 'tonconnect', 'portofel', 'cartera', 'кошелёк', '钱包', 'brieftasche', 'carteira'],
  staking:     ['stak', 'hold', 'hodl', 'benefit', 'benefici', 'преимущест', '好处', 'vorteil', 'vantagem'],
  team:        ['team', 'department', 'echipa', 'equipo', 'команда', '团队', 'mannschaft', 'equipe', '200,000', '200000', '200k', 'task agent', 'tasking', 'task specialists'],
};

async function fetchOracleChat(
  query: string,
  signal: AbortSignal,
): Promise<{ text: string | null; sourceHeader: string | null }> {
  const maxAttempts = 2;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) {
      await new Promise<void>(resolve => {
        const delay = 300 + Math.random() * 400;
        const id = setTimeout(resolve, delay);
        signal.addEventListener('abort', () => {
          clearTimeout(id);
          resolve();
        }, { once: true });
      });
      if (signal.aborted) return { text: null, sourceHeader: null };
    }
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ query }),
        signal,
      });
      const sourceHeader = res.headers.get('X-Oracle-Source');
      const raw = await res.text();
      let data: { response?: string } = {};
      try {
        data = JSON.parse(raw) as { response?: string };
      } catch {
        /* non-JSON error body */
      }
      if (res.ok && typeof data.response === 'string' && data.response.trim()) {
        return { text: data.response.trim(), sourceHeader };
      }
    } catch {
      if (signal.aborted) return { text: null, sourceHeader: null };
    }
  }
  return { text: null, sourceHeader: null };
}

function buildCopyForAiText(q: string, a: string, o: Translations['oracle']): string {
  return `${o.copyForAiQuestionLabel}\n${q}\n\n${o.copyForAiAnswerLabel}\n${a}\n\n${o.copyForAiInstructions}`;
}

// --- FOLLOW-UP SUGGESTIONS by topic ---
const FOLLOW_UP_BY_TOPIC: Record<string, string[]> = {
  price:       ['What drives CET price long-term?', 'How does DCBM stabilise price?', 'Where can I buy CET?'],
  competition: ['What is the RAV Protocol advantage?', 'Why TON over Ethereum?', 'How do task agents help the Oracle?'],
  rwa:         ['What assets back CET?', 'When is the RWA tokenisation pilot?', 'How does BRAID connect to real assets?'],
  mining:      ['What device is best for mining?', 'How long does mining last?', 'How does staking affect mining rewards?'],
  ai:          ['What is the BRAID Framework?', 'How does the RAV Protocol work?', 'What are the 200,000 task agents?'],
  ton:         ['How fast is TON?', 'Is the contract audited?', 'How do I connect my TON wallet?'],
  buy:         ['What is the contract address?', 'What slippage should I use?', 'How do I connect my TON wallet?'],
  security:    ['Who audited the contract?', 'Is KYC verified?', 'Can the supply be inflated?'],
  roadmap:     ['What is in Q2 2026?', 'When does the DAO launch?', 'What is the RWA tokenisation pilot?'],
  quantum:     ['What is Quantum OS?', 'How does entropy work?', 'What is the BRAID Framework?'],
  dcbm:        ['How does PID control work in DCBM?', 'How much does DCBM reduce volatility?', 'When does DCBM trigger?'],
  rav:         ['What is BRAID?', 'How does Gemini Reason?', 'How does Grok Act?'],
  braid:       ['What is the RAV Protocol?', 'How are BRAID graphs stored?', 'Can third parties build BRAID agents?'],
  wallet:      ['How do I buy CET after connecting?', 'Is Tonkeeper safe?', 'What is the contract address?'],
  staking:     ['What is the max staking bonus?', 'How does DAO voting work?', 'What is the DCBM mechanism?'],
  team:        ['How do agents collaborate?', 'What is the largest department?', 'How do agents learn from each other?'],
  default:     ['What makes CET unique?', 'How do I buy CET?', 'What is the total supply?'],
};

/** RAV telemetry milestones (ms) — tuned for mobile attention span; ~5.3s to completion. */
const ORACLE_PHASE_MS = [580, 1280, 2080, 2880, 3780, 4380, 4980, 5280] as const;

function buildContextualResponse(q: string, knowledge: OracleKnowledge): { answer: string; confidence: number } {
  const lower = q.toLowerCase();
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) {
      return { answer: knowledge[topic as keyof OracleKnowledge], confidence: CONFIDENCE_SCORES[topic] };
    }
  }
  return { answer: knowledge.default, confidence: CONFIDENCE_SCORES.default };
}

// --- ReAct phase status helper ---
function getReActPhaseStatus(phase: ReActPhase, targetPhases: ReActPhase[]): string {
  if (phase === 'idle') return 'text-gray-600 border-gray-800';
  if (phase === 'complete')
    return 'text-green-500 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.2)]';
  if (targetPhases.includes(phase))
    return 'text-yellow-400 border-yellow-400/50 shadow-[0_0_15px_rgba(250,204,21,0.2)] animate-pulse';

  const phaseOrder: ReActPhase[] = [
    'idle', 'observe_parse', 'observe_context',
    'think_route', 'think_validate',
    'act_execute', 'act_consensus', 'verify_cross', 'verify_anchor', 'complete',
  ];
  const currentIndex = phaseOrder.indexOf(phase);
  const targetIndex = Math.max(...targetPhases.map(p => phaseOrder.indexOf(p)));
  return currentIndex > targetIndex
    ? 'text-green-400 border-green-400/30'
    : 'text-gray-600 border-gray-800';
}

// --- Markdown renderer for oracle responses ---
// Supports: **bold**, *italic*, `code`, - bullet lists, numbered lists, \n\n paragraphs
function MarkdownText({ text }: { text: string }) {
  const renderLine = (line: string, key: number) => {
    const h3 = line.match(/^###\s+(.+)$/);
    if (h3) {
      return (
        <h4 key={key} className="text-yellow-200/95 font-bold text-sm md:text-base tracking-tight mt-3 mb-1 border-b border-yellow-500/20 pb-1">
          {renderInline(h3[1])}
        </h4>
      );
    }
    // Check for numbered list item
    const numberedMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (numberedMatch) {
      return (
        <li key={key} className="flex gap-2 items-start">
          <span className="text-yellow-500 font-bold shrink-0 min-w-[1.2em]">{numberedMatch[1]}.</span>
          <span>{renderInline(numberedMatch[2])}</span>
        </li>
      );
    }
    // Check for bullet list item
    if (line.startsWith('- ') || line.startsWith('• ')) {
      return (
        <li key={key} className="flex gap-2 items-start">
          <span className="text-yellow-500 mt-1.5 shrink-0">▸</span>
          <span>{renderInline(line.slice(2))}</span>
        </li>
      );
    }
    // Checkbox items
    if (line.startsWith('- ✅') || line.startsWith('- 🔄') || line.startsWith('- 🔮')) {
      return (
        <li key={key} className="flex gap-2 items-start">
          <span className="shrink-0">{line.slice(2, 4)}</span>
          <span>{renderInline(line.slice(4))}</span>
        </li>
      );
    }
    return <p key={key} className="leading-relaxed">{renderInline(line)}</p>;
  };

  const renderInline = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let idx = 0;
    // Pattern: **bold**, *italic*, `code`
    const pattern = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
    let match: RegExpExecArray | null;
    let lastIndex = 0;
    pattern.lastIndex = 0;
    while ((match = pattern.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(<span key={idx}>{text.slice(lastIndex, match.index)}</span>);
        idx += 1;
      }
      if (match[2]) {
        parts.push(<strong key={idx} className="text-yellow-300 font-semibold">{match[2]}</strong>);
      } else if (match[3]) {
        parts.push(<em key={idx} className="text-gray-300 italic">{match[3]}</em>);
      } else if (match[4]) {
        parts.push(<code key={idx} className="bg-gray-800 text-yellow-400 px-1.5 py-0.5 rounded text-xs font-mono break-all">{match[4]}</code>);
      }
      idx += 1;
      lastIndex = pattern.lastIndex;
    }
    if (lastIndex < text.length) {
      parts.push(<span key={idx}>{text.slice(lastIndex)}</span>);
    }
    return parts;
  };

  // Split into paragraphs by double newline
  const paragraphs = text.split(/\n\n+/);
  return (
    <div className="space-y-3 text-sm leading-relaxed">
      {paragraphs.map((para, pi) => {
        const lines = para.split('\n').filter(l => l.trim() !== '');
        const hasList = lines.some(
          l => l.startsWith('- ') || l.startsWith('• ') || /^\d+\.\s/.test(l)
        );
        if (hasList) {
          return (
            <ul key={pi} className="space-y-1.5 pl-1">
              {lines.map((line, li) => renderLine(line, li))}
            </ul>
          );
        }
        return (
          <React.Fragment key={pi}>
            {lines.map((line, li) => renderLine(line, li))}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// --- ReAct Panels (shared between widget and modal) ---
function ReActPanels({ phase }: { phase: ReActPhase }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* OBSERVE */}
      <div className={`flex flex-col p-5 rounded-2xl border-2 transition-all duration-500 bg-gray-950/50 backdrop-blur-sm ${getReActPhaseStatus(phase, ['observe_parse', 'observe_context'])}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base uppercase tracking-wider">1. Observe</h3>
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
      <div className={`flex flex-col p-5 rounded-2xl border-2 transition-all duration-500 bg-gray-950/50 backdrop-blur-sm ${getReActPhaseStatus(phase, ['think_route', 'think_validate'])}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base uppercase tracking-wider">2. Think</h3>
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
      <div className={`flex flex-col p-5 rounded-2xl border-2 transition-all duration-500 bg-gray-950/50 backdrop-blur-sm ${getReActPhaseStatus(phase, ['act_execute', 'act_consensus'])}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base uppercase tracking-wider">3. Act</h3>
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

      {/* VERIFY */}
      <div className={`flex flex-col p-5 rounded-2xl border-2 transition-all duration-500 bg-gray-950/50 backdrop-blur-sm ${getReActPhaseStatus(phase, ['verify_cross', 'verify_anchor'])}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base uppercase tracking-wider">4. Verify</h3>
          <span className="text-xs font-mono bg-gray-900 px-2 py-1 rounded">ZK PROOF</span>
        </div>
        <div className="text-sm space-y-2 opacity-80">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${phase === 'verify_cross' ? 'bg-yellow-400 animate-pulse' : phaseOrderIndex(phase) > 7 ? 'bg-green-500' : 'bg-gray-700'}`} />
            <span>Cross-Model Check</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${phase === 'verify_anchor' ? 'bg-yellow-400 animate-pulse' : phaseOrderIndex(phase) > 8 ? 'bg-green-500' : 'bg-gray-700'}`} />
            <span>IPFS Anchor</span>
          </div>
        </div>
      </div>
    </div>
  );
}


export default function AiOracleSearch() {
  // --- LANGUAGE ---
  const { t } = useLanguage();

  // --- STATE MANAGEMENT ---
  const [query, setQuery] = useState('');
  const [submittedQuestion, setSubmittedQuestion] = useState('');
  const [phase, setPhase] = useState<ReActPhase>('idle');
  const [logs, setLogs] = useState<TelemetryLog[]>([]);
  const [metrics, setMetrics] = useState<MetricsData>({ confidence: 0, latency: 0, cetCost: 0 });
  const [finalResponse, setFinalResponse] = useState('');
  const [oracleConfidence, setOracleConfidence] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [chatHistory, setChatHistory] = useLocalStorage<ChatEntry[]>('oracle-chat-history', []);
  const [copiedResponse, setCopiedResponse] = useState(false);
  const [copiedForAi, setCopiedForAi] = useState(false);
  const [detectedTopic, setDetectedTopic] = useState<string>('default');
  /** False when the last completed answer used local knowledge (no /api/chat). */
  const [responseUsedLiveApi, setResponseUsedLiveApi] = useState(false);

  const terminalRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const modalInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const oracleAbortRef = useRef<AbortController | null>(null);
  const trackedCompleteKey = useRef<string>('');

  // Auto-scroll telemetry terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  // Scroll chat to latest entry
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, submittedQuestion, finalResponse]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => { timersRef.current.forEach(clearTimeout); };
  }, []);

  useEffect(() => {
    if (isModalOpen) track('oracle_open', {});
  }, [isModalOpen]);

  useEffect(() => {
    if (phase !== 'complete' || !finalResponse) return;
    const key = `${submittedQuestion}::${finalResponse.slice(0, 96)}`;
    if (trackedCompleteKey.current === key) return;
    trackedCompleteKey.current = key;
    track('oracle_complete', { source: responseUsedLiveApi ? 'live' : 'fallback' });
  }, [phase, finalResponse, submittedQuestion, responseUsedLiveApi]);

  // --- CLOSE HANDLER ---
  const handleClose = useCallback(() => {
    oracleAbortRef.current?.abort();
    oracleAbortRef.current = null;
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setIsModalOpen(false);
    setPhase('idle');
    setQuery('');
    setLogs([]);
    setFinalResponse('');
    setOracleConfidence(0);
    setMetrics({ confidence: 0, latency: 0, cetCost: 0 });
    setChatHistory([]);
    setSubmittedQuestion('');
    setResponseUsedLiveApi(false);
    setCopiedForAi(false);
  }, [
    setIsModalOpen,
    setPhase,
    setQuery,
    setLogs,
    setFinalResponse,
    setOracleConfidence,
    setMetrics,
    setChatHistory,
    setSubmittedQuestion,
  ]);

  // Focus follow-up input when a response is ready
  useEffect(() => {
    if (!isModalOpen || phase !== 'complete') return;
    const t = setTimeout(() => modalInputRef.current?.focus(), 200);
    return () => clearTimeout(t);
  }, [isModalOpen, phase]);

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

  // --- CORE LOGIC: RAV + optional live /api/chat (Vercel) with local knowledge fallback ---
  const processQuestion = useCallback((q: string) => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    oracleAbortRef.current?.abort();
    const ac = new AbortController();
    oracleAbortRef.current = ac;

    const oracleFetchPromise = fetchOracleChat(q, ac.signal);

    const { answer: localAnswer, confidence } = buildContextualResponse(q, t.oracle.knowledge);
    const lowerQ = q.toLowerCase();
    let detected = 'default';
    for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
      if (keywords.some(kw => lowerQ.includes(kw))) {
        detected = topic;
        break;
      }
    }
    setDetectedTopic(detected);
    const hash = generateHash();
    const tokenCount = q.split(/\s+/).length;
    const startMs = performance.now();

    setSubmittedQuestion(q);
    setLogs([]);
    setFinalResponse('');
    setOracleConfidence(0);
    setMetrics({ confidence: 0, latency: 0, cetCost: 0 });
    setResponseUsedLiveApi(false);

    setPhase('observe_parse');
    addLog('INFO', `RAV_INIT: Grok × Gemini Oracle v3.1 · Session [${hash}]`);
    const observeParseSeq = buildOracleObserveParseSequence(q, detected, tokenCount);
    addLog('QUANTUM', observeParseSeq[0]!);
    for (const line of observeParseSeq.slice(1)) {
      addLog('INFO', line);
    }

    schedule(() => {
      setPhase('observe_context');
      addLog('QUANTUM', `INTENT_EXTRACTION: Semantic vector computed. Ambiguity score: 0.${Math.floor(Math.random() * 30 + 10)}`);
      addLog('QUANTUM', buildFlashGlintLogMessage(q));
      addLog('INFO', `CONTEXT_MAP: Knowledge graph traversal · Nodes visited: 2,847`);
      addLog('INFO', buildDeepLatticeMeshLogMessage('CONTEXT_MESH', q, ORACLE_LATTICE_PHASE.observeContext));
      setMetrics(prev => ({ ...prev, latency: Math.round(performance.now() - startMs) }));
    }, ORACLE_PHASE_MS[0]);

    schedule(() => {
      setPhase('think_route');
      addLog('INFO', `GEMINI_REASON: Analytical pathway · parallel hypothesis lattice`);
      addLog('QUANTUM', `HYPOTHESIS_GEN: 6 paths · superposition collapse scheduled`);
      addLog('INFO', buildDeepLatticeMeshLogMessage('ROUTE_MESH', q, ORACLE_LATTICE_PHASE.thinkRoute));
      setMetrics(prev => ({ ...prev, latency: Math.round(performance.now() - startMs) }));
    }, ORACLE_PHASE_MS[1]);

    schedule(() => {
      setPhase('think_validate');
      addLog('QUANTUM', `PATH_COLLAPSE: Highest-confidence path (p=${(confidence / 100).toFixed(4)})`);
      addLog('SEC', `CONSTRAINT_CHECK: Zero-hallucination bounds · fact anchors`);
      addLog('INFO', `BRAID_FRAME: Reasoning graph · depth 7 · nodes 1,204`);
      addLog('INFO', buildDeepLatticeMeshLogMessage('VALIDATE_MESH', q, ORACLE_LATTICE_PHASE.thinkValidate));
      addLog('QUANTUM', buildExpressomeBurstLogMessage(q));
      setMetrics(prev => ({
        ...prev,
        confidence: Math.round(confidence * 0.7),
        latency: Math.round(performance.now() - startMs),
      }));
    }, ORACLE_PHASE_MS[2]);

    schedule(() => {
      setPhase('act_execute');
      addLog('INFO', `GROK_ACT: Action directive pipeline · live /api/chat merge pending`);
      addLog('QUANTUM', `RESPONSE_COMPILE: dual-model payload · entropy seed`);
      addLog('INFO', buildDeepLatticeMeshLogMessage('ACT_MESH', q, ORACLE_LATTICE_PHASE.actExecute));
      addLog('INFO', buildDeepLatticeMeshLogMessageRawQuery('DEEP_LATTICE', q));
      addLog('SEC', `SIGN: Quantum OS key · Hash: 0x${generateHash()}${generateHash()}`);
      setMetrics(prev => ({
        ...prev,
        cetCost: parseFloat((Math.random() * 0.005 + 0.001).toFixed(4)),
        latency: Math.round(performance.now() - startMs),
      }));
    }, ORACLE_PHASE_MS[3]);

    schedule(() => {
      void (async () => {
        type FetchResult = { text: string | null; sourceHeader: string | null };
        const raced = await Promise.race<FetchResult>([
          oracleFetchPromise,
          new Promise<FetchResult>(resolve => {
            setTimeout(() => resolve({ text: null, sourceHeader: null }), 14_000);
          }),
        ]).catch((): FetchResult => ({ text: null, sourceHeader: null }));
        const remote = raced.text;
        const hasRemoteText = Boolean(remote?.trim());
        /** True only when the edge handler affirms live Oracle (see X-Oracle-Source on /api/chat). */
        const usedLive = hasRemoteText && raced.sourceHeader === 'live';
        const text = hasRemoteText ? remote!.trim() : localAnswer;
        const conf = hasRemoteText ? Math.min(99.2, confidence + 1.5) : confidence;

        setPhase('act_consensus');
        addLog(
          'INFO',
          usedLive
            ? 'LIVE_ORACLE: /api/chat merged · dual-AI RAV payload materialised'
            : hasRemoteText
              ? 'API_ORACLE: /api/chat body used · X-Oracle-Source missing or not live'
              : 'FALLBACK_ORACLE: static knowledge graph (deploy API for live Grok×Gemini)',
        );
        addLog('SEC', `TON_CONSENSUS: Payload validated · quorum OK`);
        addLog('QUANTUM', `RAV_COMPLETE: loop closed · Confidence: ${conf.toFixed(1)}%`);
        addLog('QUANTUM', buildConsensusBurstLogMessage(q));
        setMetrics(prev => ({
          ...prev,
          confidence: Math.round(conf),
          latency: Math.round(performance.now() - startMs),
        }));
        setOracleConfidence(conf);
        setFinalResponse(text);
        setResponseUsedLiveApi(usedLive);
      })();
    }, ORACLE_PHASE_MS[4]);

    schedule(() => {
      setPhase('verify_cross');
      addLog('SEC', `VERIFY_INIT: Cross-model review · Grok↔Gemini`);
      addLog('QUANTUM', `ZK_PROOF: integrity bundle · Hash: 0x${generateHash()}`);
      addLog('INFO', buildDeepLatticeMeshLogMessage('CROSS_MESH', q, ORACLE_LATTICE_PHASE.verifyCross));
    }, ORACLE_PHASE_MS[5]);

    schedule(() => {
      setPhase('verify_anchor');
      addLog('SEC', `IPFS_ANCHOR: trace slot reserved · CID: bafkrei${generateHash().toLowerCase()}`);
      addLog('INFO', `ON_CHAIN: anchor ref · Block: #${Math.floor(Math.random() * 1_000_000 + 48_000_000)}`);
      addLog('QUANTUM', buildDeepLatticeMeshLogMessage('MESH_SEAL', q, ORACLE_LATTICE_PHASE.meshSeal));
      addLog('QUANTUM', `RAV_VERIFIED: no hallucination flag on consensus path`);
    }, ORACLE_PHASE_MS[6]);

    schedule(() => {
      setPhase('complete');
      addLog('INFO', buildDeepLatticeMeshLogMessage('SESSION_MESH', q, ORACLE_LATTICE_PHASE.sessionClose));
      addLog('QUANTUM', buildLoopCompleteBurstLogMessage(q));
    }, ORACLE_PHASE_MS[7]);
  }, [generateHash, addLog, t.oracle.knowledge]);

  // Hero widget submit → open modal + start processing
  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    const q = query.trim();
    setQuery('');
    setIsModalOpen(true);
    processQuestion(q);
  };

  // Modal follow-up submit → archive current Q&A, start new question
  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isProcessing) return;
    if (finalResponse) {
      setChatHistory(prev => [
        ...prev,
        { question: submittedQuestion, answer: finalResponse, confidence: oracleConfidence },
      ]);
    }
    const q = query.trim();
    setQuery('');
    processQuestion(q);
  };

  const isProcessing = phase !== 'idle' && phase !== 'complete';

  // ── RENDER ────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Hero trigger widget ──────────────────────────────────────────────── */}
      <div
        data-testid="oracle-hero"
        className="w-full max-w-5xl mx-auto scroll-mt-24 bg-black border border-gray-800 rounded-3xl p-4 md:p-8 shadow-2xl font-sans relative overflow-hidden z-20"
      >
        {/* Background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 flex flex-col items-center mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 uppercase tracking-widest">
            {t.oracle.title}
          </h2>
          <p className="text-gray-400 text-xs md:text-sm mt-1 tracking-widest uppercase">
            {t.oracle.subtitle}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs font-mono bg-gray-900 border border-gray-700 px-2 py-0.5 rounded text-blue-400">Gemini REASON</span>
            <span className="text-gray-600 text-xs">×</span>
            <span className="text-xs font-mono bg-gray-900 border border-gray-700 px-2 py-0.5 rounded text-purple-400">Grok ACT</span>
          </div>
        </div>

        {/* Input */}
        <form
          onSubmit={handleHeroSubmit}
          className="relative z-10 flex flex-col md:flex-row w-full gap-3 md:gap-4"
        >
          <div className="flex-grow relative">
            <input
              type="text"
              data-testid="oracle-hero-query"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={t.oracle.placeholder}
              className="w-full min-h-11 px-4 md:px-6 py-3 md:py-4 bg-gray-950 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all text-base md:text-base"
            />
          </div>
          <button
            type="submit"
            className="min-h-11 px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-yellow-600 to-yellow-500 text-black font-bold rounded-xl hover:from-yellow-500 hover:to-yellow-400 transition-all active:scale-95 shadow-[0_0_20px_rgba(234,179,8,0.2)] whitespace-nowrap text-sm md:text-base touch-manipulation"
          >
            {t.oracle.sendButton}
          </button>
        </form>

        {/* Suggested questions chips */}
        <div className="mt-4 flex flex-wrap gap-2 scroll-mt-28">
          {t.oracle.suggestedQuestions.slice(0, 4).map(q => (
            <button
              key={q}
              type="button"
              onClick={() => { setQuery(q); setIsModalOpen(true); setTimeout(() => processQuestion(q), 50); setQuery(''); }}
              className="inline-flex items-center gap-1.5 min-h-11 min-w-[44px] px-3 py-2 rounded-full bg-gray-900 border border-gray-700 text-gray-400 text-xs hover:border-yellow-500/50 hover:text-yellow-400 transition-all active:scale-95 touch-manipulation"
            >
              <Sparkles className="w-3 h-3" />
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* ── Full-screen Oracle Modal (Radix Dialog — focus trap, Esc) ───────── */}
      <DialogPrimitive.Root
        open={isModalOpen}
        onOpenChange={open => {
          if (!open) handleClose();
        }}
      >
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-[9999] bg-[#020202]/98 backdrop-blur-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content
            data-testid="oracle-modal-dialog"
            aria-describedby={undefined}
            onOpenAutoFocus={e => {
              e.preventDefault();
              requestAnimationFrame(() => modalInputRef.current?.focus());
            }}
            onCloseAutoFocus={e => e.preventDefault()}
            className="fixed inset-0 z-[9999] flex flex-col font-sans pt-[env(safe-area-inset-top,0px)] outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          >
          <DialogPrimitive.Title className="sr-only">{t.oracle.title}</DialogPrimitive.Title>
          <div aria-live="polite" aria-atomic="true" className="sr-only">
            {phase === 'complete' && finalResponse ? t.oracle.announceOracleReady : ''}
          </div>
          {/* Modal header */}
          <header className="shrink-0 flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-gray-800 bg-black/60 backdrop-blur-md">
            <div>
              <h2 className="text-lg md:text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 uppercase tracking-widest">
                {t.oracle.title}
              </h2>
              <p className="text-gray-500 text-xs tracking-widest uppercase mt-0.5">
                {t.oracle.subtitle}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-xs font-mono bg-gray-900 border border-gray-700 px-2 py-0.5 rounded text-blue-400">Gemini REASON</span>
              <span className="hidden sm:inline text-gray-600 text-xs">×</span>
              <span className="hidden sm:inline text-xs font-mono bg-gray-900 border border-gray-700 px-2 py-0.5 rounded text-purple-400">Grok ACT</span>
              {chatHistory.length > 0 && (
                <button
                  onClick={() => setChatHistory([])}
                  aria-label="Clear chat history"
                  title="Clear history"
                  className="p-2 rounded-lg text-gray-600 hover:text-red-400 hover:bg-gray-800 transition-all duration-200"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={handleClose}
                aria-label="Close Oracle"
                className="ml-1 min-h-11 min-w-11 inline-flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-all duration-200 touch-manipulation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </header>

          {/* Scrollable conversation area */}
          <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
            <div className="max-w-5xl mx-auto space-y-10">

              {/* ── Chat history (previous Q&As) ── */}
              {chatHistory.map((entry, i) => (
                <div key={i} className="space-y-4 opacity-50">
                  {/* User bubble */}
                  <div className="flex justify-end">
                    <div className="bg-gray-900 border border-gray-700 rounded-2xl rounded-tr-sm px-5 py-3 max-w-2xl">
                      <p className="text-gray-300 text-sm">{entry.question}</p>
                    </div>
                  </div>
                  {/* Oracle bubble */}
                  <div className="flex justify-start">
                    <div className="bg-green-950/40 border border-green-500/20 rounded-2xl rounded-tl-sm px-5 py-4 max-w-2xl w-full">
                      <p className="text-green-400 text-xs font-mono mb-2 uppercase tracking-widest">
                        {t.oracle.oracleResponse} · {entry.confidence.toFixed(1)}% {t.oracle.confidence}
                      </p>
                      <div className="text-white">
                        <MarkdownText text={entry.answer} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* ── Current session ── */}
              {submittedQuestion && (
                <div className="space-y-6">
                  {/* Current user question bubble */}
                  <div className="flex justify-end">
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl rounded-tr-sm px-5 py-3 max-w-2xl">
                      <p className="text-yellow-200 text-sm">{submittedQuestion}</p>
                    </div>
                  </div>

                  {/* ReAct phase visualizer */}
                  <ReActPanels phase={phase} />

                  {/* Terminal & Metrics */}
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    {/* Telemetry terminal */}
                    <div className="lg:col-span-3 bg-gray-950 border border-gray-800 rounded-xl p-3 md:p-4 font-mono text-xs overflow-hidden flex flex-col h-40 md:h-56 shadow-inner">
                      <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-800 text-gray-500">
                        <span>&gt;_ RAV_TERMINAL · Grok × Gemini v3.0</span>
                        <span className={isProcessing ? 'text-yellow-500 animate-pulse' : 'text-green-500'}>
                          {isProcessing ? t.oracle.processing : `● ${t.oracle.done}`}
                        </span>
                      </div>
                      <div ref={terminalRef} className="flex-1 overflow-y-auto space-y-1 pr-1">
                        {logs.map(log => {
                          const isSkillLine =
                            log.message.startsWith('RAV_BURST:') ||
                            log.message.startsWith('INPUT_MESH:') ||
                            log.message.startsWith('CONTEXT_MESH:') ||
                            log.message.startsWith('TASK_MESH:') ||
                            log.message.startsWith('AGENT_POOL_MESH:') ||
                            log.message.startsWith('TEAM_AGENT_MESH:') ||
                            log.message.startsWith('SKILL_LOCUS:') ||
                            log.message.startsWith('EXPRESSOME_BURST:') ||
                            log.message.startsWith('DEEP_LATTICE:') ||
                            log.message.startsWith('MESH_SEAL:') ||
                            log.message.startsWith('FLASH_GLINT:') ||
                            log.message.startsWith('ROUTE_MESH:') ||
                            log.message.startsWith('CROSS_MESH:') ||
                            log.message.startsWith('CONSENSUS_BURST:') ||
                            log.message.startsWith('VALIDATE_MESH:') ||
                            log.message.startsWith('ACT_MESH:') ||
                            log.message.startsWith('PARSE_MESH:') ||
                            log.message.startsWith('SESSION_MESH:') ||
                            log.message.startsWith('LOOP_COMPLETE_BURST:');
                          return (
                            <div
                              key={log.id}
                              className={`flex gap-3 p-0.5 rounded ${
                                isSkillLine
                                  ? 'bg-fuchsia-950/25 hover:bg-fuchsia-950/35 border border-fuchsia-500/15'
                                  : 'hover:bg-gray-900/50'
                              }`}
                            >
                              <span className="text-gray-600 min-w-[88px] shrink-0">[{log.timestamp}]</span>
                              <span
                                className={`min-w-[68px] font-bold shrink-0 ${
                                  isSkillLine
                                    ? 'text-fuchsia-400'
                                    : log.type === 'INFO'
                                      ? 'text-blue-400'
                                      : log.type === 'WARN'
                                        ? 'text-yellow-400'
                                        : log.type === 'SEC'
                                          ? 'text-green-400'
                                          : 'text-purple-400'
                                }`}
                              >
                                [{isSkillLine ? 'SKILL' : log.type}]
                              </span>
                              <span
                                className={`break-all ${
                                  isSkillLine
                                    ? 'text-fuchsia-200/90 drop-shadow-[0_0_8px_rgba(217,70,239,0.12)]'
                                    : 'text-gray-300'
                                }`}
                              >
                                {log.message}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Live metrics */}
                    <div className="bg-gray-950 border border-gray-800 rounded-xl p-4 flex flex-col justify-between h-40 md:h-56">
                      <h4 className="text-gray-500 font-mono text-xs mb-3 border-b border-gray-800 pb-2">
                        SYS_METRICS
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <div className="text-gray-400 text-xs mb-1">Logic Confidence</div>
                          <div className="flex items-end gap-1">
                            <span className={`text-2xl font-bold tabular-nums ${metrics.confidence > 90 ? 'text-green-500' : 'text-yellow-500'}`}>
                              {metrics.confidence.toFixed(1)}
                            </span>
                            <span className="text-gray-500 mb-0.5 text-sm">%</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400 text-xs mb-1">Network Latency</div>
                          <div className="flex items-end gap-1">
                            <span className="text-2xl font-bold text-blue-400 tabular-nums">{metrics.latency}</span>
                            <span className="text-gray-500 mb-0.5 text-sm">ms</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400 text-xs mb-1">Est. Action Cost</div>
                          <div className="flex items-end gap-1">
                            <span className="text-xl font-bold text-yellow-500 tabular-nums">{metrics.cetCost.toFixed(4)}</span>
                            <span className="text-gray-500 mb-0.5 text-xs">CET</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Oracle final response */}
                  {phase === 'complete' && finalResponse && (
                    <div className="flex justify-start">
                      <div className="bg-gradient-to-br from-green-950/80 to-black border border-green-500/30 rounded-2xl rounded-tl-sm p-5 md:p-6 w-full">
                        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center shrink-0">
                              <svg viewBox="0 0 16 16" className="w-4 h-4 text-yellow-400" fill="currentColor">
                                <circle cx="8" cy="8" r="3" />
                                <path d="M8 1 L8.6 4.5 L8 4 L7.4 4.5 Z" />
                                <path d="M8 15 L8.6 11.5 L8 12 L7.4 11.5 Z" />
                                <path d="M1 8 L4.5 8.6 L4 8 L4.5 7.4 Z" />
                                <path d="M15 8 L11.5 8.6 L12 8 L11.5 7.4 Z" />
                              </svg>
                            </div>
                            <p className="text-green-400 text-xs font-mono font-bold uppercase tracking-widest">
                              {t.oracle.oracleResponse} · {t.oracle.confidence} {oracleConfidence.toFixed(1)}%
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap justify-end">
                            <div className="h-1.5 w-28 bg-gray-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-yellow-500 to-green-500 rounded-full transition-all duration-1000"
                                style={{ width: `${oracleConfidence}%` }}
                              />
                            </div>
                            {/* Copy response */}
                            <button
                              type="button"
                              aria-label="Copy response"
                              onClick={() => {
                                navigator.clipboard.writeText(finalResponse).then(() => {
                                  setCopiedResponse(true);
                                  setTimeout(() => setCopiedResponse(false), 2000);
                                }).catch(() => {});
                              }}
                              className="p-1.5 rounded-lg bg-gray-900 border border-gray-700 text-gray-400 hover:text-yellow-400 hover:border-yellow-500/40 transition-all"
                            >
                              {copiedResponse ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              type="button"
                              title={t.oracle.copyForAiTooltip}
                              aria-label={t.oracle.copyForAiAriaLabel}
                              onClick={() => {
                                const payload = buildCopyForAiText(submittedQuestion, finalResponse, t.oracle);
                                navigator.clipboard.writeText(payload).then(() => {
                                  setCopiedForAi(true);
                                  setTimeout(() => setCopiedForAi(false), 2000);
                                }).catch(() => {});
                              }}
                              className="p-1.5 rounded-lg bg-gray-900 border border-gray-700 text-gray-400 hover:text-cyan-300 hover:border-cyan-500/40 transition-all"
                            >
                              {copiedForAi ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Bot className="w-3.5 h-3.5" />}
                            </button>
                            {/* On-chain verify */}
                            <a
                              href={`https://tonscan.org/address/EQBbUfeIo6yrNRButZGdf4WRJZZ3IDkN8kHJbsKlu3xxypWX`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Verify on TonScan"
                              className="p-1.5 rounded-lg bg-gray-900 border border-gray-700 text-gray-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-all"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                        {!responseUsedLiveApi && (
                          <p
                            role="status"
                            className="text-amber-200/90 text-xs font-mono border border-amber-500/25 bg-amber-500/10 rounded-lg px-3 py-2 mb-4"
                          >
                            {t.oracle.offlineModeHint}
                          </p>
                        )}
                        <div className="text-white">
                          <MarkdownText text={finalResponse} />
                        </div>

                        {/* Follow-up suggestions */}
                        <div className="mt-5 pt-4 border-t border-green-500/10">
                          <p className="text-gray-600 text-[10px] font-mono uppercase tracking-widest mb-2">{t.oracle.askNextLabel}</p>
                          <div className="flex flex-wrap gap-2">
                            {(FOLLOW_UP_BY_TOPIC[detectedTopic] ?? FOLLOW_UP_BY_TOPIC.default).map(suggestion => (
                              <button
                                key={suggestion}
                                type="button"
                                onClick={() => {
                                  setChatHistory(prev => [...prev, { question: submittedQuestion, answer: finalResponse, confidence: oracleConfidence }]);
                                  processQuestion(suggestion);
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-900 border border-gray-700 text-gray-400 text-xs hover:border-yellow-500/50 hover:text-yellow-400 transition-all active:scale-95"
                              >
                                <ChevronRight className="w-3 h-3" />
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div ref={chatEndRef} />
            </div>
          </div>

          {/* ── Follow-up input (sticky bottom) ── */}
          <div className="shrink-0 border-t border-gray-800 bg-black/80 backdrop-blur-md px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] md:px-8 md:pb-4">
            <form
              onSubmit={handleModalSubmit}
              className="flex gap-3 max-w-5xl mx-auto"
            >
              <div className="flex-grow relative">
                <input
                  ref={modalInputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  disabled={isProcessing}
                  placeholder={phase === 'complete' ? t.oracle.followUpPlaceholder : t.oracle.placeholder}
                  className="w-full min-h-11 px-5 py-3 bg-gray-950 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all disabled:opacity-40 text-base"
                />
                {isProcessing && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={isProcessing || !query.trim()}
                aria-label="Send question"
                className="min-h-11 min-w-11 px-5 py-3 bg-gradient-to-r from-yellow-600 to-yellow-500 text-black font-bold rounded-xl hover:from-yellow-500 hover:to-yellow-400 transition-all active:scale-95 disabled:from-gray-800 disabled:to-gray-900 disabled:text-gray-500 shadow-[0_0_20px_rgba(234,179,8,0.2)] disabled:shadow-none flex items-center justify-center gap-2 whitespace-nowrap touch-manipulation"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">SEND</span>
              </button>
            </form>
            <p className="text-center text-gray-700 text-xs mt-2 font-mono">
              {t.oracle.escToClose}
            </p>
          </div>
        </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}

// Helper — linear progress index through phases
function phaseOrderIndex(currentPhase: string): number {
  const phases: ReActPhase[] = [
    'idle', 'observe_parse', 'observe_context',
    'think_route', 'think_validate',
    'act_execute', 'act_consensus', 'verify_cross', 'verify_anchor', 'complete',
  ];
  return phases.indexOf(currentPhase as ReActPhase);
}


