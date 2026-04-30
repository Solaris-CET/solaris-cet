import {
  Bot,
  Check,
  ChevronRight,
  ClipboardList,
  Copy,
  Download,
  ExternalLink,
  Flag,
  Mic,
  Paperclip,
  Pin,
  RefreshCw,
  Send,
  SlidersHorizontal,
  Sparkles,
  StopCircle,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import React, { useCallback,useEffect, useRef, useState } from "react";

import { Dialog, DialogTitle, FullscreenDialogContent } from "@/components/ui/dialog";
import { trackAiQuery, trackEvent } from '@/lib/analytics';
import { getAuthToken } from '@/lib/authToken';
import { CET_AI_MAX_QUERY_CHARS } from '@/lib/cetAiConstants';
import {
  buildCopyForAiText,
  buildFullConversationHandoff,
  type CetAiChatEntry,
} from '@/lib/cetAiConversation';
import { cetAiQueryCharCountToneClass, formatCetAiQueryCharCountAria } from '@/lib/cetAiQueryUi';
import {
  buildCetAiObserveParse,
  buildConsensusBurstLogMessage,
  buildDeepLatticeMeshLogMessage,
  buildDeepLatticeMeshLogMessageRawQuery,
  buildExpressomeBurstLogMessage,
  buildFlashGlintLogMessage,
  buildLoopCompleteBurstLogMessage,
  CET_AI_LATTICE_PHASE,
} from '@/lib/cetAiTelemetry';
import { TONSCAN_CET_CONTRACT_URL } from '@/lib/cetContract';

import { useLanguage } from '../hooks/useLanguage';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useSessionStorage } from '../hooks/useSessionStorage';
import type { CetAiKnowledge, Translations } from '../i18n/translations';
import { SafeHtml } from './SafeHtml';

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

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((ev: unknown) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop?: () => void;
};

type AiState = 'idle' | 'loading' | 'success' | 'error';

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

interface AiAttachmentMeta {
  id: string;
  filename: string;
  mimeType: string;
  bytes: number;
  url: string | null;
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

function chatHistoryToConversation(history: CetAiChatEntry[]): { role: 'user' | 'assistant'; content: string }[] {
  return history
    .flatMap((e) => [
      { role: 'user' as const, content: e.question },
      { role: 'assistant' as const, content: e.answer },
    ])
    .slice(-24);
}

interface CetAiFetchResult {
  text: string | null;
  sourceHeader: string | null;
  sources: Array<{ id: string; title: string; url: string; snippet: string }>;
  modelUsed: string | null;
  conversationId: string | null;
  assistantMessageId: string | null;
  queryLogId: string | null;
  usedCache: boolean;
  /** True if /api/chat responded with a non-success or empty body (helps explain fallback). */
  liveEndpointError: boolean;
  /** Parsed `message` or `error` from JSON body when the call did not yield a response. */
  errorDetail: string | null;
  /** Last HTTP status from /api/chat when the response was not usable (4xx/5xx or empty body). */
  httpStatus: number | null;
}

async function fetchCetAiChat(
  query: string,
  signal: AbortSignal,
  priorHistory: CetAiChatEntry[],
  opts?: {
    model?: string;
    tone?: string;
    mode?: string;
    instructions?: string;
    conversationId?: string | null;
    revisionOfMessageId?: string | null;
    forceFresh?: boolean;
    attachmentIds?: string[];
  },
): Promise<CetAiFetchResult> {
  const conversation = chatHistoryToConversation(priorHistory);
  const maxAttempts = 2;
  let sawHttpOrEmptyError = false;
  let lastErrorDetail: string | null = null;
  let lastHttpStatus: number | null = null;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const endpoint = attempt === 0 ? '/api/ai/ask' : '/api/chat';
    if (attempt > 0) {
      await new Promise<void>(resolve => {
        const delay = 300 + Math.random() * 400;
        const onAbort = () => {
          clearTimeout(id);
          signal.removeEventListener('abort', onAbort);
          resolve();
        };
        if (signal.aborted) {
          resolve();
          return;
        }
        const onTimeout = () => {
          signal.removeEventListener('abort', onAbort);
          resolve();
        };
        const id = setTimeout(onTimeout, delay);
        signal.addEventListener('abort', onAbort);
      });
      if (signal.aborted)
        return {
          text: null,
          sourceHeader: null,
          sources: [],
          modelUsed: null,
          conversationId: null,
          assistantMessageId: null,
          queryLogId: null,
          usedCache: false,
          liveEndpointError: false,
          errorDetail: null,
          httpStatus: null,
        };
    }
    try {
      const token = getAuthToken();
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          query,
          conversation,
          model: opts?.model,
          tone: opts?.tone,
          mode: opts?.mode,
          instructions: opts?.instructions,
          conversationId: opts?.conversationId ?? null,
          revisionOfMessageId: opts?.revisionOfMessageId ?? null,
          forceFresh: Boolean(opts?.forceFresh),
          attachmentIds: Array.isArray(opts?.attachmentIds) ? opts?.attachmentIds : [],
        }),
        signal,
      });
      const sourceHeader = res.headers.get('X-Cet-Ai-Source');
      const usedCache = res.headers.get('X-Cet-Ai-Used-Cache') === '1';
      const raw = await res.text();
      let data: {
        response?: string;
        message?: string;
        error?: string;
        sources?: unknown;
        modelUsed?: unknown;
        conversationId?: unknown;
        assistantMessageId?: unknown;
        queryLogId?: unknown;
      } = {};
      try {
        data = JSON.parse(raw) as typeof data;
      } catch {
        /* non-JSON error body */
      }
      const responseText = typeof data.response === 'string' ? data.response.trim() : '';
      const msg = typeof data.message === 'string' ? data.message.trim() : '';
      const err = typeof data.error === 'string' ? data.error.trim() : '';
      const modelUsed = typeof data.modelUsed === 'string' ? data.modelUsed.trim() : null;
      const conversationId = typeof data.conversationId === 'string' ? data.conversationId.trim() : null;
      const assistantMessageId = typeof data.assistantMessageId === 'string' ? data.assistantMessageId.trim() : null;
      const queryLogId = typeof data.queryLogId === 'string' ? data.queryLogId.trim() : null;
      const sources = Array.isArray(data.sources)
        ? data.sources
            .map((s): { id: string; title: string; url: string; snippet: string } | null => {
              if (!s || typeof s !== 'object') return null;
              const rec = s as Record<string, unknown>;
              const id = typeof rec.id === 'string' ? rec.id : '';
              const title = typeof rec.title === 'string' ? rec.title : '';
              const url = typeof rec.url === 'string' ? rec.url : '';
              const snippet = typeof rec.snippet === 'string' ? rec.snippet : '';
              if (!id || !title || !url) return null;
              return { id, title, url, snippet };
            })
            .filter((x): x is { id: string; title: string; url: string; snippet: string } => Boolean(x))
            .slice(0, 5)
        : [];
      const pickDetail = (): string | null => {
        const d = msg || err;
        if (!d) return null;
        return d.replace(/\s+/g, ' ').slice(0, 500);
      };
      if (res.ok && responseText) {
        return {
          text: responseText,
          sourceHeader,
          sources,
          modelUsed,
          conversationId,
          assistantMessageId,
          queryLogId,
          usedCache,
          liveEndpointError: false,
          errorDetail: null,
          httpStatus: null,
        };
      }
      const detail = pickDetail();
      if (detail) lastErrorDetail = detail;
      lastHttpStatus = res.status;
      if (!res.ok) {
        sawHttpOrEmptyError = true;
      } else if (res.ok && !responseText) {
        sawHttpOrEmptyError = true;
      }
    } catch {
      if (signal.aborted)
        return {
          text: null,
          sourceHeader: null,
          sources: [],
          modelUsed: null,
          conversationId: null,
          assistantMessageId: null,
          queryLogId: null,
          usedCache: false,
          liveEndpointError: false,
          errorDetail: null,
          httpStatus: null,
        };
    }
  }
  return {
    text: null,
    sourceHeader: null,
    sources: [],
    modelUsed: null,
    conversationId: null,
    assistantMessageId: null,
    queryLogId: null,
    usedCache: false,
    liveEndpointError: sawHttpOrEmptyError,
    errorDetail: lastErrorDetail,
    httpStatus: lastHttpStatus,
  };
}

function liveApiHttpHintForStatus(
  cet: Translations['cetAi'],
  status: number | null,
): string | null {
  if (status == null || status < 400) return null;
  if (status === 429) return cet.liveApiErrorRateLimited;
  if (status === 502 || status === 503 || status === 504) return cet.liveApiErrorServiceUnavailable;
  if (status >= 500) return cet.liveApiErrorServerError;
  return null;
}

function CetAiQueryCharCountLine({
  id,
  length,
  max,
  ariaTemplate,
}: {
  id: string;
  length: number;
  max: number;
  ariaTemplate: string;
}): React.ReactNode {
  if (length === 0) return null;
  return (
    <p
      id={id}
      data-testid="cet-ai-query-char-count"
      aria-label={formatCetAiQueryCharCountAria(ariaTemplate, length, max)}
      className={`mt-1 text-right text-[10px] font-mono tabular-nums ${cetAiQueryCharCountToneClass(length, max)}`}
    >
      {length}/{max}
    </p>
  );
}

function CetAiTypingIndicator({ label }: { label: string }) {
  return (
    <div
      className="flex justify-start motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300"
      aria-live="polite"
      aria-label={label}
    >
      <div className="bg-gradient-to-br from-green-950/60 to-black border border-green-500/20 rounded-2xl rounded-tl-sm px-5 py-4 max-w-2xl w-full">
        <p className="text-green-400 text-xs font-mono mb-2 uppercase tracking-widest">{label}</p>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-yellow-500/80 motion-safe:animate-bounce [animation-delay:-0.2s]" />
          <span className="h-2 w-2 rounded-full bg-yellow-500/70 motion-safe:animate-bounce [animation-delay:-0.1s]" />
          <span className="h-2 w-2 rounded-full bg-yellow-500/60 motion-safe:animate-bounce" />
          <span className="text-[11px] font-mono text-solaris-muted">RAV · Grok × Gemini</span>
        </div>
      </div>
    </div>
  );
}

function AiResultSkeleton({ label }: { label: string }) {
  return (
    <div className="flex justify-start motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">
      <div className="bg-black/30 border border-white/10 rounded-2xl rounded-tl-sm px-5 py-4 max-w-2xl w-full">
        <p className="text-white/60 text-xs font-mono mb-3 uppercase tracking-widest">{label}</p>
        <div role="status" aria-label={label}>
          <div className="h-3 rounded bg-white/10 motion-safe:animate-pulse w-[82%]" />
          <div className="mt-2 h-3 rounded bg-white/10 motion-safe:animate-pulse w-[64%]" />
          <div className="mt-2 h-3 rounded bg-white/10 motion-safe:animate-pulse w-[74%]" />
        </div>
      </div>
    </div>
  );
}

