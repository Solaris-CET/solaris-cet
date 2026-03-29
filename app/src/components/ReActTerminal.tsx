import { useEffect, useCallback, useReducer } from 'react';
import { Brain, Zap, Eye, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';

const DEDUST_POOL_URL =
  'https://dedust.io/pools/EQB5_hZPl4-EI1aWdLSd21c8T9PoKyZK2IJtrDFdPJIelfnB/deposit';

/** Delay between each ReAct step reveal (ms). */
const STEP_REVEAL_DELAY_MS = 700;

type ReActPhase = 'THOUGHT' | 'ACTION' | 'OBSERVATION';

interface ReActStep {
  phase: ReActPhase;
  /** Romanian label from the prompt template */
  label: string;
  content: string;
  color: string;
}

interface ReActTerminalProps {
  /** Raw text returned by the AI (may contain [DIAGNOSTIC INTERN] etc.) */
  responseText: string;
  /** True while the fetch is in flight */
  isLoading: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parse the structured Groq response into discrete ReAct steps. */
function parseReActSteps(text: string): ReActStep[] {
  const steps: ReActStep[] = [];

  const thoughtMatch = text.match(
    /\[DIAGNOSTIC INTERN\]([\s\S]*?)(?=\[DECODARE ORACOL\]|\[DIRECTIVĂ DE ACȚIUNE\]|$)/,
  );
  const actionMatch = text.match(
    /\[DECODARE ORACOL\]([\s\S]*?)(?=\[DIRECTIVĂ DE ACȚIUNE\]|$)/,
  );
  const observationMatch = text.match(/\[DIRECTIVĂ DE ACȚIUNE\]([\s\S]*?)$/);

  if (thoughtMatch?.[1]?.trim()) {
    steps.push({
      phase: 'THOUGHT',
      label: 'DIAGNOSTIC INTERN',
      content: thoughtMatch[1].trim(),
      color: '#F2C94C',
    });
  }
  if (actionMatch?.[1]?.trim()) {
    steps.push({
      phase: 'ACTION',
      label: 'DECODARE ORACOL',
      content: actionMatch[1].trim(),
      color: '#F97316',
    });
  }
  if (observationMatch?.[1]?.trim()) {
    steps.push({
      phase: 'OBSERVATION',
      label: 'DIRECTIVĂ DE ACȚIUNE',
      content: observationMatch[1].trim(),
      color: '#34D399',
    });
  }

  // Fallback when the model returns unstructured text
  if (steps.length === 0 && text.trim()) {
    steps.push({
      phase: 'ACTION',
      label: 'ORACLE RESPONSE',
      content: text.trim(),
      color: '#2EE7FF',
    });
  }

  return steps;
}

/**
 * Returns true when the observation step recommends a DeDust position —
 * triggering the Human-in-the-Loop confirmation dialog.
 * Uses word-boundary patterns to avoid false positives ("security", "deposit", etc.).
 */
function containsSwapIntent(text: string): boolean {
  const hasDex = /dedust|ston\.fi|swap/i.test(text);
  // Match "secure" as a whole word; "poziti" catches Romanian "poziție/poziți"
  const hasIntent = /\b(secure|buy|stake|position|poziti)\b/i.test(text);
  return hasDex && hasIntent;
}

const phaseIcons: Record<ReActPhase, typeof Brain> = {
  THOUGHT: Brain,
  ACTION: Zap,
  OBSERVATION: Eye,
};

interface TerminalState {
  steps: ReActStep[];
  visibleCount: number;
  hitlDismissed: 'accepted' | 'rejected' | null;
}

type TerminalAction =
  | { type: 'RESET'; steps: ReActStep[] }
  | { type: 'REVEAL_NEXT' }
  | { type: 'HITL_ACCEPTED' }
  | { type: 'HITL_REJECTED' };

function terminalReducer(state: TerminalState, action: TerminalAction): TerminalState {
  switch (action.type) {
    case 'RESET':
      return { steps: action.steps, visibleCount: 0, hitlDismissed: null };
    case 'REVEAL_NEXT':
      return { ...state, visibleCount: state.visibleCount + 1 };
    case 'HITL_ACCEPTED':
      return { ...state, hitlDismissed: 'accepted' };
    case 'HITL_REJECTED':
      return { ...state, hitlDismissed: 'rejected' };
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ReActTerminal = ({ responseText, isLoading }: ReActTerminalProps) => {
  const [{ steps, visibleCount, hitlDismissed }, dispatch] = useReducer(terminalReducer, {
    steps: [],
    visibleCount: 0,
    hitlDismissed: null,
  });

  /** Reset state whenever a fresh response arrives. */
  useEffect(() => {
    if (!responseText) return;
    dispatch({ type: 'RESET', steps: parseReActSteps(responseText) });
  }, [responseText]);

  /** Stagger reveal of each step. */
  useEffect(() => {
    if (steps.length === 0 || isLoading) return;
    if (visibleCount >= steps.length) return;

    const timer = setTimeout(() => {
      dispatch({ type: 'REVEAL_NEXT' });
    }, STEP_REVEAL_DELAY_MS);

    return () => clearTimeout(timer);
  }, [steps, visibleCount, isLoading]);

  const handleAccept = useCallback(() => {
    dispatch({ type: 'HITL_ACCEPTED' });
    window.open(DEDUST_POOL_URL, '_blank', 'noopener,noreferrer');
  }, []);

  const handleReject = useCallback(() => {
    dispatch({ type: 'HITL_REJECTED' });
  }, []);

  // Determine whether to show the HITL panel
  const lastStep = steps[steps.length - 1];
  const showHitl =
    hitlDismissed === null &&
    visibleCount >= steps.length &&
    steps.length > 0 &&
    lastStep !== undefined &&
    containsSwapIntent(lastStep.content);

  const allDone = visibleCount >= steps.length && steps.length > 0;

  return (
    <div className="font-mono text-sm bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 overflow-hidden">
      {/* Terminal title bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/8 bg-white/[0.03]">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
        <span className="ml-3 text-[10px] text-solaris-muted tracking-widest uppercase">
          Solaris ReAct Protocol · Groq LPU
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          {isLoading ? (
            <>
              <div className="w-1.5 h-1.5 rounded-full bg-solaris-gold animate-pulse" />
              <span className="text-[10px] text-solaris-gold">PROCESSING</span>
            </>
          ) : allDone ? (
            <>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[10px] text-emerald-400">COMPLETE</span>
            </>
          ) : null}
        </div>
      </div>

      {/* Steps */}
      <div className="p-4 space-y-3 min-h-[80px]">
        {isLoading && steps.length === 0 && (
          <div className="flex items-center gap-2 text-solaris-muted/60 py-2">
            <div className="w-1.5 h-4 bg-solaris-gold/60 animate-pulse rounded-sm" />
            <span className="text-xs animate-pulse">Initializing ReAct loop…</span>
          </div>
        )}

        {steps.map((step, i) => {
          const Icon = phaseIcons[step.phase];
          const visible = i < visibleCount;
          const active = i === visibleCount - 1 && !allDone;

          return (
            <div
              key={i}
              className="transition-all duration-500"
              style={{
                opacity: visible ? (active ? 1 : 0.55) : 0,
                transform: visible ? 'translateX(0)' : 'translateX(-10px)',
              }}
            >
              {/* Phase badge */}
              <span
                className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded mb-1.5"
                style={{
                  color: step.color,
                  border: `1px solid ${step.color}40`,
                  background: `${step.color}10`,
                  boxShadow: active ? `0 0 8px ${step.color}30` : 'none',
                }}
              >
                <Icon className="w-2.5 h-2.5" />
                {step.label}
              </span>
              {/* Content */}
              <p className="text-xs text-solaris-text/85 leading-relaxed pl-1">{step.content}</p>
            </div>
          );
        })}

        {/* Cursor blink while revealing */}
        {!isLoading && !allDone && steps.length > 0 && (
          <div className="flex items-center gap-1 pt-1">
            <div className="w-1.5 h-4 bg-solaris-gold animate-pulse rounded-sm" />
          </div>
        )}

        {/* Done indicator */}
        {allDone && !showHitl && hitlDismissed === null && (
          <div className="flex items-center gap-1.5 pt-1 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="text-[10px]">CHAIN VERIFIED · REASONING COMPLETE</span>
          </div>
        )}
      </div>

      {/* ── Human-in-the-Loop confirmation panel ── */}
      {showHitl && (
        <div className="border-t border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-start gap-2 mb-3">
            <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] font-bold text-amber-400 uppercase tracking-widest">
                Agent Action Pending — Approval Required
              </p>
              <p className="text-[11px] text-solaris-muted mt-1">
                The Oracle recommends securing a CET position on DeDust. Confirm to open the
                liquidity pool in a new tab, or reject to cancel.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAccept}
              className="flex-1 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
            >
              <ExternalLink className="w-3 h-3" />
              Confirm — Go to DeDust
            </button>
            <button
              onClick={handleReject}
              className="flex-1 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
            >
              <XCircle className="w-3 h-3" />
              Reject Action
            </button>
          </div>
        </div>
      )}

      {/* Post-HITL feedback */}
      {hitlDismissed === 'accepted' && (
        <div className="border-t border-emerald-500/20 bg-emerald-500/5 px-4 py-2.5 flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[11px] text-emerald-400">
            Transaction approved · DeDust opened in new tab
          </span>
        </div>
      )}
      {hitlDismissed === 'rejected' && (
        <div className="border-t border-red-500/20 bg-red-500/5 px-4 py-2.5 flex items-center gap-2">
          <XCircle className="w-3.5 h-3.5 text-red-400" />
          <span className="text-[11px] text-red-400">Action rejected · No transaction executed</span>
        </div>
      )}
    </div>
  );
};

export default ReActTerminal;
