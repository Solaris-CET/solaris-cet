import { Bot, Loader2, Sparkles } from 'lucide-react';

import { useTwinAgent } from '@/hooks/useTwinAgent';
import { agentConfidenceLabel, topPriorityAction } from '@/lib/twinAgent';
import { cn } from '@/lib/utils';

type Props = {
  reportId: string;
  installerKey?: string;
  onCrmAction?: () => void;
  className?: string;
};

export function TwinAgentPanel({ reportId, installerKey, onCrmAction, className }: Props) {
  const { plan, loading, executing, error, lastExecuted, execute, reload } = useTwinAgent(
    reportId,
    installerKey,
  );
  const top = topPriorityAction(plan);

  return (
    <div className={cn('rounded-xl border border-cyan-400/25 bg-cyan-400/5 p-3', className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-200">
          <Bot className="h-3.5 w-3.5" />
          Twin AI agent
          {plan ? (
            <span className="font-normal text-white/45">
              · {agentConfidenceLabel(plan.confidence)} ({Math.round(plan.confidence * 100)}%)
            </span>
          ) : null}
        </p>
        <button
          type="button"
          onClick={() => void reload()}
          disabled={loading}
          className="text-[10px] text-white/50 hover:text-white/80 disabled:opacity-50"
        >
          {loading ? 'Se încarcă…' : 'Refresh'}
        </button>
      </div>

      {error ? <p className="mt-2 text-[11px] text-red-300">{error}</p> : null}

      {plan && top ? (
        <p className="mt-2 text-[11px] text-cyan-100/80">
          <Sparkles className="mr-1 inline h-3 w-3" />
          Următor pas recomandat: <span className="font-medium">{top.label}</span>
        </p>
      ) : null}

      {plan?.reasoning?.length ? (
        <ul className="mt-2 space-y-0.5 text-[10px] text-white/45">
          {plan.reasoning.slice(0, 3).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : null}

      {plan?.actions?.length ? (
        <ul className="mt-3 space-y-1.5 border-t border-white/10 pt-2">
          {plan.actions.slice(0, 5).map((action) => (
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
                  <span className="text-[10px] text-emerald-300">done</span>
                ) : action.url ? (
                  <a
                    href={action.url}
                    className="text-[10px] text-cyan-200 hover:underline"
                  >
                    Deschide
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled={executing === action.id}
                    onClick={() => {
                      if (action.type === 'suggest_crm' && onCrmAction) {
                        onCrmAction();
                      }
                      void execute(action);
                    }}
                    className="inline-flex items-center gap-1 text-[10px] text-cyan-200 hover:text-cyan-100 disabled:opacity-50"
                  >
                    {executing === action.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : null}
                    Execută
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : !loading && !error ? (
        <p className="mt-2 text-[11px] text-white/40">Agentul analizează twin feed…</p>
      ) : null}
    </div>
  );
}