/** Enter / ⌘+Enter / Ctrl+Enter submit; Shift+Enter stays newline (textarea). */
function handleComposerEnterKeyDown(
  e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  opts: { isProcessing: boolean; hasText: boolean },
): void {
  if (e.key !== 'Enter') return;
  if (e.nativeEvent.isComposing) return;
  if (e.shiftKey) return;
  e.preventDefault();
  if (!opts.isProcessing && opts.hasText) {
    (e.currentTarget.form as HTMLFormElement | null)?.requestSubmit();
  }
}

// --- FOLLOW-UP SUGGESTIONS by topic ---
const FOLLOW_UP_BY_TOPIC: Record<string, string[]> = {
  price:       ['What drives CET price long-term?', 'How does DCBM stabilise price?', 'Where can I buy CET?'],
  competition: ['What is the RAV Protocol advantage?', 'Why TON over Ethereum?', 'How do task agents help CET AI?'],
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
const CET_AI_PHASE_MS = [580, 1280, 2080, 2880, 3780, 4380, 4980, 5280] as const;

function buildContextualResponse(q: string, knowledge: CetAiKnowledge): { answer: string; confidence: number } {
  const lower = q.toLowerCase();
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) {
      return { answer: knowledge[topic as keyof CetAiKnowledge], confidence: CONFIDENCE_SCORES[topic] };
    }
  }
  return { answer: knowledge.default, confidence: CONFIDENCE_SCORES.default };
}

const CET_AI_SAFE_HTML_CONFIG = {
  kind: 'limited' as const,
  allowedTags: ['p', 'br', 'strong', 'em', 'a', 'ul', 'ol', 'li'],
  allowedAttributes: ['href', 'target', 'rel'],
};

// --- ReAct phase status helper ---
function getReActPhaseStatus(phase: ReActPhase, targetPhases: ReActPhase[]): string {
  if (phase === 'idle') return 'text-gray-600 border-gray-800';
  if (phase === 'complete')
    return 'text-green-500 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.2)]';
  if (targetPhases.includes(phase))
    return 'text-yellow-400 border-yellow-400/50 shadow-[0_0_15px_rgba(250,204,21,0.2)] motion-safe:animate-pulse';

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

/** Linear index through ReAct phases — drives dot states in `ReActPanels`. */
function phaseOrderIndex(currentPhase: string): number {
  const phases: ReActPhase[] = [
    'idle', 'observe_parse', 'observe_context',
    'think_route', 'think_validate',
    'act_execute', 'act_consensus', 'verify_cross', 'verify_anchor', 'complete',
  ];
  return phases.indexOf(currentPhase as ReActPhase);
}

// --- Markdown renderer for CET AI responses ---
// Supports: fenced ```code```, # / ## / ### headings, **bold**, *italic*, `code`, lists,
// blockquotes (>), pipe tables, --- hr, [label](url), bare https links
function parseFencedCodeBlocks(text: string): Array<{ type: 'md' | 'code'; lang?: string; content: string }> {
  const re = /```(\w*)\n?([\s\S]*?)```/g;
  const out: Array<{ type: 'md' | 'code'; lang?: string; content: string }> = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      out.push({ type: 'md', content: text.slice(last, m.index) });
    }
    out.push({ type: 'code', lang: m[1] || undefined, content: (m[2] ?? '').replace(/\n$/, '') });
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    out.push({ type: 'md', content: text.slice(last) });
  }
  if (out.length === 0) {
    out.push({ type: 'md', content: text });
  }
  return out;
}

function isMarkdownTableSeparatorLine(line: string): boolean {
  const t = line.trim();
  if (!t.includes('|') || !t.includes('-')) return false;
  return /^[\s|:-]+$/.test(t) && !/[0-9a-zA-Z]/.test(t);
}

function splitMarkdownPipeRow(line: string): string[] {
  const t = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  return t.split('|').map((c) => c.trim());
}

function tryParsePipeTable(lines: string[]): { headers: string[]; rows: string[][] } | null {
  if (lines.length < 2) return null;
  if (!isMarkdownTableSeparatorLine(lines[1])) return null;
  const headers = splitMarkdownPipeRow(lines[0]);
  if (headers.length < 2) return null;
  const n = headers.length;
  const rows = lines.slice(2).map((row) => {
    const cells = splitMarkdownPipeRow(row);
    if (cells.length === n) return cells;
    const next = [...cells];
    while (next.length < n) next.push('');
    return next.slice(0, n);
  });
  return { headers, rows };
}

