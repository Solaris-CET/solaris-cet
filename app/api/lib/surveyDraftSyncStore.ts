import {
  buildDraftPayload,
  mergeSurveyDrafts,
  type DraftMergeResult,
  type SurveyDraftPayload,
} from '@/lib/surveyDraftConflict';
import type { InstallerProfile, SurveyFormData } from '@/lib/surveyApi';

export const SURVEY_DRAFT_SYNC_SCHEMA = 'solaris-survey-draft-sync-v1';

export type StoredServerDraft = SurveyDraftPayload & {
  draftId: string;
  storedAt: string;
};

const store = new Map<string, StoredServerDraft>();

export function draftSyncKey(draftId: string, installerId: string): string {
  return `${installerId || 'anon'}::${draftId}`;
}

export function getServerDraft(draftId: string, installerId: string): StoredServerDraft | null {
  return store.get(draftSyncKey(draftId, installerId)) ?? null;
}

export function upsertServerDraft(input: {
  draftId: string;
  form: SurveyFormData;
  installer: InstallerProfile;
  photoNames: string[];
  updatedAt: string;
  version: SurveyDraftPayload['version'];
}): { status: 'accepted'; draft: StoredServerDraft } | { status: 'merged' | 'conflict'; merge: DraftMergeResult; draft: StoredServerDraft } {
  const key = draftSyncKey(input.draftId, input.installer.installerId);
  const incoming = buildDraftPayload(
    input.form,
    input.installer,
    input.photoNames.map((name) => ({ name, type: 'image/jpeg', blob: new Blob() })),
    input.version,
    input.updatedAt,
  );

  const existing = store.get(key);
  if (!existing) {
    const draft: StoredServerDraft = {
      ...incoming,
      draftId: input.draftId,
      storedAt: new Date().toISOString(),
    };
    store.set(key, draft);
    return { status: 'accepted', draft };
  }

  const localPayload: SurveyDraftPayload = {
    form: existing.form,
    installer: existing.installer,
    photoNames: existing.photoNames,
    updatedAt: existing.updatedAt,
    version: existing.version,
  };

  const merge = mergeSurveyDrafts(incoming, localPayload);
  const draft: StoredServerDraft = {
    draftId: input.draftId,
    form: merge.form,
    installer: merge.installer,
    photoNames: merge.photoNames,
    updatedAt: new Date().toISOString(),
    version: merge.version,
    storedAt: new Date().toISOString(),
  };
  store.set(key, draft);

  return {
    status: merge.resolution === 'conflict' ? 'conflict' : 'merged',
    merge,
    draft,
  };
}

/** Test-only */
export function clearDraftSyncStore(): void {
  store.clear();
}