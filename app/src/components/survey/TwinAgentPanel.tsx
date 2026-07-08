import { Bot, Loader2, Sparkles } from 'lucide-react';
import { useMemo } from 'react';

import { useTwinAgent } from '@/hooks/useTwinAgent';
import { agentConfidenceLabel, topPriorityAction, type TwinAgentAction } from '@/lib/twinAgent';
import { cn } from '@/lib/utils';

const LABELS = {
  title: 'Twin AI agent',
  refresh: 'Refresh',
  loading: 'Se încarcă…',
  refreshAria: 'Reîmprospătează planul agentului Twin',
  nextStep: 'Următor pas recomandat:',
  idle: 'Agentul analizează twin feed…',
  open: 'Deschide',
  execute: 'Execută',
  done: 'done',
  panelAria: 'Panou agent AI Twin pentru raportul curent',
} as const;

const MAX_REASONING_LINES = 3;
const MAX_VISIBLE_ACTIONS = 5;

export type TwinAgentPanelProps = {
  reportId: string;
  installerKey?: string;
  onCrmAction?: () => void;
  className?: string;
};

function confidencePercent(confidence: number): number {
  if (!Number.isFinite(confidence)) return 0;
  return Math.round(Math.max(0, Math.min(1, confidence)) * 100);
}

function handleActionClick(
  action: TwinAgentAction,
  onCrmAction: (() => void) | undefined,
  execute: (action: TwinAgentAction) => Promise<void>,
): void {
  if (action.type === 'suggest_crm') onCrmAction?.();
  void execute(action);
}

export function TwinAgentPanel({
  reportId,
  installerKey,
  onCrmAction,
  className,
}: TwinAgentPanelProps) {
  const { plan, loading, executing, error, lastExecuted, execute, reload } = useTwinAgent(
    reportId,
    installerKey,
  );
  const top = useMemo(() => topPriorityAction(plan), [plan]);
  const visibleActions = useMemo(
    () => plan?.actions?.slice(0, MAX_VISIBLE_ACTIONS) ?? [],
    [plan?.actions],
  );
  const reasoningLines = useMemo(
    () => plan?.reasoning?.slice(0, MAX_REASONING_LINES) ?? [],
    [plan?.reasoning],
  );

  return (
    <section
      className={cn('rounded-xl border border-cyan-400/25 bg-cyan-400/5 p-3', className)}
      aria-label={LABELS.panelAria}
      aria-busy={loading}
    >
      <div className="flex items-center justify-between gap-2">
        <p
          id="twin-agent-heading"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-200"
        >
          <Bot className="h-3.5 w-3.5" aria-hidden />
          {LABELS.title}
          {plan ? (
            <span className="font-normal text-white/45">
              · {agentConfidenceLabel(plan.confidence)} ({confidencePercent(plan.confidence)}%)
            </span>
          ) : null}
        </p>
        <button
          type="button"
          onClick={() => void reload()}
          disabled={loading}
          aria-label={LABELS.refreshAria}
          className="text-[10px] text-white/50 hover:text-white/80 disabled:opacity-50"
        >
          {loading ? LABELS.loading : LABELS.refresh}
        </button>
      </div>

      {error ? (
        <p className="mt-2 text-[11px] text-red-300" role="alert">
          {error}
        </p>
      ) : null}

      {plan && top ? (
        <p className="mt-2 text-[11px] text-cyan-100/80">
          <Sparkles className="mr-1 inline h-3 w-3" aria-hidden />
          {LABELS.nextStep} <span className="font-medium">{top.label}</span>
        </p>
      ) : null}

      {reasoningLines.length ? (
        <ul className="mt-2 space-y-0.5 text-[10px] text-white/45" aria-label="Raționament agent">
          {reasoningLines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : null}

      {visibleActions.length ? (
        <ul className="mt-3 space-y-1.5 border-t border-white/10 pt-2" aria-labelledby="twin-agent-heading">
          {visibleActions.map((action) => (
            <li
              key={action.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/8 bg-black/20 px-2 py-1.5"
            >
              <div className="min-w-0">
                <p className="text-[11px] text-white/80">{action.label}</p>
                <p className="text-[10px] text-white/40">{action.reason}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    'rounded px-1.5 py-0.5 text-[9px] uppercase tracking-wide',
                    action.priority === 'high'
                      ? 'bg-amber-400/15 text-amber-200'
                      : 'bg-white/5 text-white/45',
                  )}
                >
                  {action.priority}
                </span>
                {action.status === 'done' || lastExecuted === action.id ? (
                  <span className="text-[10px] text-emerald-300">{LABELS.done}</span>
                ) : action.url ? (
                  <a
                    href={action.url}
                    className="text-[10px] text-cyan-200 hover:underline"
                    aria-label={`${LABELS.open} ${action.label}`}
                  >
                    {LABELS.open}
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled={executing === action.id}
                    aria-label={`${LABELS.execute} ${action.label}`}
                    onClick={() => handleActionClick(action, onCrmAction, execute)}
                    className="inline-flex items-center gap-1 text-[10px] text-cyan-200 hover:text-cyan-100 disabled:opacity-50"
                  >
                    {executing === action.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                    ) : null}
                    {LABELS.execute}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : !loading && !error ? (
        <p className="mt-2 text-[11px] text-white/40" role="status">
          {LABELS.idle}
        </p>
      ) : null}
    </section>
  );
}