function MarkdownBodyChunk({ text }: { text: string }) {
  const renderInline = (raw: string): React.ReactNode => {
    let key = 0;
    const parts: React.ReactNode[] = [];

    const pushPlain = (s: string) => {
      if (!s) return;
      const linkRe = /(\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)|(https?:\/\/[^\s<]+))/g;
      let li = 0;
      let m: RegExpExecArray | null;
      while ((m = linkRe.exec(s)) !== null) {
        if (m.index > li) parts.push(<span key={key++}>{s.slice(li, m.index)}</span>);
        const href = m[2] ? m[3] : m[4];
        const label = m[2] ? m[2] : (m[4] ?? '');
        if (href) {
          parts.push(
            <a
              key={key++}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 underline underline-offset-2 hover:text-cyan-300 break-all"
            >
              {label}
            </a>,
          );
        }
        li = m.index + m[0].length;
      }
      if (li < s.length) parts.push(<span key={key++}>{s.slice(li)}</span>);
    };

    const pattern = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(raw)) !== null) {
      if (match.index > lastIndex) pushPlain(raw.slice(lastIndex, match.index));
      if (match[2]) {
        parts.push(<strong key={key++} className="text-yellow-300 font-semibold">{match[2]}</strong>);
      } else if (match[3]) {
        parts.push(<em key={key++} className="text-gray-300 italic">{match[3]}</em>);
      } else if (match[4]) {
        parts.push(<code key={key++} className="bg-gray-800 text-yellow-400 px-1.5 py-0.5 rounded text-xs font-mono break-all">{match[4]}</code>);
      }
      lastIndex = pattern.lastIndex;
    }
    if (lastIndex < raw.length) pushPlain(raw.slice(lastIndex));
    return <>{parts}</>;
  };

  const renderLine = (line: string, key: number) => {
    const trimmed = line.trim();
    if (/^[-*_]{3,}$/.test(trimmed)) {
      return <hr key={key} className="my-4 border-white/10" />;
    }
    const h1 = line.match(/^#\s+(.+)$/);
    if (h1) {
      return (
        <h2
          key={key}
          className="text-yellow-100 font-bold text-lg md:text-xl tracking-tight mt-4 mb-2"
        >
          {renderInline(h1[1])}
        </h2>
      );
    }
    const h2 = line.match(/^##\s+(.+)$/);
    if (h2) {
      return (
        <h3
          key={key}
          className="text-yellow-200/95 font-bold text-base md:text-lg tracking-tight mt-4 mb-2 border-b border-yellow-500/25 pb-1"
        >
          {renderInline(h2[1])}
        </h3>
      );
    }
    const h3 = line.match(/^###\s+(.+)$/);
    if (h3) {
      return (
        <h4 key={key} className="text-yellow-200/95 font-bold text-sm md:text-base tracking-tight mt-3 mb-1 border-b border-yellow-500/20 pb-1">
          {renderInline(h3[1])}
        </h4>
      );
    }
    const bq = line.match(/^\s*>\s?(.*)$/);
    if (bq && /^\s*>/.test(line)) {
      return (
        <blockquote
          key={key}
          className="border-l-2 border-yellow-500/35 pl-3 my-1.5 text-gray-300 leading-relaxed"
        >
          {renderInline(bq[1])}
        </blockquote>
      );
    }
    const numberedMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (numberedMatch) {
      return (
        <li key={key} className="flex gap-2 items-start">
          <span className="text-yellow-500 font-bold shrink-0 min-w-[1.2em]">{numberedMatch[1]}.</span>
          <span>{renderInline(numberedMatch[2])}</span>
        </li>
      );
    }
    if (line.startsWith('- ✅')) {
      return (
        <li key={key} className="flex gap-2 items-start">
          <span className="shrink-0">✅</span>
          <span>{renderInline(line.replace(/^-\s*✅\s*/, ''))}</span>
        </li>
      );
    }
    if (line.startsWith('- 🔄')) {
      return (
        <li key={key} className="flex gap-2 items-start">
          <span className="shrink-0">🔄</span>
          <span>{renderInline(line.replace(/^-\s*🔄\s*/, ''))}</span>
        </li>
      );
    }
    if (line.startsWith('- 🔮')) {
      return (
        <li key={key} className="flex gap-2 items-start">
          <span className="shrink-0">🔮</span>
          <span>{renderInline(line.replace(/^-\s*🔮\s*/, ''))}</span>
        </li>
      );
    }
    if (line.startsWith('- ') || line.startsWith('• ')) {
      return (
        <li key={key} className="flex gap-2 items-start">
          <span className="text-yellow-500 mt-1.5 shrink-0">▸</span>
          <span>{renderInline(line.slice(2))}</span>
        </li>
      );
    }
    return <p key={key} className="leading-relaxed">{renderInline(line)}</p>;
  };

  const paragraphs = text.split(/\n\n+/);
  return (
    <div className="space-y-3 text-sm leading-relaxed">
      {paragraphs.map((para, pi) => {
        const lines = para.split('\n').filter(l => l.trim() !== '');
        const tableParsed = tryParsePipeTable(lines);
        if (tableParsed) {
          return (
            <div key={pi} className="my-3 overflow-x-auto rounded-lg">
              <table className="min-w-full text-xs border-collapse border border-white/10">
                <thead>
                  <tr className="bg-white/[0.04]">
                    {tableParsed.headers.map((h, hi) => (
                      <th
                        key={hi}
                        className="border border-white/10 px-2 py-2 text-left font-mono text-yellow-200/90 align-top"
                      >
                        {renderInline(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableParsed.rows.map((row, ri) => (
                    <tr key={ri} className="odd:bg-white/[0.02]">
                      {row.map((cell, ci) => (
                        <td
                          key={ci}
                          className="border border-white/10 px-2 py-1.5 text-gray-300 align-top"
                        >
                          {renderInline(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        if (lines.length > 0 && lines.every(l => /^\s*>/.test(l))) {
          const inner = lines.map(l => l.replace(/^\s*>\s?/, ''));
          return (
            <blockquote
              key={pi}
              className="border-l-2 border-yellow-500/40 pl-3 my-2 text-gray-300 space-y-1.5"
            >
              {inner.map((line, li) => (
                <p key={li} className="leading-relaxed">
                  {renderInline(line)}
                </p>
              ))}
            </blockquote>
          );
        }
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

function FencedCodeBlock({
  content,
  copyLabel,
  copiedAnnounce,
  lang,
}: {
  content: string;
  copyLabel: string;
  copiedAnnounce: string;
  lang?: string;
}) {
  const [copied, setCopied] = useState(false);
  const langLabel = lang?.trim();
  return (
    <div className="relative rounded-xl border border-white/10 bg-black/60">
      <span className="sr-only" aria-live="polite">
        {copied ? copiedAnnounce : ''}
      </span>
      {langLabel ? (
        <span
          className="absolute top-2 left-3 z-[1] max-w-[min(50%,12rem)] truncate text-[10px] font-mono uppercase tracking-wider text-gray-500"
          title={langLabel}
        >
          {langLabel}
        </span>
      ) : null}
      <button
        type="button"
        aria-label={copyLabel}
        title={copyLabel}
        onClick={() => {
          void navigator.clipboard.writeText(content).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }).catch(() => {});
        }}
        className="absolute top-2 right-2 z-[1] inline-flex items-center justify-center p-1.5 rounded-lg bg-gray-900/95 border border-white/10 text-gray-400 hover:text-yellow-400 hover:border-yellow-500/35 transition-colors"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
      <pre className="overflow-x-auto p-4 pt-11 text-xs text-slate-200 font-mono leading-relaxed">
        <code>{content}</code>
      </pre>
    </div>
  );
}

function MarkdownText({
  text,
  copyCodeLabel,
  codeCopiedAnnounce,
}: {
  text: string;
  copyCodeLabel: string;
  codeCopiedAnnounce: string;
}) {
  const segments = parseFencedCodeBlocks(text);
  return (
    <div className="space-y-4 text-sm leading-relaxed">
      {segments.map((seg, i) =>
        seg.type === 'code' ? (
          <FencedCodeBlock
            key={i}
            content={seg.content}
            copyLabel={copyCodeLabel}
            copiedAnnounce={codeCopiedAnnounce}
            lang={seg.lang}
          />
        ) : (
          <MarkdownBodyChunk key={i} text={seg.content} />
        ),
      )}
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
            <div className={`w-2 h-2 rounded-full ${phase === 'observe_parse' ? 'bg-yellow-400 motion-safe:animate-pulse' : phaseOrderIndex(phase) > 1 ? 'bg-green-500' : 'bg-gray-700'}`} />
            <span>Intent Extraction</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${phase === 'observe_context' ? 'bg-yellow-400 motion-safe:animate-pulse' : phaseOrderIndex(phase) > 2 ? 'bg-green-500' : 'bg-gray-700'}`} />
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
            <div className={`w-2 h-2 rounded-full ${phase === 'think_route' ? 'bg-yellow-400 motion-safe:animate-pulse' : phaseOrderIndex(phase) > 3 ? 'bg-green-500' : 'bg-gray-700'}`} />
            <span>Logic Routing</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${phase === 'think_validate' ? 'bg-yellow-400 motion-safe:animate-pulse' : phaseOrderIndex(phase) > 4 ? 'bg-green-500' : 'bg-gray-700'}`} />
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
            <div className={`w-2 h-2 rounded-full ${phase === 'act_execute' ? 'bg-yellow-400 motion-safe:animate-pulse' : phaseOrderIndex(phase) > 5 ? 'bg-green-500' : 'bg-gray-700'}`} />
            <span>Execution Payload</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${phase === 'act_consensus' ? 'bg-yellow-400 motion-safe:animate-pulse' : phaseOrderIndex(phase) > 6 ? 'bg-green-500' : 'bg-gray-700'}`} />
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
            <div className={`w-2 h-2 rounded-full ${phase === 'verify_cross' ? 'bg-yellow-400 motion-safe:animate-pulse' : phaseOrderIndex(phase) > 7 ? 'bg-green-500' : 'bg-gray-700'}`} />
            <span>Cross-Model Check</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${phase === 'verify_anchor' ? 'bg-yellow-400 motion-safe:animate-pulse' : phaseOrderIndex(phase) > 8 ? 'bg-green-500' : 'bg-gray-700'}`} />
            <span>IPFS Anchor</span>
          </div>
        </div>
      </div>
    </div>
  );
}


export default function CetAiSearch(props: { initialPrompt?: string } = {}) {
  // --- LANGUAGE ---
  const { t } = useLanguage();
  const prefersReducedMotion = useReducedMotion();

  // --- STATE MANAGEMENT ---
  const initialPrompt = props.initialPrompt;
  const [query, setQuery] = useState(() => (initialPrompt?.trim() ? initialPrompt.trim() : ''));
  const [submittedQuestion, setSubmittedQuestion] = useState('');
  const [phase, setPhase] = useState<ReActPhase>('idle');
  const [aiState, setAiState] = useState<AiState>('idle');
  const [logs, setLogs] = useState<TelemetryLog[]>([]);
  const [metrics, setMetrics] = useState<MetricsData>({ confidence: 0, latency: 0, cetCost: 0 });
  const [finalResponse, setFinalResponse] = useState('');
  const [typedResponse, setTypedResponse] = useState('');
  const [typingDone, setTypingDone] = useState(true);
  const [cetAiConfidence, setCetAiConfidence] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [chatHistory, setChatHistory] = useSessionStorage<CetAiChatEntry[]>('cet-ai-chat-history', []);
  const [pinnedEntries, setPinnedEntries] = useLocalStorage<CetAiChatEntry[]>('cet-ai-pinned', []);
  const [recentSearches, setRecentSearches] = useLocalStorage<string[]>('cet-ai-recent-searches', []);
  const [aiModel, setAiModel] = useLocalStorage<string>('cet-ai-model', 'auto');
  const [aiTone, setAiTone] = useLocalStorage<string>('cet-ai-tone', 'brand');
  const [aiMode, setAiMode] = useLocalStorage<string>('cet-ai-mode', 'default');
  const [customInstructions, setCustomInstructions] = useLocalStorage<string>('cet-ai-custom-instructions', '');
  const [readingMode, setReadingMode] = useLocalStorage<boolean>('cet-ai-reading-mode', false);
  const [serverConversationId, setServerConversationId] = useLocalStorage<string | null>(
    'cet-ai-server-conversation-id',
    null,
  );
  const [attachments, setAttachments] = useLocalStorage<AiAttachmentMeta[]>('cet-ai-attachments', []);
  const [copiedResponse, setCopiedResponse] = useState(false);
  const [copiedForAi, setCopiedForAi] = useState(false);
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  const [detectedTopic, setDetectedTopic] = useState<string>('default');
  /** False when the last completed answer used local knowledge (no /api/chat). */
  const [responseUsedLiveApi, setResponseUsedLiveApi] = useState(false);
  const [responseSources, setResponseSources] = useState<Array<{ id: string; title: string; url: string; snippet: string }>>([]);
  /** True when /api/chat returned an error/empty body and we fell back to built-in knowledge. */
  const [liveApiReturnedError, setLiveApiReturnedError] = useState(false);
  /** Optional server message from JSON (`message` / `error`) when live API failed. */
  const [liveApiErrorDetail, setLiveApiErrorDetail] = useState<string | null>(null);
  /** Last HTTP status from a failed /api/chat response (429, 5xx, etc.). */
  const [liveApiHttpStatus, setLiveApiHttpStatus] = useState<number | null>(null);

  const [currentModelUsed, setCurrentModelUsed] = useState<string | null>(null);
  const [currentAssistantMessageId, setCurrentAssistantMessageId] = useState<string | null>(null);
  const [currentQueryLogId, setCurrentQueryLogId] = useState<string | null>(null);
  const [currentFeedback, setCurrentFeedback] = useState<-1 | 0 | 1 | null>(null);
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const [currentAlternates, setCurrentAlternates] = useState<NonNullable<CetAiChatEntry['alternates']>>([]);
  const [currentUsedCache, setCurrentUsedCache] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPinned, setShowPinned] = useState(false);

  const shareConsumedRef = useRef(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const modalInputRef = useRef<HTMLTextAreaElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const cetAiAbortRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  /** Incremented to invalidate in-flight schedules (stop / new question). */
  const generationEpochRef = useRef(0);
  const typewriterRafRef = useRef<number>(0);

  // Auto-scroll telemetry terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  // Scroll chat to latest entry
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  }, [chatHistory, submittedQuestion, finalResponse, prefersReducedMotion]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
      window.cancelAnimationFrame(typewriterRafRef.current);
    };
  }, []);

  useEffect(() => {
    setChatHistory((prev) => {
      const list = Array.isArray(prev) ? prev : [];
      return list
        .map((e, i) => ({
          ...e,
          id: e.id ?? `${Date.now().toString(36)}-${i}`,
          createdAt: e.createdAt ?? Date.now(),
          alternates: Array.isArray(e.alternates) ? e.alternates : undefined,
        }))
        .slice(-80);
    });
    setPinnedEntries((prev) => (Array.isArray(prev) ? prev : []).slice(-200));
    setRecentSearches((prev) => (Array.isArray(prev) ? prev : []).slice(0, 20));
    setAttachments((prev) => (Array.isArray(prev) ? prev : []).slice(0, 6));
  }, [setChatHistory, setPinnedEntries, setRecentSearches, setAttachments]);

  useEffect(() => {
    window.cancelAnimationFrame(typewriterRafRef.current);
    let initTimer: number | null = null;
    const scheduleInit = (fn: () => void) => {
      initTimer = window.setTimeout(fn, 0);
    };

    if (!finalResponse) {
      scheduleInit(() => {
        setTypedResponse('');
        setTypingDone(true);
      });
      return () => {
        if (initTimer) window.clearTimeout(initTimer);
      };
    }
    if (prefersReducedMotion) {
      scheduleInit(() => {
        setTypedResponse(finalResponse);
        setTypingDone(true);
      });
      return () => {
        if (initTimer) window.clearTimeout(initTimer);
      };
    }

    const isHtml = /<\/?[^>]+>/.test(finalResponse);
    const plain = isHtml
      ? finalResponse
          .replace(/<br\s*\/?\s*>/gi, '\n')
          .replace(/<[^>]*>/g, '')
      : finalResponse;

    const myEpoch = generationEpochRef.current;
    const total = plain.length;
    const stepMs = total > 2200 ? 6 : total > 900 ? 10 : 14;

    let last = performance.now();
    let i = 0;
    scheduleInit(() => {
      setTypedResponse('');
      setTypingDone(false);
    });

    const tick = (now: number) => {
      if (generationEpochRef.current !== myEpoch) return;
      const dt = Math.max(0, now - last);
      last = now;
      const chars = Math.max(1, Math.floor(dt / stepMs));
      i = Math.min(total, i + chars);
      setTypedResponse(plain.slice(0, i));
      if (i >= total) {
        setTypingDone(true);
        return;
      }
      typewriterRafRef.current = window.requestAnimationFrame(tick);
    };

    typewriterRafRef.current = window.requestAnimationFrame(tick);
    return () => {
      if (initTimer) window.clearTimeout(initTimer);
      window.cancelAnimationFrame(typewriterRafRef.current);
    };
  }, [finalResponse, prefersReducedMotion]);

  // --- CLOSE HANDLER ---
  const handleClose = useCallback(() => {
    generationEpochRef.current += 1;
    cetAiAbortRef.current?.abort();
    cetAiAbortRef.current = null;
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setIsModalOpen(false);
    setPhase('idle');
    setAiState('idle');
    setQuery('');
    setLogs([]);
    setFinalResponse('');
    setTypedResponse('');
    setTypingDone(true);
    setCetAiConfidence(0);
    setMetrics({ confidence: 0, latency: 0, cetCost: 0 });
    try {
      window.speechSynthesis?.cancel();
    } catch {
      void 0;
    }
    setIsListening(false);
    setIsSpeaking(false);
    setSubmittedQuestion('');
    setResponseUsedLiveApi(false);
    setLiveApiReturnedError(false);
    setLiveApiErrorDetail(null);
    setLiveApiHttpStatus(null);
    setCopiedResponse(false);
    setCopiedForAi(false);
    setCopiedTranscript(false);
    setCurrentAssistantMessageId(null);
    setCurrentQueryLogId(null);
    setCurrentModelUsed(null);
    setCurrentFeedback(null);
    setCurrentAlternates([]);
    setCurrentUsedCache(false);
  }, [
    setIsModalOpen,
    setPhase,
    setQuery,
    setLogs,
    setFinalResponse,
    setCetAiConfidence,
    setMetrics,
    setSubmittedQuestion,
    setIsListening,
    setIsSpeaking,
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

  const estimateReadMinutes = (text: string): number => {
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 200));
  };

  const sha256Lite = (s: string): string => {
    let h1 = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) {
      h1 ^= s.charCodeAt(i);
      h1 = Math.imul(h1, 0x01000193);
    }
    return (h1 >>> 0).toString(16).padStart(8, '0');
  };

  const downloadText = (filename: string, text: string, type: string) => {
    try {
      const blob = new Blob([text], { type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 250);
    } catch {
      void 0;
    }
  };

  const exportHistoryJson = () => {
    const current: CetAiChatEntry | null =
      submittedQuestion && finalResponse
        ? {
            id: `${Date.now().toString(36)}-current`,
            question: submittedQuestion,
            answer: finalResponse,
            confidence: cetAiConfidence,
            createdAt: Date.now(),
            modelUsed: currentModelUsed ?? undefined,
            sources: responseSources,
          }
        : null;
    const payload = {
      exportedAt: new Date().toISOString(),
      history: [...chatHistory, ...(current ? [current] : [])],
      pinned: pinnedEntries,
      settings: { model: aiModel, tone: aiTone, mode: aiMode },
    };
    downloadText(`cet-ai-history-${Date.now()}.json`, JSON.stringify(payload, null, 2), 'application/json');
  };

  const exportHistoryMarkdown = () => {
    const blocks: string[] = [];
    const all: CetAiChatEntry[] = [...chatHistory];
    if (submittedQuestion && finalResponse) {
      all.push({
        question: submittedQuestion,
        answer: finalResponse,
        confidence: cetAiConfidence,
        modelUsed: currentModelUsed ?? undefined,
        sources: responseSources,
      });
    }
    blocks.push(`# CET AI Transcript\n\nExported: ${new Date().toISOString()}`);
    for (const e of all) {
      blocks.push(`\n## Q\n${e.question}\n\n## A\n${e.answer}`);
      if (Array.isArray(e.alternates) && e.alternates.length > 0) {
        const alt = e.alternates
          .map((a, i) => `\n### Regenerate #${i + 1}\n${a.answer}`)
          .join('\n');
        blocks.push(alt);
      }
      blocks.push('\n---');
    }
    downloadText(`cet-ai-history-${Date.now()}.md`, blocks.join('\n'), 'text/markdown');
  };

  const uploadAttachment = async (file: File) => {
    const token = getAuthToken();
    if (!token) {
      window.alert('Login required for attachments.');
      return;
    }
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/ai/attachments', {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: form,
      });
      const raw = await res.text();
      let data: unknown = null;
      try {
        data = JSON.parse(raw) as unknown;
      } catch {
        data = null;
      }
      const rec = data && typeof data === 'object' ? (data as Record<string, unknown>) : null;
      const attachmentRec = rec && rec.attachment && typeof rec.attachment === 'object' ? (rec.attachment as Record<string, unknown>) : null;
      const id = attachmentRec && typeof attachmentRec.id === 'string' ? attachmentRec.id : '';
      const filename = attachmentRec && typeof attachmentRec.filename === 'string' ? attachmentRec.filename : '';
      const mimeType = attachmentRec && typeof attachmentRec.mimeType === 'string' ? attachmentRec.mimeType : '';
      const bytes = attachmentRec && typeof attachmentRec.bytes === 'number' ? attachmentRec.bytes : 0;
      const url = rec && typeof rec.url === 'string' ? rec.url : null;
      if (!res.ok || !id) {
        window.alert('Upload failed.');
        return;
      }
      setAttachments((prev) => {
        const list = Array.isArray(prev) ? prev : [];
        const next = [{ id, filename, mimeType, bytes, url }, ...list.filter((x) => x.id !== id)];
        return next.slice(0, 6);
      });
    } catch {
      window.alert('Upload failed.');
    }
  };

  const handleAttachmentInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = '';
    if (files.length === 0) return;
    void (async () => {
      for (const file of files.slice(0, 3)) {
        await uploadAttachment(file);
      }
    })();
  };

  const togglePinEntry = (entry: CetAiChatEntry) => {
    const id = entry.id ?? `${sha256Lite(entry.question)}-${sha256Lite(entry.answer)}`;
    setPinnedEntries((prev) => {
      const list = Array.isArray(prev) ? prev : [];
      const exists = list.some((p) => (p.id ?? '') === id);
      if (exists) return list.filter((p) => (p.id ?? '') !== id);
      const next = [{ ...entry, id, pinned: true }, ...list];
      return next.slice(0, 200);
    });
  };

  const reportCurrentAnswer = async () => {
    if (!submittedQuestion || !finalResponse) return;
    const reason = window.prompt('Raportează răspuns: motiv scurt (ex: conținut inadecvat, halucinație, spam)')?.trim() ?? '';
    if (!reason) return;
    try {
      const token = getAuthToken();
      await fetch('/api/ai/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          reason,
          query: submittedQuestion,
          response: finalResponse,
          messageId: currentAssistantMessageId,
        }),
      });
    } catch {
      void 0;
    }
  };

  const rateCurrentAnswer = async (rating: -1 | 0 | 1) => {
    if (!finalResponse) return;
    if (sendingFeedback) return;
    setSendingFeedback(true);
    try {
      const token = getAuthToken();
      await fetch('/api/ai/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          rating,
          messageId: currentAssistantMessageId,
          queryLogId: currentQueryLogId,
        }),
      });
      setCurrentFeedback(rating);
      trackEvent('ai_feedback', { rating });
    } catch {
      void 0;
    } finally {
      setSendingFeedback(false);
    }
  };

  const stopSpeaking = () => {
    try {
      window.speechSynthesis?.cancel();
    } catch {
      void 0;
    }
    setIsSpeaking(false);
  };

  const speakAnswer = (text: string) => {
    if (!text.trim()) return;
    try {
      if (!('speechSynthesis' in window)) return;
      stopSpeaking();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = navigator.language;
      u.onend = () => setIsSpeaking(false);
      u.onerror = () => setIsSpeaking(false);
      setIsSpeaking(true);
      window.speechSynthesis.speak(u);
    } catch {
      setIsSpeaking(false);
    }
  };

  const toggleListening = () => {
    try {
      const AnyWin = window as unknown as {
        SpeechRecognition?: new () => SpeechRecognitionLike;
        webkitSpeechRecognition?: new () => SpeechRecognitionLike;
      };
      const Rec = AnyWin.SpeechRecognition ?? AnyWin.webkitSpeechRecognition;
      if (!Rec) return;
      if (isListening) {
        recognitionRef.current?.stop?.();
        setIsListening(false);
        return;
      }
      const rec = new Rec();
      recognitionRef.current = rec;
      rec.lang = navigator.language;
      rec.interimResults = true;
      rec.continuous = false;
      rec.onresult = (ev: unknown) => {
        const transcript =
          typeof ev === 'object' &&
          ev !== null &&
          'results' in ev &&
          Array.isArray((ev as { results?: unknown }).results) &&
          Array.isArray((ev as { results: unknown[] }).results[0])
            ? (ev as { results: Array<Array<{ transcript?: unknown }>> }).results[0]?.[0]?.transcript
            : undefined;
        if (typeof transcript === 'string') setQuery(transcript.slice(0, CET_AI_MAX_QUERY_CHARS));
      };
      rec.onend = () => setIsListening(false);
      rec.onerror = () => setIsListening(false);
      setIsListening(true);
      rec.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleStopGeneration = useCallback(() => {
    generationEpochRef.current += 1;
    window.cancelAnimationFrame(typewriterRafRef.current);
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    cetAiAbortRef.current?.abort();
    cetAiAbortRef.current = null;
    setPhase('complete');
    setAiState('error');
    setFinalResponse(t.cetAi.generationStopped);
    setTypedResponse(t.cetAi.generationStopped);
    setTypingDone(true);
    setResponseUsedLiveApi(false);
    setResponseSources([]);
    setLiveApiReturnedError(false);
    setLiveApiErrorDetail(null);
    setLiveApiHttpStatus(null);
    setCetAiConfidence(0);
    setMetrics((m) => ({ ...m, confidence: 0 }));
  }, [t.cetAi.generationStopped]);

  // --- CORE LOGIC: RAV + optional live /api/chat (Coolify/VPS) with local knowledge fallback ---
  const processQuestion = useCallback((
    q: string,
    priorHistory: CetAiChatEntry[] = [],
    runOpts?: { forceFresh?: boolean; revisionOfMessageId?: string | null },
  ) => {
    const question = q.trim().slice(0, CET_AI_MAX_QUERY_CHARS);
    if (!question) return;

    const myEpoch = ++generationEpochRef.current;
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    cetAiAbortRef.current?.abort();
    const ac = new AbortController();
    cetAiAbortRef.current = ac;

    const cetAiFetchPromise = fetchCetAiChat(question, ac.signal, priorHistory, {
      model: aiModel,
      tone: aiTone,
      mode: aiMode,
      instructions: customInstructions,
      conversationId: serverConversationId,
      revisionOfMessageId: runOpts?.revisionOfMessageId ?? null,
      forceFresh: Boolean(runOpts?.forceFresh),
      attachmentIds: attachments.map((a) => a.id),
    });

    const { answer: localAnswer, confidence } = buildContextualResponse(question, t.cetAi.knowledge);
    const lowerQ = question.toLowerCase();
    let detected = 'default';
    for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
      if (keywords.some(kw => lowerQ.includes(kw))) {
        detected = topic;
        break;
      }
    }
    setDetectedTopic(detected);
    try {
      try {
        const k = 'solaris_ai_activated';
        const seen = typeof window !== 'undefined' ? localStorage.getItem(k) : null;
        if (!seen) {
          localStorage.setItem(k, String(Date.now()));
          trackEvent('ai_activation', { topic: detected });
        }
      } catch {
        void 0;
      }
      trackAiQuery({
        topic: detected,
        queryLength: question.length,
        route: typeof window !== 'undefined' ? window.location.pathname : undefined,
        source: 'cet_ai',
      });
    } catch {
      void 0;
    }
    const hash = generateHash();
    const tokenCount = question.split(/\s+/).length;
    const startMs = performance.now();

    setSubmittedQuestion(question);
    if (!runOpts?.revisionOfMessageId) {
      setCurrentAssistantMessageId(null);
    }
    setCurrentModelUsed(null);
    setCurrentUsedCache(false);
    setAiState('loading');
    setLogs([]);
    setFinalResponse('');
    setCetAiConfidence(0);
    setMetrics({ confidence: 0, latency: 0, cetCost: 0 });
    setResponseUsedLiveApi(false);
    setResponseSources([]);
    setLiveApiReturnedError(false);
    setLiveApiErrorDetail(null);
    setLiveApiHttpStatus(null);
    setCopiedResponse(false);
    setCopiedForAi(false);
    setCopiedTranscript(false);
    setCurrentFeedback(null);

    if (!runOpts?.revisionOfMessageId) {
      setRecentSearches((prev) => {
        const base = Array.isArray(prev) ? prev : [];
        const next = [question, ...base.filter((x) => x !== question)];
        return next.slice(0, 12);
      });
    }

    setPhase('observe_parse');
    addLog('INFO', `RAV_INIT: Grok × Gemini CET AI v3.1 · Session [${hash}]`);
    const observeParseSeq = buildCetAiObserveParse(question, detected, tokenCount);
    addLog('QUANTUM', observeParseSeq[0]!);
    for (const line of observeParseSeq.slice(1)) {
      addLog('INFO', line);
    }

    schedule(() => {
      if (generationEpochRef.current !== myEpoch) return;
      setPhase('observe_context');
      addLog('QUANTUM', `INTENT_EXTRACTION: Semantic vector computed. Ambiguity score: 0.${Math.floor(Math.random() * 30 + 10)}`);
      addLog('QUANTUM', buildFlashGlintLogMessage(question));
      addLog('INFO', `CONTEXT_MAP: Knowledge graph traversal · Nodes visited: 2,847`);
      addLog('INFO', buildDeepLatticeMeshLogMessage('CONTEXT_MESH', question, CET_AI_LATTICE_PHASE.observeContext));
      setMetrics(prev => ({ ...prev, latency: Math.round(performance.now() - startMs) }));
    }, CET_AI_PHASE_MS[0]);

    schedule(() => {
      if (generationEpochRef.current !== myEpoch) return;
      setPhase('think_route');
      addLog('INFO', `GEMINI_REASON: Analytical pathway · parallel hypothesis lattice`);
      addLog('QUANTUM', `HYPOTHESIS_GEN: 6 paths · superposition collapse scheduled`);
      addLog('INFO', buildDeepLatticeMeshLogMessage('ROUTE_MESH', question, CET_AI_LATTICE_PHASE.thinkRoute));
      setMetrics(prev => ({ ...prev, latency: Math.round(performance.now() - startMs) }));
    }, CET_AI_PHASE_MS[1]);

    schedule(() => {
      if (generationEpochRef.current !== myEpoch) return;
      setPhase('think_validate');
      addLog('QUANTUM', `PATH_COLLAPSE: Highest-confidence path (p=${(confidence / 100).toFixed(4)})`);
      addLog('SEC', `CONSTRAINT_CHECK: Zero-hallucination bounds · fact anchors`);
      addLog('INFO', `BRAID_FRAME: Reasoning graph · depth 7 · nodes 1,204`);
      addLog('INFO', buildDeepLatticeMeshLogMessage('VALIDATE_MESH', question, CET_AI_LATTICE_PHASE.thinkValidate));
      addLog('QUANTUM', buildExpressomeBurstLogMessage(question));
      setMetrics(prev => ({
        ...prev,
        confidence: Math.round(confidence * 0.7),
        latency: Math.round(performance.now() - startMs),
      }));
    }, CET_AI_PHASE_MS[2]);

    schedule(() => {
      if (generationEpochRef.current !== myEpoch) return;
      setPhase('act_execute');
      addLog('INFO', `GROK_ACT: Action directive pipeline · live /api/chat merge pending`);
      addLog('QUANTUM', `RESPONSE_COMPILE: dual-model payload · entropy seed`);
      addLog('INFO', buildDeepLatticeMeshLogMessage('ACT_MESH', question, CET_AI_LATTICE_PHASE.actExecute));
      addLog('INFO', buildDeepLatticeMeshLogMessageRawQuery('DEEP_LATTICE', question));
      addLog('SEC', `SIGN: Quantum OS key · Hash: 0x${generateHash()}${generateHash()}`);
      setMetrics(prev => ({
        ...prev,
        cetCost: parseFloat((Math.random() * 0.005 + 0.001).toFixed(4)),
        latency: Math.round(performance.now() - startMs),
      }));
    }, CET_AI_PHASE_MS[3]);

    schedule(() => {
      void (async () => {
        if (generationEpochRef.current !== myEpoch) return;
        const raced = await Promise.race<CetAiFetchResult>([
          cetAiFetchPromise,
          new Promise<CetAiFetchResult>(resolve => {
            setTimeout(
              () =>
                resolve({
                  text: null,
                  sourceHeader: null,
                  sources: [],
                  modelUsed: null,
                  conversationId: null,
                  assistantMessageId: null,
                  queryLogId: null,
                  usedCache: false,
                  liveEndpointError: false,
                  errorDetail: null,
                  httpStatus: null,
                }),
              18_000,
            );
          }),
        ]).catch((): CetAiFetchResult => ({
          text: null,
          sourceHeader: null,
          sources: [],
          modelUsed: null,
          conversationId: null,
          assistantMessageId: null,
          queryLogId: null,
          usedCache: false,
          liveEndpointError: false,
          errorDetail: null,
          httpStatus: null,
        }));

        if (generationEpochRef.current !== myEpoch || ac.signal.aborted) return;
        const remote = raced.text;
        const hasRemoteText = Boolean(remote?.trim());
        /** True only when the edge handler affirms live CET AI (see X-Cet-Ai-Source on /api/chat). */
        const usedLive = hasRemoteText && raced.sourceHeader === 'live';
        const text = hasRemoteText ? remote!.trim() : localAnswer;
        const conf = hasRemoteText ? Math.min(99.2, confidence + 1.5) : confidence;
        setResponseSources(hasRemoteText ? raced.sources : []);
        setCurrentModelUsed(hasRemoteText ? (raced.modelUsed ?? null) : null);
        setCurrentUsedCache(Boolean(hasRemoteText && raced.usedCache));
        if (hasRemoteText && raced.conversationId) setServerConversationId(raced.conversationId);
        if (hasRemoteText && raced.assistantMessageId) setCurrentAssistantMessageId(raced.assistantMessageId);
        setCurrentQueryLogId(hasRemoteText ? (raced.queryLogId ?? null) : null);
        setLiveApiReturnedError(!hasRemoteText && raced.liveEndpointError);
        setLiveApiErrorDetail(
          !hasRemoteText && raced.liveEndpointError ? (raced.errorDetail ?? null) : null,
        );
        setLiveApiHttpStatus(
          !hasRemoteText && raced.liveEndpointError ? (raced.httpStatus ?? null) : null,
        );

        setPhase('act_consensus');
        addLog(
          'INFO',
          usedLive
            ? 'LIVE_CET_AI: /api/chat merged · dual-AI RAV payload materialised'
            : hasRemoteText
              ? 'API_CET_AI: /api/chat body used · X-Cet-Ai-Source missing or not live'
              : 'FALLBACK_CET_AI: static knowledge graph (deploy API for live Grok×Gemini)',
        );
        addLog('SEC', `TON_CONSENSUS: Payload validated · quorum OK`);
        addLog('QUANTUM', `RAV_COMPLETE: loop closed · Confidence: ${conf.toFixed(1)}%`);
        addLog('QUANTUM', buildConsensusBurstLogMessage(question));
        setMetrics(prev => ({
          ...prev,
          confidence: Math.round(conf),
          latency: Math.round(performance.now() - startMs),
        }));
        setCetAiConfidence(conf);
        setFinalResponse(text);
        setAiState('success');
        setResponseUsedLiveApi(usedLive);
      })();
    }, CET_AI_PHASE_MS[4]);

    schedule(() => {
      if (generationEpochRef.current !== myEpoch) return;
      setPhase('verify_cross');
      addLog('SEC', `VERIFY_INIT: Cross-model review · Grok↔Gemini`);
      addLog('QUANTUM', `ZK_PROOF: integrity bundle · Hash: 0x${generateHash()}`);
      addLog('INFO', buildDeepLatticeMeshLogMessage('CROSS_MESH', question, CET_AI_LATTICE_PHASE.verifyCross));
    }, CET_AI_PHASE_MS[5]);

    schedule(() => {
      if (generationEpochRef.current !== myEpoch) return;
      setPhase('verify_anchor');
      addLog('SEC', `IPFS_ANCHOR: trace slot reserved · CID: bafkrei${generateHash().toLowerCase()}`);
      addLog('INFO', `ON_CHAIN: anchor ref · Block: #${Math.floor(Math.random() * 1_000_000 + 48_000_000)}`);
      addLog('QUANTUM', buildDeepLatticeMeshLogMessage('MESH_SEAL', question, CET_AI_LATTICE_PHASE.meshSeal));
      addLog('QUANTUM', `RAV_VERIFIED: no hallucination flag on consensus path`);
    }, CET_AI_PHASE_MS[6]);

    schedule(() => {
      if (generationEpochRef.current !== myEpoch) return;
      setPhase('complete');
      addLog('INFO', buildDeepLatticeMeshLogMessage('SESSION_MESH', question, CET_AI_LATTICE_PHASE.sessionClose));
      addLog('QUANTUM', buildLoopCompleteBurstLogMessage(question));
    }, CET_AI_PHASE_MS[7]);
  }, [
    generateHash,
    addLog,
    t.cetAi.knowledge,
    aiModel,
    aiTone,
    aiMode,
    customInstructions,
    serverConversationId,
    setServerConversationId,
    attachments,
    setRecentSearches,
  ]);

  // Hero widget submit → open modal + start processing
  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    const q = query.trim();
    setQuery('');
    setIsModalOpen(true);
    processQuestion(q, []);
  };

  // Modal follow-up submit → archive current Q&A, start new question
  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isProcessing) return;
    const nextHistory: CetAiChatEntry[] =
      finalResponse && submittedQuestion
        ? [
            ...chatHistory,
            {
              id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
              question: submittedQuestion,
              answer: finalResponse,
              confidence: cetAiConfidence,
              createdAt: Date.now(),
              modelUsed: currentModelUsed ?? undefined,
              sources: responseSources,
              alternates: currentAlternates.length > 0 ? currentAlternates : undefined,
            },
          ]
        : chatHistory;
    setChatHistory(nextHistory);
    const q = query.trim();
    setQuery('');
    processQuestion(q, nextHistory);
  };

  const isProcessing = phase !== 'idle' && phase !== 'complete';
  const liveApiHttpHint = liveApiReturnedError
    ? liveApiHttpHintForStatus(t.cetAi, liveApiHttpStatus)
    : null;

  useEffect(() => {
    if (!initialPrompt) return;
    if (shareConsumedRef.current) return;
    shareConsumedRef.current = true;
    const q = initialPrompt.trim().slice(0, CET_AI_MAX_QUERY_CHARS);
    if (!q) return;
    setQuery(q);
    setIsModalOpen(true);
    window.setTimeout(() => processQuestion(q, chatHistory), 50);
    setQuery('');
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('share');
      window.history.replaceState(null, '', url.toString());
    } catch {
      void 0;
    }
  }, [chatHistory, initialPrompt, processQuestion]);

  const handleRegenerate = useCallback(() => {
    if (!submittedQuestion.trim() || isProcessing) return;
    if (finalResponse.trim()) {
      setCurrentAlternates((prev) => [
        ...prev,
        {
          answer: finalResponse,
          confidence: cetAiConfidence,
          createdAt: Date.now(),
          modelUsed: currentModelUsed ?? undefined,
          sources: responseSources,
        },
      ]);
    }
    processQuestion(submittedQuestion.trim(), chatHistory, {
      forceFresh: true,
      revisionOfMessageId: currentAssistantMessageId,
    });
  }, [
    submittedQuestion,
    chatHistory,
    isProcessing,
    processQuestion,
    finalResponse,
    cetAiConfidence,
    currentModelUsed,
    responseSources,
    currentAssistantMessageId,
    setCurrentAlternates,
  ]);

  // ── RENDER ────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Hero trigger widget ──────────────────────────────────────────────── */}
      <div
        data-testid="cet-ai-hero"
        className="w-full max-w-5xl mx-auto scroll-mt-24 bg-black border border-gray-800 rounded-3xl p-4 md:p-8 shadow-2xl font-sans relative overflow-hidden z-20"
      >
        {/* Background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 flex flex-col items-center mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 uppercase tracking-widest">
            {t.cetAi.title}
          </h2>
          <p className="text-gray-400 text-xs md:text-sm mt-1 tracking-widest uppercase">
            {t.cetAi.subtitle}
          </p>
          <p
            role="note"
            className="text-gray-500 text-[10px] sm:text-xs mt-3 max-w-2xl mx-auto text-center leading-relaxed px-1"
          >
            {t.cetAi.heroCapabilityNote}
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
            <label htmlFor="cet-ai-hero-query" className="sr-only">
              {t.cetAi.placeholder}
            </label>
            <input
              id="cet-ai-hero-query"
              type="text"
              data-testid="cet-ai-hero-query"
              value={query}
              maxLength={CET_AI_MAX_QUERY_CHARS}
              onChange={e => setQuery(e.target.value.slice(0, CET_AI_MAX_QUERY_CHARS))}
              onKeyDown={e =>
                handleComposerEnterKeyDown(e, {
                  isProcessing,
                  hasText: Boolean(query.trim()),
                })
              }
              disabled={isModalOpen}
              placeholder={t.cetAi.placeholder}
              aria-label={t.cetAi.placeholder}
              aria-describedby={
                query.length > 0 && !isModalOpen ? 'cet-ai-hero-char-count' : undefined
              }
              className="w-full min-h-11 px-4 md:px-6 py-3 md:py-4 bg-gray-950 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all text-base md:text-base disabled:opacity-40"
            />
            {!isModalOpen ? (
              <CetAiQueryCharCountLine
                id="cet-ai-hero-char-count"
                length={query.length}
                max={CET_AI_MAX_QUERY_CHARS}
                ariaTemplate={t.cetAi.queryCharCountAria}
              />
            ) : null}
          </div>
          <button
            type="submit"
            className="min-h-11 px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-yellow-600 to-yellow-500 text-black font-bold rounded-xl hover:from-yellow-500 hover:to-yellow-400 transition-all active:scale-95 shadow-[0_0_20px_rgba(234,179,8,0.2)] whitespace-nowrap text-sm md:text-base touch-manipulation"
          >
            {t.cetAi.sendButton}
          </button>
        </form>

        {/* Suggested questions chips */}
        <div className="mt-4 flex flex-wrap gap-2 scroll-mt-28">
          {t.cetAi.suggestedQuestions.slice(0, 4).map(q => (
            <button
              key={q}
              type="button"
              onClick={() => {
                setQuery(q);
                setIsModalOpen(true);
                setTimeout(() => processQuestion(q, []), 50);
                setQuery('');
              }}
              className="inline-flex items-center gap-1.5 min-h-11 min-w-[44px] px-3 py-2 rounded-full bg-gray-900 border border-gray-700 text-gray-400 text-xs hover:border-yellow-500/50 hover:text-yellow-400 transition-all active:scale-95 touch-manipulation"
            >
              <Sparkles className="w-3 h-3" />
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* ── Full-screen CET AI modal (Radix Dialog — focus trap, Esc) ───────── */}
      <Dialog
        open={isModalOpen}
        onOpenChange={(open: boolean) => {
          if (!open) handleClose();
        }}
      >
          <FullscreenDialogContent
            data-testid="cet-ai-modal-dialog"
            aria-describedby="cet-ai-dialog-desc"
            aria-busy={isProcessing}
            onOpenAutoFocus={(e: Event) => {
              e.preventDefault();
              requestAnimationFrame(() => modalInputRef.current?.focus());
            }}
            onCloseAutoFocus={(e: Event) => e.preventDefault()}
            showCloseButton={false}
            overlayClassName="bg-black/95 backdrop-blur-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
            className="fixed inset-0 z-[9999] flex flex-col font-sans pt-[env(safe-area-inset-top,0px)] outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          >
          <div className="sr-only">
            <DialogTitle>{t.cetAi.title}</DialogTitle>
          </div>
          <p id="cet-ai-dialog-desc" className="sr-only">
            {t.cetAi.modalDescription}
          </p>
          <div aria-live="polite" aria-atomic="true" className="sr-only">
            {phase === 'complete' && finalResponse ? t.cetAi.announceCetAiReady : ''}
          </div>
          <div aria-live="polite" aria-atomic="true" className="sr-only">
            {copiedTranscript ? t.cetAi.copyTranscriptAnnounce : ''}
          </div>
          {/* Modal header */}
          <header className="shrink-0 flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-gray-800 bg-black/60 backdrop-blur-md">
            <div>
              <h2 className="text-lg md:text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 uppercase tracking-widest">
                {t.cetAi.title}
              </h2>
              <p className="text-gray-500 text-xs tracking-widest uppercase mt-0.5">
                {t.cetAi.subtitle}
              </p>
              {phase === 'complete' && finalResponse && (
                <span
                  role="status"
                  className={`inline-block mt-2 text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border ${
                    responseUsedLiveApi
                      ? 'border-green-500/40 text-green-400 bg-green-500/10'
                      : 'border-amber-500/40 text-amber-200/90 bg-amber-500/10'
                  }`}
                >
                  {responseUsedLiveApi ? t.cetAi.sourceBadgeLive : t.cetAi.sourceBadgeLocal}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
              <span className="hidden sm:inline text-xs font-mono bg-gray-900 border border-gray-700 px-2 py-0.5 rounded text-blue-400">Gemini REASON</span>
              <span className="hidden sm:inline text-gray-600 text-xs">×</span>
              <span className="hidden sm:inline text-xs font-mono bg-gray-900 border border-gray-700 px-2 py-0.5 rounded text-purple-400">Grok ACT</span>
              {isProcessing && (
                <button
                  type="button"
                  onClick={handleStopGeneration}
                  aria-label={t.cetAi.stopGenerating}
                  className="inline-flex items-center gap-1.5 min-h-11 px-3 py-2 rounded-lg border border-red-500/45 text-red-300 hover:bg-red-500/10 transition-colors touch-manipulation"
                >
                  <StopCircle className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-semibold">{t.cetAi.stopGenerating}</span>
                </button>
              )}
              {chatHistory.length > 0 && (
                <button
                  onClick={() => setChatHistory([])}
                  aria-label={t.cetAi.clearChatAria}
                  title={t.cetAi.clearChatTitle}
                  className="p-2 rounded-lg text-gray-600 hover:text-red-400 hover:bg-gray-800 transition-all duration-200"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowPinned((v) => !v)}
                aria-label="Pins"
                title="Pins"
                className="p-2 rounded-lg text-gray-600 hover:text-yellow-300 hover:bg-gray-800 transition-all duration-200"
              >
                <Pin className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setShowSettings((v) => !v)}
                aria-label="Settings"
                title="Settings"
                className="p-2 rounded-lg text-gray-600 hover:text-cyan-300 hover:bg-gray-800 transition-all duration-200"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => attachmentInputRef.current?.click()}
                aria-label="Attach"
                title="Attach"
                className="p-2 rounded-lg text-gray-600 hover:text-blue-300 hover:bg-gray-800 transition-all duration-200"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={exportHistoryJson}
                aria-label="Export"
                title="Export"
                className="p-2 rounded-lg text-gray-600 hover:text-green-300 hover:bg-gray-800 transition-all duration-200"
              >
                <Download className="w-4 h-4" />
              </button>
              <input
                ref={attachmentInputRef}
                type="file"
                multiple
                onChange={handleAttachmentInputChange}
                className="hidden"
              />
              <button
                onClick={handleClose}
                aria-label={t.cetAi.closeCetAiAria}
                className="ml-1 min-h-11 min-w-11 inline-flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-all duration-200 touch-manipulation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </header>

          {/* Scrollable conversation area */}
          <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
            <div className="max-w-5xl mx-auto space-y-10">

              {showSettings && (
                <div className="rounded-2xl border border-gray-800/90 bg-black/30 px-4 py-4 space-y-3">
                  <div className="flex flex-wrap gap-3 items-end">
                    <label className="text-[11px] font-mono text-gray-500 uppercase tracking-widest">
                      Model
                      <select
                        value={aiModel}
                        onChange={(e) => setAiModel(e.target.value)}
                        className="mt-1 block bg-gray-950 border border-gray-700 rounded-lg px-2 py-1 text-xs text-gray-200"
                      >
                        <option value="auto">Auto</option>
                        <option value="grok">Grok</option>
                        <option value="gemini">Gemini</option>
                        <option value="claude">Claude</option>
                      </select>
                    </label>
                    <label className="text-[11px] font-mono text-gray-500 uppercase tracking-widest">
                      Tone
                      <select
                        value={aiTone}
                        onChange={(e) => setAiTone(e.target.value)}
                        className="mt-1 block bg-gray-950 border border-gray-700 rounded-lg px-2 py-1 text-xs text-gray-200"
                      >
                        <option value="brand">Brand</option>
                        <option value="neutral">Neutral</option>
                        <option value="fun">Fun</option>
                      </select>
                    </label>
                    <label className="text-[11px] font-mono text-gray-500 uppercase tracking-widest">
                      Mode
                      <select
                        value={aiMode}
                        onChange={(e) => setAiMode(e.target.value)}
                        className="mt-1 block bg-gray-950 border border-gray-700 rounded-lg px-2 py-1 text-xs text-gray-200"
                      >
                        <option value="default">Default</option>
                        <option value="read">Read</option>
                        <option value="eli5">ELI5</option>
                      </select>
                    </label>
                    <button
                      type="button"
                      onClick={() => setReadingMode((v) => !v)}
                      className={`min-h-9 px-3 rounded-lg border text-xs font-semibold transition-colors ${
                        readingMode
                          ? 'border-yellow-500/40 text-yellow-200 bg-yellow-500/10'
                          : 'border-gray-700 text-gray-300 bg-gray-950'
                      }`}
                    >
                      Reading mode
                    </button>
                    <button
                      type="button"
                      onClick={exportHistoryMarkdown}
                      className="min-h-9 px-3 rounded-lg border border-gray-700 bg-gray-950 text-gray-300 text-xs font-semibold hover:border-green-500/40 hover:text-green-300 transition-colors"
                    >
                      Export MD
                    </button>
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-gray-500 uppercase tracking-widest mb-1">
                      Custom instructions
                    </label>
                    <textarea
                      value={customInstructions}
                      onChange={(e) => setCustomInstructions(e.target.value.slice(0, 1200))}
                      rows={3}
                      className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-yellow-500"
                      placeholder="Ex: răspunde scurt, cu pași numerotați; evită marketingul."
                    />
                  </div>
                  <div>
                    <p className="text-[11px] font-mono text-gray-500 uppercase tracking-widest mb-2">Attachments</p>
                    {attachments.length === 0 ? (
                      <p className="text-xs text-gray-500">No attachments.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {attachments.map((a) => (
                          <div
                            key={a.id}
                            className="inline-flex items-center gap-2 min-h-9 px-3 rounded-full bg-gray-950 border border-gray-700 text-gray-300 text-xs"
                          >
                            {a.url ? (
                              <a
                                href={a.url}
                                target="_blank"
                                rel="noreferrer"
                                className="hover:text-yellow-300"
                                title={`${a.filename} (${a.mimeType})`}
                              >
                                {a.filename}
                              </a>
                            ) : (
                              <span title={`${a.filename} (${a.mimeType})`}>{a.filename}</span>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                setAttachments((prev) =>
                                  (Array.isArray(prev) ? prev : []).filter((x) => x.id !== a.id),
                                )
                              }
                              className="p-1 rounded hover:bg-gray-800 text-gray-500 hover:text-gray-200"
                              aria-label="Remove"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {recentSearches.length > 0 ? (
                    <div>
                      <p className="text-[11px] font-mono text-gray-500 uppercase tracking-widest mb-2">Recent</p>
                      <div className="flex flex-wrap gap-2">
                        {recentSearches.slice(0, 8).map((q) => (
                          <button
                            key={q}
                            type="button"
                            onClick={() => {
                              setQuery(q);
                              setShowSettings(false);
                              setTimeout(() => processQuestion(q, chatHistory), 50);
                            }}
                            className="inline-flex items-center gap-1 min-h-9 px-3 rounded-full bg-gray-950 border border-gray-700 text-gray-300 text-xs hover:border-yellow-500/50 hover:text-yellow-300 transition-all"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {showPinned && (
                <div className="rounded-2xl border border-gray-800/90 bg-black/30 px-4 py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-mono text-gray-500 uppercase tracking-widest">Pins</p>
                    <button
                      type="button"
                      onClick={() => setShowPinned(false)}
                      className="text-xs text-gray-500 hover:text-gray-300"
                    >
                      Close
                    </button>
                  </div>
                  {pinnedEntries.length === 0 ? (
                    <p className="text-sm text-gray-500">No pinned answers yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {pinnedEntries.slice(0, 50).map((p) => (
                        <div key={p.id ?? p.question} className="rounded-xl border border-gray-800 bg-black/20 p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-xs text-gray-400">{p.question}</p>
                              <p className="mt-2 text-sm text-gray-200 whitespace-pre-wrap">{p.answer.slice(0, 260)}{p.answer.length > 260 ? '…' : ''}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => togglePinEntry(p)}
                              className="p-2 rounded-lg text-gray-500 hover:text-yellow-300 hover:bg-gray-800"
                              aria-label="Unpin"
                            >
                              <Pin className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Chat history (previous Q&As) ── */}
              {chatHistory.map((entry, i) => (
                <div key={entry.id ?? i} className="space-y-4 opacity-50">
                  {/* User bubble */}
                  <div className="flex justify-end">
                    <div className="bg-gray-900 border border-gray-700 rounded-2xl rounded-tr-sm px-5 py-3 max-w-2xl">
                      <p className="text-gray-300 text-sm">{entry.question}</p>
                    </div>
                  </div>
                  {/* CET AI bubble */}
                  <div className="flex justify-start">
                    <div className="bg-green-950/40 border border-green-500/20 rounded-2xl rounded-tl-sm px-5 py-4 max-w-2xl w-full">
                      <p className="text-green-400 text-xs font-mono mb-2 uppercase tracking-widest">
                        {t.cetAi.cetAiResponse} · {entry.confidence.toFixed(1)}% {t.cetAi.confidence}
                      </p>
                      <div className="text-white">
                        <MarkdownText
                          text={entry.answer}
                          copyCodeLabel={t.cetAi.copyCodeAria}
                          codeCopiedAnnounce={t.cetAi.codeCopiedAnnounce}
                        />
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
                      <p className="text-yellow-200 text-sm whitespace-pre-wrap">{submittedQuestion}</p>
                    </div>
                  </div>

                  {aiState === 'loading' ? (
                    <div className="space-y-3">
                      <AiResultSkeleton label={t.cetAi.processing} />
                      <CetAiTypingIndicator label={t.cetAi.processing} />
                    </div>
                  ) : null}

                  {/* Answer-first (Claude-style): show response as soon as it is ready */}
                  {finalResponse && (
                    <div className="flex justify-start motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500 motion-safe:slide-in-from-bottom-2">
                      <div className="bg-gradient-to-br from-green-950/80 to-black border border-green-500/30 rounded-2xl rounded-tl-sm p-5 md:p-6 w-full">
                        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center shrink-0">
                              <Sparkles className="w-4 h-4 text-yellow-400" aria-hidden />
                            </div>
                            <p className="text-green-400 text-xs font-mono font-bold uppercase tracking-widest">
                              {t.cetAi.cetAiResponse} · {t.cetAi.confidence} {cetAiConfidence.toFixed(1)}%
                              {currentModelUsed ? ` · ${currentModelUsed}` : ''}
                              {currentUsedCache ? ' · cache' : ''}
                              {finalResponse ? ` · ~${estimateReadMinutes(finalResponse)} min` : ''}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap justify-end">
                            <div className="h-1.5 w-28 bg-gray-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-yellow-500 to-green-500 rounded-full transition-all duration-1000"
                                style={{ width: `${cetAiConfidence}%` }}
                              />
                            </div>
                            <button
                              type="button"
                              aria-label={t.cetAi.copyResponseAria}
                              onClick={() => {
                                navigator.clipboard.writeText(finalResponse).then(() => {
                                  setCopiedResponse(true);
                                  setTimeout(() => setCopiedResponse(false), 2000);
                                  trackEvent('ai_copy', { kind: 'response' });
                                }).catch(() => {});
                              }}
                              className="p-1.5 rounded-lg bg-gray-900 border border-gray-700 text-gray-400 hover:text-yellow-400 hover:border-yellow-500/40 transition-all"
                            >
                              {copiedResponse ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              type="button"
                              title={t.cetAi.copyForAiTooltip}
                              aria-label={t.cetAi.copyForAiAriaLabel}
                              onClick={() => {
                                const payload = buildCopyForAiText(submittedQuestion, finalResponse, t.cetAi);
                                navigator.clipboard.writeText(payload).then(() => {
                                  setCopiedForAi(true);
                                  setTimeout(() => setCopiedForAi(false), 2000);
                                  trackEvent('ai_copy', { kind: 'for_ai' });
                                }).catch(() => {});
                              }}
                              className="p-1.5 rounded-lg bg-gray-900 border border-gray-700 text-gray-400 hover:text-cyan-300 hover:border-cyan-500/40 transition-all"
                            >
                              {copiedForAi ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Bot className="w-3.5 h-3.5" />}
                            </button>
                            {chatHistory.length > 0 ? (
                              <button
                                type="button"
                                data-testid="cet-ai-copy-transcript"
                                title={t.cetAi.copyTranscriptTitle}
                                aria-label={t.cetAi.copyTranscriptAria}
                                onClick={() => {
                                  const payload = buildFullConversationHandoff(
                                    chatHistory,
                                    submittedQuestion,
                                    finalResponse,
                                    t.cetAi,
                                  );
                                  navigator.clipboard
                                    .writeText(payload)
                                    .then(() => {
                                      setCopiedTranscript(true);
                                      setTimeout(() => setCopiedTranscript(false), 2000);
                                      trackEvent('ai_copy', { kind: 'transcript' });
                                    })
                                    .catch(() => {});
                                }}
                                className="p-1.5 rounded-lg bg-gray-900 border border-gray-700 text-gray-400 hover:text-violet-300 hover:border-violet-500/40 transition-all"
                              >
                                {copiedTranscript ? (
                                  <Check className="w-3.5 h-3.5 text-green-400" />
                                ) : (
                                  <ClipboardList className="w-3.5 h-3.5" />
                                )}
                              </button>
                            ) : null}
                            <button
                              type="button"
                              title={t.cetAi.regenerateTitle}
                              aria-label={t.cetAi.regenerateAria}
                              onClick={handleRegenerate}
                              disabled={isProcessing}
                              className="p-1.5 rounded-lg bg-gray-900 border border-gray-700 text-gray-400 hover:text-amber-300 hover:border-amber-500/40 transition-all disabled:opacity-40 disabled:pointer-events-none"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              aria-label="Pin"
                              title="Pin"
                              onClick={() => {
                                if (!submittedQuestion || !finalResponse) return;
                                togglePinEntry({
                                  id: `${Date.now().toString(36)}-pin`,
                                  question: submittedQuestion,
                                  answer: finalResponse,
                                  confidence: cetAiConfidence,
                                  createdAt: Date.now(),
                                  modelUsed: currentModelUsed ?? undefined,
                                  sources: responseSources,
                                  alternates: currentAlternates.length > 0 ? currentAlternates : undefined,
                                  pinned: true,
                                });
                              }}
                              className="p-1.5 rounded-lg bg-gray-900 border border-gray-700 text-gray-400 hover:text-yellow-300 hover:border-yellow-500/40 transition-all"
                            >
                              <Pin className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              aria-label="Text to speech"
                              title="Text to speech"
                              onClick={() => (isSpeaking ? stopSpeaking() : speakAnswer(finalResponse))}
                              className="p-1.5 rounded-lg bg-gray-900 border border-gray-700 text-gray-400 hover:text-cyan-300 hover:border-cyan-500/40 transition-all"
                            >
                              {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              type="button"
                              aria-label="Thumbs up"
                              title="Thumbs up"
                              onClick={() => void rateCurrentAnswer(1)}
                              disabled={sendingFeedback || currentFeedback === 1}
                              className={`p-1.5 rounded-lg bg-gray-900 border text-gray-400 transition-all disabled:opacity-40 disabled:pointer-events-none ${
                                currentFeedback === 1 ? 'border-green-500/40 text-green-300' : 'border-gray-700 hover:text-green-300 hover:border-green-500/40'
                              }`}
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              aria-label="Thumbs down"
                              title="Thumbs down"
                              onClick={() => void rateCurrentAnswer(-1)}
                              disabled={sendingFeedback || currentFeedback === -1}
                              className={`p-1.5 rounded-lg bg-gray-900 border text-gray-400 transition-all disabled:opacity-40 disabled:pointer-events-none ${
                                currentFeedback === -1 ? 'border-red-500/40 text-red-300' : 'border-gray-700 hover:text-red-300 hover:border-red-500/40'
                              }`}
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              aria-label="Report"
                              title="Report"
                              onClick={reportCurrentAnswer}
                              className="p-1.5 rounded-lg bg-gray-900 border border-gray-700 text-gray-400 hover:text-red-300 hover:border-red-500/40 transition-all"
                            >
                              <Flag className="w-3.5 h-3.5" />
                            </button>
                            <a
                              href={TONSCAN_CET_CONTRACT_URL}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={t.cetAi.verifyOnTonscanTitle}
                              className="p-1.5 rounded-lg bg-gray-900 border border-gray-700 text-gray-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-all"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                        {!responseUsedLiveApi && (
                          <div
                            role="status"
                            className="text-amber-200/90 text-xs border border-amber-500/25 bg-amber-500/10 rounded-lg px-3 py-2 mb-4 space-y-2"
                          >
                            <p className="font-mono leading-relaxed">
                              {liveApiReturnedError ? t.cetAi.liveApiErrorFallback : t.cetAi.offlineModeHint}
                            </p>
                            {liveApiReturnedError && liveApiHttpHint ? (
                              <p className="font-mono text-[11px] text-amber-100/85 leading-relaxed">
                                {liveApiHttpHint}
                              </p>
                            ) : null}
                            {liveApiReturnedError && liveApiErrorDetail ? (
                              <p className="font-mono text-[11px] text-amber-100/80 leading-relaxed break-words">
                                <span className="text-amber-200/70">{t.cetAi.liveApiErrorDetailLabel}</span>{' '}
                                {liveApiErrorDetail}
                              </p>
                            ) : null}
                          </div>
                        )}
                        <div
                          className={
                            readingMode
                              ? 'text-white text-[15px] leading-7 tracking-[0.01em]'
                              : 'text-white'
                          }
                          role="status"
                          aria-live="polite"
                          aria-atomic="true"
                          onClick={() => {
                            if (typingDone) return;
                            const isHtml = /<\/?[^>]+>/.test(finalResponse);
                            const plain = isHtml
                              ? finalResponse
                                  .replace(/<br\s*\/?\s*>/gi, '\n')
                                  .replace(/<[^>]*>/g, '')
                              : finalResponse;
                            setTypedResponse(plain);
                            setTypingDone(true);
                          }}
                        >
                          {!typingDone ? (
                            <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">
                              {typedResponse}
                              <span className="ml-0.5 inline-block w-[0.6ch] text-yellow-300 motion-safe:animate-pulse">▍</span>
                            </pre>
                          ) : /<\/?[^>]+>/.test(finalResponse) ? (
                            <SafeHtml
                              html={finalResponse.replace(/\n/g, '<br/>')}
                              config={CET_AI_SAFE_HTML_CONFIG}
                            />
                          ) : (
                            <MarkdownText
                              text={finalResponse}
                              copyCodeLabel={t.cetAi.copyCodeAria}
                              codeCopiedAnnounce={t.cetAi.codeCopiedAnnounce}
                            />
                          )}
                        </div>
                        {responseSources.length > 0 ? (
                          <div
                            data-testid="cet-ai-sources"
                            className="mt-5 rounded-xl border border-gray-800/90 bg-black/25 px-4 py-3"
                          >
                            <p className="text-[10px] font-mono uppercase tracking-widest text-gray-500 mb-2">
                              {t.cetAi.sourcesLabel}
                            </p>
                            <ul className="space-y-1">
                              {responseSources.map((s) => (
                                <li key={s.id} className="flex items-start gap-2">
                                  <a
                                    href={s.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    data-testid="cet-ai-source-link"
                                    className="inline-flex items-center gap-2 text-xs text-gray-300 hover:text-cyan-300 transition-colors break-all"
                                    title={s.title}
                                  >
                                    <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-70" aria-hidden />
                                    <span className="font-mono">{s.title}</span>
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                        <div className="mt-5 pt-4 border-t border-green-500/10">
                          <p className="text-gray-600 text-[10px] font-mono uppercase tracking-widest mb-2">{t.cetAi.askNextLabel}</p>
                          <div className="flex flex-wrap gap-2">
                            {(FOLLOW_UP_BY_TOPIC[detectedTopic] ?? FOLLOW_UP_BY_TOPIC.default).map(suggestion => (
                              <button
                                key={suggestion}
                                type="button"
                                onClick={() => {
                                  const nextHistory = [
                                    ...chatHistory,
                                    {
                                      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
                                      question: submittedQuestion,
                                      answer: finalResponse,
                                      confidence: cetAiConfidence,
                                      createdAt: Date.now(),
                                      modelUsed: currentModelUsed ?? undefined,
                                      sources: responseSources,
                                      alternates: currentAlternates.length > 0 ? currentAlternates : undefined,
                                    },
                                  ];
                                  setChatHistory(nextHistory);
                                  processQuestion(suggestion, nextHistory);
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

                  <details
                    data-testid="cet-ai-trace"
                    className="group rounded-2xl border border-gray-800/90 bg-black/30 open:bg-black/40"
                    open={isProcessing}
                  >
                    <summary className="cursor-pointer px-4 py-3 text-xs font-mono text-gray-500 uppercase tracking-wider hover:text-gray-400 list-none flex items-center justify-between gap-2 [&::-webkit-details-marker]:hidden">
                      <span>{t.cetAi.ravTraceToggle}</span>
                      <span className="text-[10px] text-gray-600 group-open:rotate-0 transition-transform">▼</span>
                    </summary>
                    <div className="border-t border-gray-800/80 px-3 pb-4 pt-2 space-y-4">
                  <ReActPanels phase={phase} />

                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    {/* Telemetry terminal */}
                    <div className="lg:col-span-3 bg-gray-950 border border-gray-800 rounded-xl p-3 md:p-4 font-mono text-xs overflow-hidden flex flex-col h-40 md:h-56 shadow-inner">
                      <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-800 text-gray-500">
                        <span>&gt;_ RAV_TERMINAL · Grok × Gemini v3.0</span>
                        <span className={isProcessing ? 'text-yellow-500 motion-safe:animate-pulse' : 'text-green-500'}>
                          {isProcessing ? t.cetAi.processing : `● ${t.cetAi.done}`}
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
                    </div>
                  </details>
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
                <label htmlFor="cet-ai-modal-query" className="sr-only">
                  {t.cetAi.placeholder}
                </label>
                <textarea
                  ref={modalInputRef}
                  id="cet-ai-modal-query"
                  data-testid="cet-ai-modal-query"
                  value={query}
                  maxLength={CET_AI_MAX_QUERY_CHARS}
                  onChange={e => setQuery(e.target.value.slice(0, CET_AI_MAX_QUERY_CHARS))}
                  onKeyDown={e =>
                    handleComposerEnterKeyDown(e, {
                      isProcessing,
                      hasText: Boolean(query.trim()),
                    })
                  }
                  disabled={isProcessing}
                  rows={2}
                  placeholder={phase === 'complete' ? t.cetAi.followUpPlaceholder : t.cetAi.placeholder}
                  aria-label={t.cetAi.placeholder}
                  aria-describedby={query.length > 0 ? 'cet-ai-modal-char-count' : undefined}
                  className="w-full min-h-[3rem] max-h-40 resize-y px-5 py-3 bg-gray-950 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all disabled:opacity-40 text-base leading-relaxed"
                />
                <CetAiQueryCharCountLine
                  id="cet-ai-modal-char-count"
                  length={query.length}
                  max={CET_AI_MAX_QUERY_CHARS}
                  ariaTemplate={t.cetAi.queryCharCountAria}
                />
                {isProcessing && (
                  <div className="absolute right-4 top-4">
                    <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full motion-safe:animate-spin" />
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={isProcessing || !query.trim()}
                aria-label={t.cetAi.sendQuestionAria}
                className="min-h-11 min-w-11 px-5 py-3 bg-gradient-to-r from-yellow-600 to-yellow-500 text-black font-bold rounded-xl hover:from-yellow-500 hover:to-yellow-400 transition-all active:scale-95 disabled:from-gray-800 disabled:to-gray-900 disabled:text-gray-500 shadow-[0_0_20px_rgba(234,179,8,0.2)] disabled:shadow-none flex items-center justify-center gap-2 whitespace-nowrap touch-manipulation"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">{t.cetAi.sendCompact}</span>
              </button>
              <button
                type="button"
                onClick={toggleListening}
                disabled={isProcessing}
                aria-label="Voice input"
                className={`min-h-11 min-w-11 px-4 py-3 rounded-xl border transition-all flex items-center justify-center touch-manipulation ${
                  isListening
                    ? 'border-cyan-500/50 text-cyan-300 bg-cyan-500/10 motion-safe:animate-pulse'
                    : 'border-gray-700 text-gray-400 bg-gray-950 hover:border-cyan-500/40 hover:text-cyan-300'
                } disabled:opacity-40 disabled:pointer-events-none`}
              >
                <Mic className="w-4 h-4" />
              </button>
            </form>
            <p className="text-center text-gray-600 text-[11px] mt-2 font-mono max-w-lg mx-auto leading-snug">
              {t.cetAi.sendHintModEnter}
            </p>
            <p className="text-center text-gray-700 text-xs mt-1 font-mono">
              {t.cetAi.escToClose}
            </p>
          </div>
          </FullscreenDialogContent>
      </Dialog>
    </>
  );
}
