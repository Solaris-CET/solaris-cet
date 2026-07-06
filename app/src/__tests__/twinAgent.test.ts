import { describe, expect, it } from 'vitest';

import {
  TWIN_AGENT_SCHEMA,
  agentConfidenceLabel,
  topPriorityAction,
  type TwinAgentPlan,
} from '@/lib/twinAgent';

const plan: TwinAgentPlan = {
  schema: TWIN_AGENT_SCHEMA,
  agent_version: 1,
  generated_at: '2026-01-01T00:00:00Z',
  report_id: 'SOL-AG-1',
  confidence: 0.82,
  reasoning: ['test'],
  twin_feed_schema: 'solaris-twin-feed-v1',
  actions: [
    {
      id: 'act-crm',
      type: 'suggest_crm',
      label: 'CRM',
      priority: 'normal',
      reason: 'auto',
      status: 'pending',
    },
    {
      id: 'act-permit',
      type: 'suggest_permit',
      label: 'Permit',
      priority: 'high',
      reason: 'risk',
      status: 'pending',
      url: '/permit',
    },
  ],
  recommended_next: 'act-permit',
  actions_total: 2,
};

describe('twinAgent', () => {
  it('topPriorityAction picks high priority', () => {
    expect(topPriorityAction(plan)?.id).toBe('act-permit');
  });

  it('agentConfidenceLabel tiers', () => {
    expect(agentConfidenceLabel(0.9)).toContain('ridicată');
    expect(agentConfidenceLabel(0.6)).toContain('moderată');
  });
});