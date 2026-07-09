import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

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

type StoreFile = Record<string, StoredServerDraft>;

const memoryStore = new Map<string, StoredServerDraft>();

function useMemoryStore(): boolean {
  return process.env.SURVEY_DRAFT_SYNC_MEMORY === '1';
}

function resolveStorePath(): string {
  if (process.env.SURVEY_DRAFT_SYNC_PATH) {
    return process.env.SURVEY_DRAFT_SYNC_PATH;
  }
  const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
  return join(root, '.data', 'survey-draft-sync.json');
}

function loadStoreFile(): StoreFile {
  const path = resolveStorePath();
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as StoreFile;
  } catch {
    return {};
  }
}

function saveStoreFile(data: StoreFile): void {
  const path = resolveStorePath();
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2), 'utf8');
}

function getEntry(key: string): StoredServerDraft | null {
  if (useMemoryStore()) return memoryStore.get(key) ?? null;
  const file = loadStoreFile();
  return file[key] ?? null;
}

function setEntry(key: string, draft: StoredServerDraft): void {
  if (useMemoryStore()) {
    memoryStore.set(key, draft);
    return;
  }
  const file = loadStoreFile();
  file[key] = draft;
  saveStoreFile(file);
}

export function draftSyncKey(draftId: string, installerId: string): string {
  return `${installerId || 'anon'}::${draftId}`;
}

export function getServerDraft(draftId: string, installerId: string): StoredServerDraft | null {
  return getEntry(draftSyncKey(draftId, installerId));
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

  const existing = getEntry(key);
  if (!existing) {
    const draft: StoredServerDraft = {
      ...incoming,
      draftId: input.draftId,
      storedAt: new Date().toISOString(),
    };
    setEntry(key, draft);
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
  setEntry(key, draft);

  return {
    status: merge.resolution === 'conflict' ? 'conflict' : 'merged',
    merge,
    draft,
  };
}

/** Test-only — clears memory or file store */
export function clearDraftSyncStore(): void {
  memoryStore.clear();
  const path = resolveStorePath();
  if (existsSync(path)) {
    saveStoreFile({});
  }
}