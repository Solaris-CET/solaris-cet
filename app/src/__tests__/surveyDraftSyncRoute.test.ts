// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { clearDraftSyncStore } from '../../api/lib/surveyDraftSyncStore';
import draftSyncRoute from '../../api/survey/draft-sync/route';

const form = {
  clientName: 'Ion',
  clientAddress: 'Str. 1',
  clientCity: 'Cluj',
  clientPostal: '400001',
  clientPhone: '0700000000',
  clientEmail: 'ion@test.com',
  jurisdictionCode: '',
  siteLatitude: null,
  siteLongitude: null,
  roofType: 'tile',
  roofOrientation: 'S',
  roofPitch: 30,
  usableAreaM2: 40,
  annualConsumptionKwh: 5000,
  gridConnection: 'single-phase',
  shadingLevel: 'low',
  existingSolar: false,
  structuralNotes: '',
  premium: false,
  checklist: {
    struct: 'pass',
    electric: 'pass',
    shading: 'pass',
    access: 'pass',
    docs: 'pass',
    compliance: 'pass',
  },
};

const installer = { installerId: 'INST-1', installerName: 'Tech', company: 'Solaris' };

function version(clocks: Record<string, number>) {
  return { deviceId: 'dev-a', clock: Math.max(1, ...Object.values(clocks)), fieldClocks: clocks };
}

describe('/api/survey/draft-sync', () => {
  beforeEach(() => {
    process.env.SURVEY_DRAFT_SYNC_MEMORY = '1';
  });

  afterEach(() => {
    clearDraftSyncStore();
    delete process.env.SURVEY_DRAFT_SYNC_MEMORY;
  });

  it('POST accepts first draft then reports conflict on overlapping edit', async () => {
    const draftId = 'inst-1:ion:str-1';
    const first = await draftSyncRoute(
      new Request('http://localhost/api/survey/draft-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draftId,
          form,
          installer,
          photoNames: ['a.jpg'],
          updatedAt: '2026-07-09T12:00:00.000Z',
          version: version({ 'form.clientCity': 2 }),
        }),
      }),
    );
    expect(first.status).toBe(200);
    const firstBody = (await first.json()) as { status: string };
    expect(firstBody.status).toBe('accepted');

    const second = await draftSyncRoute(
      new Request('http://localhost/api/survey/draft-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draftId,
          form: { ...form, clientCity: 'București' },
          installer,
          photoNames: ['a.jpg'],
          updatedAt: '2026-07-09T12:05:00.000Z',
          version: version({ 'form.clientCity': 2 }),
        }),
      }),
    );
    const secondBody = (await second.json()) as { status: string; merge?: { conflicts: unknown[] } };
    expect(secondBody.status).toBe('conflict');
    expect(secondBody.merge?.conflicts?.length).toBeGreaterThan(0);
  });

  it('GET returns stored draft by draftId', async () => {
    const draftId = 'draft-get-test';
    await draftSyncRoute(
      new Request('http://localhost/api/survey/draft-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draftId,
          form,
          installer,
          updatedAt: '2026-07-09T12:00:00.000Z',
          version: version({}),
        }),
      }),
    );

    const res = await draftSyncRoute(
      new Request(`http://localhost/api/survey/draft-sync?draftId=${draftId}&installerId=INST-1`, {
        method: 'GET',
      }),
    );
    const body = (await res.json()) as { draft: { draftId: string } | null };
    expect(body.draft?.draftId).toBe(draftId);
  });
});