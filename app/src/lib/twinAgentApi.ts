import type { TwinAgentDecision, TwinAgentPlan } from './twinAgent';

export async function fetchTwinAgentPlan(reportId: string): Promise<TwinAgentPlan> {
  const qs = new URLSearchParams({ report_id: reportId });
  const res = await fetch(`/api/survey/twin-agent?${qs}`);
  const data = (await res.json()) as { plan?: TwinAgentPlan; error?: string };
  if (!res.ok) throw new Error(data.error || 'Twin agent indisponibil');
  if (!data.plan) throw new Error('Twin agent plan lipsă');
  return data.plan;
}

export async function executeTwinAgentAction(
  reportId: string,
  action: { action_id: string; action_type: string; detail?: string },
  installerKey?: string,
): Promise<unknown> {
  const qs = new URLSearchParams({ report_id: reportId });
  const res = await fetch(`/api/survey/twin-agent/execute?${qs}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(installerKey ? { 'X-Installer-Key': installerKey } : {}),
    },
    body: JSON.stringify({
      action_id: action.action_id,
      action_type: action.action_type,
      detail: action.detail ?? '',
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error((data as { error?: string }).error || 'Execuție agent eșuată');
  return data;
}

export async function fetchTwinAgentDecisions(
  reportId?: string,
  limit = 40,
): Promise<TwinAgentDecision[]> {
  const qs = new URLSearchParams({ limit: String(limit) });
  if (reportId) qs.set('report_id', reportId);
  const res = await fetch(`/api/survey/twin-agent/decisions?${qs}`);
  const data = (await res.json()) as { decisions?: TwinAgentDecision[]; error?: string };
  if (!res.ok) throw new Error(data.error || 'Twin agent decisions indisponibile');
  return data.decisions ?? [];
}