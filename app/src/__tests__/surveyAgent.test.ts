// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { permitHintMessage, shouldAutoCrm, stepById } from '@/lib/surveyAgent';
import type { SurveyOrchestration } from '@/lib/surveyAgent';

const plan: SurveyOrchestration = {
  schema: 'solaris-orchestration-v1',
  report_id: 'SOL-1',
  permit_risk: { score: 65, permit_recommended: true, reasons: ['Județ RO-CJ'], threshold: 50 },
  auto_crm: true,
  auto_permit_hint: true,
  budget_guard: { alert: false, exceeded: false },
  steps: [
    { id: 'generate', label: 'PDF', status: 'done' },
    { id: 'crm', label: 'CRM', status: 'pending', auto: true },
  ],
  contact_url: '/contact?from=survey',
  permit_pack_url: '/api/survey/permit-pack?report_id=SOL-1',
};

describe('surveyAgent', () => {
  it('shouldAutoCrm returns false when plan missing or budget exceeded', () => {
    expect(shouldAutoCrm(undefined)).toBe(false);
    expect(shouldAutoCrm({ ...plan, auto_crm: false })).toBe(false);
    expect(shouldAutoCrm({ ...plan, budget_guard: { alert: true, exceeded: true } })).toBe(false);
  });

  it('shouldAutoCrm returns true when auto_crm enabled and budget ok', () => {
    expect(shouldAutoCrm(plan)).toBe(true);
    expect(shouldAutoCrm({ ...plan, budget_guard: { alert: true, exceeded: false } })).toBe(true);
  });

  it('permitHintMessage returns null when hint disabled', () => {
    expect(permitHintMessage(undefined)).toBeNull();
    expect(permitHintMessage({ ...plan, auto_permit_hint: false })).toBeNull();
  });

  it('permitHintMessage includes score and up to two reasons', () => {
    expect(permitHintMessage(plan)).toBe(
      'Agent recomandă pachet autorizație (risc 65/100): Județ RO-CJ',
    );
    expect(
      permitHintMessage({
        ...plan,
        permit_risk: {
          ...plan.permit_risk,
          reasons: ['A', 'B', 'C'],
        },
      }),
    ).toBe('Agent recomandă pachet autorizație (risc 65/100): A · B');
  });

  it('permitHintMessage omits reason suffix when list is empty', () => {
    expect(
      permitHintMessage({
        ...plan,
        permit_risk: { ...plan.permit_risk, reasons: [] },
      }),
    ).toBe('Agent recomandă pachet autorizație (risc 65/100)');
  });

  it('stepById finds step or returns undefined', () => {
    expect(stepById(plan, 'crm')?.label).toBe('CRM');
    expect(stepById(plan, 'missing')).toBeUndefined();
    expect(stepById(undefined, 'crm')).toBeUndefined();
    expect(stepById({ ...plan, steps: [] }, 'crm')).toBeUndefined();
  });
});