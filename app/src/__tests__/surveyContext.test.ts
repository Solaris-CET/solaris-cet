// @vitest-environment node
import { describe, expect, it } from 'vitest';

import {
  countLowConfidenceFindings,
  hasPermitPack,
  normalizeReportId,
  permitPackUrl,
  REPORT_CONTEXT_SCHEMA,
  type ExplainableFinding,
  type ReportContext,
} from '@/lib/surveyContext';

const findings: ExplainableFinding[] = [
  { claim: 'OK', confidence: 0.9, evidence_photo_ids: ['p1'] },
  { claim: 'Shade', confidence: 0.5, evidence_photo_ids: ['p2'] },
  { claim: 'Docs', confidence: 0.65, evidence_photo_ids: [] },
];

const context: ReportContext = {
  schema: REPORT_CONTEXT_SCHEMA,
  report_id: 'SOL-1',
  report: {
    client_name: 'Test',
    city: 'Cluj',
    capacity_kwp: 6,
    annual_kwh: 9000,
    suitability_score: 82,
    premium_tier: false,
    installer_id: 'INST',
    technician_name: 'Tech',
    timestamp: '2026-07-07T10:00:00.000Z',
    routing: 'standard',
  },
  jurisdiction: { code: 'RO-CJ', name: 'Cluj', grid_operator: 'EON' },
  crm: { submit_url: '/api/survey/crm', lead_search_key: 'phone', context_url: '/api/survey/context' },
  cost: { api_usd: 0.12, routing: 'deepseek' },
  files: {
    pdf: 'r.pdf',
    ahj: null,
    pdf_url: '/pdf',
    ahj_url: null,
    permit_pack_url: '/api/survey/permit-pack?report_id=SOL-1',
  },
  explainable: { findings, low_confidence_count: 2 },
};

describe('surveyContext', () => {
  it('normalizeReportId trims whitespace', () => {
    expect(normalizeReportId('  SOL-1  ')).toBe('SOL-1');
  });

  it('permitPackUrl encodes report id', () => {
    expect(permitPackUrl('SOL-2026-0042')).toBe('/api/survey/permit-pack?report_id=SOL-2026-0042');
    expect(permitPackUrl('a b')).toBe('/api/survey/permit-pack?report_id=a%20b');
    expect(permitPackUrl('  SOL-1 ')).toBe('/api/survey/permit-pack?report_id=SOL-1');
  });

  it('countLowConfidenceFindings uses threshold', () => {
    expect(countLowConfidenceFindings(findings)).toBe(2);
    expect(countLowConfidenceFindings(findings, 0.6)).toBe(1);
    expect(countLowConfidenceFindings([])).toBe(0);
  });

  it('hasPermitPack detects permit pack URL', () => {
    expect(hasPermitPack(context)).toBe(true);
    expect(hasPermitPack({ files: { ...context.files, permit_pack_url: '' } })).toBe(false);
    expect(hasPermitPack(undefined)).toBe(false);
  });
});