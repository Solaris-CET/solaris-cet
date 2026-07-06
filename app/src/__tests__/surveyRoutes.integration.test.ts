// @vitest-environment node
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/emailProvider', () => ({
  sendEmail: vi.fn(async () => undefined),
}));

vi.mock('../../api/lib/surveyWebhook', () => ({
  dispatchSurveyWebhook: vi.fn(async () => undefined),
}));

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

import surveyBatchRoute from '../../api/survey/batch/route';
import surveyContextRoute from '../../api/survey/context/route';
import surveyCorrectionsRoute from '../../api/survey/corrections/route';
import surveyDemoRoute from '../../api/survey/demo/route';
import surveyHealthRoute from '../../api/survey/health/route';
import surveyCrmRoute from '../../api/survey/crm/route';
import surveyJurisdictionsRoute from '../../api/survey/jurisdictions/route';
import surveyOrchestrateRoute from '../../api/survey/orchestrate/route';
import surveyTwinFeedRoute from '../../api/survey/twin-feed/route';
import surveyPermitPackRoute from '../../api/survey/permit-pack/route';
import surveyStatsRoute from '../../api/survey/stats/route';
import { dispatchSurveyWebhook } from '../../api/lib/surveyWebhook';

function jsonBody(res: Response): Promise<unknown> {
  return res.text().then((t) => (t ? (JSON.parse(t) as unknown) : null));
}

