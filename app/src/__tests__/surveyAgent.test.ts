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
  it('shouldAutoCrm when budget ok', () => {
    expect(shouldAutoCrm(plan)).toBe(true);
    expect(shouldAutoCrm({ ...plan, auto_crm: true, budget_guard: { alert: true, exceeded: true } })).toBe(false);
  });

  it('permitHintMessage when recommended', () => {
    expect(permitHintMessage(plan)).toContain('risc 65');
  });

  it('stepById finds step', () => {
    expect(stepById(plan, 'crm')?.label).toBe('CRM');
  });
});