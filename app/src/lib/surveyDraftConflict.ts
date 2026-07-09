import type { InstallerProfile, SurveyFormData } from '@/lib/surveyApi';
import type { StoredPhoto } from '@/lib/surveyDraftStorage';

export const SURVEY_DRAFT_CONFLICT_SCHEMA = 'solaris-survey-draft-conflict-v1';

export type DraftVersionVector = {
  deviceId: string;
  clock: number;
  fieldClocks: Record<string, number>;
};

export type DraftConflictField = {
  path: string;
  localValue: unknown;
  remoteValue: unknown;
  localClock: number;
  remoteClock: number;
};

export type SurveyDraftPayload = {
  form: SurveyFormData;
  installer: InstallerProfile;
  photoNames: string[];
  updatedAt: string;
  version: DraftVersionVector;
};

export type DraftMergeResult = {
  form: SurveyFormData;
  installer: InstallerProfile;
  photoNames: string[];
  version: DraftVersionVector;
  conflicts: DraftConflictField[];
  autoMergedPaths: string[];
  resolution: 'clean' | 'auto_merged' | 'conflict';
};

const FORM_SCALAR_KEYS: (keyof SurveyFormData)[] = [
  'clientName',
  'clientAddress',
  'clientCity',
  'clientPostal',
  'clientPhone',
  'clientEmail',
  'jurisdictionCode',
  'siteLatitude',
  'siteLongitude',
  'roofType',
  'roofOrientation',
  'roofPitch',
  'usableAreaM2',
  'annualConsumptionKwh',
  'gridConnection',
  'shadingLevel',
  'existingSolar',
  'structuralNotes',
  'premium',
];

const CHECKLIST_KEYS = ['struct', 'electric', 'shading', 'access', 'docs', 'compliance'] as const;

export function createDraftVersionVector(deviceId: string, prev?: DraftVersionVector): DraftVersionVector {
  return {
    deviceId,
    clock: (prev?.clock ?? 0) + 1,
    fieldClocks: { ...(prev?.fieldClocks ?? {}) },
  };
}

export function bumpFieldClocks(
  version: DraftVersionVector,
  paths: string[],
  at = version.clock,
): DraftVersionVector {
  const fieldClocks = { ...version.fieldClocks };
  for (const path of paths) {
    fieldClocks[path] = at;
  }
  return { ...version, fieldClocks };
}

export function draftFieldPaths(_form: SurveyFormData, _installer: InstallerProfile): string[] {
  const paths = FORM_SCALAR_KEYS.map((k) => `form.${k}`);
  for (const key of CHECKLIST_KEYS) {
    paths.push(`form.checklist.${key}`);
  }
  paths.push('installer.installerId', 'installer.installerName', 'installer.company');
  return paths;
}

function getAtPath(root: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let cur: unknown = root;
  for (const part of parts) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

function setAtPathOnDraft(
  draft: { form: SurveyFormData; installer: InstallerProfile },
  path: string,
  value: unknown,
): void {
  const parts = path.split('.');
  if (parts[0] !== 'form' && parts[0] !== 'installer') return;
  let cur: Record<string, unknown> = draft as unknown as Record<string, unknown>;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const key = parts[i];
    if (cur[key] == null || typeof cur[key] !== 'object') {
      cur[key] = {};
    }
    cur = cur[key] as Record<string, unknown>;
  }
  cur[parts[parts.length - 1]] = value;
}

function valuesEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a === 'number' && typeof b === 'number' && Number.isNaN(a) && Number.isNaN(b)) return true;
  return JSON.stringify(a) === JSON.stringify(b);
}

export function mergePhotoNames(local: string[], remote: string[]): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];
  for (const name of [...local, ...remote]) {
    if (!name || seen.has(name)) continue;
    seen.add(name);
    merged.push(name);
  }
  return merged;
}

export function mergeStoredPhotos(local: StoredPhoto[], remote: StoredPhoto[]): StoredPhoto[] {
  const byName = new Map<string, StoredPhoto>();
  for (const photo of [...local, ...remote]) {
    if (!photo.name) continue;
    if (!byName.has(photo.name)) byName.set(photo.name, photo);
  }
  return [...byName.values()];
}