describe('survey API routes', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    const leadDir = mkdtempSync(join(tmpdir(), 'solaris-test-leads-'));
    process.env = { ...originalEnv, LEAD_STORAGE_DIR: leadDir };
    fetchMock.mockReset();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it('/api/survey/health: GET proxies engine health', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true, service: 'survey-engine' }), { status: 200 }),
    );
    const req = new Request('http://test/api/survey/health', { method: 'GET', headers: { origin: 'https://x.test' } });
    const res = await surveyHealthRoute(req);
    expect(res.status).toBe(200);
    const body = (await jsonBody(res)) as { engine: { ok: boolean } };
    expect(body.engine.ok).toBe(true);
  });

  it('/api/survey/crm: POST validates required fields', async () => {
    const req = new Request('http://test/api/survey/crm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', origin: 'https://x.test' },
      body: JSON.stringify({ report_id: 'R1' }),
    });
    const res = await surveyCrmRoute(req);
    expect(res.status).toBe(400);
  });

  it('/api/survey/demo: POST proxies engine demo', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          report_id: 'SOL-DEMO-1',
          pdf_path: '/app/output/demo.pdf',
          score: 75,
        }),
        { status: 200 },
      ),
    );
    const req = new Request('http://test/api/survey/demo', { method: 'POST', headers: { origin: 'https://x.test' } });
    const res = await surveyDemoRoute(req);
    expect(res.status).toBe(200);
    const body = (await jsonBody(res)) as { report_id: string };
    expect(body.report_id).toBe('SOL-DEMO-1');
  });

  it('/api/survey/batch: POST proxies engine batch', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          total: 1,
          succeeded: 1,
          failed: 0,
          results: [{
            job_id: 'b1',
            success: true,
            report_id: 'SOL-B1',
            pdf_filename: 'batch/b1/report.pdf',
            ahj_filename: 'batch/b1/AHJ.json',
            score: 80,
            error: '',
          }],
        }),
        { status: 200 },
      ),
    );
    const fd = new FormData();
    fd.append('manifest', '[{"job_id":"b1","client_name":"Test"}]');
    const req = new Request('http://test/api/survey/batch', {
      method: 'POST',
      headers: { origin: 'https://x.test' },
      body: fd,
    });
    const res = await surveyBatchRoute(req);
    expect(res.status).toBe(200);
    const body = (await jsonBody(res)) as { succeeded: number; results: Array<{ pdf_url: string }> };
    expect(body.succeeded).toBe(1);
    expect(body.results[0].pdf_url).toContain('batch%2Fb1%2Freport.pdf');
  });

  it('/api/survey/jurisdictions: GET proxies engine list', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ jurisdictions: [{ code: 'RO-VS', name: 'Vaslui', grid_operator: 'Delgaz Grid' }] }),
        { status: 200 },
      ),
    );
    const req = new Request('http://test/api/survey/jurisdictions', { method: 'GET', headers: { origin: 'https://x.test' } });
    const res = await surveyJurisdictionsRoute(req);
    expect(res.status).toBe(200);
    const body = (await jsonBody(res)) as { jurisdictions: Array<{ code: string }> };
    expect(body.jurisdictions[0].code).toBe('RO-VS');
  });

  it('/api/survey/stats: GET proxies public stats', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ total_reports: 3, avg_score: 78, total_capacity_kwp: 18, by_installer: { 'INST-1': 2 } }),
        { status: 200 },
      ),
    );
    const req = new Request('http://test/api/survey/stats', { method: 'GET', headers: { origin: 'https://x.test' } });
    const res = await surveyStatsRoute(req);
    expect(res.status).toBe(200);
    const body = (await jsonBody(res)) as { platform: string; stats: { total_reports: number } };
    expect(body.platform).toBe('solaris-cet');
    expect(body.stats.total_reports).toBe(3);
  });

  it('/api/survey/twin-feed: GET proxies twin feed', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ schema: 'solaris-twin-feed-v1', report_id: 'SOL-TWIN-1' }), { status: 200 }),
    );
    const req = new Request('http://test/api/survey/twin-feed?report_id=SOL-TWIN-1', {
      method: 'GET',
      headers: { origin: 'https://x.test' },
    });
    const res = await surveyTwinFeedRoute(req);
    expect(res.status).toBe(200);
    const body = (await jsonBody(res)) as { feed: { schema: string } };
    expect(body.feed.schema).toBe('solaris-twin-feed-v1');
  });

  it('/api/survey/corrections: GET lists corrections', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ total: 1, corrections: [{ report_id: 'R1', field: 'verdict' }] }), { status: 200 }),
    );
    const req = new Request('http://test/api/survey/corrections?report_id=R1', {
      method: 'GET',
      headers: { origin: 'https://x.test' },
    });
    const res = await surveyCorrectionsRoute(req);
    expect(res.status).toBe(200);
    const body = (await jsonBody(res)) as { total: number };
    expect(body.total).toBe(1);
  });

  it('/api/survey/orchestrate: GET proxies OODA plan', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          schema: 'solaris-orchestration-v1',
          report_id: 'SOL-ORCH-1',
          auto_crm: true,
          steps: [{ id: 'crm', label: 'CRM', status: 'pending' }],
        }),
        { status: 200 },
      ),
    );
    const req = new Request('http://test/api/survey/orchestrate?report_id=SOL-ORCH-1', {
      method: 'GET',
      headers: { origin: 'https://x.test' },
    });
    const res = await surveyOrchestrateRoute(req);
    expect(res.status).toBe(200);
    const body = (await jsonBody(res)) as { orchestration: { report_id: string } };
    expect(body.orchestration.report_id).toBe('SOL-ORCH-1');
  });

  it('/api/survey/context: GET proxies unified context', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          schema: 'solaris-context-v1',
          report_id: 'SOL-CTX-1',
          report: { client_name: 'Test', city: 'Cluj' },
          jurisdiction: { code: 'RO-CJ', name: 'Cluj' },
          crm: { submit_url: '/api/survey/crm', lead_search_key: 'SOL-CTX-1' },
          cost: { api_usd: 0.1, routing: 'demo' },
          files: { pdf: 'x.pdf' },
        }),
        { status: 200 },
      ),
    );
    const req = new Request('http://test/api/survey/context?report_id=SOL-CTX-1', {
      method: 'GET',
      headers: { origin: 'https://x.test' },
    });
    const res = await surveyContextRoute(req);
    expect(res.status).toBe(200);
    const body = (await jsonBody(res)) as { context: { report_id: string } };
    expect(body.context.report_id).toBe('SOL-CTX-1');
  });

  it('/api/survey/permit-pack: GET proxies ZIP', async () => {
    fetchMock.mockResolvedValueOnce(new Response(new Uint8Array([0x50, 0x4b, 0x03, 0x04]), { status: 200 }));
    const req = new Request('http://test/api/survey/permit-pack?report_id=SOL-ZIP-1', {
      method: 'GET',
      headers: { origin: 'https://x.test' },
    });
    const res = await surveyPermitPackRoute(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/zip');
  });

  it('/api/survey/corrections: POST validates required fields', async () => {
    const req = new Request('http://test/api/survey/corrections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', origin: 'https://x.test' },
      body: JSON.stringify({ report_id: 'R1' }),
    });
    const res = await surveyCorrectionsRoute(req);
    expect(res.status).toBe(400);
  });

  it('/api/survey/corrections: POST proxies engine', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true, correction: { report_id: 'R1', field: 'verdict' } }), { status: 200 }),
    );
    const req = new Request('http://test/api/survey/corrections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', origin: 'https://x.test' },
      body: JSON.stringify({ report_id: 'R1', field: 'verdict', corrected: 'Condiționat' }),
    });
    const res = await surveyCorrectionsRoute(req);
    expect(res.status).toBe(200);
    const body = (await jsonBody(res)) as { ok: boolean };
    expect(body.ok).toBe(true);
  });

  it('/api/survey/crm: POST persists survey lead', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    const req = new Request('http://test/api/survey/crm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', origin: 'https://x.test', host: 'test' },
      body: JSON.stringify({
        report_id: 'SOL-TEST-001',
        pdf_filename: 'RAPORT_SOL-TEST-001.pdf',
        client_name: 'Ion Popescu',
        client_phone: '0722123456',
        client_city: 'Vaslui',
        installer_id: 'INST-1',
        installer_name: 'Tehnician Test',
        score: 82,
        capacity_kwp: 5.5,
      }),
    });
    const res = await surveyCrmRoute(req);
    expect(res.status).toBe(200);
    const body = (await jsonBody(res)) as { success: boolean; pdfUrl: string };
    expect(body.success).toBe(true);
    expect(body.pdfUrl).toContain('RAPORT_SOL-TEST-001.pdf');
    expect(dispatchSurveyWebhook).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'survey_crm_lead', reportId: 'SOL-TEST-001' }),
    );
  });
});