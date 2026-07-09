import { getAllowedOrigin } from '@/api/lib/cors';
import {
  getServerDraft,
  SURVEY_DRAFT_SYNC_SCHEMA,
  upsertServerDraft,
} from '../../lib/surveyDraftSyncStore';
import type { InstallerProfile, SurveyFormData } from '@/lib/surveyApi';
import type { DraftVersionVector } from '@/lib/surveyDraftConflict';

export const SURVEY_DRAFT_SYNC_PATH = '/api/survey/draft-sync';
export const SURVEY_DRAFT_SYNC_METHODS = 'GET, POST, OPTIONS';

export const SURVEY_DRAFT_SYNC_PROBE = {
  path: SURVEY_DRAFT_SYNC_PATH,
  methods: ['GET', 'POST', 'OPTIONS'] as const,
  authRequired: false,
};

export const config = { runtime: 'nodejs' };

type DraftSyncBody = {
  draftId: string;
  form: SurveyFormData;
  installer: InstallerProfile;
  photoNames?: string[];
  updatedAt: string;
  version: DraftVersionVector;
};

function json(body: unknown, origin: string, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin,
      Vary: 'Origin',
      'Cache-Control': 'no-store',
    },
  });
}

export default async function handler(req: Request): Promise<Response> {
  const allowed = getAllowedOrigin(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': allowed,
        'Access-Control-Allow-Methods': SURVEY_DRAFT_SYNC_METHODS,
        'Access-Control-Allow-Headers': 'Content-Type',
        Vary: 'Origin',
      },
    });
  }

  if (req.method === 'GET') {
    const url = new URL(req.url);
    const draftId = url.searchParams.get('draftId')?.trim();
    const installerId = url.searchParams.get('installerId')?.trim() ?? '';
    if (!draftId) {
      return json({ error: 'draftId required' }, allowed, 400);
    }
    const draft = getServerDraft(draftId, installerId);
    return json({ schema: SURVEY_DRAFT_SYNC_SCHEMA, draft }, allowed, 200);
  }

  if (req.method === 'POST') {
    let body: DraftSyncBody;
    try {
      body = (await req.json()) as DraftSyncBody;
    } catch {
      return json({ error: 'Invalid JSON body' }, allowed, 400);
    }
    if (!body.draftId || !body.form || !body.installer || !body.version) {
      return json({ error: 'draftId, form, installer, version required' }, allowed, 400);
    }

    const result = upsertServerDraft({
      draftId: body.draftId,
      form: body.form,
      installer: body.installer,
      photoNames: body.photoNames ?? [],
      updatedAt: body.updatedAt ?? new Date().toISOString(),
      version: body.version,
    });

    return json(
      {
        schema: SURVEY_DRAFT_SYNC_SCHEMA,
        status: result.status,
        draft: result.draft,
        merge: 'merge' in result ? result.merge : undefined,
      },
      allowed,
      200,
    );
  }

  return json({ error: 'Method not allowed' }, allowed, 405);
}