export function detectDraftConflicts(
  local: SurveyDraftPayload,
  remote: SurveyDraftPayload,
): DraftConflictField[] {
  const conflicts: DraftConflictField[] = [];
  const paths = new Set([
    ...Object.keys(local.version.fieldClocks),
    ...Object.keys(remote.version.fieldClocks),
    ...draftFieldPaths(local.form, local.installer),
  ]);

  const localRoot = { form: local.form, installer: local.installer };
  const remoteRoot = { form: remote.form, installer: remote.installer };

  for (const path of paths) {
    const localVal = getAtPath(localRoot as unknown as Record<string, unknown>, path);
    const remoteVal = getAtPath(remoteRoot as unknown as Record<string, unknown>, path);
    if (valuesEqual(localVal, remoteVal)) continue;

    const localClock = local.version.fieldClocks[path] ?? 0;
    const remoteClock = remote.version.fieldClocks[path] ?? 0;
    if (localClock === 0 && remoteClock === 0) continue;

    if (localClock > 0 && remoteClock > 0) {
      conflicts.push({
        path,
        localValue: localVal,
        remoteValue: remoteVal,
        localClock,
        remoteClock,
      });
    }
  }
  return conflicts;
}

export function mergeSurveyDrafts(local: SurveyDraftPayload, remote: SurveyDraftPayload): DraftMergeResult {
  const conflicts = detectDraftConflicts(local, remote);
  const mergedForm = structuredClone(local.form);
  const mergedInstaller = structuredClone(local.installer);
  const autoMergedPaths: string[] = [];

  const localRoot = { form: local.form, installer: local.installer };
  const remoteRoot = { form: remote.form, installer: remote.installer };
  const paths = draftFieldPaths(local.form, local.installer);

  for (const path of paths) {
    const localVal = getAtPath(localRoot as unknown as Record<string, unknown>, path);
    const remoteVal = getAtPath(remoteRoot as unknown as Record<string, unknown>, path);
    if (valuesEqual(localVal, remoteVal)) continue;

    const localClock = local.version.fieldClocks[path] ?? 0;
    const remoteClock = remote.version.fieldClocks[path] ?? 0;

    if (localClock > remoteClock) {
      setAtPathOnDraft({ form: mergedForm, installer: mergedInstaller }, path, localVal);
      autoMergedPaths.push(path);
    } else if (remoteClock > localClock) {
      setAtPathOnDraft({ form: mergedForm, installer: mergedInstaller }, path, remoteVal);
      autoMergedPaths.push(path);
    }
  }

  const mergedVersion: DraftVersionVector = {
    deviceId: local.version.deviceId,
    clock: Math.max(local.version.clock, remote.version.clock) + 1,
    fieldClocks: {
      ...remote.version.fieldClocks,
      ...local.version.fieldClocks,
      ...Object.fromEntries(autoMergedPaths.map((p) => [p, Math.max(local.version.clock, remote.version.clock) + 1])),
    },
  };

  const resolution: DraftMergeResult['resolution'] =
    conflicts.length > 0 ? 'conflict' : autoMergedPaths.length > 0 ? 'auto_merged' : 'clean';

  return {
    form: mergedForm,
    installer: mergedInstaller,
    photoNames: mergePhotoNames(local.photoNames, remote.photoNames),
    version: mergedVersion,
    conflicts,
    autoMergedPaths,
    resolution,
  };
}

export function buildDraftPayload(
  form: SurveyFormData,
  installer: InstallerProfile,
  photos: StoredPhoto[],
  version: DraftVersionVector,
  updatedAt: string,
): SurveyDraftPayload {
  return {
    form,
    installer,
    photoNames: photos.map((p) => p.name),
    updatedAt,
    version,
  };
}

export function resolveConflictChoice(
  base: DraftMergeResult,
  conflictPath: string,
  choice: 'local' | 'remote',
  _local: SurveyDraftPayload,
  _remote: SurveyDraftPayload,
): DraftMergeResult {
  const conflict = base.conflicts.find((c) => c.path === conflictPath);
  if (!conflict) return base;

  const mergedForm = structuredClone(base.form);
  const mergedInstaller = structuredClone(base.installer);
  const value = choice === 'local' ? conflict.localValue : conflict.remoteValue;
  setAtPathOnDraft({ form: mergedForm, installer: mergedInstaller }, conflictPath, value);

  const remaining = base.conflicts.filter((c) => c.path !== conflictPath);
  const fieldClocks = {
    ...base.version.fieldClocks,
    [conflictPath]: base.version.clock,
  };

  return {
    ...base,
    form: mergedForm,
    installer: mergedInstaller,
    conflicts: remaining,
    version: { ...base.version, fieldClocks },
    resolution: remaining.length > 0 ? 'conflict' : 'auto_merged',
  };
}