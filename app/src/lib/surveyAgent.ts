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

const AGENT_MESSAGES = {
  permitHintPrefix: (score: number) => `Agent recomandă pachet autorizație (risc ${score}/100)`,
} as const;

const MAX_PERMIT_REASONS = 2;

export function shouldAutoCrm(plan: SurveyOrchestration | undefined): boolean {
  if (!plan?.auto_crm) return false;
  return !plan.budget_guard.exceeded;
}

export function permitHintMessage(plan: SurveyOrchestration | undefined): string | null {
  if (!plan?.auto_permit_hint) return null;
  const reasons = plan.permit_risk.reasons.slice(0, MAX_PERMIT_REASONS).join(' · ');
  const prefix = AGENT_MESSAGES.permitHintPrefix(plan.permit_risk.score);
  return reasons ? `${prefix}: ${reasons}` : prefix;
}

export function stepById(plan: SurveyOrchestration | undefined, id: string): OrchestrationStep | undefined {
  if (!plan?.steps.length) return undefined;
  return plan.steps.find((step) => step.id === id);
}

export type SurveyThinkingResult = {
  /** Overall readiness 0..100 to proceed with automation. */
  readiness: number;
  /** Steps that must complete before any downstream auto step can run. */
  blockers: OrchestrationStep[];
  /** Next recommended step according to the agent policy. */
  nextStep: OrchestrationStep | null;
  /** Human-readable reasoning trace. */
  reasoning: string[];
  /** True when CRM can be executed automatically right now. */
  canAutoCrm: boolean;
  /** True when the permit hint should be surfaced. */
  canShowPermitHint: boolean;
};

function isTerminal(status: OrchestrationStep['status']): boolean {
  return status === 'done' || status === 'skipped';
}

function isBlocked(status: OrchestrationStep['status']): boolean {
  return status === 'blocked' || status === 'pending';
}

/**
 * Runs a lightweight ReAct-style reasoning pass over the survey orchestration.
 * Observable, testable, no hidden state — every decision is explained.
 */
export function surveyThink(plan: SurveyOrchestration | undefined): SurveyThinkingResult {
  const reasoning: string[] = [];

  if (!plan) {
    reasoning.push('No orchestration plan available; cannot reason about next steps.');
    return {
      readiness: 0,
      blockers: [],
      nextStep: null,
      reasoning,
      canAutoCrm: false,
      canShowPermitHint: false,
    };
  }

  const steps = plan.steps;
  const doneCount = steps.filter((s) => isTerminal(s.status)).length;
  const total = steps.length || 1;
  const completionRatio = doneCount / total;

  // Budget guard is the highest-priority blocker.
  if (plan.budget_guard.exceeded) {
    reasoning.push('Budget guard exceeded: all automation paused until reviewed.');
    return {
      readiness: Math.round(completionRatio * 50),
      blockers: [],
      nextStep: null,
      reasoning,
      canAutoCrm: false,
      canShowPermitHint: false,
    };
  }

  // Identify blockers: pending steps that appear before any downstream pending auto step.
  const pendingAutoIndex = steps.findIndex((s) => s.status === 'pending' && s.auto);
  const blockers: OrchestrationStep[] = [];
  if (pendingAutoIndex > 0) {
    for (let i = 0; i < pendingAutoIndex; i += 1) {
      const s = steps[i];
      if (isBlocked(s.status)) {
        blockers.push(s);
        reasoning.push(`Step "${s.label}" (${s.id}) blocks downstream automation.`);
      }
    }
  }

  // Determine next best action.
  let nextStep: OrchestrationStep | null = null;
  const firstPending = steps.find((s) => s.status === 'pending');
  if (firstPending) {
    nextStep = firstPending;
    reasoning.push(`Next recommended step: "${firstPending.label}" (${firstPending.id}).`);
  } else if (steps.every((s) => isTerminal(s.status))) {
    reasoning.push('All steps are complete or skipped; no further action required.');
  }

  // Readiness score: completion + penalties for blockers and permit risk.
  let readiness = Math.round(completionRatio * 100);
  if (blockers.length > 0) readiness -= blockers.length * 15;
  if (plan.permit_risk.score > plan.permit_risk.threshold) readiness -= 10;
  if (plan.budget_guard.alert) readiness -= 10;
  readiness = Math.max(0, Math.min(100, readiness));
  reasoning.push(`Readiness score: ${readiness}/100.`);

  const canAutoCrm = shouldAutoCrm(plan) && blockers.length === 0 && Boolean(stepById(plan, 'crm')?.status === 'pending');
  if (canAutoCrm) reasoning.push('CRM auto-step is unblocked and ready.');

  const canShowPermitHint = Boolean(permitHintMessage(plan));
  if (canShowPermitHint) {
    reasoning.push(`Permit risk ${plan.permit_risk.score}/${plan.permit_risk.threshold} recommends permit pack.`);
  }

  return {
    readiness,
    blockers,
    nextStep,
    reasoning,
    canAutoCrm,
    canShowPermitHint,
  };
}