import { useCallback, useEffect, useState } from 'react';

import { executeTwinAgentAction, fetchTwinAgentPlan } from '@/lib/twinAgentApi';
import type { TwinAgentAction, TwinAgentPlan } from '@/lib/twinAgent';

type State = {
  plan: TwinAgentPlan | null;
  loading: boolean;
  executing: string | null;
  error: string;
  lastExecuted: string | null;
};

const INITIAL: State = {
  plan: null,
  loading: false,
  executing: null,
  error: '',
  lastExecuted: null,
};

export function useTwinAgent(reportId: string | null, installerKey?: string) {
  const [state, setState] = useState<State>(INITIAL);

  const load = useCallback(async () => {
    if (!reportId) return;
    setState((s) => ({ ...s, loading: true, error: '' }));
    try {
      const plan = await fetchTwinAgentPlan(reportId);
      setState((s) => ({ ...s, plan, loading: false }));
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : 'Twin agent eșuat',
      }));
    }
  }, [reportId]);

  const execute = useCallback(
    async (action: TwinAgentAction) => {
      if (!reportId) return;
      setState((s) => ({ ...s, executing: action.id, error: '' }));
      try {
        await executeTwinAgentAction(
          reportId,
          { action_id: action.id, action_type: action.type, detail: action.reason },
          installerKey,
        );
        setState((s) => ({
          ...s,
          executing: null,
          lastExecuted: action.id,
          plan: s.plan
            ? {
                ...s.plan,
                actions: s.plan.actions.map((a) =>
                  a.id === action.id ? { ...a, status: 'done' as const } : a,
                ),
              }
            : s.plan,
        }));
      } catch (err) {
        setState((s) => ({
          ...s,
          executing: null,
          error: err instanceof Error ? err.message : 'Execuție eșuată',
        }));
      }
    },
    [reportId, installerKey],
  );

  useEffect(() => {
    void load();
  }, [load]);

  return { ...state, reload: load, execute };
}