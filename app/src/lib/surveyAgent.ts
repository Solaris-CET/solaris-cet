export type OrchestrationStep = {
  id: string;
  label: string;
  status: 'done' | 'pending' | 'skipped' | 'blocked';
  url?: string;
  auto?: boolean;
  permit_risk?: number;
  permit_recommended?: boolean;
  verdict?: string;
};

export type SurveyOrchestration = {
  schema: string;
  report_id: string;
  permit_risk: {
    score: number;
    permit_recommended: boolean;
    reasons: string[];
    threshold: number;
  };
  auto_crm: boolean;
  auto_permit_hint: boolean;
  budget_guard: { alert: boolean; exceeded: boolean };
  steps: OrchestrationStep[];
  contact_url: string;
  permit_pack_url: string | null;
};

export function shouldAutoCrm(plan: SurveyOrchestration | undefined): boolean {
  return Boolean(plan?.auto_crm && !plan.budget_guard.exceeded);
}

export function permitHintMessage(plan: SurveyOrchestration | undefined): string | null {
  if (!plan?.auto_permit_hint) return null;
  const reasons = plan.permit_risk.reasons.slice(0, 2).join(' · ');
  return `Agent recomandă pachet autorizație (risc ${plan.permit_risk.score}/100)${reasons ? `: ${reasons}` : ''}`;
}

export function stepById(plan: SurveyOrchestration | undefined, id: string): OrchestrationStep | undefined {
  return plan?.steps.find((s) => s.id === id);
}