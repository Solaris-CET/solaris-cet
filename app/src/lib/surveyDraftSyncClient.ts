import type { DraftConflictField, DraftMergeResult, DraftVersionVector } from '@/lib/surveyDraftConflict';
import type { InstallerProfile, SurveyFormData } from '@/lib/surveyApi';

export const SURVEY_DRAFT_SYNC_API = '/api/survey/draft-sync';

export type DraftSyncResponse = {
  schema: string;
  status: 'accepted' | 'merged' | 'conflict';
  draft?: {
    draftId: string;
    form: SurveyFormData;
    installer: InstallerProfile;
    photoNames: string[];
    updatedAt: string;
    version: DraftVersionVector;
  };
  merge?: DraftMergeResult;
};

export type FetchServerDraftResult = {
  draft: DraftSyncResponse['draft'] | null;
};

export async function fetchServerSurveyDraft(
  draftId: string,
  installerId: string,
  signal?: AbortSignal,
): Promise<FetchServerDraftResult> {
  const params = new URLSearchParams({ draftId, installerId });
  const res = await fetch(`${SURVEY_DRAFT_SYNC_API}?${params}`, { signal });
  if (!res.ok) throw new Error(`draft-sync GET failed: ${res.status}`);
  const data = (await res.json()) as { draft: FetchServerDraftResult['draft'] };
  return { draft: data.draft ?? null };
}

export async function pushSurveyDraftSync(body: {
  draftId: string;
  form: SurveyFormData;
  installer: InstallerProfile;
  photoNames: string[];
  updatedAt: string;
  version: DraftVersionVector;
}): Promise<DraftSyncResponse> {
  const res = await fetch(SURVEY_DRAFT_SYNC_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`draft-sync POST failed: ${res.status}`);
  return (await res.json()) as DraftSyncResponse;
}

export function conflictsFromSyncResponse(res: DraftSyncResponse): DraftConflictField[] {
  return res.merge?.conflicts ?? [];
}