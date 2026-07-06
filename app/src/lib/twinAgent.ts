export const TWIN_AGENT_SCHEMA = 'solaris-twin-agent-v1';

export type TwinAgentActionType =
  | 'suggest_crm'
  | 'suggest_permit'
  | 'suggest_correction'
  | 'suggest_contact'
  | 'escalate_low_confidence'
  | 'refresh_twin';

export type TwinAgentAction = {
  id: string;
  type: TwinAgentActionType;
  label: string;
  priority: 'high' | 'normal' | 'low';
  reason: string;
  url?: string;
  auto?: boolean;
  status: 'pending' | 'done' | 'skipped';
};

export type TwinAgentPlan = {
  schema: string;
  agent_version: number;
  generated_at: string;
  report_id: string;
  confidence: number;
  reasoning: string[];
  twin_feed_schema: string;
  orchestration_schema?: string;
  permit_risk?: {
    score: number;
    permit_recommended: boolean;
    reasons: string[];
    threshold: number;
  };
  auto_crm?: boolean;
  actions: TwinAgentAction[];
  recommended_next: string | null;
  actions_total: number;
};

export type TwinAgentDecision = {
  event_id: string;
  report_id: string;
  event_type: 'agent_plan_ready' | 'agent_action' | 'agent_reassess';
  payload: Record<string, unknown>;
  timestamp: string;
};

export function topPriorityAction(plan: TwinAgentPlan | null | undefined): TwinAgentAction | undefined {
  if (!plan?.actions?.length) return undefined;
  const rank = { high: 0, normal: 1, low: 2 };
  return [...plan.actions].sort((a, b) => rank[a.priority] - rank[b.priority])[0];
}

export function agentConfidenceLabel(confidence: number): string {
  if (confidence >= 0.85) return 'încredere ridicată';
  if (confidence >= 0.7) return 'încredere medie';
  return 'încredere moderată';
}