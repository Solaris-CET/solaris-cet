// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildSurveyCrmPdfUrl,
  buildSurveyCrmSuccessResponse,
  parseSurveyCrmPayload,
  parseSurveyCrmPhone,
  SURVEY_CRM_PATH,
  SURVEY_CRM_PROBE,
} from '../../api/lib/surveyCrm';

const fsMocks = vi.hoisted(() => ({
  mkdir: vi.fn(async () => undefined),
  writeFile: vi.fn(async () => undefined),
  appendFile: vi.fn(async () => undefined),
}));

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>();
  return {
    ...actual,
    promises: {
      ...actual.promises,
      mkdir: fsMocks.mkdir,
      writeFile: fsMocks.writeFile,
      appendFile: fsMocks.appendFile,
    },
  };
});

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/publicOrigin', () => ({
  publicOrigin: () => 'https://solaris.test',
}));

vi.mock('../../api/lib/emailProvider', () => ({
  sendEmail: vi.fn(async () => undefined),
}));

vi.mock('../../api/lib/telegramNotify', () => ({
  sendTelegramNotify: vi.fn(async () => undefined),
}));

vi.mock('../../api/lib/surveyWebhook', () => ({
  dispatchSurveyWebhook: vi.fn(async () => undefined),
}));

const fetchMock = vi.fn(async () => ({ ok: true }));

import surveyCrmRoute, { SURVEY_CRM_PROBE as routeProbe } from '../../api/survey/crm/route';

function crmRequest(body: unknown, init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('origin', 'https://allowed.test');
  return new Request(`http://test${SURVEY_CRM_PATH}`, {
    method: 'POST',
    ...init,
    headers,
    body: JSON.stringify(body),
  });
}

const validPayload = {
  report_id: 'rpt-1',
  pdf_filename: 'RAPORT_rpt-1.pdf',
  client_name: 'Ion Popescu',
  client_phone: '0769889721',
  client_city: 'Vaslui',
  installer_name: 'Tech Solar',
  score: 92,
  capacity_kwp: 6.5,
};

describe('surveyCrm helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(SURVEY_CRM_PROBE.path).toBe('/api/survey/crm');
    expect(routeProbe.leadType).toBe('survey_report');
    expect(routeProbe.authRequired).toBe(false);
  });

  it('parseSurveyCrmPayload validates required fields', () => {
    expect(parseSurveyCrmPayload(validPayload)?.reportId).toBe('rpt-1');
    expect(parseSurveyCrmPayload({ report_id: 'rpt-1' })).toBeNull();
  });

  it('parseSurveyCrmPhone strips invalid chars', () => {
    expect(parseSurveyCrmPhone('+40 769-889-721 (mobil)')).toBe('+40 769-889-721 ');
  });

  it('buildSurveyCrmPdfUrl uses files route', () => {
    expect(buildSurveyCrmPdfUrl('https://solaris.test', 'report.pdf')).toContain('/api/survey/files?file=report.pdf');
  });

  it('buildSurveyCrmSuccessResponse shapes response', () => {
    expect(buildSurveyCrmSuccessResponse('lead-1', 'https://pdf')).toEqual({
      success: true,
      leadId: 'lead-1',
      pdfUrl: 'https://pdf',
    });
  });
});

describe('/api/survey/crm e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);
    process.env.LEAD_STORAGE_DIR = '/tmp/survey-leads-test';
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(SURVEY_CRM_PATH);
    expect(src).toContain('api/survey/crm/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await surveyCrmRoute(
      new Request(`http://test${SURVEY_CRM_PATH}`, { method: 'OPTIONS', headers: { origin: 'https://allowed.test' } }),
    );
    expect(res.status).toBe(204);
  });

  it('POST without required fields returns 400', async () => {
    const res = await surveyCrmRoute(crmRequest({ report_id: 'rpt-1' }));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(SURVEY_CRM_PROBE.requiredFieldsError);
  });

  it('POST registers survey lead', async () => {
    const res = await surveyCrmRoute(crmRequest(validPayload));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean; leadId: string | null; pdfUrl: string };
    expect(body.success).toBe(true);
    expect(body.leadId).toMatch(/^survey-/);
    expect(body.pdfUrl).toContain('RAPORT_rpt-1.pdf');
    expect(fsMocks.writeFile).toHaveBeenCalled();
    expect(fsMocks.appendFile).toHaveBeenCalled();
  });
});